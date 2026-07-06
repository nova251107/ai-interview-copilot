/**
 * Utility functions for making authenticated API requests to the backend.
 */

/**
 * Constructs request headers including the Clerk JWT token.
 * Used in Client Components.
 */
export async function getClientHeaders(
  getToken: (options?: { template?: string; skipCache?: boolean }) => Promise<string | null>,
  metadata?: { id?: string; name?: string; email?: string }
): Promise<Record<string, string>> {
  const token = await getToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Include legacy headers for backward compatibility
  if (metadata?.id) headers["x-user-id"] = metadata.id;
  if (metadata?.name) headers["x-user-name"] = metadata.name;
  if (metadata?.email) headers["x-user-email"] = metadata.email;

  return headers;
}

interface ClerkAuthObject {
  getToken: (options?: { template?: string; skipCache?: boolean }) => Promise<string | null>;
}

/**
 * Constructs request headers including the Clerk JWT token.
 * Used in Server Components.
 */
export async function getServerHeaders(
  authFn: () => Promise<ClerkAuthObject>,
  metadata?: { id?: string; name?: string; email?: string }
): Promise<Record<string, string>> {
  const authObj = await authFn();
  const token = await authObj.getToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (metadata?.id) headers["x-user-id"] = metadata.id;
  if (metadata?.name) headers["x-user-name"] = metadata.name;
  if (metadata?.email) headers["x-user-email"] = metadata.email;

  return headers;
}
