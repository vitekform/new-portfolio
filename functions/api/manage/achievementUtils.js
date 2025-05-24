/**
 * Award an achievement to a user
 * @param {number} userId - The ID of the user
 * @param {string} achievementCode - The code of the achievement to award
 * @param {Object} env - The environment object containing D1 binding
 * @returns {Promise<Object>} - The created user achievement
 */
export async function awardAchievement(userId, achievementCode, env) {
    try {
        // Find the achievement first
        const achievement = await env.DB.prepare(`
      SELECT id FROM achievements WHERE code = ?1 LIMIT 1
    `).bind(achievementCode).first();

        if (!achievement) {
            throw new Error(`Achievement with code ${achievementCode} not found`);
        }

        // Check if the user already has this achievement
        const existingAchievement = await env.DB.prepare(`
      SELECT * FROM user_achievements WHERE user_id = ?1 AND achievement_id = ?2 LIMIT 1
    `).bind(userId, achievement.id).first();

        if (existingAchievement) {
            return existingAchievement;
        }

        // Award the achievement to the user
        const insertResult = await env.DB.prepare(`
      INSERT INTO user_achievements (user_id, achievement_id, created_at)
      VALUES (?1, ?2, datetime('now'))
    `).bind(userId, achievement.id).run();

        // Get the created user achievement with achievement details
        const userAchievement = await env.DB.prepare(`
      SELECT ua.*, a.code, a.name, a.description 
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?1 AND ua.achievement_id = ?2
    `).bind(userId, achievement.id).first();

        // Check if this achievement unlocks any secret settings
        const secretSettingsResult = await env.DB.prepare(`
      SELECT id FROM secret_settings WHERE achievement_id = ?1
    `).bind(achievement.id).all();

        // Unlock the secret settings for the user
        for (const setting of secretSettingsResult.results) {
            // Check if user already has this secret setting
            const existingSetting = await env.DB.prepare(`
        SELECT id FROM user_secret_settings WHERE user_id = ?1 AND secret_setting_id = ?2 LIMIT 1
      `).bind(userId, setting.id).first();

            if (!existingSetting) {
                await env.DB.prepare(`
          INSERT INTO user_secret_settings (user_id, secret_setting_id, created_at)
          VALUES (?1, ?2, datetime('now'))
        `).bind(userId, setting.id).run();
            }
        }

        return userAchievement;
    } catch (error) {
        console.error('Error awarding achievement:', error);
        throw error;
    }
}

/**
 * Unlock an easter egg for a user
 * @param {number} userId - The ID of the user
 * @param {string} easterEggCode - The code of the easter egg to unlock
 * @param {Object} env - The environment object containing D1 binding
 * @returns {Promise<Object>} - The created user easter egg
 */
export async function unlockEasterEgg(userId, easterEggCode, env) {
    try {
        // Find the easter egg first
        const easterEgg = await env.DB.prepare(`
      SELECT id FROM easter_eggs WHERE code = ?1 LIMIT 1
    `).bind(easterEggCode).first();

        if (!easterEgg) {
            throw new Error(`Easter egg with code ${easterEggCode} not found`);
        }

        // Check if the user already has this easter egg
        const existingEasterEgg = await env.DB.prepare(`
      SELECT * FROM user_easter_eggs WHERE user_id = ?1 AND easter_egg_id = ?2 LIMIT 1
    `).bind(userId, easterEgg.id).first();

        if (existingEasterEgg) {
            return existingEasterEgg;
        }

        // Unlock the easter egg for the user
        const insertResult = await env.DB.prepare(`
      INSERT INTO user_easter_eggs (user_id, easter_egg_id, created_at)
      VALUES (?1, ?2, datetime('now'))
    `).bind(userId, easterEgg.id).run();

        // Get the created user easter egg with easter egg details
        const userEasterEgg = await env.DB.prepare(`
      SELECT uee.*, ee.code, ee.name, ee.description 
      FROM user_easter_eggs uee
      JOIN easter_eggs ee ON uee.easter_egg_id = ee.id
      WHERE uee.user_id = ?1 AND uee.easter_egg_id = ?2
    `).bind(userId, easterEgg.id).first();

        // Check if this easter egg unlocks any secret settings
        const secretSettingsResult = await env.DB.prepare(`
      SELECT id FROM secret_settings WHERE easter_egg_id = ?1
    `).bind(easterEgg.id).all();

        // Unlock the secret settings for the user
        for (const setting of secretSettingsResult.results) {
            // Check if user already has this secret setting
            const existingSetting = await env.DB.prepare(`
        SELECT id FROM user_secret_settings WHERE user_id = ?1 AND secret_setting_id = ?2 LIMIT 1
      `).bind(userId, setting.id).first();

            if (!existingSetting) {
                await env.DB.prepare(`
          INSERT INTO user_secret_settings (user_id, secret_setting_id, created_at)
          VALUES (?1, ?2, datetime('now'))
        `).bind(userId, setting.id).run();
            }
        }

        return userEasterEgg;
    } catch (error) {
        console.error('Error unlocking easter egg:', error);
        throw error;
    }
}

