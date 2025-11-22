const API_ORIGIN = 'https://api.themoviedb.org';
const IMAGE_ORIGIN = 'https://image.tmdb.org';
const API_CACHE_TTL = 600;
const IMAGE_CACHE_TTL = 86400;
const MAX_CONCURRENT = 5;

export default {
  async fetch(request, event) {
    const url = new URL(request.url);
    const { pathname, search } = url;

    if (pathname.startsWith('/3/') || pathname.startsWith('/4/')) {
      const target = `${API_ORIGIN}${pathname}${search}`;
      return proxy(request, target, API_CACHE_TTL, false, event);
    }

    if (pathname.startsWith('/t/p/')) {
      const target = `${IMAGE_ORIGIN}${pathname}${search}`;
      return proxy(request, target, IMAGE_CACHE_TTL, true, event);
    }

    return new Response('OK', { status: 200 });
  }
};

let queue = 0;
async function proxy(incomingRequest, targetUrl, ttl, cacheImages, event) {
  while(queue >= MAX_CONCURRENT) await new Promise(r=>setTimeout(r,10));
  queue++;
  const hopByHop = new Set([
    'connection','keep-alive','transfer-encoding','proxy-connection',
    'upgrade','proxy-authenticate','proxy-authorization','te','trailers'
  ]);

  const reqHeaders = new Headers();
  for(const [k,v] of incomingRequest.headers) if(!hopByHop.has(k.toLowerCase()) && k.toLowerCase()!=='host') reqHeaders.append(k,v);

  const init = { method: incomingRequest.method, headers: reqHeaders, body: needsBody(incomingRequest.method)?incomingRequest.body:undefined, redirect: cacheImages?'follow':'manual' };
  const cache = caches.default;
  const cacheKey = new Request(targetUrl, init);

  if(cacheImages){
    const cached = await cache.match(cacheKey);
    if(cached){ queue--; return cached; }
  }

  const upstream = await fetch(targetUrl, init);
  const resHeaders = new Headers();
  for(const [k,v] of upstream.headers) if(!hopByHop.has(k.toLowerCase())) resHeaders.append(k,v);

  resHeaders.set('Access-Control-Allow-Origin','*');
  resHeaders.set('Access-Control-Allow-Methods','GET,HEAD,OPTIONS');
  resHeaders.set('Access-Control-Allow-Headers','*');
  resHeaders.set('Cache-Control', `public, max-age=${ttl}`);

  const response = new Response(upstream.body,{ status: upstream.status, statusText: upstream.statusText, headers: resHeaders });

  if(cacheImages && upstream.ok) event.waitUntil(cache.put(cacheKey,response.clone()));

  queue--;
  return response;
}

function needsBody(method){ const m=method.toUpperCase(); return m!=='GET' && m!=='HEAD'; }