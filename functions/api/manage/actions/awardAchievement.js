import { executeQueryFirst, executeQueryRun, executeQuery } from '../../lib/d1.js';

export async function awardAchievement(userId, achievementCode) {
    try {
        // Check if the user already has this achievement
        const achievement = await executeQueryFirst(
            'SELECT id FROM Achievement WHERE code = ?',
            [achievementCode]
        );

        if (!achievement) {
            throw new Error(`Achievement with code ${achievementCode} not found`);
        }

        const existingAchievement = await executeQueryFirst(
            'SELECT id FROM UserAchievement WHERE user_id = ? AND achievement_id = ?',
            [userId, achievement.id]
        );

        if (existingAchievement) {
            return existingAchievement;
        }

        // Award the achievement to the user
        const result = await executeQueryRun(
            'INSERT INTO UserAchievement (user_id, achievement_id, unlocked_at) VALUES (?, ?, datetime("now"))',
            [userId, achievement.id]
        );

        // Get the created achievement with details
        const userAchievement = await executeQueryFirst(
            `SELECT ua.*, a.code, a.name, a.description 
             FROM UserAchievement ua 
             JOIN Achievement a ON ua.achievement_id = a.id 
             WHERE ua.id = ?`,
            [result.meta.last_row_id]
        );

        // Check if this achievement unlocks any secret settings
        const secretSettings = await executeQuery(
            'SELECT id FROM SecretSetting WHERE achievement_id = ?',
            [achievement.id]
        );

        // Unlock the secret settings for the user
        for (const setting of secretSettings.results) {
            await executeQueryRun(
                'INSERT OR IGNORE INTO UserSecretSetting (user_id, secret_setting_id, unlocked_at) VALUES (?, ?, datetime("now"))',
                [userId, setting.id]
            );
        }

        return userAchievement;
    } catch (error) {
        console.error('Error awarding achievement:', error);
        throw error;
    }
}