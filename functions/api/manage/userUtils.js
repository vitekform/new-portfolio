import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import getD1Client, { initializeD1Client } from '../lib/d1.js'; // Use D1 client
import { awardAchievement } from './achievementUtils.js';

export function onRequest(context) {
    return (async () => {
        const request = context.request;
        const env = context.env;

        // Initialize the D1 client with the environment
        initializeD1Client(env);
        const d1 = getD1Client(env);

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
                    const existingUser = await d1.user.findFirst({
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
                    const newUser = await d1.user.create({
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
                        await awardAchievement(newUserId, 'BIG_MIST