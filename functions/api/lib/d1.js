/**
 * Cloudflare D1 Database Client
 * Replaces Prisma for Cloudflare Pages with D1 binding named "DB"
 */

let db = null;

export function initializeD1Client(env) {
    if (!env?.DB) {
        throw new Error('D1 database binding "DB" not found in environment');
    }
    db = env.DB;
    return db;
}

export function getD1Client() {
    if (!db) {
        throw new Error('D1 client not initialized. Call initializeD1Client(env) first.');
    }
    return db;
}

// Helper function to execute queries with error handling
export async function executeQuery(query, params = []) {
    const client = getD1Client();
    try {
        const result = await client.prepare(query).bind(...params).all();
        return result;
    } catch (error) {
        console.error('D1 Query Error:', error);
        throw error;
    }
}

// Helper function to execute single queries
export async function executeQueryFirst(query, params = []) {
    const client = getD1Client();
    try {
        const result = await client.prepare(query).bind(...params).first();
        return result;
    } catch (error) {
        console.error('D1 Query Error:', error);
        throw error;
    }
}

// Helper function to execute queries that return metadata (insert, update, delete)
export async function executeQueryRun(query, params = []) {
    const client = getD1Client();
    try {
        const result = await client.prepare(query).bind(...params).run();
        return result;
    } catch (error) {
        console.error('D1 Query Error:', error);
        throw error;
    }
}

export default { initializeD1Client, getD1Client, executeQuery, executeQueryFirst, executeQueryRun };