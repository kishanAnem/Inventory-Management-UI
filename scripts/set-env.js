const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const environment = process.argv[2] || process.env.NODE_ENV || 'development';
const projectRoot = path.resolve(__dirname, '..');
const envFilePath = path.join(projectRoot, `.env.${environment}`);

console.log(`Loading configuration for environment: ${environment}`);
console.log(`Looking for env file: ${envFilePath}`);

// Force env file values for deterministic local builds, even if shell vars exist.
dotenv.config({ path: envFilePath, override: true });

const requiredVars = [
  'AUTH0_DOMAIN',
  'AUTH0_CLIENT_ID',
  'AUTH0_AUDIENCE',
  'AUTH0_CALLBACK_URL',
  'API_SERVER_URL'
];

const missingVars = requiredVars.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:');
  missingVars.forEach((key) => console.error(`- ${key}`));
  process.exit(1);
}

const envVars = {
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
  AUTH0_CALLBACK_URL: process.env.AUTH0_CALLBACK_URL,
  API_SERVER_URL: process.env.API_SERVER_URL,
  ENVIRONMENT: environment
};

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

const environmentProdContent = `export const environment = {
  production: true,
  environment: 'production',
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

const environmentsDir = path.join(projectRoot, 'src', 'environments');
const envPath = path.join(environmentsDir, 'environment.ts');
const envProdPath = path.join(environmentsDir, 'environment.prod.ts');

fs.mkdirSync(environmentsDir, { recursive: true });

fs.writeFileSync(envPath, environmentContent);
fs.writeFileSync(envProdPath, environmentProdContent);

console.log('Environment files generated successfully');
console.log('- src/environments/environment.ts');
console.log('- src/environments/environment.prod.ts');
