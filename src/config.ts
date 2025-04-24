/**
 * WALEMCP Configuration
 * Centralized configuration management
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Default configuration
const defaultConfig = {
  // Server configuration
  server: {
    port: 3000,
    host: 'localhost',
    corsOrigins: ['http://localhost:3000'],
    apiVersion: 'v1',
  },
  
  // Logging configuration
  logging: {
    level: 'info', // debug, info, warn, error
    logToFile: false,
    logFilePath: './logs',
  },
  
  // Solana configuration
  solana: {
    endpoint: 'https://api.devnet.solana.com',
    programId: 'MCPv1111111111111111111111111111111111111',
    commitment: 'confirmed',
  },
  
  // Storage configuration
  storage: {
    arweaveEndpoint: 'https://arweave.net',
    ipfsGateway: 'https://ipfs.io',
    useLocalCache: true,
    cacheDir: './cache',
  },
  
  // AI Provider configuration
  ai: {
    provider: 'openai',
    apiKey: '',
    defaultModel: 'gpt-4',
    timeout: 30000,
  },
  
  // Template configuration
  templates: {
    basePath: './templates',
    cacheEnabled: true,
    cacheExpiry: 3600, // seconds
  },
  
  // Security configuration
  security: {
    jwtSecret: 'development_jwt_secret',
    apiKey: 'development_api_key',
    tokenExpiry: '24h',
  }
};

// Environment-specific configuration
const envConfig = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || defaultConfig.server.host,
    corsOrigins: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',')
      : defaultConfig.server.corsOrigins,
    apiVersion: process.env.API_VERSION || defaultConfig.server.apiVersion,
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || defaultConfig.logging.level,
    logToFile: process.env.LOG_TO_FILE === 'true',
    logFilePath: process.env.LOG_FILE_PATH || defaultConfig.logging.logFilePath,
  },
  
  // Solana configuration
  solana: {
    endpoint: process.env.SOLANA_ENDPOINT || defaultConfig.solana.endpoint,
    programId: process.env.SOLANA_PROGRAM_ID || defaultConfig.solana.programId,
    commitment: process.env.SOLANA_COMMITMENT || defaultConfig.solana.commitment,
  },
  
  // Storage configuration
  storage: {
    arweaveEndpoint: process.env.ARWEAVE_ENDPOINT || defaultConfig.storage.arweaveEndpoint,
    ipfsGateway: process.env.IPFS_GATEWAY || defaultConfig.storage.ipfsGateway,
    useLocalCache: process.env.USE_LOCAL_CACHE !== 'false',
    cacheDir: process.env.CACHE_DIR || defaultConfig.storage.cacheDir,
  },
  
  // AI Provider configuration
  ai: {
    provider: process.env.AI_PROVIDER || defaultConfig.ai.provider,
    apiKey: process.env.AI_API_KEY || defaultConfig.ai.apiKey,
    defaultModel: process.env.AI_MODEL || defaultConfig.ai.defaultModel,
    timeout: parseInt(process.env.AI_TIMEOUT || defaultConfig.ai.timeout.toString(), 10),
  },
  
  // Template configuration
  templates: {
    basePath: process.env.TEMPLATES_PATH || path.resolve(process.cwd(), defaultConfig.templates.basePath),
    cacheEnabled: process.env.TEMPLATES_CACHE !== 'false',
    cacheExpiry: parseInt(process.env.TEMPLATES_CACHE_EXPIRY || defaultConfig.templates.cacheExpiry.toString(), 10),
  },
  
  // Security configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || defaultConfig.security.jwtSecret,
    apiKey: process.env.API_KEY || defaultConfig.security.apiKey,
    tokenExpiry: process.env.TOKEN_EXPIRY || defaultConfig.security.tokenExpiry,
  }
};

// Merge configurations
const config = {
  ...defaultConfig,
  server: { ...defaultConfig.server, ...envConfig.server },
  logging: { ...defaultConfig.logging, ...envConfig.logging },
  solana: { ...defaultConfig.solana, ...envConfig.solana },
  storage: { ...defaultConfig.storage, ...envConfig.storage },
  ai: { ...defaultConfig.ai, ...envConfig.ai },
  templates: { ...defaultConfig.templates, ...envConfig.templates },
  security: { ...defaultConfig.security, ...envConfig.security },
};

// Environment indicator
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const isTest = process.env.NODE_ENV === 'test';

// Validation
if (isProduction && config.security.jwtSecret === defaultConfig.security.jwtSecret) {
  console.warn('WARNING: Using default JWT secret in production environment!');
}

if (isProduction && config.security.apiKey === defaultConfig.security.apiKey) {
  console.warn('WARNING: Using default API key in production environment!');
}

if (config.ai.apiKey === '') {
  console.warn('WARNING: AI API key not configured. Some features may not work properly.');
}

// Create cache directory if it doesn't exist
if (config.storage.useLocalCache) {
  try {
    fs.mkdirSync(config.storage.cacheDir, { recursive: true });
  } catch (error) {
    console.error(`Failed to create cache directory: ${error.message}`);
  }
}

// Create log directory if logging to file
if (config.logging.logToFile) {
  try {
    fs.mkdirSync(config.logging.logFilePath, { recursive: true });
  } catch (error) {
    console.error(`Failed to create log directory: ${error.message}`);
  }
}

// Export the configuration
export default {
  ...config,
  isProduction,
  isDevelopment,
  isTest,
}; 