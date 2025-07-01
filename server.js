// 导入 http 模块来创建服务器
import { createServer } from 'http';
// 导入项目最核心的 Bare Server 创建函数
import { createBareServer } from '@mercuryworkshop/bare-mux';
// 导入 path 模块来处理文件路径
import { join } from 'path';
// 导入 serve-static 模块来提供静态文件服务
import serveStatic from 'serve-static';

// 获取当前文件所在的目录
// 在 ES Module 中，__dirname 是不可用的，所以我们用这种方式获取
import { fileURLToPath } from 'url';
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// 创建 Bare Server 实例，并指定 API 路由前缀为 /bare/
// 这是 Ultraviolet 代理的核心
const bare = createBareServer('/bare/');

// 创建一个静态文件服务，它会去 'dist' 目录里找文件
// 'dist' 目录是在构建步骤中生成的
const serve = serveStatic(join(__dirname, 'dist/'));

// 创建一个标准的 HTTP 服务器
const httpServer = createServer();

// 监听 'request' 事件 (处理普通 HTTP 请求)
httpServer.on('request', (req, res) => {
  // 如果请求是 Bare Server 的 API 请求，就交给 Bare Server 处理
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    // 否则，就把它当作是静态文件请求（比如 index.html, uv.bundle.js 等）
    // 交给 serve-static 处理
    serve(req, res, (err) => {
      // 如果 serve-static 找不到文件，就返回 404
      res.writeHead(err?.statusCode || 404, { 'Content-Type': 'text/plain' });
      res.end(err?.message);
    });
  }
});

// 监听 'upgrade' 事件 (处理 WebSocket 连接)
httpServer.on('upgrade', (req, socket, head) => {
  // 如果是 Bare Server 的 WebSocket 请求，就交给它处理
  if (bare.shouldRoute(req)) {
    bare.routeUpgrade(req, socket, head);
  } else {
    // 否则，直接关闭连接
    socket.destroy();
  }
});

// 这是关键！从 Render 的环境变量中获取端口，如果不存在则默认为 8080
const port = parseInt(process.env.PORT || 8080);

// 让我们的服务器监听这个端口
httpServer.listen(port, () => {
  console.log(`MyCatDog is running on http://localhost:${port}`);
});