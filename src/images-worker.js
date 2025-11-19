export default {
  async fetch(request) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // 必须是 /t/p/... 的 TMDb 图片路径
      if (!path.startsWith('/t/p/')) {
        return new Response('Not found', { status: 404, headers });
      }

      const tmdbUrl = 'https://image.tmdb.org' + path;

      const resp = await fetch(tmdbUrl);
      const arrayBuffer = await resp.arrayBuffer();

      return new Response(arrayBuffer, {
        status: resp.status,
        headers: {
          ...headers,
          'Content-Type': resp.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'max-age=86400', // 缓存 1 天
        },
      });
    } catch (err) {
      console.error('Image proxy error:', err);
      return new Response('Internal Error', { status: 500, headers });
    }
  },
};