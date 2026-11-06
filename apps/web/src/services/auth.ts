import { Amplify } from 'aws-amplify';
import {
  confirmResetPassword,
  confirmSignUp,
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  resendSignUpCode,
  resetPassword,
  signIn,
  signOut,
  signUp,
} from 'aws-amplify/auth';
import { env } from '../config/env';

/**
 * All communication with Amazon Cognito. The rest of the app calls these functions
 * and never touches Amplify directly. Amplify stores the tokens after login and
 * renews them automatically.
 */

export interface AuthUser {
  name?: string;
  email?: string;
}

export type LoginResult =
  | 'signed-in'
  | 'needs-email-verification'
  | 'needs-password-reset'
  | 'unsupported-step';

export const isAuthConfigured = Boolean(
  env.cognitoUserPoolId && env.cognitoClientId,
);

export function configureAuth(): void {
  if (!env.cognitoUserPoolId || !env.cognitoClientId) {
    return;
  }

  // Cognito works out its AWS region from the user pool ID.
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: env.cognitoUserPoolId,
        userPoolClientId: env.cognitoClientId,
        loginWith: { email: true },
      },
    },
  });
}

/** The user pool ignores case, so use one form of each address everywhere. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<void> {
  const address = normalizeEmail(email);
  await signUp({
    username: address,
    password,
    options: { userAttributes: { email: address, name: name.trim() } },
  });
}

export async function confirmRegistration(
  email: string,
  code: string,
): Promise<void> {
  await confirmSignUp({
    username: normalizeEmail(email),
    confirmationCode: code.trim(),
  });
}

export async function resendVerificationCode(email: string): Promise<void> {
  await resendSignUpCode({ username: normalizeEmail(email) });
}

export async function logIn(
  email: string,
  password: string,
): Promise<LoginResult> {
  const { nextStep } = await signIn({
    username: normalizeEmail(email),
    password,
  });

  switch (nextStep.signInStep) {
    case 'DONE':
      return 'signed-in';
    case 'CONFIRM_SIGN_UP':
      return 'needs-email-verification';
    case 'RESET_PASSWORD':
      return 'needs-password-reset';
    default:
      return 'unsupported-step';
  }
}

export async function logOutUser(): Promise<void> {
  await signOut();
}

export async function requestPasswordReset(email: string): Promise<void> {
  await resetPassword({ username: normalizeEmail(email) });
}

export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  await confirmResetPassword({
    username: normalizeEmail(email),
    confirmationCode: code.trim(),
    newPassword,
  });
}

/** Returns the signed-in user, or null when nobody is signed in. */
export async function getSignedInUser(): Promise<AuthUser | null> {
  try {
    await getCurrentUser();
  } catch {
    return null;
  }

  // The session is valid even if the name and email can't be loaded right now.
  try {
    const { name, email } = await fetchUserAttributes();
    return { name, email };
  } catch {
    return {};
  }
}

/**
 * Returns the signed-in user's access token, renewing it first if it has expired.
 * It has to be the access token: the API rejects ID tokens with a 401.
 */
export async function getAccessToken(): Promise<string | undefined> {
  if (!isAuthConfigured) {
    return undefined;
  }

  const { tokens } = await fetchAuthSession();
  return tokens?.accessToken.toString();
}
