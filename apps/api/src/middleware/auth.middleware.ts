import { CognitoJwtVerifier } from 'aws-jwt-verify';
import {
  FetchError,
  JwkValidationError,
  JwksValidationError,
  JwtBaseError,
} from 'aws-jwt-verify/error';
import type { RequestHandler, Response } from 'express';

/**
 * Authentication middleware: lets a request continue only if it carries a valid
 * Cognito access token in the header `Authorization: Bearer <token>`.
 */

class AuthConfigError extends Error {
  override name = 'AuthConfigError';
}

function createVerifier() {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  if (!userPoolId || !clientId) {
    throw new AuthConfigError('Cognito environment variables are not set');
  }

  // verify() checks the signature, expiry, issuing user pool and app client, and
  // that this is an access token rather than an ID token.
  return CognitoJwtVerifier.create({
    userPoolId,
    clientId,
    tokenUse: 'access',
  });
}

// Created on first use, not when the file loads, so that a configuration problem
// can't take /health down too. Reusing it across warm invocations also reuses
// Cognito's public keys, which it downloads once and keeps in memory.
let verifier: ReturnType<typeof createVerifier> | undefined;

function getBearerToken(header: string | undefined): string | undefined {
  return header?.match(/^Bearer +(\S+)$/i)?.[1];
}

/**
 * True when the token itself is bad. These library errors share a parent class
 * with failures on our side, such as being unable to download Cognito's keys.
 * Those aren't the caller's fault, so they must not be reported as a 401.
 */
function isInvalidTokenError(error: unknown): boolean {
  return (
    error instanceof JwtBaseError &&
    !(
      error instanceof FetchError ||
      error instanceof JwksValidationError ||
      error instanceof JwkValidationError
    )
  );
}

function sendUnauthorized(res: Response): void {
  // The same reply for every bad token, so it gives attackers no hints.
  res
    .status(401)
    .set('WWW-Authenticate', 'Bearer')
    .json({ status: 'error', message: 'Unauthorized' });
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    sendUnauthorized(res);
    return;
  }

  // Outside the try: a setup problem here is ours, so it must become a 500. Inside
  // verify(), even a ParameterValidationError can come from the token, because the
  // library uses it to reject an issuer it doesn't recognize.
  verifier ??= createVerifier();

  try {
    await verifier.verify(token);
  } catch (error) {
    if (isInvalidTokenError(error)) {
      sendUnauthorized(res);
      return;
    }
    // Not the caller's fault: Express passes this to the error handler in app.ts.
    // That handler logs only the error's type, which is just "Error" for this
    // library. Logging the message is safe because bad tokens never reach here.
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Could not verify token: ${message}`);
    throw error;
  }

  next();
};
