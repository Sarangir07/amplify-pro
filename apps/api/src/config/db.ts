import { MongoClient, type Db } from 'mongodb';
import { getSecret } from './secrets';

/**
 * MongoDB connection.
 * Creates one MongoClient per Lambda container and reuses it across invocations.
 */

const MONGODB_SECRET_ID = 'amplify/mongodb';

// Stored outside the function so it survives between invocations. It holds the
// Promise (the connection in progress or finished), not just the final result,
// so requests arriving during the first connect all wait for the same attempt.
let connection: Promise<Db> | undefined;

/**
 * Returns the app's database: builds the Atlas URI from Secrets Manager
 * credentials and environment variables, then connects. Both the credentials
 * and the connection are cached, so warm invocations make no network calls.
 * The URI contains the password, so it must never be logged.
 */
export async function getDatabase(): Promise<Db> {
  const host = requireEnv('MONGODB_CLUSTER_HOST');
  const database = requireEnv('MONGODB_DATABASE');
  const { username, password } = await getSecret(MONGODB_SECRET_ID);

  // encodeURIComponent stops characters like @ or / in a value from being
  // read as part of the URI's structure.
  const uri =
    `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}` +
    `@${host}/${encodeURIComponent(database)}`;

  return connectToDatabase(uri);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}

export async function connectToDatabase(uri: string): Promise<Db> {
  connection ??= openConnection(uri).catch((error: unknown) => {
    // Forget the failed attempt so the next call can try again.
    connection = undefined;
    throw error;
  });

  return connection;
}

async function openConnection(uri: string): Promise<Db> {
  let client: MongoClient | undefined;

  try {
    client = new MongoClient(uri, {
      // Give up after 5 seconds. The default is 30, the same as this Lambda's
      // timeout, so AWS could stop the function before the error is reported.
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();

    // No name passed: uses the database named in the connection string.
    return client.db();
  } catch (error) {
    // Release anything the failed attempt opened. A failure while closing is
    // ignored so that it can't hide the original connection error.
    await client?.close().catch(() => {});

    // The message never includes the URI, because it contains the password.
    throw new Error('Failed to connect to MongoDB', { cause: error });
  }
}
