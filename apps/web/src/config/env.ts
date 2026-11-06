/**
 * The one place that reads environment variables. Values are undefined when not
 * set, so the rest of the app can show a clear message instead of crashing.
 */
function read(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

export const env = {
  apiUrl: read(import.meta.env.VITE_API_URL)?.replace(/\/+$/, ''),
  cognitoUserPoolId: read(import.meta.env.VITE_COGNITO_USER_POOL_ID),
  cognitoClientId: read(import.meta.env.VITE_COGNITO_CLIENT_ID),
};
