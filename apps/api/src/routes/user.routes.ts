import { Router, type Response } from 'express';
import { MongoServerError, ObjectId } from 'mongodb';
import {
  getUsersCollection,
  validateUserInput,
  type User,
} from '../models/user.model';

/**
 * Users API, mounted at /users in app.ts.
 * Each route checks the request, calls MongoDB, and picks the HTTP response.
 *
 * Unexpected errors aren't caught here: Express 5 automatically passes errors
 * from async routes to the error handler in app.ts.
 */
export const userRoutes = Router();

const DUPLICATE_KEY_ERROR_CODE = 11000;

function parseObjectId(value: string): ObjectId | null {
  return ObjectId.isValid(value) ? new ObjectId(value) : null;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    error instanceof MongoServerError &&
    error.code === DUPLICATE_KEY_ERROR_CODE
  );
}

function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors?: string[],
): void {
  res.status(statusCode).json({ status: 'error', message, errors });
}

function sendInvalidId(res: Response): void {
  sendError(res, 400, 'Invalid user id');
}

function sendNotFound(res: Response): void {
  sendError(res, 404, 'User not found');
}

function sendEmailTaken(res: Response): void {
  sendError(res, 409, 'A user with this email already exists');
}

// POST /users: create a user.
userRoutes.post('/', async (req, res) => {
  const input = validateUserInput(req.body);
  if (!input.valid) {
    sendError(res, 400, 'Validation failed', input.errors);
    return;
  }

  const now = new Date();
  const user: User = { ...input.value, createdAt: now, updatedAt: now };
  const users = await getUsersCollection();

  try {
    const { insertedId } = await users.insertOne(user);
    res.status(201).json({
      status: 'success',
      data: { _id: insertedId, ...user },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      sendEmailTaken(res);
      return;
    }
    throw error;
  }
});

// GET /users: list every user, oldest first.
userRoutes.get('/', async (_req, res) => {
  const users = await getUsersCollection();
  const data = await users.find().sort({ _id: 1 }).toArray();
  res.status(200).json({ status: 'success', data });
});

// GET /users/:id: fetch one user.
userRoutes.get('/:id', async (req, res) => {
  const id = parseObjectId(req.params.id);
  if (!id) {
    sendInvalidId(res);
    return;
  }

  const users = await getUsersCollection();
  const data = await users.findOne({ _id: id });
  if (!data) {
    sendNotFound(res);
    return;
  }

  res.status(200).json({ status: 'success', data });
});

// PUT /users/:id: replace the user's name and email. Both are required, and
// _id and createdAt never change.
userRoutes.put('/:id', async (req, res) => {
  const id = parseObjectId(req.params.id);
  if (!id) {
    sendInvalidId(res);
    return;
  }

  const input = validateUserInput(req.body);
  if (!input.valid) {
    sendError(res, 400, 'Validation failed', input.errors);
    return;
  }

  const users = await getUsersCollection();

  try {
    const data = await users.findOneAndUpdate(
      { _id: id },
      { $set: { ...input.value, updatedAt: new Date() } },
      { returnDocument: 'after' },
    );
    if (!data) {
      sendNotFound(res);
      return;
    }

    res.status(200).json({ status: 'success', data });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      sendEmailTaken(res);
      return;
    }
    throw error;
  }
});

// DELETE /users/:id: delete one user.
userRoutes.delete('/:id', async (req, res) => {
  const id = parseObjectId(req.params.id);
  if (!id) {
    sendInvalidId(res);
    return;
  }

  const users = await getUsersCollection();
  const { deletedCount } = await users.deleteOne({ _id: id });
  if (deletedCount === 0) {
    sendNotFound(res);
    return;
  }

  res.status(200).json({ status: 'success', message: 'User deleted' });
});
