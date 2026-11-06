import type { Collection } from 'mongodb';
import { getDatabase } from '../config/db';

/**
 * User model: the shape of a user, the rules for valid input, and access to the
 * `users` collection. It knows nothing about HTTP.
 */

/** A user as stored in MongoDB. MongoDB adds the `_id` field itself. */
export interface User {
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/** The only fields a client is allowed to set. */
export type UserInput = Pick<User, 'name' | 'email'>;

export type UserValidationResult =
  | { valid: true; value: UserInput }
  | { valid: false; errors: string[] };

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254; // The longest address email standards allow.
// A basic shape check: text, @, then at least two dot-separated domain parts,
// none empty. Only sending an email can prove that an address really exists.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export async function getUsersCollection(): Promise<Collection<User>> {
  const db = await getDatabase();
  return db.collection<User>('users');
}

/**
 * Checks untrusted request data and returns a clean copy. Only `name` and
 * `email` are copied, so extra fields a client sends never reach the database.
 */
export function validateUserInput(body: unknown): UserValidationResult {
  const { name, email } = (body ?? {}) as Record<string, unknown>;

  // The typeof checks also block objects such as {"$ne": null}, which could
  // otherwise be interpreted by MongoDB as a query operator.
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  const errors: string[] = [];

  if (!cleanName) {
    errors.push('name is required');
  } else if (cleanName.length > MAX_NAME_LENGTH) {
    errors.push(`name must be at most ${MAX_NAME_LENGTH} characters`);
  }

  if (!cleanEmail) {
    errors.push('email is required');
  } else if (
    cleanEmail.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(cleanEmail)
  ) {
    errors.push('email must be a valid email address');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true, value: { name: cleanName, email: cleanEmail } };
}
