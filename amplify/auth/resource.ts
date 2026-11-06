import { defineAuth } from '@aws-amplify/backend';

/**
 * Defines the Amazon Cognito login system.
 * Users sign up and log in with their email address and a password.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
