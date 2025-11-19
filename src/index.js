const TMDB_API_BASE = 'https://api.themoviedb.org';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    console.log('=== 图片调试模式 ===');
    console.log('请求路径:', path + url.search);

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
        const apiKey = env.TMDB_API_KEY;
        const headers = { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        };

        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
          console.log('🔑 使用Worker API Key');
        } else {
          return new Response(JSON.stringify({ 
            success: false, 
            status_code: 7,
            status_message: "Invalid API key" 
          }), {
            status: 401,
            headers: { ...baseHeaders, "Content-Type": "application/json" }
          });
        }

        const targetUrl = TMDB_API_BASE + path + url.search;
        console.log('🚀 请求TMDb API:', targetUrl);
        
        const resp = await fetch(targetUrl, { headers });
        const responseBody = await resp.text();
        
        console.log('📡 API响应状态:', resp.status);
        
        // 调试图片路径
        try {
          const data = JSON.parse(responseBody);
          if (data.poster_path) {
            console.log('📸 海报路径:', data.poster_path);
            console.log('完整海报URL:', `${TMDB_IMAGE_BASE}/t/p/w500${data.poster_path}`);
          }
          if (data.profile_path) {
            console.log('👤 人物图片路径:', data.profile_path);
            console.log('完整人物URL:', `${TMDB_IMAGE_BASE}/t/p/w185${data.profile_path}`);
          }
          if (data.backdrop_path) {
            console.log('🎬 背景图路径:', data.backdrop_path);
          }
          if (data.results && Array.isArray(data.results)) {
            data.results.forEach((item, index) => {
              if (item.poster_path) {
                console.log(`🎞️ 结果${index}海报:`, item.poster_path);
              }
            });
          }
        } catch (e) {
          console.log('解析响应数据时出错:', e.message);
        }
        
        return new Response(responseBody, {
          status: resp.status,
          headers: {
            ...baseHeaders,
            'Content-Type': 'application/json; charset=utf-8'
          }
        });
      }

      if (path.startsWith('/t/p/')) {
        console.log('🖼️ 图片请求详情:');
        console.log('路径:', path);
        console.log('查询参数:', url.search);
        
        const targetUrl = TMDB_IMAGE_BASE + path + url.search;
        console.log('完整图片URL:', targetUrl);
        
        const resp = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.themoviedb.org/',
            'Accept': 'image/webp,image/apng,image/*,*/*'
          }
        });
        
        console.log('图片响应状态:', resp.status);
        console.log('内容类型:', resp.headers.get('content-type'));
        console.log('内容长度:', resp.headers.get('content-length'));
        
        return new Response(resp.body, {
          status: resp.status,
          headers: {
            ...baseHeaders,
            'Content-Type': resp.headers.get('Content-Type') || 'image/jpeg',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      }

      return new Response(JSON.stringify({ 
        message: 'TMDB代理Worker - 调试模式',
        endpoints: {
          api: '/3/movie/550?language=zh-CN',
          image: '/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg'
        }
      }), {
        headers: { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });

    } catch (err) {
      console.error('💥 错误:', err.message);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }
  }
}