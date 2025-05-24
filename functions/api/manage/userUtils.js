import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import prisma from '../lib/prisma.js';
import * as Sentry from '@sentry/node';
import { awardAchievement } from './achievementUtils.js';

Sentry.init({
    dsn: "https://342a3da4b820d22a01431d0c0201a770@o4508938006626304.ingest.de.sentry.io/4509362550734928",

    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
});

export async function POST(request) {
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
                // Continue with registration even if awarding achievement fails
            }

            // Send welcome email
            try {
                // Initialize SendGrid with API key
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);

                // Compose welcome email
                const msg = {
                    to: email,
                    from: process.env.SENDGRID_FROM_EMAIL,
                    subject: 'Welcome to Our Platform!',
                    html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2>Welcome to Our Platform!</h2>
                                <p>Hello ${username},</p>
                                <p>Thank you for registering with us. We're excited to have you on board!</p>
                                <p>Your account has been created successfully. To get started, please verify your email address by clicking the verification link we've sent in a separate email.</p>
                                <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                                <p>Best regards,<br>The Team</p>
                            </div>
                        `
                };

                // Send welcome email (don't wait for it to complete)
                sgMail.send(msg).catch(err => {
                    Sentry.captureException(err);
                    console.error('Error sending welcome email:', err);
                });
            } catch (emailError) {
                Sentry.captureException(emailError);
                console.error('Error preparing welcome email:', emailError);
                // Continue with registration even if welcome email fails
            }

            return new Response(JSON.stringify({
                success: true,
                message: 'User registered successfully',
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
    } else if (action === 'login') {
        try {
            // Get login credentials from request body
            const usernameOrEmail = requestData.username;
            const password = requestData.password;

            // Validate input
            if (!usernameOrEmail || !password) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Missing username/email or password'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            try {
                // Check if user exists by username or email
                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { username: usernameOrEmail },
                            { email: usernameOrEmail }
                        ]
                    },
                    select: {
                        id: true,
                        username: true,
                        password: true,
                        token: true
                    }
                });

                // If no user found
                if (!user) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Invalid username/email or password'
                    }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Verify password using bcrypt
                const passwordMatch = await bcrypt.compare(password, user.password);
                if (!passwordMatch) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Invalid username/email or password'
                    }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Generate a new token or use existing one
                let token = user.token;
                if (!token) {
                    token = crypto.randomBytes(128).toString('hex'); // 128 bytes = 256 hex characters
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { token: token }
                    });
                }

                // Check if device tracking is enabled
                let deviceInfo = null;
                try {
                    // Get device info from request headers
                    const userAgent = request.headers.get('user-agent') || 'Unknown';

                    // Get user's full details including device history
                    const userData = await prisma.user.findUnique({
                        where: { id: user.id },
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            device_history: true
                        }
                    });

                    // Parse device history (it's stored as JSON)
                    const deviceHistory = userData.device_history || [];

                    // Generate a device identifier based on user agent
                    const deviceId = crypto.createHash('md5').update(userAgent).digest('hex');

                    // Check if this device is in the history
                    const knownDevice = Array.isArray(deviceHistory) && deviceHistory.some(device => device.id === deviceId);

                    if (!knownDevice) {
                        // This is a new device, require verification
                        // Generate a 6-digit auth code
                        const authCode = Math.floor(100000 + Math.random() * 900000).toString();

                        // Store the auth code with expiration (15 minutes)
                        const expiresAt = new Date();
                        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

                        // Store verification token
                        await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                verification_tokens: {
                                    device_verification: {
                                        code: authCode,
                                        device_id: deviceId,
                                        user_agent: userAgent,
                                        expires_at: expiresAt.toISOString()
                                    }
                                }
                            }
                        });

                        // Send auth code via email
                        // Initialize SendGrid with API key
                        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

                        // We already have user email and username from userData
                        const userEmail = userData.email;
                        const username = userData.username;

                        // Compose email
                        const msg = {
                            to: userEmail,
                            from: process.env.SENDGRID_FROM_EMAIL,
                            subject: 'Login Verification Code',
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <h2>Login Verification</h2>
                                    <p>Hello ${username},</p>
                                    <p>We noticed a login attempt from a new device. For your security, please use the following code to verify your identity:</p>
                                    <div style="text-align: center; margin: 30px 0;">
                                        <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">${authCode}</div>
                                    </div>
                                    <p>This code will expire in 15 minutes.</p>
                                    <p>If you didn't attempt to log in, please ignore this email and consider changing your password.</p>
                                </div>
                            `
                        };

                        // Send email
                        await sgMail.send(msg);

                        // Return response indicating verification required
                        return new Response(JSON.stringify({
                            success: false,
                            requireVerification: true,
                            message: 'Login from new device detected. Verification code sent to your email.',
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

                        // Update device history using Prisma
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { device_history: limitedHistory }
                        });
                    } else {
                        // Initialize device history using Prisma
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

    // Handle getAllUsers action (admin/root only)
    else if (action === 'getAllUsers') {
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


            // First check if the requesting user is admin or root
            const authUser = await prisma.user.findFirst({
                where: {
                    id: parseInt(userId),
                    token: token
                },
                select: {
                    role: true
                }
            });

            // If no user found or token doesn't match
            if (!authUser) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Invalid user ID or token'
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const userRole = authUser.role;

            // Check if user has admin or root role
            if (userRole !== 'admin' && userRole !== 'root') {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Unauthorized. Admin or root role required.'
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Get all users (excluding the requesting user)
            const users = await prisma.user.findMany({
                where: {
                    id: {
                        not: parseInt(userId)
                    }
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    created_at: true
                },
                orderBy: {
                    created_at: 'desc'
                }
            });

            // Return users data (excluding sensitive information)
            return new Response(JSON.stringify({
                success: true,
                users: users
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            Sentry.captureException(error);
            console.error('Get all users error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred while fetching users'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // Handle updateUserRole action (admin/root only)
    else if (action === 'updateUserRole') {
        try {
            const userId = requestData.userId;
            const token = requestData.token;
            const targetUserId = requestData.targetUserId;
            const newRole = requestData.newRole;

            // Validate input
            if (!userId || !token || !targetUserId || !newRole) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Missing required parameters'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Validate role
            const validRoles = ['user', 'admin', 'unverified'];
            if (!validRoles.includes(newRole)) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Invalid role'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // First check if the requesting user is admin or root
            const authUser = await prisma.user.findFirst({
                where: {
                    id: parseInt(userId),
                    token: token
                },
                select: {
                    role: true
                }
            });

            // If no user found or token doesn't match
            if (!authUser) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Invalid user ID or token'
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const userRole = authUser.role;

            // Check if user has admin or root role
            if (userRole !== 'admin' && userRole !== 'root') {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Unauthorized. Admin or root role required.'
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if target user exists and get their current role
            const targetUser = await prisma.user.findUnique({
                where: {
                    id: parseInt(targetUserId)
                },
                select: {
                    role: true
                }
            });

            if (!targetUser) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Target user not found'
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const targetUserRole = targetUser.role;

            // Root users can only be modified by other root users
            if (targetUserRole === 'root' && userRole !== 'root') {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Cannot modify a root user'
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Update the user's role
            await prisma.user.update({
                where: {
                    id: parseInt(targetUserId)
                },
                data: {
                    role: newRole
                }
            });

            return new Response(JSON.stringify({
                success: true,
                message: 'User role updated successfully'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            Sentry.captureException(error);
            console.error('Update user role error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred while updating user role'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // Handle deleteUser action (admin/root only)
    else if (action === 'deleteUser') {
        try {
            const userId = requestData.userId;
            const token = requestData.token;
            const targetUserId = requestData.targetUserId;

            // Validate input
            if (!userId || !token || !targetUserId) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Missing required parameters'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            try {
                // First check if the requesting user is admin or root
                const authUser = await prisma.user.findFirst({
                    where: {
                        id: parseInt(userId),
                        token: token
                    },
                    select: {
                        role: true
                    }
                });

                // If no user found or token doesn't match
                if (!authUser) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Invalid user ID or token'
                    }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                const userRole = authUser.role;

                // Check if user has admin or root role
                if (userRole !== 'admin' && userRole !== 'root') {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Unauthorized. Admin or root role required.'
                    }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Check if target user exists and get their role
                const targetUser = await prisma.user.findUnique({
                    where: {
                        id: parseInt(targetUserId)
                    },
                    select: {
                        role: true
                    }
                });

                if (!targetUser) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Target user not found'
                    }), {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                const targetUserRole = targetUser.role;

                // Root users can only be deleted by other root users
                if (targetUserRole === 'root' && userRole !== 'root') {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Cannot delete a root user'
                    }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Delete the user
                await prisma.user.delete({
                    where: {
                        id: parseInt(targetUserId)
                    }
                });

                return new Response(JSON.stringify({
                    success: true,
                    message: 'User deleted successfully'
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
            console.error('Delete user error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred while deleting user'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // Handle updateUserField action
    else if (action === 'updateUserField') {
        try {
            const userId = requestData.userId;
            const token = requestData.token;
            const field = requestData.field;
            const value = requestData.value;
            const currentPassword = requestData.currentPassword;

            // Validate input
            if (!userId || !token || !field || value === undefined) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Missing required parameters'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // First check if user exists and token is valid
            const user = await prisma.user.findFirst({
                where: {
                    id: parseInt(userId),
                    token: token
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    password: true,
                    role: true
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

            // Handle different fields
            switch (field) {
                case 'username':
                    // Check if username is already taken
                { const existingUser = await prisma.user.findFirst({
                    where: {
                        username: value,
                        id: {
                            not: parseInt(userId)
                        }
                    }
                });

                    if (existingUser) {
                        return new Response(JSON.stringify({
                            success: false,
                            message: 'Username is already taken'
                        }), {
                            status: 409,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Update username
                    await prisma.user.update({
                        where: { id: parseInt(userId) },
                        data: { username: value }
                    });
                    break; }

                case 'email':
                    // Check if email is already taken
                { const existingUser = await prisma.user.findFirst({
                    where: {
                        email: value,
                        id: {
                            not: parseInt(userId)
                        }
                    }
                });

                    if (existingUser) {
                        return new Response(JSON.stringify({
                            success: false,
                            message: 'Email is already taken'
                        }), {
                            status: 409,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Update email and set role to unverified
                    await prisma.user.update({
                        where: { id: parseInt(userId) },
                        data: {
                            email: value,
                            role: 'unverified'
                        }
                    });
                    break; }

                case 'password':
                    // Verify current password
                { if (!currentPassword) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Current password is required'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
                    if (!passwordMatch) {
                        return new Response(JSON.stringify({
                            success: false,
                            message: 'Current password is incorrect'
                        }), {
                            status: 401,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Hash the new password
                    const saltRounds = 10;
                    const password_hashed = await bcrypt.hash(value, saltRounds);

                    // Update password
                    await prisma.user.update({
                        where: { id: parseInt(userId) },
                        data: { password: password_hashed }
                    });
                    break; }

                case 'theme':
                    // Update theme preference
                    try {
                        // Get current theme preferences
                        const userData = await prisma.user.findUnique({
                            where: { id: parseInt(userId) },
                            select: { theme_preferences: true }
                        });

                        // Create updated theme preferences
                        const currentPreferences = userData?.theme_preferences || {};
                        const updatedPreferences = {
                            ...currentPreferences,
                            theme: value
                        };

                        // Update theme preference
                        await prisma.user.update({
                            where: { id: parseInt(userId) },
                            data: { theme_preferences: updatedPreferences }
                        });

                        // Award the "Master of the Dark Arts" achievement if dark mode is enabled
                        if (value === 'dark') {
                            try {
                                await awardAchievement(parseInt(userId), 'MASTER_OF_DARK_ARTS');
                            } catch (achievementError) {
                                Sentry.captureException(achievementError);
                                console.error('Error awarding achievement:', achievementError);
                                // Continue even if awarding achievement fails
                            }
                        }
                    } catch (err) {
                        Sentry.captureException(err);
                        console.error('Error updating theme preference:', err);
                        // If there's an error with the theme column, just continue
                        // This is not critical functionality
                    }
                    break;

                default:
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Invalid field'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
            }

            return new Response(JSON.stringify({
                success: true,
                message: `${field} updated successfully`
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            Sentry.captureException(error);
            console.error('Update user field error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred while updating user field'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // Handle sendVerificationEmail action
    else if (action === 'sendVerificationEmail') {
        try {
            const userId = requestData.userId;
            const token = requestData.token;

            // Validate input
            if (!userId || !token) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Missing required parameters'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            try {
                // Check if user exists and token is valid
                const user = await prisma.user.findFirst({
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
                if (!user) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Invalid user ID or token'
                    }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Check if user is already verified
                if (user.role !== 'unverified') {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Email is already verified'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Generate a verification token
                const verificationToken = crypto.randomBytes(32).toString('hex');

                // Add verification token with expiration (24 hours from now)
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 24);

                // Create the verification token data
                const verificationTokenData = {
                    token: verificationToken,
                    expires_at: expiresAt.toISOString()
                };

                // Update the user with the verification token
                await prisma.user.update({
                    where: {
                        id: parseInt(userId)
                    },
                    data: {
                        verification_tokens: {
                            email_verification: verificationTokenData
                        }
                    }
                });

                // Construct the verification link
                // Use the request URL to determine the base URL
                const baseUrl = new URL(request.url).origin;
                const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;

                // Initialize SendGrid with API key
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);

                // Compose email
                const msg = {
                    to: user.email,
                    from: process.env.SENDGRID_FROM_EMAIL, // Verified sender email in SendGrid
                    subject: 'Verify Your Email Address',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>Email Verification</h2>
                            <p>Hello ${user.username},</p>
                            <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
                            </div>
                            <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
                            <p>${verificationLink}</p>
                            <p>This link will expire in 24 hours.</p>
                            <p>If you didn't request this verification, please ignore this email.</p>
                        </div>
                    `
                };

                try {
                    // Send email
                    await sgMail.send(msg);

                    return new Response(JSON.stringify({
                        success: true,
                        message: 'Verification email sent successfully'
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (emailError) {
                    Sentry.captureException(emailError);
                    console.error('Error sending verification email with SendGrid:', emailError);
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Failed to send verification email',
                        error: emailError.message
                    }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            } catch (dbError) {
                Sentry.captureException(dbError);
                console.error('Database operation error:', dbError);
                throw dbError; // Re-throw to be caught by the outer catch block
            }
        } catch (error) {
            Sentry.captureException(error);
            console.error('Send verification email error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred while sending verification email'
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
                // Check if user exists with this email
                const user = await prisma.user.findUnique({
                    where: {
                        email: email
                    },
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        verification_tokens: true
                    }
                });

                // If no user found with this email
                if (!user) {
                    // For security reasons, don't reveal that the email doesn't exist
                    return new Response(JSON.stringify({
                        success: true,
                        message: 'If your email is registered, you will receive password reset instructions'
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Generate a password reset token
                const resetToken = crypto.randomBytes(32).toString('hex');

                // Add reset token with expiration (1 hour from now)
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 1);

                // Create the reset token data
                const resetTokenData = {
                    token: resetToken,
                    expires_at: expiresAt.toISOString()
                };

                // Get current verification tokens or initialize empty object
                const verificationTokens = user.verification_tokens || {};

                // Update the user with the reset token
                await prisma.user.update({
                    where: {
                        id: user.id
                    },
                    data: {
                        verification_tokens: {
                            ...verificationTokens,
                            password_reset: resetTokenData
                        }
                    }
                });

                // Construct the reset password link
                const baseUrl = new URL(request.url).origin;
                const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

                // Initialize SendGrid with API key
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);

                // Compose email
                const msg = {
                    to: user.email,
                    from: process.env.SENDGRID_FROM_EMAIL,
                    subject: 'Reset Your Password',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>Password Reset</h2>
                            <p>Hello ${user.username},</p>
                            <p>We received a request to reset your password. Click the button below to create a new password:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
                            </div>
                            <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
                            <p>${resetLink}</p>
                            <p>This link will expire in 1 hour.</p>
                            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                        </div>
                    `
                };

                try {
                    // Send email
                    await sgMail.send(msg);

                    return new Response(JSON.stringify({
                        success: true,
                        message: 'Password reset instructions sent to your email'
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (emailError) {
                    Sentry.captureException(emailError);
                    console.error('Error sending password reset email with SendGrid:', emailError);
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Failed to send password reset email',
                        error: emailError.message
                    }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
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

    // Handle verifyDeviceCode action
    else if (action === 'verifyDeviceCode') {
        try {
            const userId = requestData.userId;
            const token = requestData.token;
            const authCode = requestData.authCode;

            // Validate input
            if (!userId || !token || !authCode) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Missing required parameters'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            try {
                // Check if user exists and token is valid
                const user = await prisma.user.findFirst({
                    where: {
                        id: parseInt(userId),
                        token: token
                    },
                    select: {
                        id: true,
                        verification_tokens: true,
                        device_history: true
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

                const verificationTokens = user.verification_tokens || {};

                // Check if device verification exists
                if (!verificationTokens.device_verification) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'No device verification in progress'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                const deviceVerification = verificationTokens.device_verification;

                // Check if code matches
                if (deviceVerification.code !== authCode) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Invalid verification code'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Check if code is expired
                const expiresAt = new Date(deviceVerification.expires_at);
                if (expiresAt < new Date()) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Verification code has expired'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Code is valid, add device to history
                const deviceInfo = {
                    id: deviceVerification.device_id,
                    user_agent: deviceVerification.user_agent,
                    last_used: new Date().toISOString()
                };

                // Get current device history
                const deviceHistory = user.device_history || [];

                // Update device history
                let updatedDeviceHistory;
                if (Array.isArray(deviceHistory)) {
                    // Remove this device if it exists
                    const updatedHistory = deviceHistory.filter(device => device.id !== deviceInfo.id);
                    // Add updated device info
                    updatedHistory.push(deviceInfo);
                    // Keep only the last 5 devices
                    updatedDeviceHistory = updatedHistory.slice(-5);
                } else {
                    // Initialize device history
                    updatedDeviceHistory = [deviceInfo];
                }

                // Create a copy of verification tokens without device_verification
                const updatedVerificationTokens = { ...verificationTokens };
                delete updatedVerificationTokens.device_verification;

                // Update the user with the new device history and remove verification token
                await prisma.user.update({
                    where: {
                        id: parseInt(userId)
                    },
                    data: {
                        device_history: updatedDeviceHistory,
                        verification_tokens: updatedVerificationTokens
                    }
                });

                return new Response(JSON.stringify({
                    success: true,
                    message: 'Device verified successfully',
                    userId: userId,
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

    // Handle resetPassword action
    else if (action === 'resetPassword') {
        try {
            const resetToken = requestData.resetToken;
            const newPassword = requestData.newPassword;

            // Validate input
            if (!resetToken || !newPassword) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Missing required parameters'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            try {
                // Find all users
                const users = await prisma.user.findMany({
                    select: {
                        id: true,
                        verification_tokens: true
                    }
                });

                // Find the user with the matching reset token
                let matchedUser = null;
                let tokenData = null;

                for (const user of users) {
                    const verificationTokens = user.verification_tokens || {};
                    const passwordReset = verificationTokens.password_reset;

                    if (passwordReset && passwordReset.token === resetToken) {
                        matchedUser = user;
                        tokenData = passwordReset;
                        break;
                    }
                }

                if (!matchedUser) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Invalid or expired reset token'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Check if token is expired
                const expiresAt = new Date(tokenData.expires_at);
                if (expiresAt < new Date()) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Reset token has expired'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Hash the new password
                const saltRounds = 10;
                const password_hashed = await bcrypt.hash(newPassword, saltRounds);

                // Create a copy of verification tokens without password_reset
                const updatedVerificationTokens = { ...matchedUser.verification_tokens };
                delete updatedVerificationTokens.password_reset;

                // Update user's password and remove the reset token
                await prisma.user.update({
                    where: {
                        id: matchedUser.id
                    },
                    data: {
                        password: password_hashed,
                        verification_tokens: updatedVerificationTokens
                    }
                });

                return new Response(JSON.stringify({
                    success: true,
                    message: 'Password has been reset successfully'
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

    // Handle verifyEmail action
    else if (action === 'verifyEmail') {
        try {
            const verificationToken = requestData.verificationToken;

            // Validate input
            if (!verificationToken) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Missing verification token'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            try {
                // Find all users
                const users = await prisma.user.findMany({
                    select: {
                        id: true,
                        verification_tokens: true
                    }
                });

                // Find the user with the matching verification token
                let matchedUser = null;
                let tokenData = null;

                for (const user of users) {
                    const verificationTokens = user.verification_tokens || {};
                    const emailVerification = verificationTokens.email_verification;

                    if (emailVerification && emailVerification.token === verificationToken) {
                        matchedUser = user;
                        tokenData = emailVerification;
                        break;
                    }
                }

                if (!matchedUser) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Invalid or expired verification token'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Check if token is expired
                const expiresAt = new Date(tokenData.expires_at);
                if (expiresAt < new Date()) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Verification token has expired'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Create a copy of verification tokens without email_verification
                const updatedVerificationTokens = { ...matchedUser.verification_tokens };
                delete updatedVerificationTokens.email_verification;

                // Update user role to 'user' and remove the verification token
                await prisma.user.update({
                    where: {
                        id: matchedUser.id
                    },
                    data: {
                        role: 'user',
                        verification_tokens: updatedVerificationTokens
                    }
                });

                // Award the "Verify Your Email" achievement
                try {
                    await awardAchievement(matchedUser.id, 'VERIFY_EMAIL');
                } catch (achievementError) {
                    Sentry.captureException(achievementError);
                    console.error('Error awarding achievement:', achievementError);
                    // Continue even if awarding achievement fails
                }

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
            console.error('Verify email error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred while verifying email'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // Handle getUserAchievements action
    else if (action === 'getUserAchievements') {
        try {
            const userId = requestData.userId;
            const token = requestData.token;

            // Validate input
            if (!userId || !token) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Missing required parameters'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // First check if user exists and token is valid
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

            // Get user achievements
            const achievements = await prisma.userAchievement.findMany({
                where: { user_id: parseInt(userId) },
                include: {
                    achievement: true,
                },
            });

            // Get user easter eggs
            const easterEggs = await prisma.userEasterEgg.findMany({
                where: { user_id: parseInt(userId) },
                include: {
                    easter_egg: true,
                },
            });

            // Get user secret settings
            const secretSettings = await prisma.userSecretSetting.findMany({
                where: { user_id: parseInt(userId) },
                include: {
                    secret_setting: true,
                },
            });

            return new Response(JSON.stringify({
                success: true,
                achievements,
                easterEggs,
                secretSettings
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            Sentry.captureException(error);
            console.error('Get user achievements error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred while fetching user achievements'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return new Response(JSON.stringify({
        success: false,
        message: 'Invalid action'
    }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
    });
}