import express, { type ErrorRequestHandler } from 'express';
import { requireAuth } from './middleware/auth.middleware';
import { userRoutes } from './routes/user.routes';

/**
 * The Express application.
 * It knows nothing about Lambda, so the same app can run locally or on AWS.
 */
export const app = express();

// Must stay before anything async, such as requireAuth. With serverless-express,
// a body that isn't read straight away is left unparsed after a real wait.
app.use(express.json());

// Health check: a lightweight route to confirm the API is up and reachable.
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running successfully',
  });
});

// Runs left to right: the routes are reached only after requireAuth accepts the token.
app.use('/users', requireAuth, userRoutes);

// Catches every error passed along by the code above, so it must stay last.
// Express recognizes an error handler by its four parameters.
const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  // The response has already started, so let Express close the connection.
  if (res.headersSent) {
    next(error);
    return;
  }

  // Bad requests caught by express.json(), such as malformed JSON (400) or a
  // body that's too large (413). They set `status` on the error they throw.
  const status: unknown = error?.status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({ status: 'error', message: 'Invalid request' });
    return;
  }

  // Log only the error's type. Its full text could contain connection details,
  // and the caller never needs to see anything about the failure.
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  console.error(`Request failed: ${req.method} ${req.path} (${errorName})`);

  res.status(500).json({ status: 'error', message: 'Internal server error' });
};

app.use(errorHandler);
