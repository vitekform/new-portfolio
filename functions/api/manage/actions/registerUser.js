import { executeQueryFirst, executeQueryRun } from '../../lib/d1.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function registerUser(requestData) {
    try {
        const username = requestData.username;
        const email = requestData.email;
        const password = requestData.password;
        let confirmPassword = requestData.confirmPassword;

        // Validate input
        if (!username || !email || !password) {
            let didnt_provide = [];
            if (!username) didnt_provide.push('username');
            if (!email) didnt_provide.push('email');
            if (!password) didnt_provide.push('password');
            return new Response(JSON.stringify({
                success: false,
                message: 'All fields are required! You didnt provide: ' + didnt_provide
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!confirmPassword) {
            // for some reason, the frontend doesn't send confirmPassword
            confirmPassword = password; // assume they match if not provided
        }
        // Validate password confirmation
        if (password !== confirmPassword) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Passwords do not match'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate password strength (minimum 8 characters)
        if (password.length < 8) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Password must be at least 8 characters long'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Please enter a valid email address'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate username format (alphanumeric and underscores only, 3-20 characters)
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            // Check if username already exists
            const existingUserByUsername = await executeQueryFirst(
                'SELECT id FROM User WHERE username = ?',
                [username]
            );

            if (existingUserByUsername) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Username is already taken'
                }), {
                    status: 409,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if email already exists
            const existingUserByEmail = await executeQueryFirst(
                'SELECT id FROM User WHERE email = ?',
                [email]
            );

            if (existingUserByEmail) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Email is already registered'
                }), {
                    status: 409,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Generate initial session token
            const token = uuidv4();

            // Generate verification token for email verification
            const verificationToken = uuidv4();
            const verificationTokens = JSON.stringify({
                email: verificationToken,
                created_at: new Date().toISOString()
            });

            // Create new user
            const result = await executeQueryRun(
                `INSERT INTO User (
                    username, 
                    email, 
                    password, 
                    token, 
                    role, 
                    theme_preferences, 
                    device_history, 
                    verification_tokens,
                    created_at, 
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))`,
                [
                    username,
                    email,
                    hashedPassword,
                    token,
                    'unverified', // Default role for new users
                    '{}', // Default theme preferences
                    '[]', // Default device history
                    verificationTokens
                ]
            );

            const userId = result.meta.last_row_id;

            // Award "First Steps" achievement for registering
            try {
                // Check if "First Steps" achievement exists
                const firstStepsAchievement = await executeQueryFirst(
                    'SELECT id FROM Achievement WHERE code = ?',
                    ['first_steps']
                );

                if (firstStepsAchievement) {
                    // Award the achievement
                    await executeQueryRun(
                        'INSERT INTO UserAchievement (user_id, achievement_id, unlocked_at) VALUES (?, ?, datetime("now"))',
                        [userId, firstStepsAchievement.id]
                    );
                }
            } catch (achievementError) {
                console.error('Error awarding registration achievement:', achievementError);
                // Don't fail registration if achievement awarding fails
            }

            // Return success response with user data
            return new Response(JSON.stringify({
                success: true,
                message: 'Registration successful! Please check your email to verify your account.',
                userId: userId,
                token: token,
                verificationToken: verificationToken, // In a real app, you'd send this via email
                userData: {
                    id: userId,
                    username: username,
                    email: email,
                    role: 'unverified'
                }
            }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (dbError) {
            console.error('Database operation error:', dbError);

            // Check if it's a unique constraint violation
            if (dbError.message && dbError.message.includes('UNIQUE constraint failed')) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Username or email is already taken'
                }), {
                    status: 409,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            throw dbError;
        }
    } catch (error) {
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