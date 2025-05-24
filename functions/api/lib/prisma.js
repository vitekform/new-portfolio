// Import the D1 client instead of Prisma
import { getD1Client } from './d1.js';

// This file now acts as a compatibility layer for existing code
// It exports an object that mimics the Prisma client interface but uses D1 under the hood

// The actual D1 client will be initialized when the first request comes in
// with the environment containing the D1 binding
let d1ClientInstance = null;

// This is a proxy that will be returned to callers
// It will initialize the D1 client when needed and forward calls to it
export const prisma = new Proxy({}, {
  get: (target, prop) => {
    // Return a function that will initialize the D1 client when called
    return (...args) => {
      if (!d1ClientInstance) {
        throw new Error('D1 client not initialized. Make sure to call initializeD1Client with the environment first.');
      }
      return d1ClientInstance[prop](...args);
    };
  }
});

// This function must be called before using the prisma object
// It should be called in the handler with the environment containing the D1 binding
export function initializeD1Client(env) {
  d1ClientInstance = getD1Client(env);
  return d1ClientInstance;
}

export default prisma;
