import { env } from '../config/env';
import type { HealthResponse } from '../types/api';
import { getAccessToken } from './auth';

/** Any failed API call. `status` is missing if no response came back at all. */
export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Set to false only for public routes, so they work without a session. */
  authenticated?: boolean;
}

let onUnauthorized: (() => void) | undefined;

/** Lets AuthContext end the session when the API rejects the user's token. */
export function setUnauthorizedHandler(handler?: () => void): void {
  onUnauthorized = handler;
}

function unauthorized(): ApiError {
  onUnauthorized?.();
  return new ApiError('Your session has expired. Please log in again.', 401);
}

async function getAuthHeader(): Promise<string> {
  let token: string | undefined;
  try {
    token = await getAccessToken();
  } catch {
    throw new ApiError('Could not check your session. Please try again.');
  }

  if (!token) {
    throw unauthorized();
  }
  return `Bearer ${token}`;
}

/**
 * Sends a request to the Express API and returns the parsed JSON response. Routes
 * are treated as protected unless marked otherwise, and any failure is an ApiError.
 */
export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, authenticated = true }: RequestOptions = {},
): Promise<T> {
  if (!env.apiUrl) {
    throw new ApiError('VITE_API_URL is not set');
  }

  const headers: Record<string, string> = {};
  if (authenticated) {
    headers.Authorization = await getAuthHeader();
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // Browsers report network and CORS failures the same way, with no details.
    throw new ApiError('Could not reach the API');
  }

  if (response.status === 401 && authenticated) {
    throw unauthorized();
  }
  if (response.status >= 500) {
    throw new ApiError(
      'The server ran into a problem. Please try again in a moment.',
      response.status,
    );
  }

  const data: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message = (data as { message?: unknown } | undefined)?.message;
    throw new ApiError(
      typeof message === 'string'
        ? message
        : `Request failed with status ${response.status}`,
      response.status,
    );
  }

  return data as T;
}

export function getHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/health', { authenticated: false });
}
