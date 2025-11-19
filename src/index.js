const TMDB_API_BASE = 'https://api.themoviedb.org';
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
      // ======================
      //  1) TMDB 数据 API 代理
      // ======================
      if (path.startsWith('/3/')) {
        const apiKey = env.TMDB_API_KEY;

        if (!apiKey) {
          return new Response(JSON.stringify({
            success: false,
            status_code: 7,
            status_message: "Invalid API key"
          }), {
            status: 401,
            headers: { ...baseHeaders, "Content-Type": "application/json" }
          });
        }

        const headers = {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`    // 强制使用 Worker 的 API key
        };

        const targetUrl = TMDB_API_BASE + path + url.search;
        const resp = await fetch(targetUrl, { headers });

        const responseBody = await resp.arrayBuffer();

        return new Response(responseBody, {
          status: resp.status,
          headers: {
            ...baseHeaders,
            "Content-Type": "application/json; charset=utf-8"
          }
        });
      }

      // ======================
      //  2) 图片代理（海报/背景/人物头像）
      // ======================
      if (path.startsWith('/t/p/')) {
        const targetUrl = TMDB_IMAGE_BASE + path + url.search;

        // 获取 TMDB 图片
        const resp = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://www.themoviedb.org/'
          }
        });

        // 🔥 核心修复：保留 TMDB 原始图片 headers（包括 Content-Type: image/jpeg）
        const newHeaders = new Headers(baseHeaders);
        resp.headers.forEach((v, k) => newHeaders.set(k, v));

        return new Response(resp.body, {
          status: resp.status,
          headers: newHeaders
        });
      }

      // 默认返回
      return new Response(JSON.stringify({
        message: 'TMDB Proxy Worker (No Load Balancing)',
        usage: '/3/movie/550?language=zh-CN'
      }), {
        headers: {
          ...baseHeaders,
          "Content-Type": "application/json; charset=utf-8"
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          ...baseHeaders,
          "Content-Type": "application/json; charset=utf-8"
        }
      });
    }
  }
};