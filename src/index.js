const TMDB_API_BASE = 'https://api.themoviedb.org';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 🚨 关键诊断日志
    console.log('=== 🔍 EMBY 诊断请求 ===');
    console.log('时间:', new Date().toISOString());
    console.log('路径:', path);
    console.log('参数:', url.search);
    console.log('方法:', request.method);
    console.log('User-Agent:', request.headers.get('user-agent') || '未知');
    console.log('来源:', request.headers.get('referer') || '直接访问');
    console.log('Authorization头:', request.headers.get('authorization') ? '有' : '无');
    console.log('========================');

    const baseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD, POST',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: baseHeaders });
    }

    try {
      // -------------------------------------------------------------------
      // 📌 1. API 代理 - 重点诊断
      // -------------------------------------------------------------------
      if (path.startsWith('/3/')) {
        console.log('🎯 识别为 API 请求，开始处理...');
        
        const apiKey = env.TMDB_API_KEY;
        const headers = { 'Accept': 'application/json' };

        // 诊断认证情况
        const auth = request.headers.get("Authorization");
        if (auth) {
          console.log('❌ 配置问题: Emby 仍然提供了 Authorization 头');
          headers["Authorization"] = auth;
        } else {
          console.log('✅ 认证配置正确: Emby 未提供 Auth 头');
          if (apiKey) {
            headers["Authorization"] = `Bearer ${apiKey}`;
            console.log('✅ 使用 Worker 的 API Key');
          } else {
            console.log('❌ Worker 环境变量缺少 API Key');
          }
        }

        const targetUrl = TMDB_API_BASE + path + url.search;
        console.log('🚀 请求 TMDb:', targetUrl);
        
        const resp = await fetch(targetUrl, { headers });
        
        console.log('📡 TMDb 响应状态:', resp.status);
        console.log('📡 TMDb 响应文本:', resp.statusText);
        
        // 检查响应内容
        const responseText = await resp.text();
        console.log('📄 响应长度:', responseText.length, '字符');
        
        if (responseText.length > 0) {
          try {
            const jsonData = JSON.parse(responseText);
            if (jsonData.title) {
              console.log('✅ 成功获取电影:', jsonData.title);
              console.log('📖 剧情简介长度:', jsonData.overview?.length || 0, '字符');
            } else if (jsonData.status_message) {
              console.log('❌ TMDb 错误:', jsonData.status_message);
            }
          } catch (e) {
            console.log('⚠️ 响应不是有效 JSON');
          }
        }

        return new Response(responseText, {
          status: resp.status,
          headers: {
            ...baseHeaders,
            'Content-Type': 'application/json; charset=utf-8'
          }
        });
      }

      // -------------------------------------------------------------------
      // 📌 2. 图片代理
      // -------------------------------------------------------------------
      if (path.startsWith('/t/p/')) {
        console.log('🖼️ 识别为图片请求');
        const targetUrl = TMDB_IMAGE_BASE + path + url.search;
        const resp = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://www.themoviedb.org/'
          }
        });
        
        console.log('🖼️ 图片响应状态:', resp.status);
        return new Response(resp.body, {
          status: resp.status,
          headers: baseHeaders
        });
      }

      // -------------------------------------------------------------------
      // 📌 3. 诊断页面
      // -------------------------------------------------------------------
      if (path === '/diagnose' || path === '/') {
        const diagnoseInfo = {
          status: 'running',
          issue: '海报正常但元数据缺失 - 深度诊断',
          possible_causes: [
            '1. Emby 未使用此 Worker 作为 API 服务器',
            '2. Emby 插件配置未生效',
            '3. Emby 缓存了旧的元数据',
            '4. 媒体库元数据下载器设置错误',
            '5. 电影文件命名不规范，无法识别'
          ],
          check_steps: [
            '确认 Emby 插件中 API 服务器设置为: https://cf.6080808.xyz',
            '确认 API 密钥字段已清空',
            '重启 Emby 服务',
            '检查媒体库的元数据下载器设置',
            '尝试手动识别电影'
          ],
          test_urls: {
            health: 'https://cf.6080808.xyz/',
            movie_test: 'https://cf.6080808.xyz/3/movie/1165656?language=zh-CN',
            image_test: 'https://cf.6080808.xyz/t/p/w500/rhc3ALgQ77kzHu8Z2X3hrFbEvTj.jpg'
          },
          timestamp: new Date().toISOString()
        };
        
        return new Response(JSON.stringify(diagnoseInfo, null, 2), {
          headers: { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8' }
        });
      }

      // -------------------------------------------------------------------
      // 📌 4. 健康检查
      // -------------------------------------------------------------------
      if (path === '/health') {
        return new Response(JSON.stringify({ 
          status: 'healthy',
          message: '诊断 Worker 运行正常',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8' }
        });
      }

      return new Response(JSON.stringify({ 
        message: 'TMDB Proxy Worker - 诊断版',
        usage: '访问 /diagnose 获取诊断信息',
        available_endpoints: ['/3/*', '/t/p/*', '/diagnose', '/health']
      }), {
        headers: { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });

    } catch (err) {
      console.error('💥 错误:', err.message);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }
  }
}