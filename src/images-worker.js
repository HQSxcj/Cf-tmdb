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

      // 确保路径以 /images/ 开头
      if (!path.startsWith('/images/')) {
        return new Response('Not found', { status: 404, headers });
      }

      // 转发到 TMDb 图片服务器
      // /images/w500/abcd.jpg -> https://image.tmdb.org/t/p/w500/abcd.jpg
      const tmdbPath = path.replace('/images/', '/');
      const tmdbUrl = 'https://image.tmdb.org/t/p' + tmdbPath;

      const resp = await fetch(tmdbUrl);
      const arrayBuffer = await resp.arrayBuffer();

      // 返回图片流
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
