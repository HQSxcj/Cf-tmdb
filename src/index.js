const TMDB_API_BASE = 'https://api.themoviedb.org/3';
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
      // 根路径
      if (path === '/') {
        return new Response(JSON.stringify({
          message: 'TMDB Proxy Worker',
          endpoints: {
            api: '/3/movie/550',
            image: '/t/p/w500/kBf3g9crrADGMc2AMAMlLBgSm2h.jpg'
          }
        }), {
          headers: { ...baseHeaders, 'Content-Type': 'application/json' }
        });
      }

      // API 代理
      if (path.startsWith('/3/')) {
        const targetUrl = `${TMDB_API_BASE}${path.substring(2)}${url.search}`;
        
        const resp = await fetch(targetUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        return new Response(resp.body, {
          status: resp.status,
          headers: { 
            ...baseHeaders,
            'Content-Type': 'application/json; charset=utf-8'
          }
        });
      }

      // 图片代理 - 简化版本
      if (path.startsWith('/t/p/')) {
        const targetUrl = `${TMDB_IMAGE_BASE}${path}${url.search}`;
        
        const resp = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/*,*/*',
            'Referer': 'https://www.themoviedb.org/',
          }
        });

        if (resp.status === 200) {
          const headers = new Headers(baseHeaders);
          const contentType = resp.headers.get('content-type');
          if (contentType) headers.set('Content-Type', contentType);
          return new Response(resp.body, { status: 200, headers });
        } else {
          return new Response(JSON.stringify({
            error: 'Image not found',
            status: resp.status
          }), {
            status: resp.status,
            headers: { ...baseHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // 404 for unknown paths
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...baseHeaders, 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error'
      }), {
        status: 500,
        headers: { ...baseHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
}