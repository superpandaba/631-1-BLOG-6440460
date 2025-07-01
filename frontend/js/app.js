// 前端逻辑将写在这里

// 全局变量，用于存储当前登录的用户名
let currentLoggedInUser = null;

// 将API集中管理
const API_BASE_URL = 'https://yuan-6440460-blog-cff9h4adguanc3gj.eastus-01.azurewebsites.net/';

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 已完全加载，app.js 开始执行。');

    // 检查登录状态
    checkLoginStatus();

    // 为登录/登出按钮绑定事件
    setupLoginButton();

    // 检查当前页面是否是首页
    const postsContainer = document.getElementById('posts-container');
    if (postsContainer) {
        fetchPosts(postsContainer);

        // 为文章列表容器添加点击事件委托
        postsContainer.addEventListener('click', (event) => {
            // 检查被点击的是否是"阅读全文"链接
            if (event.target.classList.contains('read-more')) {
                const link = event.target;
                const postId = link.href.split('id=')[1]; // 从链接中解析出文章ID

                console.log(`"阅读全文"被点击，文章ID: ${postId}。准备增加阅读数。`);
                
                // 悄悄地发送增加阅读数的请求，不影响页面跳转
                const API_URL = `${API_BASE_URL}/api/posts/${postId}/view`;
                fetch(API_URL, { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            console.log(`文章 ${postId} 阅读数增加成功，最新为: ${data.views}`);
                        }
                    })
                    .catch(error => {
                        console.error('增加阅读数失败:', error);
                    });
                
            }
        });
    }

    // 检查当前页面是否是文章详情页
    const postDetailContainer = document.getElementById('post-detail-container');
    if (postDetailContainer) {
        fetchPostDetail(postDetailContainer);
    }

    // 检查当前页面是否是新建文章页
    const newPostForm = document.getElementById('new-post-form');
    if (newPostForm) {
        handleNewPostForm(newPostForm);
    }

    // 检查当前页面是否有评论表单
    const newCommentForm = document.getElementById('new-comment-form');
    if (newCommentForm) {
        handleCommentForm(newCommentForm);
    }
});

/**
 * 检查登录状态
 * 不再检查URL参数，只检查localStorage
 */
function checkLoginStatus() {
    const userFromStorage = localStorage.getItem('blogAdminUser');
    if (userFromStorage) {
        console.log(`从LocalStorage恢复登录状态: ${userFromStorage}`);
        currentLoggedInUser = userFromStorage;
    } else {
        console.log('当前为访客状态。');
    }
}

/**
 * 设置登录/登出按钮的行为
 */
function setupLoginButton() {
    const loginBtn = document.getElementById('login-btn');
    const newPostLink = document.getElementById('new-post-link'); // 获取发布文章的链接

    if (!loginBtn) return;

    if (currentLoggedInUser) {
        // 如果已登录
        loginBtn.textContent = '登出';
        if (newPostLink) newPostLink.style.display = 'inline-block'; // 显示发布链接
        loginBtn.onclick = () => {
            localStorage.removeItem('blogAdminUser'); // 从localStorage里移除身份
            window.location.reload(); // 刷新页面以更新UI
        };
    } else {
        // 如果未登录
        loginBtn.textContent = '管理员登录';
        if (newPostLink) newPostLink.style.display = 'none'; // 隐藏发布链接
        loginBtn.onclick = () => {
            const username = prompt('请输入管理员用户名:');
            if (username === null) return; // 用户点击了取消
            const password = prompt('请输入密码:');
            if (password === null) return; // 用户点击了取消

            handleLogin(username, password);
        };
    }
}

/**
 * 处理登录逻辑
 * @param {string} username 
 * @param {string} password 
 */
async function handleLogin(username, password) {
    const API_URL = `${API_BASE_URL}/api/login`;
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (data.success) {
            alert('登录成功！');
            localStorage.setItem('blogAdminUser', data.username);
            window.location.reload();
        } else {
            throw new Error(data.message || '登录失败');
        }
    } catch (error) {
        alert(error.message);
    }
}

/**
 * 异步函数：从后端API获取所有文章并显示在页面上
 * @param {HTMLElement} container - 用于显示文章的HTML容器元素
 */
