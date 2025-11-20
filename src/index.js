/**
 * Cloudflare Workers - TMDB Proxy
 */

const API_ORIGIN = 'https://api.themoviedb.org';
const IMAGE_ORIGIN = 'https://image.tmdb.org';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const { pathname, search } = url;

    if (pathname.startsWith('/3/') || pathname.startsWith('/4/')) {
      const target = `${API_ORIGIN}${pathname}${search}`;
      return proxy(request, target);
    }

    if (pathname.startsWith('/t/p/')) {
      const target = `${IMAGE_ORIGIN}${pathname}${search}`;
      return proxy(request, target);
    }

    return new Response('OK: use /3/... or /4/... for API, /t/p/... for images', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
};

async function proxy(incomingRequest, targetUrl) {
  const hopByHop = new Set([
    'connection',
    'keep-alive',
    'transfer-encoding',
    'proxy-connection',
    'upgrade',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers'
  ]);

  const reqHeaders = new Headers();
  for (const [k, v] of incomingRequest.headers) {
    if (!hopByHop.has(k.toLowerCase()) && k.toLowerCase() !== 'host') {
      reqHeaders.append(k, v);
    }
  }

  const isImage = targetUrl.startsWith(IMAGE_ORIGIN);
  const init = {
    method: incomingRequest.method,
    headers: reqHeaders,
    body: needsBody(incomingRequest.method) ? incomingRequest.body : undefined,
    redirect: isImage ? 'follow' : 'manual'
  };

  const upstreamRes = await fetch(targetUrl, init);

  const resHeaders = new Headers();
  for (const [k, v] of upstreamRes.headers) {
    if (!hopByHop.has(k.toLowerCase())) {
      resHeaders.append(k, v);
    }
  }

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: resHeaders
  });
}

function needsBody(method) {
  const m = method.toUpperCase();
  return m !== 'GET' && m !== 'HEAD';
}