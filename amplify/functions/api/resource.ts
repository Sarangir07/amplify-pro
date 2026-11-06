import { defineFunction } from '@aws-amplify/backend';

// These values aren't secret, but they differ per environment, so they are read
// from the environment running the deploy. Stopping here gives a clear error
// instead of deploying a Lambda that can't connect.
function requireDeployEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name} before deploying the backend`);
  }
  return value;
}

export const api = defineFunction({
  name: 'api',
  entry: '../../../apps/api/src/lambda.ts',
  runtime: 22,
  timeoutSeconds: 30,
  memoryMB: 768,
  environment: {
    NODE_ENV: 'production',
    MONGODB_CLUSTER_HOST: requireDeployEnv('MONGODB_CLUSTER_HOST'),
    MONGODB_DATABASE: requireDeployEnv('MONGODB_DATABASE'),
  },
});
