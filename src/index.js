const TMDB_API_BASE = 'https://api.themoviedb.org';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const baseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: baseHeaders });
    }

    try {
      // ======================
      // API 请求 /3/
      // ======================
      if (url.hostname === 'tmdbapi.6080808.xyz' && path.startsWith('/3/')) {
        const apiKey = env.TMDB_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ status_code: 7, status_message: 'Invalid API key' }), {
            status: 401,
            headers: { ...baseHeaders, "Content-Type": "application/json" }
          });
        }

        const headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };

        const targetUrl = TMDB_API_BASE + path + url.search;
        const resp = await fetch(targetUrl, { headers });
        const body = await resp.arrayBuffer();

        return new Response(body, {
          status: resp.status,
          headers: { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8' }
        });
      }

      // ======================
      // 图片请求 /t/p/
      // ======================
      if (url.hostname === 'tmdbimg.6080808.xyz' && path.startsWith('/t/p/')) {
        const targetUrl = TMDB_IMAGE_BASE + path + url.search;
        const resp = await fetch(targetUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.themoviedb.org/' }
        });

        const newHeaders = new Headers(baseHeaders);
        resp.headers.forEach((v, k) => newHeaders.set(k, v));

        return new Response(resp.body, { status: resp.status, headers: newHeaders });
      }

      return new Response(JSON.stringify({ message: 'TMDB Proxy Worker B方案' }), {
        headers: { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }
  }
}