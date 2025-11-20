# Cf-tmdb

一个基于 **Cloudflare Workers** 的轻量级 TMDB 代理，适合国内环境访问 TMDB，让媒体服务器能正常抓取图片与元数据。

---

## 功能特点

- ✅ 自动为 TMDB API 代理（[申请 TMDB_API_KEY](https://www.themoviedb.org/settings/api)）  
- ✅ 多源图片代理，自动故障切换  
- ✅ 支持 Emby 或其他需用 `api.tmdb.org` 和 `image.tmdb.org` 的工具  
  > embyserver使用 [神医助手](https://github.com/sjtuross/StrmAssistant/wiki/%E6%9B%BF%E4%BB%A3-TMDB-%E9%85%8D%E7%BD%AE) 代替 TMDB 配置  
- ✅ Cloudflare 全球加速（⚠️ 部署需要 **CLOUDFLARE_API_TOKEN**）  
- ✅ 完全 CORS 兼容  
- ✅ 无需传统后端服务器  

---

## 快速部署

1. **Fork 仓库**  

[复制本仓库（Fork）](https://github.com/HQSxcj/Cf-tmdb/fork)  

2. **一键部署 Workers 项目**  

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/HQSxcj/Cf-tmdb.git)

> ⚠️ 注意：部署前请先生成 **Cloudflare API Token**，点击按钮会跳转到创建页面。

---

## 使用说明

- 将生成的 Workers 地址配置到你的媒体服务器中，替代 TMDB 官方 API 地址。  
- 对于 Emby / Jellyfin / Kodi / Radarr / Sonarr 等，推荐使用神医助手来简化 TMDB 配置。  
- 支持多源图片自动切换，即使部分源失效也能正常显示封面。  

---
