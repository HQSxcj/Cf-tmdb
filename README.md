# Cf-tmdb

一个基于 **Cloudflare Workers** 的轻量级 TMDB 代理，适合国内环境访问 TMDB，让emby不用机场节点也能正常刮削图片与元数据。

## 提前准备

在开始部署 Cf-tmdb 之前，请先准备以下内容：

1. **域名托管到 Cloudflare**  
   - 需要有一个域名，并将其 DNS 托管到 Cloudflare  
   - [点击前往 Cloudflare 官网](https://www.cloudflare.com/)  


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

-  3.添加Worker 自定义域地址，填写到需要填api.tmdb.org和image.tmdb.org填空中，替代 TMDB 官方 API 地址。  

-  4.对于 Emby 推荐使用神医助手来简化 TMDB 配置。  

-  5.找剧集或电影刷新元数据或者搜索图像


---
