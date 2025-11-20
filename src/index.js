const TMDB_API_BASE = 'https://api.themoviedb.org/3';

const IMAGE_SOURCES = [
  { name: 'tmdb-primary', base: 'https://image.tmdb.org/t/p', priority: 1 },
  { name: 'tmdb-backup1', base: 'https://www.themoviedb.org/t/p', priority: 2 },
  { name: 'tmdb-backup2', base: 'https://media.themoviedb.org/t/p', priority: 3 },
];

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
      if (path.startsWith('/3/')) {
        let targetUrl = `${TMDB_API_BASE}${path.substring(2)}`;
        const searchParams = new URLSearchParams(url.search);
        
        if (!searchParams.has('api_key') && env.TMDB_API_KEY) {
          searchParams.set('api_key', env.TMDB_API_KEY);
        }
        
        targetUrl = `${targetUrl}?${searchParams.toString()}`;
        
        const resp = await fetch(targetUrl);
        return new Response(resp.body, {
          status: resp.status,
          headers: { ...baseHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (path.startsWith('/t/p/')) {
        const imagePath = path.substring('/t/p/'.length);
        
        for (const source of IMAGE_SOURCES.sort((a, b) => a.priority - b.priority)) {
          try {
            const targetUrl = `${source.base}/${imagePath}`;
            const resp = await fetch(targetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*,*/*',
                'Referer': 'https://www.themoviedb.org/',
              }
            });

            if (resp.status === 200) {
              const headers = new Headers(baseHeaders);
              headers.set('Content-Type', resp.headers.get('content-type') || 'image/jpeg');
              headers.set('X-Image-Source', source.name);
              return new Response(resp.body, { status: 200, headers });
            }
          } catch (err) {
            continue;
          }
        }
        
        return new Response(JSON.stringify({ error: 'Image not available from any source' }), {
          status: 404,
          headers: { ...baseHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        message: 'TMDB Proxy',
        status: 'TMDB_API_KEY environment variable required'
      }), {
        headers: { ...baseHeaders, 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { ...baseHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
}