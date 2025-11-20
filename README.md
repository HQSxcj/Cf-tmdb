# Cf-tmdb

一个基于 **Cloudflare Workers** 的轻量级 TMDB 代理：  
- ✔ 自动为 TMDB API（[The Movie Database][点击前往 TMDB API 申请页面](https://www.themoviedb.org/settings/api)添加 `TMDB_API_KEY`  
- ✔ 多源图片代理，自动故障切换  
- ✔ 支持 Emby / Jellyfin / Kodi / Radarr / Sonarr 等媒体服务器  
- ✔ Cloudflare 全球加速  
- ✔ 完全 CORS 兼容  
- ✔ 无需传统后端服务器  

适合国内环境访问 TMDB、让媒体服务器能正常抓取图片与元数据。

---
[复制本仓库（Fork）](https://github.com/HQSxcj/Cf-tmdb/fork)后，点击下方按钮一键部署workers项目

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/HQSxcj/Cf-tmdb.git)
