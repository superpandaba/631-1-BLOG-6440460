const http = require('http');
const fs = require('fs');
const path = require('path');

// 日志记录函数，方便我们追踪请求和错误
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);

const server = http.createServer((req, res) => {
    log(`收到请求: ${req.method} ${req.url}`);

    // 设置CORS头，允许前端从不同源访问
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE, PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 预检请求（Preflight request）处理
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const urlParts = req.url.split('/');

    // 1. 管理员登录
    if (req.method === 'POST' && req.url === '/api/login') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { username, password } = JSON.parse(body);
                const dbPath = path.join(__dirname, 'data', 'db.json');
                
                fs.readFile(dbPath, 'utf8', (err, data) => {
                    if (err) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message: '服务器内部错误' })); return; }
                    const jsonData = JSON.parse(data);
                    const admin = jsonData.adminUser;

                    if (username === admin.username && password === admin.password) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, username: admin.username }));
                        log(`管理员登录成功: ${username}`);
                    } else {
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: '用户名或密码错误' }));
                        log(`管理员登录失败: ${username}`);
                    }
                });
            } catch (parseError) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message: '请求数据格式错误' })); }
        });
    }

    // 2. 获取所有文章
    else if (req.method === 'GET' && req.url === '/api/posts') {
        const dbPath = path.join(__dirname, 'data', 'db.json');
        fs.readFile(dbPath, 'utf8', (err, data) => {
            if (err) { res.writeHead(500); res.end(); return; }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
            log('成功发送文章列表');
        });
    }

    // 3. 获取单篇文章
    else if (req.method === 'GET' && urlParts[1] === 'api' && urlParts[2] === 'posts' && urlParts[3] && !urlParts[4]) {
        const postId = parseInt(urlParts[3], 10);
        const dbPath = path.join(__dirname, 'data', 'db.json');
        fs.readFile(dbPath, 'utf8', (err, data) => {
            if (err) { res.writeHead(500); res.end(); return; }
            try {
                const jsonData = JSON.parse(data);
                const post = jsonData.posts.find(p => p.id === postId);
                if (post) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(post));
                    log(`成功发送文章 ID: ${postId} (仅数据)`);
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: '文章未找到' }));
                }
            } catch (e) { res.writeHead(500); res.end(); }
        });
    }

    // 4. 创建新文章
    else if (req.method === 'POST' && req.url === '/api/posts') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { title, author, content } = JSON.parse(body);

                if (!title || !author || !content) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: '错误：标题、作者和内容不能为空。' }));
                    return;
                }

                const dbPath = path.join(__dirname, 'data', 'db.json');
                fs.readFile(dbPath, 'utf8', (err, data) => {
                    if (err) {
                        log(`错误: 无法读取 db.json 文件 - ${err.message}`);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: '服务器内部错误' }));
                        return;
                    }

                    const jsonData = JSON.parse(data);
                    
                    const newPost = {
                        id: jsonData.posts.length > 0 ? Math.max(...jsonData.posts.map(p => p.id)) + 1 : 1,
                        title,
                        author,
                        date: new Date().toISOString().split('T')[0],
                        content,
                        views: 0,
                        comments: []
                    };

                    jsonData.posts.push(newPost);

                    fs.writeFile(dbPath, JSON.stringify(jsonData, null, 2), (writeErr) => {
                        if (writeErr) {
                            log(`错误: 无法写入 db.json 文件 - ${writeErr.message}`);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ message: '服务器内部错误' }));
                            return;
                        }

                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(newPost));
                        log(`成功创建新文章，ID: ${newPost.id}`);
                    });
                });

            } catch (e) { res.writeHead(400); res.end(); }
        });
    }
    
    // 5. 增加阅读数
    else if (req.method === 'POST' && urlParts[1] === 'api' && urlParts[2] === 'posts' && urlParts[4] === 'view') {
        const postId = parseInt(urlParts[3], 10);
        const dbPath = path.join(__dirname, 'data', 'db.json');
        fs.readFile(dbPath, 'utf8', (err, data) => {
            if (err) { res.writeHead(500); return; }
            const jsonData = JSON.parse(data);
            const postIndex = jsonData.posts.findIndex(p => p.id === postId);
            if (postIndex !== -1) {
                jsonData.posts[postIndex].views = (jsonData.posts[postIndex].views || 0) + 1;
                fs.writeFile(dbPath, JSON.stringify(jsonData, null, 2), (writeErr) => {
                    if (writeErr) { res.writeHead(500); return; }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, views: jsonData.posts[postIndex].views }));
                    log(`文章 ${postId} 的阅读次数已更新`);
                });
            } else { res.writeHead(404); }
        });
    }
    
    // 6. 创建新评论
    else if (req.method === 'POST' && urlParts[1] === 'api' && urlParts[2] === 'posts' && urlParts[4] === 'comments') {
        const postId = parseInt(urlParts[3], 10);
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                // 对于评论，暂时简化，只接收 user 和 text
                const { user, text } = JSON.parse(body);

                if (!user || !text) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: '错误：用户名和评论内容不能为空。' }));
                    log(`创建评论失败：缺少字段。文章ID: ${postId}`);
                    return;
                }

                const dbPath = path.join(__dirname, 'data', 'db.json');
                fs.readFile(dbPath, 'utf8', (err, data) => {
                    if (err) {
                        log(`错误: 无法读取 db.json 文件 - ${err.message}`);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: '服务器内部错误' }));
                        return;
                    }

                    const jsonData = JSON.parse(data);
                    const postIndex = jsonData.posts.findIndex(p => p.id === postId);

                    if (postIndex === -1) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: '文章未找到' }));
                        log(`创建评论失败：未找到文章ID: ${postId}`);
                        return;
                    }

                    const post = jsonData.posts[postIndex];
                    const newComment = {
                        id: post.comments.length > 0 ? Math.max(...post.comments.map(c => c.id)) + 1 : 1,
                        user,
                        text
                    };

                    post.comments.push(newComment);

                    fs.writeFile(dbPath, JSON.stringify(jsonData, null, 2), (writeErr) => {
                        if (writeErr) {
                            log(`错误: 无法写入 db.json 文件 - ${writeErr.message}`);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ message: '服务器内部错误' }));
                            return;
                        }

                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(newComment));
                        log(`成功为文章 ${postId} 创建新评论, ID: ${newComment.id}`);
                    });
                });

            } catch (parseError) {
                log(`错误: 解析评论请求体JSON失败 - ${parseError.message}`);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: '请求数据格式错误或非JSON格式' }));
            }
        });
    }
    
    // 7. 删除文章
    else if (req.method === 'DELETE' && urlParts[1] === 'api' && urlParts[2] === 'posts' && urlParts[3]) {
        const postId = parseInt(urlParts[3], 10);
        const dbPath = path.join(__dirname, 'data', 'db.json');
        fs.readFile(dbPath, 'utf8', (err, data) => {
            if (err) { res.writeHead(500); return; }
            let jsonData = JSON.parse(data);
            const postIndex = jsonData.posts.findIndex(p => p.id === postId);
            if (postIndex > -1) {
                jsonData.posts.splice(postIndex, 1);
                fs.writeFile(dbPath, JSON.stringify(jsonData, null, 2), (writeErr) => {
                    if (writeErr) { res.writeHead(500); return; }
                    res.writeHead(204);
                    res.end();
                    log(`成功删除文章 ID: ${postId}`);
                });
            } else { res.writeHead(404); }
        });
    }

    // 8. 更新文章
    else if (req.method === 'PUT' && urlParts[1] === 'api' && urlParts[2] === 'posts' && urlParts[3]) {
        const postId = parseInt(urlParts[3], 10);
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { title, content } = JSON.parse(body);
                if (!title || !content) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: '标题和内容不能为空' }));
                    return;
                }

                const dbPath = path.join(__dirname, 'data', 'db.json');
                fs.readFile(dbPath, 'utf8', (err, data) => {
                    if (err) { res.writeHead(500); return; }
                    let jsonData = JSON.parse(data);
                    const postIndex = jsonData.posts.findIndex(p => p.id === postId);

                    if (postIndex > -1) {
                        // 更新文章数据
                        jsonData.posts[postIndex].title = title;
                        jsonData.posts[postIndex].content = content;

                        fs.writeFile(dbPath, JSON.stringify(jsonData, null, 2), (writeErr) => {
                            if (writeErr) { res.writeHead(500); return; }
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(jsonData.posts[postIndex])); // 返回更新后的文章
                            log(`成功更新文章 ID: ${postId}`);
                        });
                    } else {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: '文章未找到' }));
                    }
                });
            } catch (e) { res.writeHead(400); }
        });
    }

    // 9. 兜底：未找到资源
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '您访问的页面不存在' }));
        log(`未找到资源: ${req.url}`);
    }
});

// 读取 Azure 环境变量（尝试获取云环境提供的PORT，如果获取不到，就用3000作为默认值）
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    log(`后端服务器已启动，正在监听 http://localhost:${PORT}`);
    log('你可以通过访问 http://localhost:3000/api/posts 来获取博客文章数据');
}); 