import { defineBackend } from '@aws-amplify/backend';
import { CfnOutput, Duration, Stack } from 'aws-cdk-lib';
import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { auth } from './auth/resource';
import { api } from './functions/api/resource';

/**
 * Entry point of the Amplify Gen 2 backend.
 * Every resource listed here gets deployed; anything not listed is ignored.
 * - auth: the Cognito login system (amplify/auth/resource.ts)
 * - api: the Express API Lambda (amplify/functions/api/resource.ts)
 */
const backend = defineBackend({
  auth,
  api,
});

// ---------------------------------------------------------------------------
// Escape hatch: get the real CDK Lambda object Amplify created for `api`,
// so we can configure things Amplify has no shortcut for.
// ---------------------------------------------------------------------------
const apiLambda = backend.api.resources.lambda;

// ---------------------------------------------------------------------------
// Secrets Manager: reference the existing MongoDB secret (this does not create
// or change it) and let the Lambda read it. The ARN is "partial" because AWS
// appends a random 6-character suffix to it; CDK accounts for that in the
// IAM policy. Only the secret's location is here, never its values.
// ---------------------------------------------------------------------------
const apiStack = Stack.of(apiLambda);
const secret = Secret.fromSecretPartialArn(
  apiStack,
  'MongoDbSecret',
  `arn:aws:secretsmanager:ap-south-1:${apiStack.account}:secret:amplify/mongodb`,
);
secret.grantRead(apiLambda);

// ---------------------------------------------------------------------------
// Cognito: tell the Lambda which user pool and app client to accept tokens
// from. These IDs aren't secret, and AWS generates them when it creates Cognito.
// ---------------------------------------------------------------------------
const { userPool, userPoolClient, cfnResources } = backend.auth.resources;
backend.api.addEnvironment('COGNITO_USER_POOL_ID', userPool.userPoolId);
backend.api.addEnvironment('COGNITO_CLIENT_ID', userPoolClient.userPoolClientId);

// Keep Amplify's default login methods and add USER_PASSWORD_AUTH, which lets
// Postman log in with a simple request. Remove it once a real frontend exists.
cfnResources.cfnUserPoolClient.explicitAuthFlows = [
  'ALLOW_USER_SRP_AUTH',
  'ALLOW_CUSTOM_AUTH',
  'ALLOW_REFRESH_TOKEN_AUTH',
  'ALLOW_USER_PASSWORD_AUTH',
];

// ---------------------------------------------------------------------------
// Lambda Function URL: a public HTTPS endpoint that invokes the Lambda
// directly (no API Gateway). Format: https://<id>.lambda-url.<region>.on.aws/
// ---------------------------------------------------------------------------
const apiUrl = apiLambda.addFunctionUrl({
  // NONE = anyone on the internet can call it. AWS does not check identity;
  // the Express app is responsible for any authentication/authorization.
  authType: FunctionUrlAuthType.NONE,

  // CORS: tells browsers which websites may call this API from JavaScript.
  // AWS handles CORS (including OPTIONS preflight requests) for us, so the
  // Express app must NOT add its own CORS headers, or they'd be duplicated.
  cors: {
    // Only the local Vite dev server for now. Add the deployed web app's
    // domain here later. Never use '*'.
    allowedOrigins: ['http://localhost:5173'],

    // OPTIONS is intentionally not listed: the Function URL API rejects it
    // (method names are limited to 6 characters) and answers preflight itself.
    allowedMethods: [
      HttpMethod.GET,
      HttpMethod.POST,
      HttpMethod.PUT,
      HttpMethod.PATCH,
      HttpMethod.DELETE,
    ],

    // Request headers the browser is allowed to send.
    allowedHeaders: ['content-type', 'authorization'],

    // false = browsers won't send cookies to this API. We'll use the
    // Authorization header for auth instead.
    allowCredentials: false,

    // How long a browser may cache the preflight answer before asking again.
    maxAge: Duration.minutes(10),
  },
});

// ---------------------------------------------------------------------------
// CloudFormation output: prints the URL after deployment and shows it under
// the stack's "Outputs" tab in the AWS console. It's placed in the same stack
// Amplify created for the Lambda, so no cross-stack references are needed.
// ---------------------------------------------------------------------------
new CfnOutput(Stack.of(apiLambda), 'ApiFunctionUrl', {
  value: apiUrl.url,
  description: 'Public HTTPS URL of the Express API Lambda',
});
