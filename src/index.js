const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 基础CORS头
    const baseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': '*',
    };

    // 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: baseHeaders });
    }

    try {
      // ======================
      // API 请求 - 直接透传
      // ======================
      if (path.startsWith('/3/')) {
        const apiPath = path.replace('/3/', '/');
        const targetUrl = `${TMDB_API_BASE}${apiPath}${url.search}`;
        
        // 直接转发，不添加API key
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
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=300' // 5分钟缓存
          }
        });
      }

      // ======================
      // 图片请求 - 直接透传
      // ======================
      if (path.startsWith('/t/p/')) {
        const imagePath = path.replace('/t/p/', '/');
        const targetUrl = `${TMDB_IMAGE_BASE}${imagePath}${url.search}`;
        
        const resp = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/*,*/*',
            'Referer': 'https://www.themoviedb.org/',
          }
        });

        if (resp.ok) {
          const headers = new Headers(baseHeaders);
          // 保持TMDB原始图片响应头
          const contentType = resp.headers.get('content-type');
          if (contentType) headers.set('Content-Type', contentType);
          
          // 长时间缓存图片
          headers.set('Cache-Control', 'public, max-age=2592000'); // 30天缓存
          headers.set('Expires', new Date(Date.now() + 2592000000).toUTCString());
          
          return new Response(resp.body, { 
            status: resp.status,
            headers 
          });
        }
        
        return new Response(null, { status: 404 });
      }

      // 未知路径
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: '请使用 /3/ 或 /t/p/ 路径'
      }), {
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