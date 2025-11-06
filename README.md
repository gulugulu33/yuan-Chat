# yuan-AIChat

一个基于React构建的现代化AI聊天应用，支持DeepSeek API接入，提供流畅的聊天体验。

## 功能特点

- ✨ 简洁美观的用户界面
- 💬 实时AI对话功能
- 🎙️ 语音输入支持
- 🔄 开发模式下的模拟回复系统
- 📱 响应式设计，适配各种设备

## 技术栈

- **前端框架**: React 18.2.0
- **构建工具**: Vite 5.2.8
- **AI集成**: DeepSeek API
- **样式**: 自定义CSS

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

### 3. 运行开发服务器

```bash
npm run dev
```

应用将在 http://localhost:5173/ 启动。

### 4. 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist` 目录中。

## AI服务配置

### 开发模式（默认）

默认情况下，应用使用模拟回复系统，无需配置API密钥即可运行测试。模拟回复包含常见问题的预设答案。

### 生产模式（使用真实AI）

要使用真实的DeepSeek AI服务，请按照以下步骤配置：

1. 访问 [DeepSeek官网](https://www.deepseek.com/) 注册账号并获取API Key
2. 打开 `src/config/aiService.js` 文件
3. 将 `DEEPSEEK_API_KEY` 变量替换为你的实际密钥

```javascript
// 修改前
const DEEPSEEK_API_KEY = "your_deepseek_api_key_here";

// 修改后
const DEEPSEEK_API_KEY = "your_actual_api_key";
```

4. 重新启动应用

## 项目结构

```
yuan-AIChat/
├── public/              # 静态资源
├── src/
│   ├── assets/          # 图片和图标等资源
│   ├── components/      # 组件
│   │   ├── Main/        # 主界面组件
│   │   └── SideBar/     # 侧边栏组件
│   ├── config/          # 配置文件
│   │   ├── aiService.js # AI服务配置
│   │   └── gemini.js    # 原始Gemini配置（已替换）
│   ├── context/         # React Context
│   │   └── Context.jsx  # 全局状态管理
│   ├── App.jsx          # 应用入口组件
│   ├── index.css        # 全局样式
│   └── main.jsx         # 应用入口文件
├── index.html           # HTML模板
├── package.json         # 项目配置
└── vite.config.js       # Vite配置
```

## 使用说明

### 基本聊天

1. 在输入框中输入问题或指令
2. 按回车键或点击发送按钮
3. 等待AI回复（开发模式下约1秒延迟）

### 语音输入

1. 点击麦克风图标
2. 开始说话
3. 语音识别完成后，系统会自动发送并获取回复

## 常见问题

### 如何添加更多模拟回复？

编辑 `src/config/aiService.js` 文件中的 `mockResponses` 对象，添加更多问答对：

```javascript
const mockResponses = {
  "你的问题": "对应的回复内容",
  // 添加更多问答对...
};
```

### 如何修改AI模型参数？

在 `src/config/aiService.js` 文件中，可以调整以下参数：

```javascript
body: JSON.stringify({
  model: "deepseek-chat", // 模型名称
  messages: [...],
  temperature: 0.7,       // 创造性控制（0-1）
  max_tokens: 2000        // 最大回复长度
})
```

## 许可证

本项目采用MIT许可证。

## 贡献

欢迎提交Issue和Pull Request！