import { initializeD1Client, executeQueryRun, executeQuery, executeQueryFirst } from '../lib/d1.js';

/**
 * Complete database setup function
 * Creates all tables, indexes, and inserts default data
 */
export async function setupDatabase(env) {
    try {
        // Initialize D1 client
        initializeD1Client(env);

        console.log('🚀 Starting database setup...');

        // Step 1: Create all tables
        await createTables();
        console.log('✅ Tables created successfully');

        // Step 2: Create indexes
        await createIndexes();
        console.log('✅ Indexes created successfully');

        // Step 3: Insert default data
        await insertDefaultData();
        console.log('✅ Default data inserted successfully');

        // Step 4: Verify setup
        const verification = await verifySetup();
        console.log('✅ Database setup completed successfully');

        return {
            success: true,
            message: 'Database setup completed successfully',
            verification: verification
        };

    } catch (error) {
        console.error('❌ Database setup failed:', error);
        throw error;
    }
}

/**
 * Create all database tables
 */
async function createTables() {
    const tables = [
        // Users table
        `CREATE TABLE IF NOT EXISTS User (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            token TEXT,
            role TEXT NOT NULL DEFAULT 'unverified',
            theme_preferences TEXT DEFAULT '{}',
            device_history TEXT DEFAULT '[]',
            verification_tokens TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        // Services table
        `CREATE TABLE IF NOT EXISTS Service (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        // Service Requests table
        `CREATE TABLE IF NOT EXISTS ServiceRequest (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            service_id INTEGER NOT NULL,
            details TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
            FOREIGN KEY (service_id) REFERENCES Service(id) ON DELETE RESTRICT
        )`,

        // Achievements table
        `CREATE TABLE IF NOT EXISTS Achievement (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        // Easter Eggs table
        `CREATE TABLE IF NOT EXISTS EasterEgg (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        // Secret Settings table
        `CREATE TABLE IF NOT EXISTS SecretSetting (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            achievement_id INTEGER,
            easter_egg_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (achievement_id) REFERENCES Achievement(id) ON DELETE CASCADE,
            FOREIGN KEY (easter_egg_id) REFERENCES EasterEgg(id) ON DELETE CASCADE
        )`,

        // User Achievements table
        `CREATE TABLE IF NOT EXISTS UserAchievement (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            achievement_id INTEGER NOT NULL,
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
            FOREIGN KEY (achievement_id) REFERENCES Achievement(id) ON DELETE CASCADE,
            UNIQUE(user_id, achievement_id)
        )`,

        // User Easter Eggs table
        `CREATE TABLE IF NOT EXISTS UserEasterEgg (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            easter_egg_id INTEGER NOT NULL,
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
            FOREIGN KEY (easter_egg_id) REFERENCES EasterEgg(id) ON DELETE CASCADE,
            UNIQUE(user_id, easter_egg_id)
        )`,

        // User Secret Settings table
        `CREATE TABLE IF NOT EXISTS UserSecretSetting (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            secret_setting_id INTEGER NOT NULL,
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
            FOREIGN KEY (secret_setting_id) REFERENCES SecretSetting(id) ON DELETE CASCADE,
            UNIQUE(user_id, secret_setting_id)
        )`,

        // Tickets table
        `CREATE TABLE IF NOT EXISTS Ticket (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            status TEXT DEFAULT 'open',
            priority TEXT DEFAULT 'medium',
            user_id INTEGER NOT NULL,
            service_request_id INTEGER UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
            FOREIGN KEY (service_request_id) REFERENCES ServiceRequest(id) ON DELETE CASCADE
        )`,

        // Ticket Messages table
        `CREATE TABLE IF NOT EXISTS TicketMessage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ticket_id) REFERENCES Ticket(id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES User(id) ON DELETE CASCADE
        )`
    ];

    for (const table of tables) {
        await executeQueryRun(table);
    }
}

/**
 * Create database indexes for performance
 */
async function createIndexes() {
    const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_user_username ON User(username)',
        'CREATE INDEX IF NOT EXISTS idx_user_email ON User(email)',
        'CREATE INDEX IF NOT EXISTS idx_user_token ON User(token)',
        'CREATE INDEX IF NOT EXISTS idx_service_request_user ON ServiceRequest(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_service_request_service ON ServiceRequest(service_id)',
        'CREATE INDEX IF NOT EXISTS idx_service_request_status ON ServiceRequest(status)',
        'CREATE INDEX IF NOT EXISTS idx_achievement_code ON Achievement(code)',
        'CREATE INDEX IF NOT EXISTS idx_easter_egg_code ON EasterEgg(code)',
        'CREATE INDEX IF NOT EXISTS idx_secret_setting_code ON SecretSetting(code)',
        'CREATE INDEX IF NOT EXISTS idx_user_achievement_user ON UserAchievement(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_achievement_achievement ON UserAchievement(achievement_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_easter_egg_user ON UserEasterEgg(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_easter_egg_easter_egg ON UserEasterEgg(easter_egg_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_secret_setting_user ON UserSecretSetting(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_secret_setting_setting ON UserSecretSetting(secret_setting_id)',
        'CREATE INDEX IF NOT EXISTS idx_ticket_user ON Ticket(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_ticket_service_request ON Ticket(service_request_id)',
        'CREATE INDEX IF NOT EXISTS idx_ticket_status ON Ticket(status)',
        'CREATE INDEX IF NOT EXISTS idx_ticket_message_ticket ON TicketMessage(ticket_id)',
        'CREATE INDEX IF NOT EXISTS idx_ticket_message_sender ON TicketMessage(sender_id)',
        'CREATE INDEX IF NOT EXISTS idx_ticket_message_read ON TicketMessage(is_read)'
    ];

    for (const index of indexes) {
        await executeQueryRun(index);
    }
}

/**
 * Insert default data
 */
async function insertDefaultData() {
    // Insert default services
    const services = [
        ['Web Hosting', 'Reliable web hosting services with 99.9% uptime guarantee.'],
        ['File Cloud', 'Secure cloud storage for your files with easy access from anywhere.'],
        ['Application Server', 'Dedicated application server for your custom applications.'],
        ['CI / CD', 'Continuous Integration and Continuous Deployment pipeline setup and management.'],
        ['Database Management', 'Professional database setup, optimization, and maintenance services.'],
        ['Custom Development', 'Bespoke software development tailored to your specific needs.']
    ];

    for (const [name, description] of services) {
        await executeQueryRun(
            'INSERT OR IGNORE INTO Service (name, description, created_at) VALUES (?, ?, datetime("now"))',
            [name, description]
        );
    }

    // Insert default achievements
    const achievements = [
        ['first_steps', 'First Steps', 'Welcome! You have successfully created your account.'],
        ['email_verified', 'Email Verified', 'You have successfully verified your email address.'],
        ['early_adopter', 'Early Adopter', 'One of the first users to join the platform.'],
        ['profile_complete', 'Profile Complete', 'You have completed your profile information.'],
        ['first_service_request', 'First Service Request', 'You have made your first service request.'],
        ['loyal_customer', 'Loyal Customer', 'You have been using our services for over 6 months.'],
        ['feedback_provider', 'Feedback Provider', 'Thank you for providing valuable feedback to improve our services.'],
        ['problem_solver', 'Problem Solver', 'You have successfully resolved multiple support tickets.'],
        ['community_helper', 'Community Helper', 'You have helped other users in the community forums.'],
        ['security_conscious', 'Security Conscious', 'You have enabled two-factor authentication and other security features.']
    ];

    for (const [code, name, description] of achievements) {
        await executeQueryRun(
            'INSERT OR IGNORE INTO Achievement (code, name, description, created_at) VALUES (?, ?, ?, datetime("now"))',
            [code, name, description]
        );
    }

    // Insert default easter eggs
    const easterEggs = [
        ['konami_code', 'Konami Code', 'You found the classic cheat code! ↑↑↓↓←→←→BA'],
        ['dev_tools', 'Inspector Gadget', 'You opened the developer tools. Welcome, fellow developer!'],
        ['secret_page', 'Hidden Path', 'You discovered a secret page that was not meant to be found.'],
        ['coffee_lover', 'Coffee Enthusiast', 'You clicked on the coffee cup 10 times. Caffeine addiction confirmed!'],
        ['night_owl', 'Night Owl', 'You visited the site between 2 AM and 5 AM. Burning the midnight oil?'],
        ['speed_demon', 'Speed Demon', 'You navigated through 10 pages in under 30 seconds. Impressive!'],
        ['source_code', 'Code Explorer', 'You viewed the source code of the page. Curiosity is a virtue!'],
        ['error_404', 'Lost Explorer', 'You found a 404 page and discovered this easter egg instead.']
    ];

    for (const [code, name, description] of easterEggs) {
        await executeQueryRun(
            'INSERT OR IGNORE INTO EasterEgg (code, name, description, created_at) VALUES (?, ?, ?, datetime("now"))',
            [code, name, description]
        );
    }

    // Insert default secret settings
    const secretSettings = [
        ['dark_mode_plus', 'Dark Mode Plus', 'Unlock additional dark theme options with custom colors.', 'early_adopter', null],
        ['developer_mode', 'Developer Mode', 'Enable advanced debugging and development features.', null, 'dev_tools'],
        ['beta_features', 'Beta Features', 'Access to experimental features before they are released.', 'feedback_provider', null],
        ['priority_support', 'Priority Support', 'Your support tickets get higher priority in the queue.', 'loyal_customer', null],
        ['custom_themes', 'Custom Themes', 'Create and use your own custom color themes.', null, 'konami_code'],
        ['advanced_analytics', 'Advanced Analytics', 'Detailed usage statistics and performance metrics.', 'security_conscious', null]
    ];

    for (const [code, name, description, achievementCode, easterEggCode] of secretSettings) {
        let achievementId = null;
        let easterEggId = null;

        if (achievementCode) {
            const achievement = await executeQueryFirst(
                'SELECT id FROM Achievement WHERE code = ?',
                [achievementCode]
            );
            achievementId = achievement?.id || null;
        }

        if (easterEggCode) {
            const easterEgg = await executeQueryFirst(
                'SELECT id FROM EasterEgg WHERE code = ?',
                [easterEggCode]
            );
            easterEggId = easterEgg?.id || null;
        }

        await executeQueryRun(
            'INSERT OR IGNORE INTO SecretSetting (code, name, description, achievement_id, easter_egg_id, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))',
            [code, name, description, achievementId, easterEggId]
        );
    }

    // Insert default admin user
    // Password is 'admin123' - CHANGE THIS IN PRODUCTION!
    await executeQueryRun(
        `INSERT OR IGNORE INTO User (
            username, 
            email, 
            password, 
            role, 
            theme_preferences, 
            device_history, 
            verification_tokens,
            created_at, 
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))`,
        [
            'admin',
            'admin@ganamaga.me',
            '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // bcrypt hash of 'admin123'
            'root',
            '{"theme": "dark"}',
            '[]',
            '{}'
        ]
    );
}

/**
 * Verify database setup
 */
async function verifySetup() {
    const verification = {};

    // Count records in each table
    const tables = ['User', 'Service', 'Achievement', 'EasterEgg', 'SecretSetting'];

    for (const table of tables) {
        const result = await executeQueryFirst(`SELECT COUNT(*) as count FROM ${table}`);
        verification[table.toLowerCase() + '_count'] = result.count;
    }

    // Check if admin user exists
    const adminUser = await executeQueryFirst(
        'SELECT id, username, role FROM User WHERE username = ?',
        ['admin']
    );
    verification.admin_user_exists = !!adminUser;

    // Check if all tables exist
    const tableCheck = await executeQuery(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    verification.tables_created = tableCheck.results.map(row => row.name);

    return verification;
}

/**
 * Reset database (WARNING: This will delete all data!)
 */
export async function resetDatabase(env) {
    try {
        initializeD1Client(env);

        console.log('⚠️  Starting database reset...');

        // Drop all tables in reverse dependency order
        const dropTables = [
            'DROP TABLE IF EXISTS TicketMessage',
            'DROP TABLE IF EXISTS Ticket',
            'DROP TABLE IF EXISTS UserSecretSetting',
            'DROP TABLE IF EXISTS UserEasterEgg',
            'DROP TABLE IF EXISTS UserAchievement',
            'DROP TABLE IF EXISTS SecretSetting',
            'DROP TABLE IF EXISTS EasterEgg',
            'DROP TABLE IF EXISTS Achievement',
            'DROP TABLE IF EXISTS ServiceRequest',
            'DROP TABLE IF EXISTS Service',
            'DROP TABLE IF EXISTS User'
        ];

        for (const dropTable of dropTables) {
            await executeQueryRun(dropTable);
        }

        console.log('✅ All tables dropped');

        // Now recreate everything
        const result = await setupDatabase(env);

        console.log('✅ Database reset and recreated successfully');
        return result;

    } catch (error) {
        console.error('❌ Database reset failed:', error);
        throw error;
    }
}

/**
 * Check if database is already set up
 */
export async function isDatabaseSetup(env) {
    try {
        initializeD1Client(env);

        // Check if User table exists and has at least one record
        const userCount = await executeQueryFirst('SELECT COUNT(*) as count FROM User');
        const serviceCount = await executeQueryFirst('SELECT COUNT(*) as count FROM Service');

        return {
            is_setup: userCount.count > 0 && serviceCount.count > 0,
            user_count: userCount.count,
            service_count: serviceCount.count
        };
    } catch (error) {
        // If tables don't exist, database is not set up
        return {
            is_setup: false,
            user_count: 0,
            service_count: 0,
            error: error.message
        };
    }
}

// Main handler for the setup endpoint
export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === 'POST') {
        try {
            const requestData = await request.json();
            const action = requestData.action;

            switch (action) {
                case 'setup':
                    const setupResult = await setupDatabase(env);
                    return new Response(JSON.stringify(setupResult), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });

                case 'reset':
                    // Add security check for reset
                    const confirmReset = requestData.confirmReset;
                    if (confirmReset !== 'YES_I_WANT_TO_DELETE_ALL_DATA') {
                        return new Response(JSON.stringify({
                            success: false,
                            message: 'Reset confirmation required. Set confirmReset to "YES_I_WANT_TO_DELETE_ALL_DATA"'
                        }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    const resetResult = await resetDatabase(env);
                    return new Response(JSON.stringify(resetResult), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });

                case 'check':
                    const checkResult = await isDatabaseSetup(env);
                    return new Response(JSON.stringify(checkResult), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });

                default:
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Invalid action. Use "setup", "reset", or "check"'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
            }
        } catch (error) {
            console.error('Database setup error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'Database setup failed',
                error: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return new Response('Method not allowed', { status: 405 });
}