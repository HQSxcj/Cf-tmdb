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
      console.log('🔍 收到请求:', request.method, path);

      // ======================
      // API 请求 - 完全透明代理，不修改任何参数
      // ======================
      if (path.startsWith('/3/') || path === '/3') {
        const apiPath = path.replace('/3', '') || '';
        const targetUrl = `${TMDB_API_BASE}${apiPath}${url.search}`;
        
        console.log('🚀 转发 API 请求到:', targetUrl);

        const resp = await fetch(targetUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          }
        });

        console.log('📨 API 响应状态:', resp.status);

        return new Response(resp.body, {
          status: resp.status,
          headers: { 
            ...baseHeaders, 
            'Content-Type': 'application/json; charset=utf-8' 
          }
        });
      }

      // ======================
      // 图片请求 - 完全透明代理
      // ======================
      if (path.startsWith('/t/p/')) {
        const imgPath = path.replace('/t/p', '');
        const targetUrl = `${TMDB_IMAGE_BASE}${imgPath}${url.search}`;
        
        console.log('🖼️ 转发图片请求到:', targetUrl);

        const resp = await fetch(targetUrl, {
          headers: { 
            'User-Agent': 'Mozilla/5.0', 
            'Referer': 'https://www.themoviedb.org/' 
          }
        });

        console.log('📨 图片响应状态:', resp.status);

        const newHeaders = new Headers(baseHeaders);
        resp.headers.forEach((v, k) => {
          newHeaders.set(k, v);
        });

        return new Response(resp.body, { 
          status: resp.status, 
          headers: newHeaders 
        });
      }

      // 默认响应
      return new Response(JSON.stringify({ 
        message: 'TMDB Pure Proxy Worker',
        note: '纯网络代理，API Key 由客户端自行管理',
        endpoints: {
          api: '/3/...?api_key=YOUR_KEY',
          image: '/t/p/...'
        }
      }), {
        headers: { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });

    } catch (err) {
      console.error('❌ Worker错误:', err);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: err.message
      }), {
        status: 500,
        headers: { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }
  }
}