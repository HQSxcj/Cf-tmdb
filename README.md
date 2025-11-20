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

- ✅ 自动为 TMDB API 代理（[申请 TMDB_API_KEY](https://www.themoviedb.org/settings/api)）  
- ✅ 多源图片代理，自动故障切换  
- ✅ 支持 Emby 或其他需用 `api.tmdb.org` 和 `image.tmdb.org` 的工具  
  > emby使用 [神医助手](https://github.com/sjtuross/StrmAssistant/wiki/%E6%9B%BF%E4%BB%A3-TMDB-%E9%85%8D%E7%BD%AE) 代替 TMDB 配置  
- ✅ Cloudflare 全球加速

---

## 快速部署

1. **Fork 仓库**  

[复制本仓库（Fork）](https://github.com/HQSxcj/Cf-tmdb/fork)  

2. **一键部署 Workers 项目**  

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/HQSxcj/Cf-tmdb.git)

---

## 使用说明

- 将生成的 Worker 自定义域地址配置到需要填api.tmdb.org和image.tmdb.org填空中，替代 TMDB 官方 API 地址。  
- 对于 Emby 推荐使用神医助手来简化 TMDB 配置。  
-

---
