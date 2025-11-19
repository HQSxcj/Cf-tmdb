const TMDB_BASE_URL = 'https://api.themoviedb.org';

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
      // 从 Worker Secret 获取 TMDb API Key
      const TMDB_API_KEY = env.TMDB_API_KEY;
      if (!TMDB_API_KEY) {
        return new Response(JSON.stringify({ error: 'TMDB_API_KEY not set' }), { status: 500, headers });
      }

      // 构建请求头
      const authHeader = request.headers.get('Authorization');
      const reqHeaders = {};
      if (authHeader) {
        reqHeaders['Authorization'] = authHeader; // 使用透传 Authorization
      } else {
        reqHeaders['Authorization'] = `Bearer ${TMDB_API_KEY}`; // 使用 Secret
      }

      // 构建 TMDb 请求 URL
      const url = new URL(request.url);
      const path = url.pathname + url.search;
      const tmdbUrl = TMDB_BASE_URL + path;

      // 发起请求
      const response = await fetch(tmdbUrl, { headers: reqHeaders });
      const data = await response.json();

      return new Response(JSON.stringify(data), { status: response.status, headers });
    } catch (err) {
      console.error('TMDb Worker error:', err);
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }
};