async function fetchPosts(container) {
    const API_URL = `${API_BASE_URL}/api/posts`;
    console.log('正在从 API 获取文章...');

    try {
        const response = await fetch(API_URL);

        // 检查网络请求是否成功
        if (!response.ok) {
            throw new Error(`网络错误！状态: ${response.status}`);
        }

        const data = await response.json();
        const posts = data.posts; // 从返回的数据中获取文章数组
        console.log('成功获取到文章:', posts);

        // 清空容器里的 "正在加载文章..." 提示
        container.innerHTML = '';

        // 如果没有文章，显示提示信息
        if (posts.length === 0) {
            container.innerHTML = '<p>还没有文章，快去发布第一篇吧！</p>';
            return;
        }

        // 检查每一篇文章，并创建HTML元素
        posts.forEach(post => {
            const postElement = document.createElement('article');
            postElement.className = 'post-summary';
            
            // 恢复到没有删除按钮的原始HTML结构
            postElement.innerHTML = `
                <h3>${post.title}</h3>
                <p class="post-meta">作者：${post.author} | 日期：${post.date}</p>
                <p>${post.content.substring(0, 100)}...</p>
                <a href="post.html?id=${post.id}" class="read-more">阅读全文 &rarr;</a>
            `;
            
            container.appendChild(postElement);
        });

    } catch (error) {
        // 如果在获取或处理数据过程中发生任何错误，就在页面上显示错误信息
        console.error('获取文章失败:', error);
        container.innerHTML = '<p style="color: red;">抱歉，加载文章失败。请检查后端服务是否正在运行，或稍后再试。</p>';
    }
}

/**
 * fetchPostDetail函数
 * 获取文章详情
 */
async function fetchPostDetail(container) {
    // 使用URLSearchParams轻松获取URL查询参数
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');
    console.log(`正在获取 ID 为 ${postId} 的文章详情...`);

    // 如果URL中没有ID，显示错误信息
    if (!postId) {
        container.innerHTML = '<p style="color: red;">错误：未指定文章ID。</p>';
        return;
    }

    const API_URL = `${API_BASE_URL}/api/posts/${postId}`;

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`网络错误！状态: ${response.status}`);
        }

        const post = await response.json();
        console.log('成功获取到文章详情:', post);

        // 清空容器里的 "正在加载..." 提示
        container.innerHTML = '';

        // 创建文章详情的HTML结构
        const articleElement = document.createElement('article');
        articleElement.className = 'post-full';
        articleElement.innerHTML = `
            <h2>${post.title}</h2>
            <p class="post-meta">作者：${post.author} | 日期：${post.date}</p>
            <div class="post-content">
                ${post.content.replace(/\n/g, '<br>')}
            </div>
        `;
        container.appendChild(articleElement);

        // 动态创建并注入元数据容器
        const metaContainer = document.createElement('div');
        metaContainer.id = 'post-meta-container';
        metaContainer.className = 'post-meta-container';
        
        // 创建一个div用于存放左侧信息
        const infoSpan = document.createElement('div');
        infoSpan.className = 'post-meta-info';

        // 显示留言数
        const commentsCount = post.comments ? post.comments.length : 0;
        const commentsSpan = document.createElement('span');
        commentsSpan.innerHTML = `&#128172; ${commentsCount} 条留言`;
        infoSpan.appendChild(commentsSpan);

        // 显示阅读次数
        const viewsSpan = document.createElement('span');
        viewsSpan.innerHTML = `&#128065; ${post.views || 0} 次阅读`;
        infoSpan.appendChild(viewsSpan);
        
        metaContainer.appendChild(infoSpan); // 把信息区加入元数据栏

        // 权限控制的按钮
        if (currentLoggedInUser) {
            const buttonWrapper = document.createElement('div');
            buttonWrapper.className = 'action-buttons';

            const editBtn = document.createElement('button');
            editBtn.className = 'meta-btn';
            editBtn.textContent = '修改';
            editBtn.onclick = () => { window.location.href = `new-post.html?editId=${post.id}`; };
            buttonWrapper.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'meta-btn delete-btn';
            deleteBtn.textContent = '删除';
            deleteBtn.onclick = () => deletePost(post.id);
            buttonWrapper.appendChild(deleteBtn);

            metaContainer.appendChild(buttonWrapper); // 把按钮区加入元数据栏
        }

        // 把整个元数据栏添加到文章主容器的末尾
        container.appendChild(metaContainer);

        // 处理评论区
        const commentsContainer = document.getElementById('comments-container');
        if (commentsCount > 0) {
            post.comments.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';
                commentElement.innerHTML = `
                    <p><strong>${comment.user}:</strong></p>
                    <p>${comment.text}</p>
                `;
                commentsContainer.appendChild(commentElement);
            });
        } else {
            commentsContainer.innerHTML = '<p>暂无评论。</p>';
        }

    } catch (error) {
        console.error('获取文章详情失败:', error);
        container.innerHTML = `<p style="color: red;">抱歉，加载文章失败。请检查文章ID是否正确，或稍后再试。</p>`;
    }
}