/**
 * Get all achievements for a user
 * @param {number} userId - The ID of the user
 * @param {Object} env - The environment object containing D1 binding
 * @returns {Promise<Array>} - The user's achievements
 */
export async function getUserAchievements(userId, env) {
    try {
        const userAchievementsResult = await env.DB.prepare(`
      SELECT ua.*, a.code, a.name, a.description
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?1
      ORDER BY ua.created_at DESC
    `).bind(userId).all();

        return userAchievementsResult.results;
    } catch (error) {
        console.error('Error getting user achievements:', error);
        throw error;
    }
}

/**
 * Get all easter eggs for a user
 * @param {number} userId - The ID of the user
 * @param {Object} env - The environment object containing D1 binding
 * @returns {Promise<Array>} - The user's easter eggs
 */
export async function getUserEasterEggs(userId, env) {
    try {
        const userEasterEggsResult = await env.DB.prepare(`
      SELECT uee.*, ee.code, ee.name, ee.description
      FROM user_easter_eggs uee
      JOIN easter_eggs ee ON uee.easter_egg_id = ee.id
      WHERE uee.user_id = ?1
      ORDER BY uee.created_at DESC
    `).bind(userId).all();

        return userEasterEggsResult.results;
    } catch (error) {
        console.error('Error getting user easter eggs:', error);
        throw error;
    }
}

/**
 * Get all secret settings for a user
 * @param {number} userId - The ID of the user
 * @param {Object} env - The environment object containing D1 binding
 * @returns {Promise<Array>} - The user's secret settings
 */
export async function getUserSecretSettings(userId, env) {
    try {
        const userSecretSettingsResult = await env.DB.prepare(`
      SELECT uss.*, ss.code, ss.name, ss.description
      FROM user_secret_settings uss
      JOIN secret_settings ss ON uss.secret_setting_id = ss.id
      WHERE uss.user_id = ?1
      ORDER BY uss.created_at DESC
    `).bind(userId).all();

        return userSecretSettingsResult.results;
    } catch (error) {
        console.error('Error getting user secret settings:', error);
        throw error;
    }
}

/**
 * Get all achievements
 * @param {Object} env - The environment object containing D1 binding
 * @returns {Promise<Array>} - All achievements
 */
