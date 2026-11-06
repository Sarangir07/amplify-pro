import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

/**
 * AWS Secrets Manager access.
 * Fetches a secret containing a username and password, then caches it in memory.
 */
export interface SecretCredentials {
  username: string;
  password: string;
}

// Created once, outside the function, so all calls share the same client.
const client = new SecretsManagerClient({ region: 'ap-south-1' });

// Credentials already fetched, stored by secret ID. This lives in memory only:
// it is never written to disk and disappears when the Lambda instance shuts down.
const cache = new Map<string, SecretCredentials>();

export async function getSecret(secretId: string): Promise<SecretCredentials> {
  const cached = cache.get(secretId);
  if (cached) {
    return cached;
  }

  let secretString: string | undefined;
  try {
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretId }),
    );
    secretString = response.SecretString;
  } catch (error) {
    // Examples: no permission, secret not found, network problem.
    throw new Error(`Failed to retrieve secret "${secretId}"`, { cause: error });
  }

  if (!secretString) {
    throw new Error(`Secret "${secretId}" has no string value`);
  }

  const credentials = parseCredentials(secretId, secretString);
  cache.set(secretId, credentials);
  return credentials;
}

/** Turns the secret's JSON text into credentials, or throws if it is invalid. */
function parseCredentials(
  secretId: string,
  secretString: string,
): SecretCredentials {
  let parsed: unknown;
  try {
    parsed = JSON.parse(secretString);
  } catch {
    // The original JSON.parse error is deliberately dropped: its message can
    // quote part of the text being parsed, which here is the secret itself.
    throw new Error(`Secret "${secretId}" is not valid JSON`);
  }

  const { username, password } = (parsed ?? {}) as Record<string, unknown>;

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !username ||
    !password
  ) {
    throw new Error(
      `Secret "${secretId}" must contain non-empty "username" and "password" strings`,
    );
  }

  return { username, password };
}
