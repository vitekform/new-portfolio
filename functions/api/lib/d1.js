// D1 client module to replace Prisma client
// This module provides a similar interface to the Prisma client but uses Cloudflare D1

export class D1Client {
  constructor(db) {
    this.db = db;
  }

  // User model methods
  user = {
    findUnique: async ({ where }) => {
      const conditions = [];
      const params = {};
      
      if (where.id) {
        conditions.push('id = ?1');
        params['1'] = where.id;
      } else if (where.username) {
        conditions.push('username = ?1');
        params['1'] = where.username;
      } else if (where.email) {
        conditions.push('email = ?1');
        params['1'] = where.email;
      }
      
      if (conditions.length === 0) {
        throw new Error('No valid conditions provided for findUnique');
      }
      
      const query = `SELECT * FROM User WHERE ${conditions.join(' AND ')} LIMIT 1`;
      const result = await this.db.prepare(query).bind(params).first();
      
      // Parse JSON fields
      if (result) {
        if (result.theme_preferences) result.theme_preferences = JSON.parse(result.theme_preferences);
        if (result.device_history) result.device_history = JSON.parse(result.device_history);
        if (result.verification_tokens) result.verification_tokens = JSON.parse(result.verification_tokens);
      }
      
      return result;
    },
    
    findFirst: async ({ where }) => {
      const conditions = [];
      const params = {};
      let paramIndex = 1;
      
      if (where.OR) {
        const orConditions = [];
        where.OR.forEach(condition => {
          for (const [key, value] of Object.entries(condition)) {
            orConditions.push(`${key} = ?${paramIndex}`);
            params[paramIndex.toString()] = value;
            paramIndex++;
          }
        });
        if (orConditions.length > 0) {
          conditions.push(`(${orConditions.join(' OR ')})`);
        }
      }
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const query = `SELECT * FROM User ${whereClause} LIMIT 1`;
      const result = await this.db.prepare(query).bind(params).first();
      
      // Parse JSON fields
      if (result) {
        if (result.theme_preferences) result.theme_preferences = JSON.parse(result.theme_preferences);
        if (result.device_history) result.device_history = JSON.parse(result.device_history);
        if (result.verification_tokens) result.verification_tokens = JSON.parse(result.verification_tokens);
      }
      
      return result;
    },
    
    findMany: async ({ where, orderBy, take, skip } = {}) => {
      const conditions = [];
      const params = {};
      let paramIndex = 1;
      
      if (where) {
        for (const [key, value] of Object.entries(where)) {
          conditions.push(`${key} = ?${paramIndex}`);
          params[paramIndex.toString()] = value;
          paramIndex++;
        }
      }
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const orderByClause = orderBy ? `ORDER BY ${orderBy.field} ${orderBy.direction}` : '';
      const limitClause = take ? `LIMIT ${take}` : '';
      const offsetClause = skip ? `OFFSET ${skip}` : '';
      
      const query = `SELECT * FROM User ${whereClause} ${orderByClause} ${limitClause} ${offsetClause}`;
      const results = await this.db.prepare(query).bind(params).all();
      
      // Parse JSON fields for all results
      return results.results.map(result => {
        if (result.theme_preferences) result.theme_preferences = JSON.parse(result.theme_preferences);
        if (result.device_history) result.device_history = JSON.parse(result.device_history);
        if (result.verification_tokens) result.verification_tokens = JSON.parse(result.verification_tokens);
        return result;
      });
    },
    
    create: async ({ data }) => {
      const fields = [];
      const placeholders = [];
      const params = {};
      let paramIndex = 1;
      
      for (const [key, value] of Object.entries(data)) {
        fields.push(key);
        placeholders.push(`?${paramIndex}`);
        
        // Stringify JSON fields
        if (key === 'theme_preferences' || key === 'device_history' || key === 'verification_tokens') {
          params[paramIndex.toString()] = JSON.stringify(value);
        } else {
          params[paramIndex.toString()] = value;
        }
        
        paramIndex++;
      }
      
      const query = `INSERT INTO User (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
      const result = await this.db.prepare(query).bind(params).first();
      
      // Parse JSON fields
      if (result) {
        if (result.theme_preferences) result.theme_preferences = JSON.parse(result.theme_preferences);
        if (result.device_history) result.device_history = JSON.parse(result.device_history);
        if (result.verification_tokens) result.verification_tokens = JSON.parse(result.verification_tokens);
      }
      
      return result;
    },
    
    update: async ({ where, data }) => {
      const updateFields = [];
      const params = {};
      let paramIndex = 1;
      
      for (const [key, value] of Object.entries(data)) {
        updateFields.push(`${key} = ?${paramIndex}`);
        
        // Stringify JSON fields
        if (key === 'theme_preferences' || key === 'device_history' || key === 'verification_tokens') {
          params[paramIndex.toString()] = JSON.stringify(value);
        } else {
          params[paramIndex.toString()] = value;
        }
        
        paramIndex++;
      }
      
      // Add where condition
      let whereField = 'id';
      if (where.username) whereField = 'username';
      else if (where.email) whereField = 'email';
      
      params[paramIndex.toString()] = where[whereField];
      
      const query = `UPDATE User SET ${updateFields.join(', ')} WHERE ${whereField} = ?${paramIndex} RETURNING *`;
      const result = await this.db.prepare(query).bind(params).first();
      
      // Parse JSON fields
      if (result) {
        if (result.theme_preferences) result.theme_preferences = JSON.parse(result.theme_preferences);
        if (result.device_history) result.device_history = JSON.parse(result.device_history);
        if (result.verification_tokens) result.verification_tokens = JSON.parse(result.verification_tokens);
      }
      
      return result;
    },
    
    delete: async ({ where }) => {
      const params = { '1': where.id };
      const query = `DELETE FROM User WHERE id = ?1 RETURNING *`;
      const result = await this.db.prepare(query).bind(params).first();
      
      // Parse JSON fields
      if (result) {
        if (result.theme_preferences) result.theme_preferences = JSON.parse(result.theme_preferences);
        if (result.device_history) result.device_history = JSON.parse(result.device_history);
        if (result.verification_tokens) result.verification_tokens = JSON.parse(result.verification_tokens);
      }
      
      return result;
    },
    
    upsert: async ({ where, update, create }) => {
      // First try to find the record
      const existingRecord = await this.user.findUnique({ where });
      
      // If it exists, update it
      if (existingRecord) {
        return await this.user.update({ where, data: update });
      }
      
      // Otherwise, create it
      return await this.user.create({ data: create });
    }
  };

  // Achievement model methods
  achievement = {
    findUnique: async ({ where }) => {
      const params = { '1': where.id || where.code };
      const field = where.id ? 'id' : 'code';
      const query = `SELECT * FROM Achievement WHERE ${field} = ?1 LIMIT 1`;
      return await this.db.prepare(query).bind(params).first();
    },
    
    findMany: async ({ where } = {}) => {
      let query = 'SELECT * FROM Achievement';
      const params = {};
      
      if (where) {
        const conditions = [];
        let paramIndex = 1;
        
        for (const [key, value] of Object.entries(where)) {
          conditions.push(`${key} = ?${paramIndex}`);
          params[paramIndex.toString()] = value;
          paramIndex++;
        }
        
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      const results = await this.db.prepare(query).bind(params).all();
      return results.results;
    },
    
    create: async ({ data }) => {
      const fields = Object.keys(data);
      const placeholders = fields.map((_, i) => `?${i + 1}`);
      const params = {};
      
      fields.forEach((field, i) => {
        params[(i + 1).toString()] = data[field];
      });
      
      const query = `INSERT INTO Achievement (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
      return await this.db.prepare(query).bind(params).first();
    },
    
    upsert: async ({ where, update, create }) => {
      // First try to find the record
      const existingRecord = await this.achievement.findUnique({ where });
      
      // If it exists, update it
      if (existingRecord) {
        const updateFields = Object.keys(update).map((field, i) => `${field} = ?${i + 1}`);
        const params = {};
        
        Object.keys(update).forEach((field, i) => {
          params[(i + 1).toString()] = update[field];
        });
        
        params[(Object.keys(update).length + 1).toString()] = where.id || where.code;
        const field = where.id ? 'id' : 'code';
        
        const query = `UPDATE Achievement SET ${updateFields.join(', ')} WHERE ${field} = ?${Object.keys(update).length + 1} RETURNING *`;
        return await this.db.prepare(query).bind(params).first();
      }
      
      // Otherwise, create it
      return await this.achievement.create({ data: create });
    }
  };

  // Similar implementations for other models...
  // For brevity, I'm not including all models, but they would follow the same pattern

  // Helper method for transactions
  async transaction(callback) {
    // D1 doesn't support transactions in the same way as Prisma
    // This is a simplified version that just executes the callback
    return await callback(this);
  }
}

// Create and export the D1 client instance
let d1Client = null;

export function getD1Client(env) {
  if (!d1Client && env && env.DB) {
    d1Client = new D1Client(env.DB);
  }
  return d1Client;
}

// Add this for compatibility with previous initializeD1Client usage
export function initializeD1Client(env) {
  // Optionally re-initialize d1Client if needed
  // For now, just call getD1Client to ensure it's set
  getD1Client(env);
}

export default getD1Client;
