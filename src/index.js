const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// 中国配置
const CHINA_CONFIG = {
  region: 'CN',
  language: 'zh-CN', 
  timezone: 'Asia/Shanghai'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 基础头信息
    const baseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': '*',
      'X-Server-Region': 'CN',
      'X-Content-Location': 'China',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: baseHeaders });
    }

    try {
      console.log('🔍 Emby 请求路径:', path);

      // 地理位置检测端点
      if (path === '/location' || path === '/geo') {
        return new Response(JSON.stringify({
          country: 'CN',
          country_name: 'China',
          region: 'Asia',
          timezone: CHINA_CONFIG.timezone,
          language: CHINA_CONFIG.language,
          network: 'Cloudflare China'
        }), {
          headers: { ...baseHeaders, 'Content-Type': 'application/json' }
        });
      }

      // API 请求
      if (path.startsWith('/3/')) {
        let targetUrl = `${TMDB_API_BASE}${path.substring(2)}`;
        const searchParams = new URLSearchParams(url.search);
        
        // 智能添加中国参数（不覆盖已有参数）
        if (!searchParams.has('region')) {
          searchParams.set('region', CHINA_CONFIG.region);
        }
        if (!searchParams.has('language') && !path.includes('/configuration')) {
          searchParams.set('language', CHINA_CONFIG.language);
        }
        
        targetUrl = `${targetUrl}?${searchParams.toString()}`;
        
        console.log('🚀 转发 API:', targetUrl);

        const resp = await fetch(targetUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'zh-CN,zh;q=0.9',
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

      // 图片请求
      if (path.startsWith('/t/p/')) {
        const targetUrl = `${TMDB_IMAGE_BASE}${path.substring(4)}${url.search}`;
        console.log('🖼️ 转发图片:', targetUrl);

        const resp = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/*,*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9',
          }
        });

        if (resp.ok) {
          const headers = new Headers(baseHeaders);
          const contentType = resp.headers.get('content-type');
          if (contentType) headers.set('Content-Type', contentType);
          headers.set('Cache-Control', 'public, max-age=2592000');
          return new Response(resp.body, { status: resp.status, headers });
        }
        
        return new Response(null, { status: 404 });
      }

      // Emby 特殊图片路径支持
      if (path.includes('/poster') || path.includes('/backdrop') || path.includes('/logo') || 
          path.includes('/still') || path.includes('/profile')) {
        
        const parts = path.split('/');
        const filename = parts[parts.length - 1];
        
        if (filename && filename.includes('.jpg')) {
          const targetUrl = `${TMDB_IMAGE_BASE}/w500${path}${url.search}`;
          console.log('🎬 转发 Emby 图片:', targetUrl);

          const resp = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'image/*,*/*',
              'Accept-Language': 'zh-CN,zh;q=0.9',
            }
          });

          if (resp.ok) {
            const headers = new Headers(baseHeaders);
            const contentType = resp.headers.get('content-type');
            if (contentType) headers.set('Content-Type', contentType);
            headers.set('Cache-Control', 'public, max-age=2592000');
            return new Response(resp.body, { status: resp.status, headers });
          }
        }
      }

      // 其他图片路径尝试
      if (path.match(/\.(jpg|jpeg|png|webp)$/i)) {
        const targetUrl = `https://image.tmdb.org/t/p/w500${path}${url.search}`;
        console.log('🔧 尝试其他图片路径:', targetUrl);

        const resp = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/*,*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9',
          }
        });

        if (resp.ok) {
          const headers = new Headers(baseHeaders);
          const contentType = resp.headers.get('content-type');
          if (contentType) headers.set('Content-Type', contentType);
          headers.set('Cache-Control', 'public, max-age=2592000');
          return new Response(resp.body, { status: resp.status, headers });
        }
      }

      // 根路径显示信息
      return new Response(JSON.stringify({
        message: 'TMDB Proxy - 中国优化节点',
        server_info: CHINA_CONFIG,
        endpoints: {
          api: '/3/movie/550',
          image: '/t/p/w500/xxx.jpg', 
          location: '/location'
        },
        features: {
          "1. 无需API Key": "使用Emby插件自带认证",
          "2. 快速刮削": "直接透传，零延迟",
          "3. 语言准确": "跟随Emby设置",
          "4. 最快网络": "Cloudflare全球边缘"
        }
      }), {
        headers: { ...baseHeaders, 'Content-Type': 'application/json' }
      });

    } catch (err) {
      console.error('❌ Worker错误:', err);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error'
      }), {
        status: 500,
        headers: { ...baseHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
}