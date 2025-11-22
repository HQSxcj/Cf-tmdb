const API_ORIGIN = 'https://api.themoviedb.org';
const API_CACHE_TTL = 600;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const search = url.search;

    if (pathname.startsWith('/3/') || pathname.startsWith('/4/')) {
      const targetUrl = `${API_ORIGIN}${pathname}${search}`;
      return handleAPIRequest(request, targetUrl);
    }

    if (pathname.startsWith('/plugin/')) {
      const pluginPath = pathname.replace(/^\/plugin/, '');
      const targetUrl = `https://emby.media/emby/PluginCatalog${pluginPath}${search}`;
      return handlePluginRequest(request, targetUrl);
    }

    return new Response(
      'Cf-tmdb Worker is running\n\nUsage:\n- TMDB API: /3/movie/550\n- Emby Plugin Catalog: /plugin/',
      { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }
};

async function handleAPIRequest(request, targetUrl) {
  try {
    const headers = new Headers();
    for (const [key, value] of request.headers) {
      if (!['host', 'cookie', 'authorization'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    }
    headers.set('Accept', 'application/json');
    headers.set('User-Agent', 'Mozilla/5.0 (compatible; Cf-tmdb-Proxy/1.0)');

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');
    responseHeaders.set('Cache-Control', `public, max-age=${API_CACHE_TTL}`);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'API proxy failed', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

async function handlePluginRequest(request, targetUrl) {
  try {
    const headers = new Headers();
    for (const [key, value] of request.headers) {
      if (!['host', 'cookie', 'authorization'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    }
    headers.set('User-Agent', 'Mozilla/5.0 (compatible; Cf-emby-Proxy/1.0)');

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');
    responseHeaders.set('Cache-Control', `public, max-age=600`);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Plugin proxy failed', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}