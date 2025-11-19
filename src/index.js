const TMDB_API_BASE = 'https://api.themoviedb.org';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 🎯 增强调试日志 - 记录所有请求详情
    console.log('🚀 === TMDB代理请求开始 ===');
    console.log('📅 时间:', new Date().toISOString());
    console.log('🌐 来源:', request.headers.get('referer') || '直接访问');
    console.log('👤 User-Agent:', request.headers.get('user-agent') || '未知');
    console.log('🔧 方法:', request.method);
    console.log('📍 路径:', path);
    console.log('🔍 参数:', url.search);
    console.log('📊 请求头:', Object.fromEntries(request.headers));
    console.log('---');

    // 通用 CORS 头
    const baseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, User-Agent',
      'Access-Control-Max-Age': '86400',
    };

    // 处理 OPTIONS 预检
    if (request.method === 'OPTIONS') {
      console.log('✅ 处理 OPTIONS 预检请求');
      return new Response(null, { status: 200, headers: baseHeaders });
    }

    // 处理 HEAD 请求
    if (request.method === 'HEAD') {
      console.log('✅ 处理 HEAD 请求');
      return new Response(null, { status: 200, headers: baseHeaders });
    }

    try {
      // -------------------------------------------------------------------
      // 📌 1. TMDb API 代理 - 重点调试区域
      // -------------------------------------------------------------------
      if (path.startsWith('/3/')) {
        console.log('🎯 识别为 API 请求');
        
        const apiKey = env.TMDB_API_KEY;
        const headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        };

        // 处理认证头
        const auth = request.headers.get("Authorization");
        if (auth) {
          headers["Authorization"] = auth;
          console.log('🔑 使用请求中的 Authorization 头');
        } else if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
          console.log('🔑 使用环境变量 API Key');
        } else {
          console.error('❌ 错误: 没有找到 API Key');
          return new Response(JSON.stringify({ 
            success: false, 
            status_code: 7,
            status_message: "Invalid API key: You must be granted a valid key." 
          }), {
            status: 401,
            headers: { ...baseHeaders, "Content-Type": "application/json" }
          });
        }

        const targetUrl = TMDB_API_BASE + path + url.search;
        console.log('🚀 代理到 TMDb:', targetUrl);
        
        // 添加超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('⏰ 请求超时');
          controller.abort();
        }, 15000);

        try {
          const resp = await fetch(targetUrl, { 
            headers,
            signal: controller.signal,
            cf: {
              cacheTtl: path.includes('/search') ? 300 : 600,
              cacheEverything: false,
            }
          });
          
          clearTimeout(timeoutId);

          console.log('📡 TMDb API 响应状态:', resp.status, resp.statusText);
          
          // 读取响应内容用于详细调试
          const responseText = await resp.text();
          console.log('📄 响应内容长度:', responseText.length, '字符');
          
          // 分析响应内容
          if (responseText.length > 0) {
            try {
              const jsonData = JSON.parse(responseText);
              if (jsonData.success === false) {
                console.log('❌ TMDb 返回错误:', jsonData.status_message);
              } else if (jsonData.title) {
                console.log('✅ 成功获取电影:', jsonData.title, `(ID: ${jsonData.id})`);
                console.log('📖 剧情长度:', jsonData.overview?.length || 0, '字符');
              } else if (jsonData.results) {
                console.log('🔍 搜索结果数量:', jsonData.results.length);
              } else {
                console.log('📋 其他类型响应');
              }
            } catch (e) {
              console.log('⚠️ 响应不是 JSON 格式');
              console.log('🔍 响应预览:', responseText.substring(0, 200));
            }
          } else {
            console.log('📭 空响应');
          }

          const responseHeaders = {
            ...baseHeaders,
            "Content-Type": resp.headers.get("Content-Type") || "application/json",
            "Cache-Control": "public, max-age=600",
            "X-Proxy-Debug": "TMDB-Worker-1.0"
          };

          console.log('✅ API 代理完成');
          return new Response(responseText, {
            status: resp.status,
            headers: responseHeaders
          });

        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.error('💥 请求 TMDb 失败:', fetchError.message);
          throw fetchError;
        }
      }

      // -------------------------------------------------------------------
      // 📌 2. TMDb 图片代理
      // -------------------------------------------------------------------
      if (path.startsWith('/t/p/')) {
        console.log('🖼️ 识别为图片请求');
        
        const targetUrl = TMDB_IMAGE_BASE + path + url.search;
        console.log('🚀 代理图片到:', targetUrl);

        const imgResp = await fetch(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://www.themoviedb.org/",
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
          },
          cf: {
            cacheTtl: 604800,
            cacheEverything: true,
          }
        });

        console.log('📡 图片响应状态:', imgResp.status, imgResp.statusText);
        console.log('🖼️ 图片类型:', imgResp.headers.get("Content-Type"));
        console.log('📏 图片大小:', imgResp.headers.get("Content-Length") || '未知');

        if (!imgResp.ok) {
          console.log('❌ 图片获取失败:', imgResp.status);
          return new Response("Image not found", { 
            status: 404, 
            headers: baseHeaders 
          });
        }

        const imageHeaders = {
          ...baseHeaders,
          "Content-Type": imgResp.headers.get("Content-Type") || "image/jpeg",
          "Cache-Control": "public, max-age=604800, immutable",
          "X-Proxy-Debug": "TMDB-Image-Worker-1.0"
        };

        console.log('✅ 图片代理完成');
        return new Response(imgResp.body, {
          status: imgResp.status,
          headers: imageHeaders
        });
      }

      // -------------------------------------------------------------------
      // 📌 3. 健康检查和状态页面
      // -------------------------------------------------------------------
      if (path === '/health' || path === '/') {
        console.log('🔧 健康检查请求');
        return new Response(JSON.stringify({ 
          status: 'healthy', 
          service: 'TMDB Proxy Worker - Debug Edition',
          version: '2.1',
          issue: '海报正常但元数据缺失 - 调试中',
          timestamp: new Date().toISOString(),
          endpoints: {
            api: '/3/{endpoint}',
            image: '/t/p/{size}/{image_path}',
            health: '/health',
            debug: '/debug'
          }
        }), {
          headers: { ...baseHeaders, "Content-Type": "application/json" }
        });
      }

      // -------------------------------------------------------------------
      // 📌 4. 调试信息页面
      // -------------------------------------------------------------------
      if (path === '/debug') {
        console.log('🐛 调试信息请求');
        return new Response(JSON.stringify({ 
          debug_info: {
            worker_status: 'running',
            api_base: TMDB_API_BASE,
            image_base: TMDB_IMAGE_BASE,
            current_time: new Date().toISOString(),
            common_issues: [
              'Emby 没有配置 API 服务器',
              'Emby API 密钥字段未清空',
              '媒体库元数据下载器未启用 TMDb',
              '语言设置不匹配'
            ]
          }
        }), {
          headers: { ...baseHeaders, "Content-Type": "application/json" }
        });
      }

      // -------------------------------------------------------------------
      // 📌 5. 测试电影数据
      // -------------------------------------------------------------------
      if (path === '/test-movie') {
        console.log('🎬 测试电影数据请求');
        // 直接返回一个测试电影数据
        const testMovie = {
          id: 550,
          title: "搏击俱乐部",
          original_title: "Fight Club",
          overview: "杰克是一个充满中年危机意识的人，他非常憎恨自己的生活及一切，再加上他患有严重的失眠症，所以他常常参加各种团体咨询会，只为了能接触人群。",
          poster_path: "/rJBDuMN2FkGpFSVNSK3yPt5DLlV.jpg",
          backdrop_path: "/5TiwfWEaPSwD20uwXjCTUqpQX70.jpg",
          release_date: "1999-10-15",
          vote_average: 8.4
        };
        return new Response(JSON.stringify(testMovie), {
          headers: { ...baseHeaders, "Content-Type": "application/json" }
        });
      }

      // 未知路径
      console.log('❓ 未知路径请求:', path);
      return new Response(JSON.stringify({ 
        error: "Not found",
        message: "请求的路径不存在",
        available_endpoints: {
          "api_proxy": "/3/{endpoint}",
          "image_proxy": "/t/p/{size}/{image_path}",
          "health_check": "/health",
          "debug_info": "/debug",
          "test_movie": "/test-movie"
        },
        your_request: {
          path: path,
          search: url.search,
          method: request.method
        }
      }), {
        status: 404, 
        headers: { ...baseHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      console.error('💥 全局错误捕获:', err.message);
      console.error('🔧 错误堆栈:', err.stack);
      return new Response(JSON.stringify({ 
        error: "Internal Server Error",
        message: err.message,
        path: path,
        timestamp: new Date().toISOString(),
        debug_advice: "检查 Emby 的 TMDb 插件配置，确保 API 服务器设置为当前 Worker 地址"
      }), {
        status: 500,
        headers: { ...baseHeaders, "Content-Type": "application/json" }
      });
    } finally {
      console.log('🏁 === TMDB代理请求结束 ===');
      console.log(''); // 空行分隔日志
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