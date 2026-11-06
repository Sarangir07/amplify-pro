/** Turns a Cognito error into a message that's safe and useful to show the user. */
export function getAuthErrorMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : '';
  const details = error instanceof Error ? error.message : '';

  switch (name) {
    case 'NotAuthorizedException':
      // Cognito uses this one error type for several different problems.
      if (/attempts exceeded/i.test(details)) {
        return 'Too many failed attempts. Please wait a while and try again.';
      }
      if (/CONFIRMED/.test(details)) {
        return 'This email is already verified. You can log in.';
      }
      return 'Incorrect email or password.';
    case 'UserNotFoundException':
      // The same message as a wrong password, so that this form can't be used to
      // find out which email addresses have accounts.
      return 'Incorrect email or password.';
    case 'UsernameExistsException':
      return 'An account with this email already exists. Try logging in, or verify your email if you haven’t yet.';
    case 'InvalidPasswordException':
      return 'That password doesn’t meet the requirements. Please choose a stronger one.';
    case 'CodeMismatchException':
      return 'That code is incorrect. Check it and try again.';
    case 'ExpiredCodeException':
      return 'That code has expired. Please request a new one.';
    case 'CodeDeliveryFailureException':
      return 'We couldn’t send the code to that email address. Please check it and try again.';
    case 'LimitExceededException':
    case 'TooManyRequestsException':
    case 'TooManyFailedAttemptsException':
      return 'Too many attempts. Please wait a while and try again.';
    case 'InvalidParameterException':
      return 'We couldn’t process those details. Please check them and try again.';
    case 'NetworkError':
      return 'We couldn’t connect. Please check your internet connection and try again.';
    default:
      // Only the type is logged, because the details could include what was typed.
      console.error(`Unhandled authentication error: ${name || 'unknown'}`);
      return 'Something went wrong. Please try again.';
  }
}
