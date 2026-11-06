import serverlessExpress from '@vendia/serverless-express';
import type { Handler } from 'aws-lambda';
import { app } from './app';
import { getDatabase } from './config/db';

/**
 * AWS Lambda entry point (the function Amplify will invoke).
 * serverless-express translates the Lambda event into an Express request
 * and the Express response back into a Lambda result.
 *
 * Created once at module load, so warm invocations reuse it.
 */
const expressHandler = serverlessExpress({ app });

export const handler: Handler = async (event, context, callback) => {
  // Runs before every request, but is instant once the connection is cached.
  try {
    await getDatabase();
  } catch (error) {
    // Log only our own message and the cause's type, never the cause's full
    // text or the URI, so credentials can't end up in the logs.
    const message = error instanceof Error ? error.message : 'Unknown error';
    const cause = error instanceof Error ? error.cause : undefined;
    console.error(
      `Database initialization failed: ${message}`,
      cause instanceof Error ? `(${cause.name})` : '',
    );

    return {
      statusCode: 503,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        status: 'error',
        message: 'Service temporarily unavailable',
      }),
    };
  }

  return expressHandler(event, context, callback);
};
