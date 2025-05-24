import { initializeD1Client, executeQuery, executeQueryFirst, executeQueryRun } from '../lib/d1.js';
import { awardAchievement } from './actions/awardAchievement.js';
import { unlockEasterEgg } from './actions/unlockEasterEgg.js';

// Export the utility functions for use in other modules
export { awardAchievement, unlockEasterEgg };

/**
 * Get all achievements
 * @returns {Promise<Array>} - All achievements
 */
export async function getAllAchievements() {
    try {
        const achievements = await executeQuery(
            'SELECT * FROM Achievement ORDER BY created_at DESC'
        );
        return achievements.results;
    } catch (error) {
        console.error('Error getting all achievements:', error);
        throw error;
    }
}

/**
 * Create a new achievement
 * @param {string} code - The code of the achievement
 * @param {string} name - The name of the achievement
 * @param {string} description - The description of the achievement
 * @returns {Promise<Object>} - The created achievement
 */
export async function createAchievement(code, name, description) {
    try {
        // Check if achievement with this code already exists
        const existingAchievement = await executeQueryFirst(
            'SELECT id FROM Achievement WHERE code = ?',
            [code]
        );

        if (existingAchievement) {
            throw new Error(`Achievement with code ${code} already exists`);
        }

        const result = await executeQueryRun(
            'INSERT INTO Achievement (code, name, description, created_at) VALUES (?, ?, ?, datetime("now"))',
            [code, name, description]
        );

        // Get the created achievement
        const achievement = await executeQueryFirst(
            'SELECT * FROM Achievement WHERE id = ?',
            [result.meta.last_row_id]
        );

        return achievement;
    } catch (error) {
        console.error('Error creating achievement:', error);
        throw error;
    }
}

export async function onRequest(context) {
    const { request, env } = context;

    // Initialize D1 client
    initializeD1Client(env);

    if (request.method === 'POST') {
        // Parse the request body
        const requestData = await request.json();
        const action = requestData.action;

        if (action === 'getAllAchievements') {
            try {
                // Validate user authentication
                const userId = requestData.userId;
                const token = requestData.token;

                if (!userId || !token) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Authentication required'
                    }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Verify user authentication
                const user = await executeQueryFirst(
                    'SELECT id, role FROM User WHERE id = ? AND token = ?',
                    [parseInt(userId), token]
                );

                if (!user) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Invalid authentication'
                    }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Get all achievements
                const achievements = await getAllAchievements();

                return new Response(JSON.stringify({
                    success: true,
                    achievements: achievements
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (error) {
                console.error('Get all achievements error:', error);
                return new Response(JSON.stringify({
                    success: false,
                    message: 'An error occurred while fetching achievements'
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        } else {
            return new Response(JSON.stringify({
                success: false,
                message: 'Invalid action'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return new Response('Method not allowed', { status: 405 });
}