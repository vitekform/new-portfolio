import getD1Client, { initializeD1Client } from '../lib/d1.js';

/**
 * Award an achievement to a user
 * @param {number} userId - The ID of the user
 * @param {string} achievementCode - The code of the achievement to award
 * @returns {Promise<Object>} - The created user achievement
 */
export async function awardAchievement(userId, achievementCode) {
  const d1 = getD1Client();
  try {
    // Check if the user already has this achievement
    const achievement = await d1.achievement.findUnique({ where: { code: achievementCode } });
    if (!achievement) throw new Error(`Achievement with code ${achievementCode} not found`);
    const existingAchievement = await d1.userAchievement.findUnique({
      where: {
        user_id_achievement_id: {
          user_id: userId,
          achievement_id: achievement.id
        }
      }
    });

    if (existingAchievement) {
      return existingAchievement;
    }

    // Award the achievement to the user
    const userAchievement = await d1.userAchievement.create({
      data: {
        user_id: userId,
        achievement_id: achievement.id,
      }
    });

    // Check if this achievement unlocks any secret settings
    const secretSettings = await d1.secretSetting.findMany({
      where: { achievement_id: achievement.id },
    });

    // Unlock the secret settings for the user
    for (const setting of secretSettings) {
      await d1.userSecretSetting.create({
        data: {
          user_id: userId,
          secret_setting_id: setting.id,
        },
      });
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
 * @returns {Promise<Object>} - The created user easter egg
 */
export async function unlockEasterEgg(userId, easterEggCode) {
  const d1 = getD1Client();
  try {
    const easterEgg = await d1.easterEgg.findUnique({ where: { code: easterEggCode } });
    if (!easterEgg) throw new Error(`Easter egg with code ${easterEggCode} not found`);
    const existingEasterEgg = await d1.userEasterEgg.findUnique({
      where: {
        user_id_easter_egg_id: {
          user_id: userId,
          easter_egg_id: easterEgg.id
        }
      }
    });

    if (existingEasterEgg) {
      return existingEasterEgg;
    }

    // Unlock the easter egg for the user
    const userEasterEgg = await d1.userEasterEgg.create({
      data: {
        user_id: userId,
        easter_egg_id: easterEgg.id,
      }
    });

    // Check if this easter egg unlocks any secret settings
    const secretSettings = await d1.secretSetting.findMany({
      where: { easter_egg_id: easterEgg.id },
    });

    // Unlock the secret settings for the user
    for (const setting of secretSettings) {
      await d1.userSecretSetting.create({
        data: {
          user_id: userId,
          secret_setting_id: setting.id,
        },
      });
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
 * @returns {Promise<Array>} - The user's achievements
 */
export async function getUserAchievements(userId) {
  const d1 = getD1Client();
  try {
    const userAchievements = await d1.userAchievement.findMany({
      where: { user_id: userId }
    });
    return userAchievements;
  } catch (error) {
    console.error('Error getting user achievements:', error);
    throw error;
  }
}

/**
 * Get all easter eggs for a user
 * @param {number} userId - The ID of the user
 * @returns {Promise<Array>} - The user's easter eggs
 */
export async function getUserEasterEggs(userId) {
  const d1 = getD1Client();
  try {
    const userEasterEggs = await d1.userEasterEgg.findMany({
      where: { user_id: userId }
    });
    return userEasterEggs;
  } catch (error) {
    console.error('Error getting user easter eggs:', error);
    throw error;
  }
}

/**
 * Get all secret settings for a user
 * @param {number} userId - The ID of the user
 * @returns {Promise<Array>} - The user's secret settings
 */
export async function getUserSecretSettings(userId) {
  const d1 = getD1Client();
  try {
    const userSecretSettings = await d1.userSecretSetting.findMany({
      where: { user_id: userId }
    });
    return userSecretSettings;
  } catch (error) {
    console.error('Error getting user secret settings:', error);
    throw error;
  }
}

/**
 * Get all achievements
 * @returns {Promise<Array>} - All achievements
 */
export async function getAllAchievements() {
  const d1 = getD1Client();
  try {
    const achievements = await d1.achievement.findMany();
    return achievements;
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
  const d1 = getD1Client();
  try {
    // Check if achievement with this code already exists
    const existingAchievement = await d1.achievement.findUnique({
      where: { code }
    });

    if (existingAchievement) {
      throw new Error(`Achievement with code ${code} already exists`);
    }

    const achievement = await d1.achievement.create({
      data: {
        code,
        name,
        description
      }
    });

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
 * @returns {Promise<Object>} - The updated achievement
 */
export async function updateAchievement(id, name, description) {
  const d1 = getD1Client();
  try {
    const achievement = await d1.achievement.update({
      where: { id },
      data: {
        name,
        description
      }
    });

    return achievement;
  } catch (error) {
    console.error('Error updating achievement:', error);
    throw error;
  }
}

/**
 * Delete an achievement
 * @param {number} id - The ID of the achievement to delete
 * @returns {Promise<Object>} - The deleted achievement
 */
export async function deleteAchievement(id) {
  const d1 = getD1Client();
  try {
    // Check if achievement is being used by any users
    const userAchievements = await d1.userAchievement.findMany({
      where: { achievement_id: id }
    });

    if (userAchievements.length > 0) {
      throw new Error('Cannot delete achievement that has been awarded to users');
    }

    // Check if achievement is linked to any secret settings
    const secretSettings = await d1.secretSetting.findMany({
      where: { achievement_id: id }
    });

    if (secretSettings.length > 0) {
      throw new Error('Cannot delete achievement that is linked to secret settings');
    }

    const achievement = await d1.achievement.delete({
      where: { id }
    });

    return achievement;
  } catch (error) {
    console.error('Error deleting achievement:', error);
    throw error;
  }
}

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
        const user = await d1.user.findFirst({
          where: {
            id: parseInt(userId),
            token: token
          }
        });

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
        const achievements = await getAllAchievements();

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
        const user = await d1.user.findFirst({
          where: {
            id: parseInt(userId),
            token: token
          }
        });

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
        const achievement = await createAchievement(code, name, description);

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
        const user = await d1.user.findFirst({
          where: {
            id: parseInt(userId),
            token: token
          }
        });

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
        const achievement = await updateAchievement(parseInt(achievementId), name, description);

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
        const user = await d1.user.findFirst({
          where: {
            id: parseInt(userId),
            token: token
          }
        });

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
        const achievement = await deleteAchievement(parseInt(achievementId));

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
  })();
}