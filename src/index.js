const TMDB_BASE_URL = 'https://api.themoviedb.org';
const CACHE_DURATION = 10 * 60 * 1000; // 10 分钟
const MAX_CACHE_SIZE = 1000;

export default {
  async fetch(request, env) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers });

    try {
      // Secret Key 或透传 Authorization Header
      const TMDB_API_KEY = env.TMDB_API_KEY;
      const authHeader = request.headers.get('Authorization');
      const reqHeaders = {};
      if (authHeader) reqHeaders['Authorization'] = authHeader;
      else if (TMDB_API_KEY) reqHeaders['Authorization'] = `Bearer ${TMDB_API_KEY}`;

      const cacheKey = `tmdb:${request.url}`;
      const now = Date.now();

      // 尝试从 KV 获取缓存
      let cached = await env.CACHE_KV.get(cacheKey, { type: 'json' });
      if (cached && now < cached.expiry) {
        console.log('Cache hit:', request.url);
        return new Response(JSON.stringify(cached.data), { status: 200, headers });
      }

      // 构建 TMDb 请求
      const url = new URL(request.url);
      const path = url.pathname + url.search;
      const tmdbUrl = TMDB_BASE_URL + path;

      const response = await fetch(tmdbUrl, { headers: reqHeaders });
      const data = await response.json();

      // 只缓存成功响应
      if (response.status === 200) {
        const cacheValue = { data, expiry: now + CACHE_DURATION };
        await env.CACHE_KV.put(cacheKey, JSON.stringify(cacheValue));

        // 控制 KV 最大条目数
        const keys = await env.CACHE_KV.list({ prefix: 'tmdb:' });
        if (keys.keys.length > MAX_CACHE_SIZE) {
          const removeCount = keys.keys.length - MAX_CACHE_SIZE;
          for (let i = 0; i < removeCount; i++) {
            await env.CACHE_KV.delete(keys.keys[i].name);
          }
        }
        console.log('Cache stored:', request.url);
      }

      return new Response(JSON.stringify(data), { status: response.status, headers });
    } catch (err) {
      console.error('TMDb Worker error:', err);
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }
};
