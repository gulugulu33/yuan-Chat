# 聊天长列表虚拟化与语音输入实现说明

## 目标

本次实现完成了两个能力：

1. 对聊天记录引入虚拟列表，仅渲染可视区域消息节点，优化长会话场景下的 DOM 数量与渲染压力。
2. 封装语音输入能力，基于 Web Speech API 实现语音转写，并设计 `idle / recording / processing` 三态状态机，处理异常中断与状态切换。

---

## 1. 聊天记录虚拟列表

### 实现方式

- 引入 `react-virtuoso` 作为聊天消息容器。
- 原先 `messages.map(...)` 全量渲染改为 `Virtuoso` 按需渲染。
- 使用 `followOutput` 与 `scrollToIndex` 组合，实现：
  - 用户停留在底部时，流式输出自动跟随滚动。
  - 用户上滑查看历史消息时，不强制抢焦滚动到底部。
- 通过 `overscan` 预渲染少量临近节点，兼顾滚动流畅度与性能。

### 关键收益

- 上百条消息时，页面不再一次性挂载全部消息 DOM。
- 降低 Markdown 渲染和布局计算开销。
- 对流式输出场景更友好，避免长会话下滚动与渲染卡顿。

### 涉及文件

- `src/components/Main/Main.jsx`
- `src/components/Main/Main.css`
- `src/context/Context.jsx`
- `package.json`

---

## 2. 语音输入状态机

### 状态设计

语音输入抽离为独立 Hook：`src/hooks/useSpeechRecognition.js`

状态定义：

- `idle`：空闲状态，可发起录音。
- `recording`：录音中，持续接收中间识别结果。
- `processing`：录音结束，浏览器正在产出最终识别文本。

### 状态流转

#### 正常流程

`idle -> recording -> processing -> idle`

#### 异常流程

- 浏览器不支持语音识别：停留在 `idle`，提示不支持。
- 麦克风权限拒绝：回到 `idle`，显示权限错误。
- 无语音输入 / 网络异常 / 服务中断：回到 `idle`，显示对应错误。
- 录音过程中异常结束：识别为中断，回到 `idle`。

### 交互策略

- 点击麦克风按钮：
  - `idle` 时开始录音。
  - `recording` 时结束录音，进入 `processing`。
- `processing` 阶段禁用再次点击，避免状态竞争。
- 支持展示实时转写中的中间文本，增强反馈感。
- 最终识别文本生成后，自动填入并直接发送消息。

### 错误处理

对以下错误做了统一映射：

- `audio-capture`
- `network`
- `no-speech`
- `not-allowed`
- `service-not-allowed`
- 其他未识别错误

统一输出中文提示，便于直接反馈到 UI。

### 涉及文件

- `src/hooks/useSpeechRecognition.js`
- `src/context/Context.jsx`
- `src/components/Main/Main.jsx`
- `src/components/Main/Main.css`

---

## 3. 上下文与会话联动

### 本次同步优化

为了让新功能与现有会话体系协同工作，同时做了以下调整：

- 将虚拟列表引用与是否位于底部状态放入全局上下文。
- 输入框变更后仍会同步回当前会话，保证切换会话后草稿可恢复。
- 流式消息生成时，持续更新当前会话消息内容。
- 中断生成时，消息状态更新为 `aborted`，并同步到会话记录。

---

## 4. 验证结果

### 已完成

- 依赖安装完成：`react-virtuoso`
- 生产构建通过：`npm run build`

### 说明

- `npm run lint` 当前无法执行成功，原因是仓库本身没有 ESLint 配置文件；并非本次改动引入的代码错误。

---

## 5. 后续建议

如果后续还要继续优化聊天体验，建议优先考虑：

1. 对 Markdown 渲染做消息级 memo，降低流式更新时的重复渲染。
2. 将消息行组件拆分为独立文件，并配合 `React.memo` 进一步减少刷新范围。
3. 为语音输入补充浏览器兼容提示，例如 Safari / Chromium 的差异说明。
4. 对超长代码块或表格消息增加懒加载策略，进一步优化极端场景性能。

---

## 6. 本次交付清单

- [x] 聊天消息虚拟列表
- [x] 长会话滚动跟随优化
- [x] Web Speech API 语音转写能力
- [x] `idle / recording / processing` 状态机
- [x] 语音异常中断与错误提示处理
- [x] 实现说明文档
