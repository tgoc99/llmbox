/**
 * CORS utility for handling cross-origin requests
 */

/**
 * CORS headers for browser-invoked functions
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, apikey',
  'Access-Control-Max-Age': '86400', // 24 hours
};

/**
 * Handle OPTIONS preflight request
 */
export const handlePreflight = (): Response => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

/**
 * Add CORS headers to response
 */
export const withCorsHeaders = (response: Response): Response => {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

