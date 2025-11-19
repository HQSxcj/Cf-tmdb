const TMDB_API_BASE = 'https://api.themoviedb.org';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 通用 CORS 头
    const baseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 处理 OPTIONS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: baseHeaders });
    }

    try {
      // -------------------------------------------------------------------
      // 📌 1. TMDb API 代理
      // -------------------------------------------------------------------
      if (path.startsWith('/3/')) {
        const apiKey = env.TMDB_API_KEY;
        const headers = {};

        // Emby 会带 Authorization，不覆盖
        const auth = request.headers.get("Authorization");
        if (auth) {
          headers["Authorization"] = auth;
        } else if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
        }

        const target = TMDB_API_BASE + path + url.search;

        const resp = await fetch(target, { headers });
        const json = await resp.text();

        return new Response(json, {
          status: resp.status,
          headers: {
            ...baseHeaders,
            "Content-Type": "application/json",
          }
        });
      }

      // -------------------------------------------------------------------
      // 📌 2. TMDb 图片代理（Emby 海报 / Fanart）
      // -------------------------------------------------------------------
      if (path.startsWith('/t/p/')) {
        const target = TMDB_IMAGE_BASE + path + url.search;

        // 图片必须加 UA + Referer 才不会变占位符
        const imgResp = await fetch(target, {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://www.themoviedb.org/",
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
          }
        });

        // 返回原始图片流，保持所有 header
        return new Response(imgResp.body, {
          status: imgResp.status,
          headers: {
            ...baseHeaders,
            "Content-Type": imgResp.headers.get("Content-Type") ?? "image/jpeg",
            "Cache-Control": imgResp.headers.get("Cache-Control") ?? "public, max-age=604800",
            "ETag": imgResp.headers.get("ETag") ?? "",
            "Last-Modified": imgResp.headers.get("Last-Modified") ?? "",
            "Content-Length": imgResp.headers.get("Content-Length") ?? "",
          }
        });
      }

      // 其他路径
      return new Response("Not found", { status: 404, headers: baseHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...baseHeaders, "Content-Type": "application/json" }
      });
    }
  },
};