/**
 * 处理新建文章的表单
 * @param {HTMLFormElement} form - 新建文章的表单元素
 */
function handleNewPostForm(form) {
    if (!currentLoggedInUser) {
        alert('请先以管理员身份登录。');
        window.location.href = 'index.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const editId = params.get('editId');

    // 模式判断
    if (editId) {
        // 编辑模式
        document.querySelector('h2').textContent = '编辑文章';
        form.querySelector('button[type="submit"]').textContent = '更新文章';

        // 1. 获取现有文章数据并填充表单
        const API_URL_GET = `${API_BASE_URL}/api/posts/${editId}`;
        fetch(API_URL_GET)
            .then(res => res.json())
            .then(post => {
                form.elements.title.value = post.title;
                form.elements.author.value = post.author;
                form.elements.content.value = post.content;
            });

        // 2. 表单提交时，发送 PUT 请求
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const updatedData = {
                title: form.elements.title.value,
                content: form.elements.content.value
            };
            const API_URL_PUT = `${API_BASE_URL}/api/posts/${editId}`;
            try {
                const response = await fetch(API_URL_PUT, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });
                if (!response.ok) throw new Error('更新失败');
                alert('文章更新成功！');
                window.location.href = `post.html?id=${editId}`; // 返回到文章详情页
            } catch (error) {
                alert(error.message);
            }
        });

    } else {
        // 创建模式
        const authorInput = form.elements.author;
        if (authorInput) {
            authorInput.value = currentLoggedInUser;
        }

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const newPostData = {
                title: form.elements.title.value,
                author: form.elements.author.value,
                content: form.elements.content.value,
            };
            const API_URL_POST = `${API_BASE_URL}/api/posts`;
            try {
                const response = await fetch(API_URL_POST, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newPostData),
                });
                if (!response.ok) throw new Error('发布失败');
                alert('文章发布成功！');
                window.location.href = 'index.html';
            } catch (error) {
                alert(error.message);
            }
        });
    }
}

/**
 * 为详情页的评论表单添加提交事件
 * @param {HTMLFormElement} form - 评论表单元素
 */
function handleCommentForm(form) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // 阻止页面刷新

        const params = new URLSearchParams(window.location.search);
        const postId = params.get('id');

        // 从表单元素中获取值
        const user = form.elements.commentUser.value;
        const text = form.elements.commentText.value;

        if (!user.trim() || !text.trim()) {
            alert('名字和评论内容都不能为空！');
            return;
        }

        const API_URL = `${API_BASE_URL}/api/posts/${postId}/comments`;
        console.log(`正在为文章 ${postId} 提交评论...`);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, text })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '提交评论失败');
            }

            const newComment = await response.json();
            console.log('评论成功:', newComment);

            // 实时更新UI
            const commentsContainer = document.getElementById('comments-container');
            
            // 如果之前显示"暂无评论"，先把它清掉
            const noCommentP = commentsContainer.querySelector('p');
            if (noCommentP && noCommentP.textContent === '暂无评论。') {
                commentsContainer.innerHTML = '';
            }
            
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <p><strong>${newComment.user}:</strong></p>
                <p>${newComment.text}</p>
            `;
            commentsContainer.appendChild(commentElement);

            // 清空输入框，方便用户继续评论
            form.reset();

        } catch (error) {
            console.error('评论提交失败:', error);
            alert(`评论失败: ${error.message}`);
        }
    });
}

/**
 * 处理删除文章的逻辑
 * @param {number} postId 要删除的文章ID
 */
async function deletePost(postId) {
    if (confirm('你确定要永久删除这篇文章吗？')) {
        const API_URL = `${API_BASE_URL}/api/posts/${postId}`;
        try {
            const response = await fetch(API_URL, { method: 'DELETE' });
            if (response.ok) {
                alert('文章删除成功！');
                window.location.href = 'index.html'; // 删除成功后返回首页
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || '删除失败');
            }
        } catch (error) {
            console.error('删除文章失败:', error);
            alert(`删除失败: ${error.message}`);
        }
    }
} 