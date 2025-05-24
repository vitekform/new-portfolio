export async function onRequest(context) {
    const { request, env } = context;
    const requestData = await request.json();
    const action = requestData.action;

    if (action === 'setupDatabase') {
        try {
            // Validate admin authentication (for security)
            const userId = requestData.userId;
            const token = requestData.token;
            const forceReset = requestData.forceReset || false;

            if (!userId || !token) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Authentication required for database setup'
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if user exists and is admin/root (only if tables exist)
            let isAuthorized = false;
            try {
                const user = await env.DB.prepare(`
                    SELECT id, role FROM users WHERE id = ?1 AND token = ?2 LIMIT 1
                `).bind(parseInt(userId), token).first();

                if (user && (user.role === 'admin' || user.role === 'root')) {
                    isAuthorized = true;
                }
            } catch (error) {
                // If users table doesn't exist, we'll allow setup but log the attempt
                console.log('Users table does not exist, proceeding with setup...');
            }

            // For initial setup, we need to allow database creation
            // But for safety, we require a special setup key for first-time setup
            if (!isAuthorized) {
                const setupKey = requestData.setupKey;
                if (setupKey !== env.DATABASE_SETUP_KEY) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Unauthorized. Admin access or valid setup key required.'
                    }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }

            // Check if database is properly set up
            const isSetupCorrect = await checkDatabaseSetup(env);

            if (isSetupCorrect && !forceReset) {
                return new Response(JSON.stringify({
                    success: true,
                    message: 'Database is already properly set up',
                    alreadySetup: true
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Wipe and recreate database
            await wipeDatabase(env);
            await createDatabaseSchema(env);
            await insertDefaultData(env);

            return new Response(JSON.stringify({
                success: true,
                message: 'Database has been successfully set up',
                tablesCreated: [
                    'users', 'services', 'service_requests', 'tickets',
                    'ticket_messages', 'achievements', 'user_achievements',
                    'easter_eggs', 'user_easter_eggs', 'secret_settings',
                    'user_secret_settings'
                ]
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Database setup error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred during database setup',
                error: error.message
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

/**
 * Check if the database is properly set up
 */
async function checkDatabaseSetup(env) {
    try {
        const requiredTables = [
            'users', 'services', 'service_requests', 'tickets',
            'ticket_messages', 'achievements', 'user_achievements',
            'easter_eggs', 'user_easter_eggs', 'secret_settings',
            'user_secret_settings'
        ];

        // Check if all required tables exist
        for (const table of requiredTables) {
            try {
                await env.DB.prepare(`SELECT 1 FROM ${table} LIMIT 1`).first();
            } catch (error) {
                console.log(`Table ${table} does not exist or is not accessible`);
                return false;
            }
        }

        // Additional checks for table structure can be added here
        // For example, checking if specific columns exist

        return true;
    } catch (error) {
        console.error('Error checking database setup:', error);
        return false;
    }
}

/**
 * Wipe all existing tables
 */
async function wipeDatabase(env) {
    const tables = [
        'user_secret_settings', 'user_easter_eggs', 'user_achievements',
        'secret_settings', 'easter_eggs', 'achievements',
        'ticket_messages', 'tickets', 'service_requests',
        'services', 'users'
    ];

    for (const table of tables) {
        try {
            await env.DB.prepare(`DROP TABLE IF EXISTS ${table}`).run();
            console.log(`Dropped table: ${table}`);
        } catch (error) {
            console.log(`Could not drop table ${table}, it may not exist`);
        }
    }
}

/**
 * Create database schema
 */
async function createDatabaseSchema(env) {
    // Users table
    await env.DB.prepare(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            token TEXT,
            role TEXT DEFAULT 'unverified',
            device_history TEXT,
            verification_tokens TEXT,
            theme_preferences TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Services table
    await env.DB.prepare(`
        CREATE TABLE services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Service requests table
    await env.DB.prepare(`
        CREATE TABLE service_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            service_id INTEGER NOT NULL,
            title TEXT,
            details TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (service_id) REFERENCES services(id)
        )
    `).run();

    // Tickets table
    await env.DB.prepare(`
        CREATE TABLE tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            service_request_id INTEGER NOT NULL,
            status TEXT DEFAULT 'open',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (service_request_id) REFERENCES service_requests(id)
        )
    `).run();

    // Ticket messages table
    await env.DB.prepare(`
        CREATE TABLE ticket_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            sender_id INTEGER NOT NULL,
            ticket_id INTEGER NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (ticket_id) REFERENCES tickets(id)
        )
    `).run();

    // Achievements table
    await env.DB.prepare(`
        CREATE TABLE achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // User achievements table
    await env.DB.prepare(`
        CREATE TABLE user_achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            achievement_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (achievement_id) REFERENCES achievements(id),
            UNIQUE(user_id, achievement_id)
        )
    `).run();

    // Easter eggs table
    await env.DB.prepare(`
        CREATE TABLE easter_eggs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // User easter eggs table
    await env.DB.prepare(`
        CREATE TABLE user_easter_eggs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            easter_egg_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (easter_egg_id) REFERENCES easter_eggs(id),
            UNIQUE(user_id, easter_egg_id)
        )
    `).run();

    // Secret settings table
    await env.DB.prepare(`
        CREATE TABLE secret_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            achievement_id INTEGER,
            easter_egg_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (achievement_id) REFERENCES achievements(id),
            FOREIGN KEY (easter_egg_id) REFERENCES easter_eggs(id)
        )
    `).run();

    // User secret settings table
    await env.DB.prepare(`
        CREATE TABLE user_secret_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            secret_setting_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (secret_setting_id) REFERENCES secret_settings(id),
            UNIQUE(user_id, secret_setting_id)
        )
    `).run();

    console.log('All database tables created successfully');
}

/**
 * Insert default data
 */
async function insertDefaultData(env) {
    // Insert default root user
    const rootPassword = await hashPassword('admin123'); // You should change this
    const rootToken = generateToken();

    await env.DB.prepare(`
        INSERT INTO users (username, email, password, token, role, created_at)
        VALUES (?1, ?2, ?3, ?4, 'root', datetime('now'))
    `).bind('admin', 'admin@example.com', rootPassword, rootToken).run();

    // Insert default services
    const defaultServices = [
        {
            name: 'Web Hosting',
            description: 'Reliable web hosting services with 99.9% uptime guarantee.'
        },
        {
            name: 'File Cloud',
            description: 'Secure cloud storage for your files with easy access from anywhere.'
        },
        {
            name: 'Application Server',
            description: 'Dedicated application server for your custom applications.'
        },
        {
            name: 'CI / CD',
            description: 'Continuous Integration and Continuous Deployment pipeline setup and management.'
        }
    ];

    for (const service of defaultServices) {
        await env.DB.prepare(`
            INSERT INTO services (name, description, created_at)
            VALUES (?1, ?2, datetime('now'))
        `).bind(service.name, service.description).run();
    }

    // Insert default achievements
    const defaultAchievements = [
        {
            code: 'BIG_MISTAKE',
            name: 'Big Mistake',
            description: 'Registered for this platform'
        },
        {
            code: 'VERIFY_EMAIL',
            name: 'Email Verified',
            description: 'Successfully verified your email address'
        },
        {
            code: 'MASTER_OF_DARK_ARTS',
            name: 'Master of the Dark Arts',
            description: 'Enabled dark mode theme'
        }
    ];

    for (const achievement of defaultAchievements) {
        await env.DB.prepare(`
            INSERT INTO achievements (code, name, description, created_at)
            VALUES (?1, ?2, ?3, datetime('now'))
        `).bind(achievement.code, achievement.name, achievement.description).run();
    }

    console.log('Default data inserted successfully');
    console.log(`Root user created - Username: admin, Password: admin123, Token: ${rootToken}`);
}

/**
 * Simple password hashing (you should use bcrypt in production)
 */
async function hashPassword(password) {
    // This is a simplified hash for demo purposes
    // In production, use bcrypt or another proper hashing library
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a secure token
 */
function generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}