const express = require('express');
const path = require('path');
const app = express();

// 设置静态文件目录
app.use(express.static(__dirname));

// 路由处理
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'rhythm_game.html'));
});

// 启动服务器
const port = 3000;
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});
