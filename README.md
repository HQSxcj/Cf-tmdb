# Cf-tmdb

通过合理利用 **Cloudflare** 和 **Vercel** 的全球边缘网络节点的免费套餐，部署代理 **TMDB** 的 `api.tmdb.org` 和 `image.tmdb.org` 两个接口的 JSON 节目信息和图片代理转发，让被屏蔽的 **Emby** 流畅恢复刮削 **TMDB** 的节目信息和节目图片。

不需要借助修改 host 节点方法和魔法网络工具代理。

[国内网络无法进入 GitHub 请看这](https://cftmdb.6080808.xyz)

＜ 打个广告🌟 emby-nginx助手[ GitHub 地址](https://github.com/HQSxcj/emby-nginx) ＞

**网盘媒体服务器专家级 Nginx 工具**

## 🚀 一键部署（两个都要部署）

## Cf-tmdb TMDB API 代理

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/HQSxcj/Cf-tmdb.git)

## 跳转至 Vl-tmdb 仓库 部署 图像 代理
[![跳转到 Vl-tmdb](https://img.shields.io/badge/跳转到-Vl--tmdb%20仓库-black?style=for-the-badge&logo=github)](https://github.com/HQSxcj/Vl-tmdb)


## 📋 必备要素

1. 一个域名 - 并托管至 **Cloudflare**
2. 一个 **GitHub** 账号 
3. **Emby** 里的神医助手插件 - 2.0 或 3.0 版

## 🔧 部署步骤

### 自动部署

1. Fork 本仓库到你的 GitHub 账户  

   - 点击上方 **Deploy to Cloudflare** 按钮  
   - 创建 **Cloudflare** 账户（如没有）  
   - 在 **Workers** 页面创建新服务  

4. 部署完项目绑定自定义域名，也就是托管在 cloudflare 的域名的子域名
   - workers 绑定自定义域名 → worker 项目主页 → 设置 → 域和路由 
→ 添加 → 自定义域 → 输入一个子域名 例:abc.com 子域名可: cf.abc.com 点击 部署


# 使用方式

Emby 神医助手配置

在神医助手 → 元数据增强 → 使用代替 TMDB 配置

	•	代替 TMDB API 地址：Workers 自定义域名
	例: https://cf.abc.com

	•	代替 TMDB 图像 地址：Vercel 自定义域名
	例: https://vl.abc.com

填完后保存，重启 Emby 服务器 即可生效。

# 部署效果

   利用cloudflare workers的快速的边缘计算去先一步匹配节目信息的json信息。
   emby 的 tmdb 插件通过接收到的 json 信息里的图片字符串拼接出完整的图片url链接
   返回图片url链接让 Vercel 的 cdn 优秀的图像缓存处理后一步刮削海报图片

   充分利用两个网站的的项目优势去智能组合刮削，并进一步节省单个网站请求，避免触发免费范围限制

```javascript:worker.js

const API_ORIGIN = 'https://api.themoviedb.org';
const IMAGE_ORIGIN = 'https://image.tmdb.org';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const { pathname, search } = url;

    if (pathname.startsWith('/3/') || pathname.startsWith('/4/')) {
      const target = `${API_ORIGIN}${pathname}${search}`;
      return proxy(request, target);
    }

    if (pathname.startsWith('/t/p/')) {
      const target = `${IMAGE_ORIGIN}${pathname}${search}`;
      return proxy(request, target);
    }

    return new Response('OK: use /3/... or /4/... for API, /t/p/... for images', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
};

async function proxy(incomingRequest, targetUrl) {
  const hopByHop = new Set([
    'connection',
    'keep-alive',
    'transfer-encoding',
    'proxy-connection',
    'upgrade',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers'
  ]);

  const reqHeaders = new Headers();
  for (const [k, v] of incomingRequest.headers) {
    if (!hopByHop.has(k.toLowerCase()) && k.toLowerCase() !== 'host') {
      reqHeaders.append(k, v);
    }
  }

  const isImage = targetUrl.startsWith(IMAGE_ORIGIN);
  const init = {
    method: incomingRequest.method,
    headers: reqHeaders,
    body: needsBody(incomingRequest.method) ? incomingRequest.body : undefined,
    redirect: isImage ? 'follow' : 'manual'
  };

  const upstreamRes = await fetch(targetUrl, init);

  const resHeaders = new Headers();
  for (const [k, v] of upstreamRes.headers) {
    if (!hopByHop.has(k.toLowerCase())) {
      resHeaders.append(k, v);
    }
  }

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: resHeaders
  });
}

function needsBody(method) {
  const m = method.toUpperCase();
  return m !== 'GET' && m !== 'HEAD';
}
```
### 注：本仓库玩法由群友摸鱼出来，用ai助手编写代码。本仓库可随意复制，代码随意修改创作，随意利用您的想法和专业知识创作升级代码的功能，本仓库不负责解答任何问题和承担责任。

### 请注意 自主修改创作 需了解 Cloudflare Workers 的免费套餐限制，防止超过限制 被短暂限制 worker 当天请求，需第二天重置计数后才可重新请求数据。
worker代理个人家庭 emby 刮削请求在免费套餐每日限制内，切勿修改请求太高
# Cloudflare Workers 免费套餐主要限制如下：
⸻
1. 请求数
	•	每天最多 100,000 次请求。
	•	同时（Burst）速率限制，每分钟约 1000 请求。

2. 子请求
	•	每个 Worker 调用中最多 50 个子请求（fetch() 等）。
	•	每次调用最多同时 6 条外部连接。

3. 脚本大小
	•	压缩后最大 3MB。
	•	环境变量最多 64 个，每个最大 5 KB。

4. 内存
	•	每个执行环境最多 128 MB 内存。

5. CPU 时间
	•	每次调用最多 10 毫秒 CPU 时间。
	•	可通过配置将 CPU 时间调高到最多 5 分钟。
	•	定时触发任务最多允许 15 分钟 CPU 执行。

6. Cache API
	•	每次请求最多 50 次 Cache 操作。
	•	单个缓存对象最大 512 MB。

7. 环境变量
	•	免费账户最大 64 个变量，每个 5 KB。

8. Worker 数量
	•	免费账户最多 100 个 Worker 脚本。
	•	每个账号最多 5 个 Cron Trigger。

9. 日志
	•	每次请求最多 256 KB 日志数据。

10. KV 存储
	•	读取操作：每天 100,000 次。
	•	写入操作（不同 key）：每天 1,000 次。
	•	删除和列出操作：每天各 1,000 次。
	•	KV 存储总量 1 GB。
	•	Key 最大 512 bytes，Value 最大 25 MB


![IMG_2078](https://github.com/user-attachments/assets/a7218b7f-474b-4f4b-9124-d11601be7b5a)
