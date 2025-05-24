import { executeQueryFirst, executeQueryRun, executeQuery } from '../../lib/d1.js';

export async function unlockEasterEgg(userId, easterEggCode) {
    try {
        // Find the easter egg
        const easterEgg = await executeQueryFirst(
            'SELECT id FROM EasterEgg WHERE code = ?',
            [easterEggCode]
        );

        if (!easterEgg) {
            throw new Error(`Easter egg with code ${easterEggCode} not found`);
        }

        // Check if the user already has this easter egg
        const existingEasterEgg = await executeQueryFirst(
            'SELECT id FROM UserEasterEgg WHERE user_id = ? AND easter_egg_id = ?',
            [userId, easterEgg.id]
        );

        if (existingEasterEgg) {
            return existingEasterEgg;
        }

        // Unlock the easter egg for the user
        const result = await executeQueryRun(
            'INSERT INTO UserEasterEgg (user_id, easter_egg_id, unlocked_at) VALUES (?, ?, datetime("now"))',
            [userId, easterEgg.id]
        );

        // Get the created easter egg with details
        const userEasterEgg = await executeQueryFirst(
            `SELECT uee.*, ee.code, ee.name, ee.description 
             FROM UserEasterEgg uee 
             JOIN EasterEgg ee ON uee.easter_egg_id = ee.id 
             WHERE uee.id = ?`,
            [result.meta.last_row_id]
        );

        // Check if this easter egg unlocks any secret settings
        const secretSettings = await executeQuery(
            'SELECT id FROM SecretSetting WHERE easter_egg_id = ?',
            [easterEgg.id]
        );

        // Unlock the secret settings for the user
        for (const setting of secretSettings.results) {
            await executeQueryRun(
                'INSERT OR IGNORE INTO UserSecretSetting (user_id, secret_setting_id, unlocked_at) VALUES (?, ?, datetime("now"))',
                [userId, setting.id]
            );
        }

        return userEasterEgg;
    } catch (error) {
        console.error('Error unlocking easter egg:', error);
        throw error;
    }
}