export async function getAllAchievements(env) {
    try {
        const achievementsResult = await env.DB.prepare(`
      SELECT * FROM achievements ORDER BY created_at DESC
    `).all();

        return achievementsResult.results;
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
 * @param {Object} env - The environment object containing D1 binding
 * @returns {Promise<Object>} - The created achievement
 */
export async function createAchievement(code, name, description, env) {
    try {
        // Check if achievement with this code already exists
        const existingAchievement = await env.DB.prepare(`
      SELECT id FROM achievements WHERE code = ?1 LIMIT 1
    `).bind(code).first();

        if (existingAchievement) {
            throw new Error(`Achievement with code ${code} already exists`);
        }

        const insertResult = await env.DB.prepare(`
      INSERT INTO achievements (code, name, description, created_at)
      VALUES (?1, ?2, ?3, datetime('now'))
    `).bind(code, name, description).run();

        const achievementId = insertResult.meta.last_row_id;

        const achievement = await env.DB.prepare(`
      SELECT * FROM achievements WHERE id = ?1
    `).bind(achievementId).first();

        return achievement;
    } catch (error) {
        console.error('Error creating achievement:', error);
        throw error;
    }
}

/**
 * Update an achievement
 * @param {number} id - The ID of the achievement to update
 * @param {string} name - The new name of the achievement
 * @param {string} description - The new description of the achievement
 * @param {Object} env - The environment object containing D1 binding
 * @returns {Promise<Object>} - The updated achievement
 */
export async function updateAchievement(id, name, description, env) {
    try {
        await env.DB.prepare(`
      UPDATE achievements SET name = ?1, description = ?2, updated_at = datetime('now') WHERE id = ?3
    `).bind(name, description, id).run();

        const achievement = await env.DB.prepare(`
      SELECT * FROM achievements WHERE id = ?1
    `).bind(id).first();

        return achievement;
    } catch (error) {
        console.error('Error updating achievement:', error);
        throw error;
    }
}

/**
 * Delete an achievement
 * @param {number} id - The ID of the achievement to delete
 * @param {Object} env - The environment object containing D1 binding
 * @returns {Promise<Object>} - The deleted achievement
 */
export async function deleteAchievement(id, env) {
    try {
        // Check if achievement is being used by any users
        const userAchievementsResult = await env.DB.prepare(`
      SELECT id FROM user_achievements WHERE achievement_id = ?1 LIMIT 1
    `).bind(id).first();

        if (userAchievementsResult) {
            throw new Error('Cannot delete achievement that has been awarded to users');
        }

        // Check if achievement is linked to any secret settings
        const secretSettingsResult = await env.DB.prepare(`
      SELECT id FROM secret_settings WHERE achievement_id = ?1 LIMIT 1
    `).bind(id).first();

        if (secretSettingsResult) {
            throw new Error('Cannot delete achievement that is linked to secret settings');
        }

        // Get the achievement before deleting
        const achievement = await env.DB.prepare(`
      SELECT * FROM achievements WHERE id = ?1
    `).bind(id).first();

        if (!achievement) {
            throw new Error('Achievement not found');
        }

        await env.DB.prepare(`
      DELETE FROM achievements WHERE id = ?1
    `).bind(id).run();

        return achievement;
    } catch (error) {
        console.error('Error deleting achievement:', error);
        throw error;
    }
}

export async function POST(request, env) {
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

            // Verify user authentication and check if user is admin or root
            const user = await env.DB.prepare(`
        SELECT id, role FROM users WHERE id = ?1 AND token = ?2 LIMIT 1
      `).bind(parseInt(userId), token).first();

            if (!user) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Invalid authentication'
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if user is admin or root
            if (user.role !== 'admin' && user.role !== 'root') {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Unauthorized. Admin or root access required.'
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Get all achievements
            const achievements = await getAllAchievements(env);

            return new Response(JSON.stringify({
                success: true,
                achievements
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
    }
    else if (action === 'createAchievement') {
        try {
            // Validate user authentication
            const userId = requestData.userId;
            const token = requestData.token;
            const code = requestData.code;
            const name = requestData.name;
            const description = requestData.description;

            if (!userId || !token || !code || !name || !description) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Missing required parameters'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Verify user authentication and check if user is admin or root
            const user = await env.DB.prepare(`
        SELECT id, role FROM users WHERE id = ?1 AND token = ?2 LIMIT 1
      `).bind(parseInt(userId), token).first();

            if (!user) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Invalid authentication'
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if user is admin or root
            if (user.role !== 'admin' && user.role !== 'root') {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Unauthorized. Admin or root access required.'
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Create achievement
            const achievement = await createAchievement(code, name, description, env);

            return new Response(JSON.stringify({
                success: true,
                message: 'Achievement created successfully',
                achievement
            }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Create achievement error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: error.message || 'An error occurred while creating achievement'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    else if (action === 'updateAchievement') {
        try {
            // Validate user authentication
            const userId = requestData.userId;
            const token = requestData.token;
            const achievementId = requestData.achievementId;
            const name = requestData.name;
            const description = requestData.description;

            if (!userId || !token || !achievementId || !name || !description) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Missing required parameters'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Verify user authentication and check if user is admin or root
            const user = await env.DB.prepare(`
        SELECT id, role FROM users WHERE id = ?1 AND token = ?2 LIMIT 1
      `).bind(parseInt(userId), token).first();

            if (!user) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Invalid authentication'
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if user is admin or root
            if (user.role !== 'admin' && user.role !== 'root') {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Unauthorized. Admin or root access required.'
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Update achievement
            const achievement = await updateAchievement(parseInt(achievementId), name, description, env);

            return new Response(JSON.stringify({
                success: true,
                message: 'Achievement updated successfully',
                achievement
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Update achievement error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: error.message || 'An error occurred while updating achievement'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    else if (action === 'deleteAchievement') {
        try {
            // Validate user authentication
            const userId = requestData.userId;
            const token = requestData.token;
            const achievementId = requestData.achievementId;

            if (!userId || !token || !achievementId) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Missing required parameters'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Verify user authentication and check if user is admin or root
            const user = await env.DB.prepare(`
        SELECT id, role FROM users WHERE id = ?1 AND token = ?2 LIMIT 1
      `).bind(parseInt(userId), token).first();

            if (!user) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Invalid authentication'
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if user is admin or root
            if (user.role !== 'admin' && user.role !== 'root') {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Unauthorized. Admin or root access required.'
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Delete achievement
            const achievement = await deleteAchievement(parseInt(achievementId), env);

            return new Response(JSON.stringify({
                success: true,
                message: 'Achievement deleted successfully',
                achievement
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Delete achievement error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: error.message || 'An error occurred while deleting achievement'
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