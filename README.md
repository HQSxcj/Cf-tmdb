# Cf-tmdb

一个基于 **Cloudflare Workers** 的轻量级 TMDB 代理，适合国内环境访问 TMDB，让emby不用机场节点也能正常刮削图片与元数据。

## 提前准备

在开始部署 Cf-tmdb 之前，请先准备以下内容：

1. **域名托管到 Cloudflare**  
   - 需要有一个域名，并将其 DNS 托管到 Cloudflare  
   - [点击前往 Cloudflare 官网](https://www.cloudflare.com/)  
   - 创建 CLOUDFLARE_API_TOKEN 在主页右上角 → 个人简介 → 配置文件 → api令牌 → 创建令牌 → 选择使用模板（编辑Couldflare Workers） → 权限 默认不改 → 账户资源（包括-你的账户）→ 区域资源（包括-账户所有区域-账户） → 继续以显示摘要 → 创建令牌


2. **Emby 媒体服务器配置**  
   - 安装带有 **替代 TMDB 配置** 的 **神医助手插件**  
   - [点击前往神医助手 Wiki 页面](https://github.com/sjtuross/StrmAssistant/wiki/%E6%9B%BF%E4%BB%A3-TMDB-%E9%85%8D%E7%BD%AE)  
   - 插件可简化 TMDB API 和图片代理配置  

---

## 功能特点

- ✅ 不需要申请tmdb api密钥
- ✅ 多源图片代理，包含tmdb fanart.tv
- ✅ 支持 Emby 或其他需用 `api.tmdb.org` 和 `image.tmdb.org` 的工具  
  > emby使用 [神医助手](https://github.com/sjtuross/StrmAssistant/wiki/%E6%9B%BF%E4%BB%A3-TMDB-%E9%85%8D%E7%BD%AE) 代替 TMDB 配置  
- ✅ Cloudflare 全球加速 比部分机场速度更快

---

## 快速部署

1. **Fork 仓库**  

[复制本仓库（Fork）](https://github.com/HQSxcj/Cf-tmdb/fork)  

2. **一键部署 Workers 项目**  

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/HQSxcj/Cf-tmdb.git)

---

## 使用说明

-  1.复制本仓库到自己仓库

-  2.一键拉取创建Cf-tmdb的worker项目 （需要创建 CLOUDFLARE_API_TOKEN  填入复制本仓库后 → Settings → Secrets and variables → Actions → New repository secret →Name填  CLOUDFLARE_API_TOKEN Secret填 复制的令牌）

-  3.添加Worker 自定义域地址，（进入此worker项目主页 → 设置 → 域与路由 → 添加 → 自定义域 → 你托管域名的子域名 例如:abc.com 子域名可以 tmdb.abc.com → 添加域 自定义域名就是 https://tmdb.abc.com )填写到需要填api.tmdb.org和image.tmdb.org填空中，替代 TMDB 官方 API 地址。  

-  4.对于 Emby 推荐使用神医助手来简化 TMDB 配置。  

-  5.找剧集或电影刷新元数据或者搜索图像


---
## 如觉得以上太麻烦了，傻瓜式操作
-  1.托管域名到couldflare
-  2.点击workers 和 pages → 创建应用程序 → 从 Hello World 开始 开始使用 → Worker名称 随意填 → 部署 → 找到 编辑代码 → 把下面的代码 复制替换掉 workers.js的代码 → 右上角 → 部署，等屏幕下方出现绿色就部署成功 → 接下来请看 本页使用说明的 → 3 → 4 → 5

# TMDB Proxy

A Cloudflare Worker that proxies requests to TMDB API and image services.

## Usage

```javascript:worker.js
/**
 * Cloudflare Workers - TMDB Proxy
 */

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
