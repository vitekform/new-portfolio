import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import prisma, { initializeD1Client } from '../lib/prisma.js';
import * as Sentry from '@sentry/node';
import { awardAchievement } from './achievementUtils.js';

Sentry.init({
    dsn: "https://342a3da4b820d22a01431d0c0201a770@o4508938006626304.ingest.de.sentry.io/4509362550734928",

    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,

    // Disable HTTP instrumentation to avoid "this.enable is not a function" error
    integrations: (integrations) => {
        return integrations.filter(integration => integration.name !== 'Http');
    }
});

export function onRequest(context) {
    return (async () => {
        const request = context.request;
        const env = context.env;

        // Initialize the D1 client with the environment
        initializeD1Client(env);

        // Parse the request body
        const requestData = await request.json();
        const action = requestData.action;

        if (action === 'register') {
            try {
                const username = requestData.username;
                const email = requestData.email;
                const password = requestData.password;

                // Validate input
                if (!username || !email || !password) {
                    return new Response(JSON.stringify({ 
                        success: false, 
                        message: 'Missing required fields' 
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Check if username or email already exists
                    // Check for existing user with the same username or email
                    const existingUser = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { username: username },
                                { email: email }
                            ]
                        }
                    });

                    if (existingUser) {
                        // User already exists
                        const isDuplicateUsername = existingUser.username === username;
                        const isDuplicateEmail = existingUser.email === email;

                        let message = '';
                        if (isDuplicateUsername && isDuplicateEmail) {
                            message = 'Both username and email are already taken';
                        } else if (isDuplicateUsername) {
                            message = 'Username is already taken';
                        } else {
                            message = 'Email is already taken';
                        }

                        return new Response(JSON.stringify({ 
                            success: false, 
                            message: message 
                        }), {
                            status: 409,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Hash the password using bcrypt
                    const saltRounds = 10;
                    const password_hashed = await bcrypt.hash(password, saltRounds);

                    // Generate a secure random token of 256 characters
                    const token = crypto.randomBytes(128).toString('hex'); // 128 bytes = 256 hex characters

                    // Insert new user
                    const newUser = await prisma.user.create({
                        data: {
                            username,
                            email,
                            password: password_hashed,
                            token,
                            role: "unverified"
                        }
                    });

                    // Get the new user's ID
                    const newUserId = newUser.id;

                    // Award the "Big Mistake" achievement
                    try {
                        await awardAchievement(newUserId, 'BIG_MISTAKE');
                    } catch (achievementError) {
                        Sentry.captureException(achievementError);
                        console.error('Error awarding achievement:', achievementError);
                    }

                    // Generate a verification token
                    const verificationToken = crypto.randomBytes(32).toString('hex');
                    const verificationExpiry = new Date();
                    verificationExpiry.setHours(verificationExpiry.getHours() + 24); // Token valid for 24 hours

                    // Store verification token in user's record
                    await prisma.user.update({
                        where: { id: newUserId },
                        data: {
                            verification_tokens: {
                                email: verificationToken,
                                expiry: verificationExpiry.toISOString()
                            }
                        }
                    });

                    // Send verification email
                    try {
                        if (process.env.SENDGRID_API_KEY) {
                            sgMail.setApiKey(process.env.SENDGRID_API_KEY);

                            const verificationUrl = `${process.env.SITE_URL || 'https://vitek.dev'}/verify?token=${verificationToken}&userId=${newUserId}`;

                            const msg = {
                                to: email,
                                from: process.env.SENDGRID_FROM_EMAIL || 'noreply@vitek.dev',
                                subject: 'Verify your email address',
                                text: `Welcome to the site! Please verify your email address by clicking the following link: ${verificationUrl}`,
                                html: `
                                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                        <h2 style="color: #333;">Welcome to the site!</h2>
                                        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
                                        <div style="text-align: center; margin: 30px 0;">
                                            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; border-radius: 5px;">Verify Email</a>
                                        </div>
                                        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
                                        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
                                        <p>This link will expire in 24 hours.</p>
                                        <hr style="border: 1px solid #eee; margin: 30px 0;">
                                        <p style="color: #999; font-size: 12px;">If you didn't register for an account, you can safely ignore this email.</p>
                                    </div>
                                `
                            };

                            await sgMail.send(msg);
                            console.log('Verification email sent successfully');
                        } else {
                            console.warn('SENDGRID_API_KEY not set, skipping email verification');
                        }
                    } catch (emailError) {
                        Sentry.captureException(emailError);
                        console.error('Error sending verification email:', emailError);
                        // Continue with registration even if email fails
                    }

                    // Return success response with user ID and token
                    return new Response(JSON.stringify({ 
                        success: true, 
                        message: 'Registration successful. Please check your email to verify your account.',
                        userId: newUserId,
                        token: token
                    }), {
                        status: 201,
                        headers: { 'Content-Type': 'application/json' }
                    });
            } catch (error) {
                Sentry.captureException(error);
                console.error('Registration error:', error);
                return new Response(JSON.stringify({ 
                    success: false, 
                    message: 'An error occurred during registration' 
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Handle login action
        else if (action === 'login') {
            try {
                const username = requestData.username;
                const password = requestData.password;
                const userAgent = requestData.userAgent || 'Unknown';

                // Validate input
                if (!username || !password) {
                    return new Response(JSON.stringify({ 
                        success: false, 
                        message: 'Missing username or password' 
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                try {
                    // Find user by username
                    const user = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { username: username },
                                { email: username }
                            ]
                        }
                    });

                    // If no user found
                    if (!user) {
                        return new Response(JSON.stringify({ 
                            success: false, 
                            message: 'Invalid username or password' 
                        }), {
                            status: 401,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Check password
                    const passwordMatch = await bcrypt.compare(password, user.password);
                    if (!passwordMatch) {
                        return new Response(JSON.stringify({ 
                            success: false, 
                            message: 'Invalid username or password' 
                        }), {
                            status: 401,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Generate a new token
                    const token = crypto.randomBytes(128).toString('hex');

                    // Update user's token
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { token: token }
                    });

                    // Track device information
                    try {
                        // Generate a unique device ID based on user agent
                        const deviceId = crypto.createHash('md5').update(userAgent).digest('hex');

                        // Get current device history
                        let deviceHistory = user.device_history || [];

                        // Check if this device is already in history
                        const existingDevice = Array.isArray(deviceHistory) 
                            ? deviceHistory.find(device => device.id === deviceId)
                            : null;

                        let deviceInfo;

                        // If this is a new device, add it to history
                        if (!existingDevice) {
                            deviceInfo = {
                                id: deviceId,
                                user_agent: userAgent,
                                first_seen: new Date().toISOString(),
                                last_used: new Date().toISOString()
                            };

                            // Return with device verification required flag
                            return new Response(JSON.stringify({ 
                                success: true, 
                                message: 'Login successful, but device verification required',
                                requireDeviceVerification: true,
                                userId: user.id,
                                token: token
                            }), {
                                status: 200,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }

                        // Known device, update last used timestamp
                        deviceInfo = {
                            id: deviceId,
                            user_agent: userAgent,
                            last_used: new Date().toISOString()
                        };

                        // Update device history
                        if (Array.isArray(deviceHistory)) {
                            // Remove this device if it exists
                            const updatedHistory = deviceHistory.filter(device => device.id !== deviceId);
                            // Add updated device info
                            updatedHistory.push(deviceInfo);
                            // Keep only the last 5 devices
                            const limitedHistory = updatedHistory.slice(-5);

                            // Update device history using D1
                            await prisma.user.update({
                                where: { id: user.id },
                                data: { device_history: limitedHistory }
                            });
                        } else {
                            // Initialize device history using D1
                            await prisma.user.update({
                                where: { id: user.id },
                                data: { device_history: [deviceInfo] }
                            });
                        }
                    } catch (deviceError) {
                        Sentry.captureException(deviceError);
                        console.error('Device tracking error:', deviceError);
                        // Continue with login even if device tracking fails
                    }

                    // Return user ID and token
                    return new Response(JSON.stringify({ 
                        success: true, 
                        message: 'Login successful',
                        userId: user.id,
                        token: token
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (dbError) {
                    Sentry.captureException(dbError);
                    console.error('Database operation error:', dbError);
                    throw dbError; // Re-throw to be caught by the outer catch block
                }
            } catch (error) {
                Sentry.captureException(error);
                console.error('Login error:', error);
                return new Response(JSON.stringify({ 
                    success: false, 
                    message: 'An error occurred during login' 
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Handle getUserData action
        else if (action === 'getUserData') {
            try {
                const userId = requestData.userId;
                const token = requestData.token;

                // Validate input
                if (!userId || !token) {
                    return new Response(JSON.stringify({ 
                        success: false, 
                        message: 'Missing user ID or token' 
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                try {
                    // Check if user exists and token is valid
                    const userData = await prisma.user.findFirst({
                        where: {
                            id: parseInt(userId),
                            token: token
                        },
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            role: true
                        }
                    });

                    // If no user found or token doesn't match
                    if (!userData) {
                        return new Response(JSON.stringify({ 
                            success: false, 
                            message: 'Invalid user ID or token' 
                        }), {
                            status: 401,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Return user data (excluding sensitive information)
                    return new Response(JSON.stringify({ 
                        success: true, 
                        userData: {
                            id: userData.id,
                            username: userData.username,
                            email: userData.email,
                            role: userData.role
                        }
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (dbError) {
                    Sentry.captureException(dbError);
                    console.error('Database operation error:', dbError);
                    throw dbError; // Re-throw to be caught by the outer catch block
                }
            } catch (error) {
                Sentry.captureException(error);
                console.error('Get user data error:', error);
                return new Response(JSON.stringify({ 
                    success: false, 
                    message: 'An error occurred while fetching user data' 
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Handle verifyEmail action
        else if (action === 'verifyEmail') {
            try {
                const token = requestData.token;
                const userId = requestData.userId;

                // Validate input
                if (!token || !userId) {
                    return new Response(JSON.stringify({ 
                        success: false, 
                        message: 'Missing token or user ID' 
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                try {
                    // Find user by ID
                    const user = await prisma.user.findUnique({
                        where: { id: parseInt(userId) }
                    });

                    // If no user found
                    if (!user) {
                        return new Response(JSON.stringify({ 
                            success: false, 
                            message: 'User not found' 
                        }), {
                            status: 404,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Check if user is already verified
                    if (user.role !== 'unverified') {
                        return new Response(JSON.stringify({ 
                            success: true, 
                            message: 'Email already verified' 
                        }), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Check if verification token exists and is valid
                    const verificationTokens = user.verification_tokens || {};

                    if (!verificationTokens.email || verificationTokens.email !== token) {
                        return new Response(JSON.stringify({ 
                            success: false, 
                            message: 'Invalid verification token' 
                        }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Check if token is expired
                    if (verificationTokens.expiry) {
                        const expiryDate = new Date(verificationTokens.expiry);
                        if (expiryDate < new Date()) {
                            return new Response(JSON.stringify({ 
                                success: false, 
                                message: 'Verification token has expired' 
                            }), {
                                status: 400,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                    }

                    // Update user role to 'user' (verified)
                    await prisma.user.update({
                        where: { id: parseInt(userId) },
                        data: { 
                            role: 'user',
                            verification_tokens: {} // Clear verification tokens
                        }
                    });

                    // Award the "Verified" achievement
                    try {
                        await awardAchievement(parseInt(userId), 'VERIFIED');
                    } catch (achievementError) {
                        Sentry.captureException(achievementError);
                        console.error('Error awarding achievement:', achievementError);
                    }

                    // Return success response
                    return new Response(JSON.stringify({ 
                        success: true, 
                        message: 'Email verified successfully' 
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (dbError) {
                    Sentry.captureException(dbError);
                    console.error('Database operation error:', dbError);
                    throw dbError; // Re-throw to be caught by the outer catch block
                }
            } catch (error) {
                Sentry.captureException(error);
                console.error('Email verification error:', error);
                return new Response(JSON.stringify({ 
                    success: false, 
                    message: 'An error occurred during email verification' 
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Handle forgotPassword action
        else if (action === 'forgotPassword') {
            try {
                const email = requestData.email;

                // Validate input
                if (!email) {
                    return new Response(JSON.stringify({ 
                        success: false, 
                        message: 'Email is required' 
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                try {
                    // Find user by email
                    const user = await prisma.user.findUnique({
                        where: { email: email }
                    });

                    // If no user found, still return success to prevent email enumeration
                    if (!user) {
                        return new Response(JSON.stringify({ 
                            success: true, 
                            message: 'If your email is registered, you will receive a password reset link' 
                        }), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Generate a reset token
                    const resetToken = crypto.randomBytes(32).toString('hex');
                    const resetExpiry = new Date();
                    resetExpiry.setHours(resetExpiry.getHours() + 1); // Token valid for 1 hour

                    // Store reset token in user's record
                    const verificationTokens = user.verification_tokens || {};
                    verificationTokens.reset = resetToken;
                    verificationTokens.resetExpiry = resetExpiry.toISOString();

                    await prisma.user.update({
                        where: { id: user.id },
                        data: { verification_tokens: verificationTokens }
                    });

                    // Send reset email
                    try {
                        if (process.env.SENDGRID_API_KEY) {
                            sgMail.setApiKey(process.env.SENDGRID_API_KEY);

                            const resetUrl = `${process.env.SITE_URL || 'https://vitek.dev'}/reset-password?token=${resetToken}&userId=${user.id}`;

                            const msg = {
                                to: email,
                                from: process.env.SENDGRID_FROM_EMAIL || 'noreply@vitek.dev',
                                subject: 'Reset your password',
                                text: `You requested to reset your password. Please click the following link to reset your password: ${resetUrl}. This link will expire in 1 hour.`,
                                html: `
                                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                        <h2 style="color: #333;">Password Reset Request</h2>
                                        <p>You requested to reset your password. Please click the button below to set a new password:</p>
                                        <div style="text-align: center; margin: 30px 0;">
                                            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; border-radius: 5px;">Reset Password</a>
                                        </div>
                                        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
                                        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                                        <p>This link will expire in 1 hour.</p>
                                        <hr style="border: 1px solid #eee; margin: 30px 0;">
                                        <p style="color: #999; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email.</p>
                                    </div>
                                `
                            };

                            await sgMail.send(msg);
                            console.log('Password reset email sent successfully');
                        } else {
                            console.warn('SENDGRID_API_KEY not set, skipping password reset email');
                        }
                    } catch (emailError) {
                        Sentry.captureException(emailError);
                        console.error('Error sending password reset email:', emailError);
                        // Continue even if email fails
                    }

                    // Return success response
                    return new Response(JSON.stringify({ 
                        success: true, 
                        message: 'If your email is registered, you will receive a password reset link' 
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (dbError) {
                    Sentry.captureException(dbError);
                    console.error('Database operation error:', dbError);
                    throw dbError; // Re-throw to be caught by the outer catch block
                }
            } catch (error) {
                Sentry.captureException(error);
                console.error('Forgot password error:', error);
                return new Response(JSON.stringify({ 
                    success: false, 
                    message: 'An error occurred while processing your request' 
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Handle resetPassword action
        else if (action === 'resetPassword') {
            try {
                const token = requestData.token;
                const userId = requestData.userId;
                const newPassword = requestData.newPassword;

                // Validate input
                if (!token || !userId || !newPassword) {
                    return new Response(JSON.stringify({ 
                        success: false, 
                        message: 'Missing required fields' 
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                try {
                    // Find user by ID
                    const user = await prisma.user.findUnique({
                        where: { id: parseInt(userId) }
                    });

                    // If no user found
                    if (!user) {
                        return new Response(JSON.stringify({ 
                            success: false, 
                            message: 'User not found' 
                        }), {
                            status: 404,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Check if reset token exists and is valid
                    const verificationTokens = user.verification_tokens || {};

                    if (!verificationTokens.reset || verificationTokens.reset !== token) {
                        return new Response(JSON.stringify({ 
                            success: false, 
                            message: 'Invalid reset token' 
                        }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Check if token is expired
                    if (verificationTokens.resetExpiry) {
                        const expiryDate = new Date(verificationTokens.resetExpiry);
                        if (expiryDate < new Date()) {
                            return new Response(JSON.stringify({ 
                                success: false, 
                                message: 'Reset token has expired' 
                            }), {
                                status: 400,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                    }

                    // Hash the new password
                    const saltRounds = 10;
                    const password_hashed = await bcrypt.hash(newPassword, saltRounds);

                    // Update user's password and clear reset token
                    const updatedVerificationTokens = { ...verificationTokens };
                    delete updatedVerificationTokens.reset;
                    delete updatedVerificationTokens.resetExpiry;

                    await prisma.user.update({
                        where: { id: parseInt(userId) },
                        data: { 
                            password: password_hashed,
                            verification_tokens: updatedVerificationTokens
                        }
                    });

                    // Return success response
                    return new Response(JSON.stringify({ 
                        success: true, 
                        message: 'Password reset successfully' 
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (dbError) {
                    Sentry.captureException(dbError);
                    console.error('Database operation error:', dbError);
                    throw dbError; // Re-throw to be caught by the outer catch block
                }
            } catch (error) {
                Sentry.captureException(error);
                console.error('Reset password error:', error);
                return new Response(JSON.stringify({ 
                    success: false, 
                    message: 'An error occurred while resetting your password' 
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Handle verifyDevice action
        else if (action === 'verifyDevice') {
            try {
                const userId = requestData.userId;
                const token = requestData.token;
                const userAgent = requestData.userAgent || 'Unknown';

                // Validate input
                if (!userId || !token) {
                    return new Response(JSON.stringify({ 
                        success: false, 
                        message: 'Missing user ID or token' 
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                try {
                    // Find user by ID and token
                    const user = await prisma.user.findFirst({
                        where: {
                            id: parseInt(userId),
                            token: token
                        }
                    });

                    // If no user found or token doesn't match
                    if (!user) {
                        return new Response(JSON.stringify({ 
                            success: false, 
                            message: 'Invalid user ID or token' 
                        }), {
                            status: 401,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Generate a unique device ID based on user agent
                    const deviceId = crypto.createHash('md5').update(userAgent).digest('hex');

                    // Get current device history
                    let deviceHistory = user.device_history || [];

                    // Create device info
                    const deviceInfo = {
                        id: deviceId,
                        user_agent: userAgent,
                        first_seen: new Date().toISOString(),
                        last_used: new Date().toISOString(),
                        verified: true
                    };

                    // Update device history
                    if (Array.isArray(deviceHistory)) {
                        // Remove this device if it exists
                        const updatedHistory = deviceHistory.filter(device => device.id !== deviceId);
                        // Add updated device info
                        updatedHistory.push(deviceInfo);
                        // Keep only the last 5 devices
                        const limitedHistory = updatedHistory.slice(-5);

                        // Update device history
                        await prisma.user.update({
                            where: { id: parseInt(userId) },
                            data: { device_history: limitedHistory }
                        });
                    } else {
                        // Initialize device history
                        await prisma.user.update({
                            where: { id: parseInt(userId) },
                            data: { device_history: [deviceInfo] }
                        });
                    }

                    // Return success response
                    return new Response(JSON.stringify({ 
                        success: true, 
                        message: 'Device verified successfully' 
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (dbError) {
                    Sentry.captureException(dbError);
                    console.error('Database operation error:', dbError);
                    throw dbError; // Re-throw to be caught by the outer catch block
                }
            } catch (error) {
                Sentry.captureException(error);
                console.error('Device verification error:', error);
                return new Response(JSON.stringify({ 
                    success: false, 
                    message: 'An error occurred during device verification' 
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Handle logout action
        else if (action === 'logout') {
            try {
                const userId = requestData.userId;
                const token = requestData.token;

                // Validate input
                if (!userId || !token) {
                    return new Response(JSON.stringify({ 
                        success: false, 
                        message: 'Missing user ID or token' 
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                try {
                    // Find user by ID and token
                    const user = await prisma.user.findFirst({
                        where: {
                            id: parseInt(userId),
                            token: token
                        }
                    });

                    // If no user found or token doesn't match, still return success
                    if (!user) {
                        return new Response(JSON.stringify({ 
                            success: true, 
                            message: 'Logged out successfully' 
                        }), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Invalidate the token
                    await prisma.user.update({
                        where: { id: parseInt(userId) },
                        data: { token: null }
                    });

                    // Return success response
                    return new Response(JSON.stringify({ 
                        success: true, 
                        message: 'Logged out successfully' 
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (dbError) {
                    Sentry.captureException(dbError);
                    console.error('Database operation error:', dbError);
                    throw dbError; // Re-throw to be caught by the outer catch block
                }
            } catch (error) {
                Sentry.captureException(error);
                console.error('Logout error:', error);
                return new Response(JSON.stringify({ 
                    success: false, 
                    message: 'An error occurred during logout' 
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Handle updateThemePreferences action
        else if (action === 'updateThemePreferences') {
            try {
                const userId = requestData.userId;
                const token = requestData.token;
                const themePreferences = requestData.themePreferences;

                // Validate input
                if (!userId || !token || !themePreferences) {
                    return new Response(JSON.stringify({ 
                        success: false, 
                        message: 'Missing required fields' 
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                try {
                    // Find user by ID and token
                    const user = await prisma.user.findFirst({
                        where: {
                            id: parseInt(userId),
                            token: token
                        }
                    });

                    // If no user found or token doesn't match
                    if (!user) {
                        return new Response(JSON.stringify({ 
                            success: false, 
                            message: 'Invalid user ID or token' 
                        }), {
                            status: 401,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Update theme preferences
                    await prisma.user.update({
                        where: { id: parseInt(userId) },
                        data: { theme_preferences: themePreferences }
                    });

                    // Return success response
                    return new Response(JSON.stringify({ 
                        success: true, 
                        message: 'Theme preferences updated successfully' 
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (dbError) {
                    Sentry.captureException(dbError);
                    console.error('Database operation error:', dbError);
                    throw dbError; // Re-throw to be caught by the outer catch block
                }
            } catch (error) {
                Sentry.captureException(error);
                console.error('Update theme preferences error:', error);
                return new Response(JSON.stringify({ 
                    success: false, 
                    message: 'An error occurred while updating theme preferences' 
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Handle getThemePreferences action
        else if (action === 'getThemePreferences') {
            try {
                const userId = requestData.userId;
                const token = requestData.token;

                // Validate input
                if (!userId || !token) {
                    return new Response(JSON.stringify({ 
                        success: false, 
                        message: 'Missing user ID or token' 
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                try {
                    // Find user by ID and token
                    const user = await prisma.user.findFirst({
                        where: {
                            id: parseInt(userId),
                            token: token
                        },
                        select: {
                            id: true,
                            theme_preferences: true
                        }
                    });

                    // If no user found or token doesn't match
                    if (!user) {
                        return new Response(JSON.stringify({ 
                            success: false, 
                            message: 'Invalid user ID or token' 
                        }), {
                            status: 401,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Return theme preferences
                    return new Response(JSON.stringify({ 
                        success: true, 
                        themePreferences: user.theme_preferences || {}
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (dbError) {
                    Sentry.captureException(dbError);
                    console.error('Database operation error:', dbError);
                    throw dbError; // Re-throw to be caught by the outer catch block
                }
            } catch (error) {
                Sentry.captureException(error);
                console.error('Get theme preferences error:', error);
                return new Response(JSON.stringify({ 
                    success: false, 
                    message: 'An error occurred while fetching theme preferences' 
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // If action is not recognized
        else {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Invalid action' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    })();
}
