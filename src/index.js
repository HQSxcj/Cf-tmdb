const TMDB_BASE_URL = 'https://api.themoviedb.org';
const CACHE_DURATION = 10 * 60 * 1000; // 可选：10 分钟缓存

// 简单内存缓存
const cache = new Map();

export default {
  async fetch(request, env) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers });

    try {
      const TMDB_API_KEY = env.TMDB_API_KEY;
      if (!TMDB_API_KEY) {
        return new Response(JSON.stringify({ error: 'TMDB_API_KEY not set' }), { status: 500, headers });
      }

      const url = new URL(request.url);
      const path = url.pathname + url.search;
      const cacheKey = path;
      const now = Date.now();

      // 内存缓存命中
      if (cache.has(cacheKey)) {
        const item = cache.get(cacheKey);
        if (now < item.expiry) {
          return new Response(JSON.stringify(item.data), { status: 200, headers });
        } else {
          cache.delete(cacheKey);
        }
      }

      // 构建请求头
      const authHeader = request.headers.get('Authorization');
      const reqHeaders = {};
      if (authHeader) {
        reqHeaders['Authorization'] = authHeader; // 透传
      } else {
        reqHeaders['Authorization'] = `Bearer ${TMDB_API_KEY}`; // 使用 V4 Token
      }

      const response = await fetch(TMDB_BASE_URL + path, { headers: reqHeaders });
      const data = await response.json();

      // 内存缓存成功响应
      if (response.status === 200) {
        cache.set(cacheKey, { data, expiry: now + CACHE_DURATION });
      }

      return new Response(JSON.stringify(data), { status: response.status, headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }
};