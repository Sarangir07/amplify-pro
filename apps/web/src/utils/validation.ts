/**
 * Form checks that give instant feedback. Cognito still enforces its own rules, so
 * these are a convenience and not a security control. Each returns an error message,
 * or undefined when the value is fine.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export const PASSWORD_HINT =
  'At least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol.';

export function validateName(name: string): string | undefined {
  return name.trim() ? undefined : 'Enter your name.';
}

export function validateEmail(email: string): string | undefined {
  const address = email.trim();
  if (!address) {
    return 'Enter your email address.';
  }
  return EMAIL_PATTERN.test(address)
    ? undefined
    : 'Enter a valid email address.';
}

/** Matches the user pool's deployed password policy. */
export function validateNewPassword(password: string): string | undefined {
  if (!password) {
    return 'Enter a password.';
  }
  const isStrong =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9\s]/.test(password);

  if (!isStrong) {
    return PASSWORD_HINT;
  }
  return /^\s|\s$/.test(password)
    ? 'The password can’t start or end with a space.'
    : undefined;
}

export function validatePasswordMatch(
  password: string,
  confirmation: string,
): string | undefined {
  return password === confirmation ? undefined : 'The passwords don’t match.';
}

export function validateCode(code: string): string | undefined {
  return code.trim() ? undefined : 'Enter the code from your email.';
}
