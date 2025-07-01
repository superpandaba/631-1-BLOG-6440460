# 响应式博客平台

这是一个简单但功能齐全的博客平台，旨在提供一个动态加载内容、支持用户交互（如发布、查看、评论）的网站。

本项目的核心特色是**响应式网页设计 (Responsive Web Design)**，确保在桌面、平板和手机等不同尺寸的设备上都能提供优良的阅读和使用体验。

## 核心功能

-   **完整的增删改查**:
    -   发布新文章 (Create)
    -   查看文章列表和详情 (Read)
    -   修改文章内容 (Update)
    -   删除文章 (Delete)
-   **权限管理**:
    -   基于用户名和密码的管理员登录系统。
    -   只有管理员登录后，才能看到和使用修改、删除功能。
-   **互动功能**:
    -   访客可以对文章进行评论。
    -   自动追踪并显示每篇文章的阅读次数。

## 技术栈

-   **前端**: `HTML`, `CSS`, `JavaScript` (原生)
-   **后端**: `Node.js` (原生 `http` 模块)
-   **数据存储**: `JSON` 文件 (`db.json`)

## 项目结构

```
/
├── backend/
│   ├── data/
│   │   └── db.json     # 存放我们所有博客文章和评论的 "数据库" 文件
│   └── server.js       # 后端服务器，负责提供数据接口
│
├── frontend/
│   ├── css/
│   │   └── style.css   # 存放所有样式，负责美化页面和响应式设计
│   ├── js/
│   │   └── app.js      # 存放前端逻辑，比如如何从后端获取数据并显示在页面上
│   ├── index.html      # 博客列表页，我们项目的主页
│   ├── post.html       # 博客详情页，显示单篇文章的完整内容
│   └── new-post.html   # 新建文章页，用来发布新博客
│
└── README.md           # 我们的项目说明书
```

## 本地浏览

1.  **启动后端服务**:
    ```bash
    cd backend
    npm install express # 首次运行时需要安装依赖
    node server.js
    ```
    服务将在 `http://localhost:3000` 上运行。

2.  **查看前端页面**:
    在浏览器中直接打开 `frontend/` 目录下的 `.html` 文件即可。

## Azure 部署方案 

将采用前后端分离的模式，将项目部署到 Microsoft Azure 云平台。

### 1. 前端部署

-   **服务**: **Azure Static Web Apps (静态 Web 应用)**
-   **内容**: 托管 `frontend/` 目录下的所有静态文件 (`.html`, `.css`, `.js`)。
-   **特点**: 高性能、全球分发、提供免费的SSL证书和慷慨的免费额度。

### 2. 后端部署

-   **服务**: **Azure App Service (应用服务)**
-   **内容**: 运行 `backend/` 目录下的 Node.js 服务 (`server.js`)。
-   **特点**: 这是一个功能强大的平台即服务(PaaS)，可以托管各种Web应用。我们需要配置它以正确运行 Node.js 环境。

### 部署步骤概览

1.  **准备工作**: 注册 Azure 账号，安装 Azure CLI 和 VS Code 的 Azure 扩展。
2.  **代码适配**:
    -   修改后端 `server.js` 以适应 App Service 的运行环境（主要是端口的获取方式）。
    -   修改前端 `app.js`，将写死的 `http://localhost:3000` API 地址替换为可配置的环境变量。
3.  **部署后端**: 将 `backend/` 文件夹部署到 Azure App Service，获取一个公开的后端URL。
4.  **部署前端**: 将 `frontend/` 文件夹部署到 Azure Static Web Apps，并将后端的URL配置为前端的环境变量。
5.  **完成**! 获取前端的公开URL，即可在全网访问我们的博客。

## API 接口说明

-   `GET /api/posts`: 获取所有博客文章列表。
-   `GET /api/posts/:id`: 获取单篇文章的详细内容。
-   `POST /api/posts`: 创建一篇新的博客文章。
-   `PUT /api/posts/:id`: 更新一篇文章。
-   `DELETE /api/posts/:id`: 删除一篇文章。
-   `POST /api/posts/:id/view`: 增加文章阅读数。
-   `POST /api/posts/:id/comments`: 为文章添加新的评论。
-   `POST /api/login`: 管理员登录。