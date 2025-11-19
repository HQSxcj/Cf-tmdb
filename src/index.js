const TMDB_API_BASE = 'https://api.themoviedb.org';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // --- API 请求 ---
    if (path.startsWith('/3/')) {
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers });
      }

      try {
        const apiKey = env.TMDB_API_KEY;
        const reqHeaders = {};

        if (apiKey) {
          reqHeaders['Authorization'] = `Bearer ${apiKey}`;
        }

        const tmdbUrl = TMDB_API_BASE + path + url.search;
        const resp = await fetch(tmdbUrl);
        const data = await resp.json();

        return new Response(JSON.stringify(data), {
          status: resp.status,
          headers,
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers,
        });
      }
    }

    // --- 图片请求 ---
    if (path.startsWith('/t/p/')) {
      try {
        const tmdbUrl = TMDB_IMAGE_BASE + path + url.search;
        const resp = await fetch(tmdbUrl);

        return new Response(resp.body, {
          status: resp.status,
          headers: {
            'Content-Type': resp.headers.get('Content-Type') || 'image/jpeg',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      } catch (err) {
        return new Response('Image Error', { status: 500 });
      }
    }

    return new Response('Not found', { status: 404 });
  },
};