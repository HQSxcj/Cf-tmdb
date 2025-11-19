const TMDB_API_BASE = 'https://api.themoviedb.org';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org';

// 存储日志的全局变量
let requestLogs = [];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const now = new Date().toISOString();

    // 记录请求
    const logEntry = {
      time: now,
      method: request.method,
      path: path + url.search,
      userAgent: (request.headers.get('user-agent') || 'unknown').substring(0, 50),
      isEmby: (request.headers.get('user-agent') || '').includes('Emby')
    };
    
    // 添加到日志数组
    requestLogs.unshift(logEntry);
    if (requestLogs.length > 30) {
      requestLogs = requestLogs.slice(0, 30);
    }
    
    // 输出到控制台
    console.log(`${now} - ${request.method} ${path} - Emby: ${logEntry.isEmby}`);

    const baseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': '*',
    };

    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: baseHeaders });
    }

    try {
      // 日志查看页面
      if (path === '/logs' || path === '/debug') {
        const embyCount = requestLogs.filter(log => log.isEmby).length;
        const apiCount = requestLogs.filter(log => log.path.startsWith('/3/')).length;
        const embyApiCount = requestLogs.filter(log => log.isEmby && log.path.startsWith('/3/')).length;
        
        const logInfo = {
          summary: {
            total_requests: requestLogs.length,
            emby_requests: embyCount,
            api_requests: apiCount,
            emby_api_requests: embyApiCount,
            status: embyApiCount > 0 ? '✅ Emby配置正确' : '❌ Emby未发送API请求'
          },
          recent_requests: requestLogs.slice(0, 10)
        };
        
        return new Response(JSON.stringify(logInfo, null, 2), {
          headers: { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8' }
        });
      }

      // API 代理
      if (path.startsWith('/3/')) {
        console.log(`API请求: ${path} - 来自Emby: ${logEntry.isEmby}`);
        
        const apiKey = env.TMDB_API_KEY;
        const headers = { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        };

        // 检查认证
        const auth = request.headers.get("Authorization");
        if (auth) {
          headers["Authorization"] = auth;
          console.log('Emby提供了API密钥');
        } else if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
          console.log('使用Worker的API密钥');
        }

        const targetUrl = TMDB_API_BASE + path + url.search;
        const resp = await fetch(targetUrl, { headers });
        
        console.log(`TMDb响应状态: ${resp.status}`);
        
        // 直接返回原始响应
        const responseBody = await resp.arrayBuffer();
        return new Response(responseBody, {
          status: resp.status,
          headers: {
            ...baseHeaders,
            'Content-Type': 'application/json; charset=utf-8'
          }
        });
      }

      // 图片代理
      if (path.startsWith('/t/p/')) {
        console.log(`图片请求: ${path}`);
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

      // 主页
      return new Response(JSON.stringify({ 
        message: 'TMDB代理Worker',
        endpoints: {
          logs: '/logs - 查看请求日志',
          api_test: '/3/movie/550?language=zh-CN',
          image_test: '/t/p/w500/rJBDuMN2FkGpFSVNSK3yPt5DLlV.jpg'
        },
        check_emby: '在Emby中刷新电影，然后查看 /logs'
      }), {
        headers: { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });

    } catch (err) {
      console.error('错误:', err.message);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }
  }
}