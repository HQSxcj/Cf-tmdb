const TMDB_API_BASE = 'https://api.themoviedb.org';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    console.log('=== B方案 - 强制使用Worker API Key ===');
    console.log('路径:', path + url.search);
    console.log('方法:', request.method);
    console.log('User-Agent:', request.headers.get('user-agent') || '未知');

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

        // 🚨 B方案核心：强制使用Worker的API Key，忽略插件提供的
        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
          console.log('🔑 强制使用Worker的API Key（B方案）');
        } else {
          console.error('❌ Worker环境变量缺少API Key');
          return new Response(JSON.stringify({ 
            success: false, 
            status_code: 7,
            status_message: "Invalid API key" 
          }), {
            status: 401,
            headers: { ...baseHeaders, "Content-Type": "application/json" }
          });
        }

        // 检查插件是否提供了Key（仅用于日志）
        const auth = request.headers.get("Authorization");
        if (auth) {
          console.log('⚠️ 插件提供了API Key，但被忽略');
        }

        const targetUrl = TMDB_API_BASE + path + url.search;
        console.log('🚀 请求TMDb:', targetUrl);
        
        const resp = await fetch(targetUrl, { headers });
        
        console.log('📡 TMDb响应状态:', resp.status);
        
        const responseBody = await resp.arrayBuffer();
        return new Response(responseBody, {
          status: resp.status,
          headers: {
            ...baseHeaders,
            'Content-Type': 'application/json; charset=utf-8'
          }
        });
      }

      if (path.startsWith('/t/p/')) {
        console.log('🖼️ 图片请求:', path);
        const targetUrl = TMDB_IMAGE_BASE + path + url.search;
        const resp = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://www.themoviedb.org/'
          }
        });
        
        return new Response(resp.body, {
          status: resp.status,
          headers: baseHeaders
        });
      }

      return new Response(JSON.stringify({ 
        message: 'TMDB代理Worker - B方案',
        warning: '此方案强制使用Worker的API Key，可能存在合规风险',
        usage: '访问 /3/movie/550?language=zh-CN 测试'
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