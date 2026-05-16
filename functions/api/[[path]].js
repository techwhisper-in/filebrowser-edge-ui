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
  const userEmail = request.headers.get('Cf-Access-Authenticated-User-Email');
  if (userEmail) {
    proxyRequest.headers.set('Cf-Access-Authenticated-User-Email', userEmail);
  }

  return fetch(proxyRequest);
}
