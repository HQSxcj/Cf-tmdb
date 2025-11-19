const TMDB_API_BASE = 'https://api.themoviedb.org';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 通用 CORS 头
    const baseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    };

    // 处理 OPTIONS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: baseHeaders });
    }

    // 处理 HEAD 请求（Emby 可能会用）
    if (request.method === 'HEAD') {
      return new Response(null, { status: 200, headers: baseHeaders });
    }

    try {
      // -------------------------------------------------------------------
      // 📌 1. TMDb API 代理 (/3/ 路径)
      // -------------------------------------------------------------------
      if (path.startsWith('/3/')) {
        const apiKey = env.TMDB_API_KEY;
        const headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        };

        // 处理认证头
        const auth = request.headers.get("Authorization");
        if (auth) {
          headers["Authorization"] = auth;
        } else if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
        } else {
          return new Response(JSON.stringify({ error: "Missing TMDB API Key" }), {
            status: 500,
            headers: { ...baseHeaders, "Content-Type": "application/json" }
          });
        }

        const targetUrl = TMDB_API_BASE + path + url.search;
        
        const resp = await fetch(targetUrl, { 
          headers,
          cf: {
            // 添加 Cloudflare 缓存策略
            cacheTtl: 300, // 5分钟缓存
            cacheEverything: true,
          }
        });

        // 复制重要的响应头
        const responseHeaders = {
          ...baseHeaders,
          "Content-Type": resp.headers.get("Content-Type") || "application/json",
        };

        // 如果有缓存相关头，也传递
        const cacheControl = resp.headers.get("Cache-Control");
        if (cacheControl) {
          responseHeaders["Cache-Control"] = cacheControl;
        }

        return new Response(resp.body, {
          status: resp.status,
          headers: responseHeaders
        });
      }

      // -------------------------------------------------------------------
      // 📌 2. TMDb 图片代理（支持所有图片类型）
      // -------------------------------------------------------------------
      if (path.startsWith('/t/p/')) {
        const targetUrl = TMDB_IMAGE_BASE + path + url.search;

        // 记录图片类型（用于调试）
        const imageType = getImageType(path);
        console.log(`Processing ${imageType} image: ${path}`);

        const imgResp = await fetch(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Referer": "https://www.themoviedb.org/",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
          },
          cf: {
            // 图片缓存更长时间
            cacheTtl: 604800, // 7天
            cacheEverything: true,
          }
        });

        if (!imgResp.ok) {
          console.log(`Image not found: ${path}, Status: ${imgResp.status}`);
          return new Response("Image not found", { 
            status: 404, 
            headers: baseHeaders 
          });
        }

        // 构建图片响应头
        const imageHeaders = {
          ...baseHeaders,
          "Content-Type": imgResp.headers.get("Content-Type") || "image/jpeg",
          "Cache-Control": "public, max-age=604800, immutable", // 图片可长期缓存
        };

        // 传递更多原始头
        const etag = imgResp.headers.get("ETag");
        if (etag) imageHeaders["ETag"] = etag;
        
        const lastModified = imgResp.headers.get("Last-Modified");
        if (lastModified) imageHeaders["Last-Modified"] = lastModified;

        return new Response(imgResp.body, {
          status: imgResp.status,
          headers: imageHeaders
        });
      }

      // -------------------------------------------------------------------
      // 📌 3. 健康检查端点
      // -------------------------------------------------------------------
      if (path === '/health' || path === '/') {
        return new Response(JSON.stringify({ 
          status: 'ok', 
          service: 'TMDB Proxy Worker',
          version: '2.0',
          features: [
            'API Proxy (/3/*)',
            'Image Proxy (/t/p/*) - includes posters, backdrops, actor photos',
            'CORS Support',
            'Cloudflare Caching'
          ],
          timestamp: new Date().toISOString()
        }), {
          headers: { ...baseHeaders, "Content-Type": "application/json" }
        });
      }

      // -------------------------------------------------------------------
      // 📌 4. 使用说明端点
      // -------------------------------------------------------------------
      if (path === '/help' || path === '/info') {
        const helpText = `
TMDB Proxy Worker 使用说明

📌 API 代理:
  格式: /3/{endpoint}
  示例: /3/movie/550?language=zh-CN
  示例: /3/search/movie?query=Avengers

📌 图片代理 (支持所有类型):
  - 电影海报: /t/p/w500/poster_path.jpg
  - 背景图: /t/p/original/backdrop_path.jpg  
  - 演员图片: /t/p/w185/actor_profile.jpg
  - 剧集图片: /t/p/w300/tv_poster.jpg

📌 常用图片尺寸:
  - w92, w154, w185, w342, w500, w780, original
  - h632 (演员专用)

📌 Emby 配置:
  在元数据下载器设置中，将 TMDB API 地址改为您的 Worker 地址

健康检查: /health
本帮助: /help
        `.trim();

        return new Response(helpText, {
          headers: { ...baseHeaders, "Content-Type": "text/plain; charset=utf-8" }
        });
      }

      // 其他路径
      return new Response(JSON.stringify({ 
        error: "Not found",
        available_endpoints: {
          "api_proxy": "/3/{endpoint}",
          "image_proxy": "/t/p/{size}/{image_path}",
          "health_check": "/health",
          "help": "/help"
        }
      }), {
        status: 404, 
        headers: { ...baseHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      console.error('Proxy Error:', err);
      return new Response(JSON.stringify({ 
        error: "Internal Server Error",
        message: err.message,
        path: path
      }), {
        status: 500,
        headers: { ...baseHeaders, "Content-Type": "application/json" }
      });
    }
  },
};

// 辅助函数：识别图片类型
function getImageType(path) {
  if (path.includes('/original/')) return 'original';
  if (path.includes('/w185/') || path.includes('/h632/')) return 'actor';
  if (path.includes('/w300/')) return 'tv';
  if (path.includes('/w500/') || path.includes('/w780/')) return 'poster';
  if (path.includes('/w1280/')) return 'backdrop';
  return 'unknown';
}