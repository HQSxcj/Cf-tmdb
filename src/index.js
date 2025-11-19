const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

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
      console.log('🔍 请求路径:', path);

      // ======================
      // Emby 会发送 /3/xxx 请求
      // ======================
      if (path.startsWith('/3/')) {
        const targetUrl = `${TMDB_API_BASE}${path.substring(2)}${url.search}`;
        console.log('🚀 转发 API:', targetUrl);

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
            'Cache-Control': 'public, max-age=300'
          }
        });
      }

      // ======================
      // Emby 会发送 /t/p/xxx 请求
      // ======================
      if (path.startsWith('/t/p/')) {
        const targetUrl = `${TMDB_IMAGE_BASE}${path.substring(4)}${url.search}`;
        console.log('🖼️ 转发图片:', targetUrl);

        const resp = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/*,*/*',
            'Referer': 'https://www.themoviedb.org/',
          }
        });

        if (resp.ok) {
          const headers = new Headers(baseHeaders);
          const contentType = resp.headers.get('content-type');
          if (contentType) headers.set('Content-Type', contentType);
          
          headers.set('Cache-Control', 'public, max-age=2592000');
          
          return new Response(resp.body, { 
            status: resp.status,
            headers 
          });
        }
        
        return new Response(null, { status: 404 });
      }

      // 根路径响应
      return new Response(JSON.stringify({
        message: 'TMDB Proxy - 配置正确',
        current_config: {
          "ApiBaseUrls": ["https://cf.6080808.xyz"],
          "ImageBaseUrls": ["https://cf.6080808.xyz"]
        },
        expected_paths: {
          "api": "/3/movie/550",
          "image": "/t/p/w500/xxx.jpg"
        }
      }), {
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