const fs = require('fs');
const path = require('path');

// Determine environment from command line argument or NODE_ENV
const environment = process.argv[2] || process.env.NODE_ENV || 'development';
const envFile = `.env.${environment}`;

console.log(`Loading configuration for environment: ${environment}`);
console.log(`Using env file: ${envFile}`);

// Load environment-specific .env file
require('dotenv').config({ path: envFile });

// Read environment variables from the specific .env file
const envVars = {
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN || 'your-tenant.auth0.com',
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID || 'your-angular-client-id',
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || 'https://api.inventorymanagement.com',
  AUTH0_CALLBACK_URL: process.env.AUTH0_CALLBACK_URL || 'http://localhost:4200/callback',
  API_SERVER_URL: process.env.API_SERVER_URL || 'https://localhost:7081',
  ENVIRONMENT: environment
};

console.log(`Setting up ${environment} environment configuration...`);
console.log('Auth0 Domain:', envVars.AUTH0_DOMAIN);
console.log('Auth0 Client ID:', envVars.AUTH0_CLIENT_ID);
console.log('Auth0 Audience:', envVars.AUTH0_AUDIENCE);
console.log('API Server URL:', envVars.API_SERVER_URL);

// Determine if this is production environment
const isProduction = environment === 'production';

// Generate environment.ts file
const environmentContent = `export const environment = {
  production: ${environment === 'production'},
  environment: '${environment}',
  apiUrl: '${envVars.API_SERVER_URL}',
  apiVersion: 'v1',
  auth0: {
    domain: '${envVars.AUTH0_DOMAIN}',
    clientId: '${envVars.AUTH0_CLIENT_ID}',
    audience: '${envVars.AUTH0_AUDIENCE}',
    redirectUri: '${envVars.AUTH0_CALLBACK_URL}',
    logoutUri: window.location.origin
  }
};
`;

// Generate environment.prod.ts file (always production config)
const environmentProdContent = `export const environment = {
  production: true,
  environment: 'production',
  apiUrl: '${environment === 'production' ? envVars.API_SERVER_URL : 'https://api.retailpro.com'}',
  apiVersion: 'v1',
  auth0: {
    domain: '${environment === 'production' ? envVars.AUTH0_DOMAIN : 'prod-retailpro.us.auth0.com'}',
    clientId: '${environment === 'production' ? envVars.AUTH0_CLIENT_ID : 'your-production-client-id'}',
    audience: '${environment === 'production' ? envVars.AUTH0_AUDIENCE : 'https://api.retailpro.com'}',
    redirectUri: '${environment === 'production' ? envVars.AUTH0_CALLBACK_URL : 'https://app.retailpro.com/callback'}',
    logoutUri: window.location.origin
  }
};
`;

// Write environment files
const envPath = path.resolve(__dirname, '../src/environments/environment.ts');
const envProdPath = path.resolve(__dirname, '../src/environments/environment.prod.ts');

fs.writeFileSync(envPath, environmentContent);
fs.writeFileSync(envProdPath, environmentProdContent);

console.log('✅ Environment files generated successfully!');
console.log('Files updated:');
console.log('- src/environments/environment.ts');
console.log('- src/environments/environment.prod.ts');