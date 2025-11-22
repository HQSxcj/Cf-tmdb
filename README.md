# Cf-tmdb

通过合理利用 **Cloudflare** 和 **Vercel** 的全球边缘网络节点的免费套餐，部署代理 **TMDB** 的 `api.tmdb.org` 和 `image.tmdb.org` 两个接口的 JSON 节目信息和图片代理转发，让被屏蔽的 **Emby** 流畅恢复刮削 **TMDB** 的节目信息和节目图片。

不需要借助修改 host 节点方法和魔法网络工具代理。

[国内网络无法进入 GitHub 请看这](https://cftmdb.6080808.xyz)

＜ 打个广告🌟 emby-nginx助手[ GitHub 地址](https://github.com/HQSxcj/emby-nginx) ＞

**网盘媒体服务器专家级 Nginx 工具**



## 提前准备

在开始部署 Cf-tmdb 之前，请先准备以下内容：

1. **域名托管到 Cloudflare**  
   - 需要有一个域名，并将其 DNS 托管到 Cloudflare  
   - [点击前往 Cloudflare 官网](https://www.cloudflare.com/)  
   - 创建 CLOUDFLARE_API_TOKEN 在主页右上角 → 个人简介 → 配置文件 → api令牌 → 创建令牌 → 选择使用模板（编辑Couldflare Workers） → 权限 默认不改 → 账户资源（包括-你的账户）→ 区域资源（包括-账户所有区域-账户） → 继续以显示摘要 → 创建令牌 令牌复制保存待粘贴到GitHub


2. **Emby 媒体服务器配置**  
请 <a href="https://github.com/sjtuross/StrmAssistant/releases/tag/v2.0.0.30">下载</a> 安装StrmAssistant.dll **替代 TMDB 配置** 功能的**神医助手插件**。安装方式:下载 StrmAssistant.dll 文件保存在 emby容器的 plugins文件夹内和其他.dll文件放置一起 → 重启 emby生效
   - [点击前往神医助手 Wiki 页面](https://github.com/sjtuross/StrmAssistant/wiki/%E6%9B%BF%E4%BB%A3-TMDB-%E9%85%8D%E7%BD%AE)  
   - emby服务器 控制台 左下角 点击 神医助手 → 元数据增强 → 打开 代替TMDB配置 → 两个代替地址填空 填入 Worker 自定义域名 → 保存 即可体验秒出海报。
   - 目前 使用代替 TMDB 配置 在神医助手pro版属于无需收费激活版本，请觉得不错的朋友可以付费激活体验其他功能，推荐朋友学习此教程也请推荐神医助手pro激活版其他功能。
3. **凡事不懂多问ai助手，多积累玩法经验**
---

## 功能特点

- ✅ 不需要申请tmdb api密钥
- ✅ 多源图片代理，包含tmdb fanart.tv
- ✅ 支持 Emby 或其他需填用 `api.tmdb.org` 和 `image.tmdb.org` 的工具  
  > emby使用 [神医助手](https://github.com/sjtuross/StrmAssistant/wiki/%E6%9B%BF%E4%BB%A3-TMDB-%E9%85%8D%E7%BD%AE) 代替 TMDB 配置  
- ✅ Cloudflare 全球加速 比部分机场速度更快

---

## 快速部署

1. **Fork 仓库**  

[复制本仓库（Fork）](https://github.com/HQSxcj/Cf-tmdb/fork)  

#  一键部署 Cf-tmdb 部署 API 代理

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/HQSxcj/Cf-tmdb.git)

#  跳转至 Vl-tmdb 仓库 部署 图像 代理
[![跳转到 Vl-tmdb](https://img.shields.io/badge/跳转到-Vl--tmdb%20仓库-black?style=for-the-badge&logo=github)](https://github.com/HQSxcj/Vl-tmdb)


3. **复制本仓库后，如需本人或利用ai编写升级worker项目功能，请修改后全局替换src/index.js 内代码内容，github 会实时自动部署至worker 运行。**
---

## 使用说明

-  1.复制本仓库到自己仓库

-  2.一键部署Cf-tmdb的worker项目 （需要创建 CLOUDFLARE_API_TOKEN  填入复制本仓库后 → Settings → Secrets and variables → Actions → New repository secret →Name填  CLOUDFLARE_API_TOKEN Secret填 复制的令牌）

-  3.添加Worker 自定义域地址，（进入此worker项目主页 → 设置 → 域与路由 → 添加 → 自定义域 → 你托管域名的子域名 例如:abc.com 子域名可以 tmdb.abc.com → 添加域 自定义域名就是 https://tmdb.abc.com )填写到需要填api.tmdb.org和image.tmdb.org填空中，替代 TMDB 官方 API 地址。  

-  4.对于 Emby 推荐使用神医助手来简化 TMDB 配置。  

-  5.找剧集或电影刷新元数据或者搜索图像

### 注意：设置好的自定义域名代理 因有 cloudflare workers 免费套餐限制，个人刮削使用完全足够，请不要分享代理自定义域名给他人使用，可推荐他人自主安装 worker 使用自己的 cloudflare worker 免费套餐
---
## 如觉得以上太麻烦了，可以手动配置操作
-  1.托管域名到couldflare
-  2.点击workers 和 pages → 创建应用程序 → 从 Hello World 开始 开始使用 → Worker名称 随意填 → 部署 → 找到 编辑代码 → 把下面的代码 复制替换掉 workers.js的代码 → 右上角 → 部署，等屏幕下方出现绿色就部署成功 → 接下来请看 本页使用说明的 → 3 → 4 → 5

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
### worker代理个人家庭 emby 刮削请求在免费套餐每日限制内，切勿修改请求太高。

### 目前体验的优点是无魔法网络秒出海报和节目信息，缺点emby采用的是多线程同时刮削 worker项目免费套餐 跟不上emby的多线程，比高速vpn可能有些许的慢，具体需要各位自行体验。

### 建议对均衡负载或者couldflare Workers 熟悉的朋友 可以研究多个workers 均衡负载 增加线程等方法。

![IMG_2078](https://github.com/user-attachments/assets/a7218b7f-474b-4f4b-9124-d11601be7b5a)
