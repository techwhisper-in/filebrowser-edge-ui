export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  
  // Point to your secure API tunnel (change this to your actual tunnel URL later)
  const BACKEND_TUNNEL_URL = context.env.BACKEND_TUNNEL_URL || "https://api.yourdomain.com";
  const targetUrl = new URL(url.pathname + url.search, BACKEND_TUNNEL_URL);
  
  const proxyRequest = new Request(targetUrl, request);
  
  // Attach the secret keys to authenticate with Cloudflare Zero Trust
  // These variables must be set in your Cloudflare Pages Environment Variables
  if (context.env.CF_ACCESS_CLIENT_ID && context.env.CF_ACCESS_CLIENT_SECRET) {
    proxyRequest.headers.set('CF-Access-Client-Id', context.env.CF_ACCESS_CLIENT_ID);
    proxyRequest.headers.set('CF-Access-Client-Secret', context.env.CF_ACCESS_CLIENT_SECRET);
  }

  // CRITICAL: Forward the user's verified email from Cloudflare Access to the Backend
  // We must use a custom header name (X-Forwarded-Email) because Cloudflare Access
  // on the API tunnel will strip the original Cf-Access header for Service Tokens!
  const userEmail = request.headers.get('cf-access-authenticated-user-email');
  if (userEmail) {
    proxyRequest.headers.set('X-Forwarded-Email', userEmail);
  }

  // DEBUG ROUTE: Let's check if the variables are actually loaded!
  if (url.pathname === '/api/debug') {
    return new Response(JSON.stringify({
      hasClientId: !!context.env.CF_ACCESS_CLIENT_ID,
      hasClientSecret: !!context.env.CF_ACCESS_CLIENT_SECRET,
      backendUrl: BACKEND_TUNNEL_URL,
      userEmail: userEmail || "Missing!"
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  return fetch(proxyRequest);
}
