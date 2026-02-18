# yuan-Chat

一个基于 React + Node.js 构建的现代化 AI 对话应用，采用流式输出技术，提供流畅的实时对话体验。

## 功能特点

- ✨ 简洁美观的用户界面
- 💬 实时 AI 对话功能
- 🌊 流式输出（Streaming Response）- 逐字显示 AI 回复
- ⏸️ 支持中断生成
- 🎙️ 语音输入支持
- 📜 智能滚动 - 用户查看历史时自动暂停滚动
- 🎯 预设问题卡片 - 快速开始对话
- 📱 响应式设计，适配各种设备

## 技术栈

### 前端
- **框架**: React 18.2.0
- **构建工具**: Vite 5.2.8
- **状态管理**: React Context API
- **样式**: 自定义 CSS

### 后端
- **运行时**: Node.js
- **HTTP 服务器**: 原生 http/https 模块
- **AI 服务**: 讯飞星火 MaaS API

## 核心技术方案

本项目按照[流式对话渲染模块设计](https://www.yuque.com/guluguluwater-qkq0t/otcxaz/pihgy9hz1r2tpfth)文档实现，采用三层架构：

### 1. 流式解析层
- 使用 `fetch + ReadableStream` 接收流式数据
- 使用 `TextDecoder('utf-8', { stream: true })` 进行增量解码
- 双缓冲区设计：SSE 解析缓冲区 + 渲染缓冲区
- 节奏控制机制：每 50ms 从缓冲区 flush 8 个字符
- 支持 AbortController 随时中断生成

### 2. 消息状态管理层
- 管理消息列表状态
- 支持生成状态管理（generating/completed/aborted/failed）
- 智能滚动策略：用户滚动时暂停自动滚动，1 秒后恢复
- 作为唯一事实来源

### 3. 渲染与交互层
- 消息内容展示
- 自动滚动策略
- 输入框与中断按钮交互
- 不感知流式细节，只消费已节奏化处理的文本增量

### 数据流路径

```
用户输入 → 前端 POST 请求 → 后端转发到讯飞星火 API → 流式返回（SSE）
→ 后端 pipe 转发 → 前端 ReadableStream → TextDecoder 增量解码
→ SSE 数据帧解析 → 写入 renderBuffer → 定时 flush（50ms 间隔）
→ 更新消息状态 → 触发视图更新 → 智能滚动 → 用户看到流式输出
```

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/gulugulu33/yuan-Chat.git
cd yuan-Chat
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
XUNFEI_API_KEY=your_xunfei_api_key_here
PORT=3001
```

获取讯飞星火 API Key：
1. 访问 [讯飞开放平台](https://www.xfyun.cn/)
2. 注册账号并创建应用
3. 获取 API Key

### 4. 启动后端服务器

```bash
npm run server
```

后端服务器将在 http://localhost:3001 启动。

### 5. 启动前端开发服务器

```bash
npm run dev
```

前端应用将在 http://localhost:5173/ 启动。

### 6. 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist` 目录中。

## 项目结构

```
yuan-Chat/
├── public/                    # 静态资源
├── src/
│   ├── assets/               # 图片和图标等资源
│   │   ├── assets.js        # 资源导出
│   │   └── *.png           # 图标文件
│   ├── components/           # React 组件
│   │   ├── Main/           # 主界面组件
│   │   │   ├── Main.jsx    # 主界面逻辑
│   │   │   └── Main.css    # 主界面样式
│   │   └── SideBar/       # 侧边栏组件
│   ├── services/           # 服务层
│   │   └── streamParser.js # 流式解析器
│   ├── context/            # React Context
│   │   └── Context.jsx     # 全局状态管理
│   ├── App.jsx            # 应用入口组件
│   ├── index.css          # 全局样式
│   └── main.jsx           # 应用入口文件
├── server.js             # Node.js 后端服务器
├── .env                 # 环境变量配置
├── index.html            # HTML 模板
├── package.json          # 项目配置
└── vite.config.js        # Vite 配置
```

## 使用说明

### 基本聊天

1. 在输入框中输入问题或指令
2. 按回车键或点击发送按钮
3. AI 回复会以流式方式逐字显示

### 使用预设问题

点击首页的预设问题卡片，快速开始对话：
- 建议一些即将自驾游时可以去的美丽景点
- 简要总结一下"城市规划"这个概念
- 为我们的团队拓展活动集思广益
- 提升以下代码的可读性

### 中断生成

在 AI 生成回复时，点击发送按钮（变为停止图标）即可中断生成。

### 语音输入

1. 点击麦克风图标
2. 开始说话
3. 语音识别完成后，系统会自动发送并获取回复

### 智能滚动

- 默认情况下，对话会自动滚动到底部
- 当你向上滚动查看历史消息时，自动滚动会暂停
- 1 秒后恢复自动滚动

## 核心设计原则

### 1. 逐 token 可感知渲染
- 通过节奏控制，用户看到"正在逐步输出"的效果
- 避免网络抖动导致的跳变式刷新

### 2. 渲染节奏可控
- 数据接收节奏：网络和模型输出（不可控）
- 渲染节奏：每 50ms 固定间隔（可控）
- 两者完全解耦

### 3. 中断优先级最高
- 用户随时可以点击停止按钮
- AbortController 立即中断 fetch 请求
- flush 所有剩余内容后停止

### 4. 滚动跟随优化
- 仅当用户未主动离开底部时，才启用自动滚动
- 通过滚动距离阈值判断（< 100px）
- 在 flush 阶段触发滚动，降低频率

## 技术细节

### 为什么使用 fetch + ReadableStream 而不是 WebSocket？

- 数据流是单向的（服务端 → 前端），符合模型生成的业务特性
- 无需维护复杂的连接状态，部署与调试成本更低
- 与现有 HTTP/网关体系兼容性更好
- ReadableStream 提供对字节级流的精细化控制

### 为什么必须使用 TextDecoder？

- 一个字符（尤其是中文）可能被拆分到多个 chunk 中
- 直接拼接字节或一次性 decode 会出现乱码
- `{ stream: true }` 确保跨 chunk 字符正确还原

### 为什么需要节奏控制？

- 避免渲染频率直接受网络和模型输出节奏影响
- 提供稳定的视觉体验
- 降低滚动和重绘频率，提升性能

## API 接口

### POST /api/chat

请求体：
```json
{
  "messages": [
    {
      "role": "user",
      "content": "你好"
    }
  ]
}
```

响应：SSE 流式响应

```
data: {"choices":[{"delta":{"content":"你"}}]}

data: {"choices":[{"delta":{"content":"好"}}]}

data: [DONE]
```

## 开发说明

### 修改流式输出节奏

编辑 `src/services/streamParser.js`：

```javascript
// 修改 flush 间隔（默认 50ms）
this.flushInterval = setInterval(() => {
  this.flushChunk();
}, 50);

// 修改每次 flush 的字符数（默认 8 个字符）
const chunkSize = Math.min(8, this.renderBuffer.length);
```

### 修改滚动阈值

编辑 `src/context/Context.jsx`：

```javascript
// 修改滚动距离阈值（默认 100px）
const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
```

### 修改 AI 模型参数

编辑 `server.js`：

```javascript
const requestBody = {
  model: 'xop3qwen1b7',
  messages: messages,
  max_tokens: 4000,
  temperature: 0.7,
  stream: true
};
```

## 常见问题

### 如何更换 AI 服务提供商？

修改 `server.js` 中的 API 配置：

```javascript
const options = {
  hostname: 'your-api-host.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`
  }
};
```

### 如何调整流式输出速度？

在 `src/services/streamParser.js` 中调整：
- `flushInterval` 的间隔时间
- `chunkSize` 的大小

### 如何添加更多预设问题？

编辑 `src/components/Main/Main.jsx` 中的卡片内容：

```javascript
<div className="card" onClick={() => onSent("你的问题")}>
  <p>你的问题</p>
  <img src={assets.icon} alt="" />
</div>
```

## 许可证

本项目采用 MIT 许可证。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 技术参考

- [流式对话渲染模块设计](https://www.yuque.com/guluguluwater-qkq0t/otcxaz/pihgy9hz1r2tpfth)
- [讯飞星火 MaaS API](https://www.xfyun.cn/)
- [ReadableStream API](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
