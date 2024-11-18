const express = require('express');
const path = require('path');
const app = express();
const port = 3200;

// 设置静态文件目录
app.use(express.static('src'));

// 设置路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// 启动服务器
app.listen(port, () => {
    console.log(`Rhythm Game running at http://localhost:${port}`);
}); 