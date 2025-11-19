const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'; // 可改 w780/original
const CACHE_DURATION = 10 * 60 * 1000; // 10 分钟缓存
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
      if (!TMDB_API_KEY) return new Response(JSON.stringify({ error: 'TMDB_API_KEY not set' }), { status: 500, headers });

      const url = new URL(request.url);
      const path = url.pathname + url.search;
      const cacheKey = path;
      const now = Date.now();

      // 内存缓存
      if (cache.has(cacheKey)) {
        const item = cache.get(cacheKey);
        if (now < item.expiry) return new Response(JSON.stringify(item.data), { status: 200, headers });
        cache.delete(cacheKey);
      }

      // 构建请求头
      const authHeader = request.headers.get('Authorization');
      const reqHeaders = {};
      if (authHeader) reqHeaders['Authorization'] = authHeader;
      else reqHeaders['Authorization'] = `Bearer ${TMDB_API_KEY}`;

      const response = await fetch(TMDB_BASE_URL + path, { headers: reqHeaders });
      const data = await response.json();

      // 图片 URL 完整化函数
      const fullImage = p => p ? IMAGE_BASE_URL + p : null;

      // 电影/剧集海报、背景图
      if (data.poster_path) data.poster_path = fullImage(data.poster_path);
      if (data.backdrop_path) data.backdrop_path = fullImage(data.backdrop_path);

      // 出品公司 logo
      if (data.production_companies) {
        data.production_companies = data.production_companies.map(c => ({
          ...c,
          logo_path: fullImage(c.logo_path),
        }));
      }

      // 演员/工作人员头像
      if (data.cast) {
        data.cast = data.cast.map(c => ({ ...c, profile_path: fullImage(c.profile_path) }));
      }
      if (data.crew) {
        data.crew = data.crew.map(c => ({ ...c, profile_path: fullImage(c.profile_path) }));
      }

      // 推荐/相似等列表里的海报
      if (data.results) {
        data.results = data.results.map(item => ({
          ...item,
          poster_path: fullImage(item.poster_path),
          backdrop_path: fullImage(item.backdrop_path)
        }));
      }

      // 内存缓存
      if (response.status === 200) cache.set(cacheKey, { data, expiry: now + CACHE_DURATION });

      return new Response(JSON.stringify(data), { status: response.status, headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }
};