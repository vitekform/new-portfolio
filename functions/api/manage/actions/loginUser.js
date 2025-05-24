import { executeQueryFirst, executeQueryRun } from '../../lib/d1.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function loginUser(requestData) {
    try {
        const username = requestData.username;
        const password = requestData.password;
        const deviceInfo = requestData.deviceInfo || {};

        // Validate input
        if (!username || !password) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Username and password are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            // Check if user exists with the provided username
            const user = await executeQueryFirst(
                'SELECT id, username, email, password, role, device_history FROM User WHERE username = ?',
                [username]
            );

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

            // Generate new session token
            const token = uuidv4();

            // Update user's token
            await executeQueryRun(
                'UPDATE User SET token = ?, updated_at = datetime("now") WHERE id = ?',
                [token, user.id]
            );

            // Handle device tracking
            try {
                if (deviceInfo && Object.keys(deviceInfo).length > 0) {
                    let deviceHistory = [];

                    // Parse existing device history
                    if (user.device_history) {
                        try {
                            deviceHistory = JSON.parse(user.device_history);
                        } catch (parseError) {
                            console.error('Error parsing device history:', parseError);
                            deviceHistory = [];
                        }
                    }

                    // Add current device info with timestamp
                    const deviceWithTimestamp = {
                        ...deviceInfo,
                        timestamp: new Date().toISOString()
                    };

                    // Check if this device is already in history (based on IP and user agent)
                    const existingDeviceIndex = deviceHistory.findIndex(device =>
                        device.ip === deviceInfo.ip && device.userAgent === deviceInfo.userAgent
                    );

                    if (existingDeviceIndex !== -1) {
                        // Update existing device timestamp
                        deviceHistory[existingDeviceIndex] = deviceWithTimestamp;
                    } else {
                        // Add new device
                        deviceHistory.unshift(deviceWithTimestamp);
                    }

                    // Keep only last 10 devices
                    const limitedHistory = deviceHistory.slice(0, 10);

                    // Update device history
                    await executeQueryRun(
                        'UPDATE User SET device_history = ? WHERE id = ?',
                        [JSON.stringify(limitedHistory), user.id]
                    );
                }
            } catch (deviceError) {
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
            console.error('Database operation error:', dbError);
            throw dbError;
        }
    } catch (error) {
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