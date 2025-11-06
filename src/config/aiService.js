// DeepSeek API 服务接入

// 注意：使用时需要替换为你自己的 API Key
const DEEPSEEK_API_KEY = "your_deepseek_api_key_here";
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

// 开发模式：如果API密钥未设置或为空，使用模拟回复
const USE_MOCK_RESPONSE = !DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === "your_deepseek_api_key_here";

/**
 * 生成模拟回复（开发模式使用）
 * @param {string} prompt - 用户输入的提示文本
 * @returns {string} - 模拟的AI回复
 */
function getMockResponse(prompt) {
  const mockResponses = {
    // 常见问题的模拟回复
    "你好": "你好！我是AI助手，很高兴为你提供帮助。请问有什么我可以帮你的吗？",
    "你是谁": "我是一个基于DeepSeek API的AI助手。在实际部署时，你需要配置有效的API密钥才能使用完整功能。",
    "什么是AI": "人工智能（AI）是计算机科学的一个分支，致力于创建能够模拟人类智能行为的系统。这些系统可以学习、推理、解决问题、理解自然语言、感知环境等。\n\n注意：这是一个模拟回复。在生产环境中，你需要配置有效的DeepSeek API密钥来获取更准确的信息。",
    "如何学习编程": "学习编程是一个循序渐进的过程。以下是一些建议：\n\n1. 选择一门入门语言（如Python或JavaScript）\n2. 学习基础概念（变量、条件语句、循环、函数等）\n3. 实践编码，从小项目开始\n4. 参与社区，向他人学习\n5. 不断挑战自己，尝试更复杂的项目\n\n注意：这是一个模拟回复。配置API密钥后可以获得更详细的指导。"
  };

  // 查找匹配的回复
  const lowerPrompt = prompt.toLowerCase();
  for (const [key, value] of Object.entries(mockResponses)) {
    if (lowerPrompt.includes(key)) {
      return value;
    }
  }

  // 默认回复
  return `这是一个模拟回复。你的问题是："${prompt}"\n\n要使用真实的AI回复，请按照以下步骤操作：\n1. 访问 DeepSeek 官网 (https://www.deepseek.com/)\n2. 注册账号并获取 API Key\n3. 打开 src/config/aiService.js 文件\n4. 将 DEEPSEEK_API_KEY 变量替换为你的实际密钥\n5. 重新启动应用`;
}

/**
 * 调用 DeepSeek API 生成回复
 * @param {string} prompt - 用户输入的提示文本
 * @returns {Promise<string>} - AI 生成的回复
 */
async function runChat(prompt) {
  // 开发模式：返回模拟回复
  if (USE_MOCK_RESPONSE) {
    console.log("开发模式：使用模拟回复");
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getMockResponse(prompt);
  }

  // 生产模式：调用真实API
  try {
    console.log("正在调用 DeepSeek API...");
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat", // 可以根据需要更换模型
        messages: [
          {
            role: "system",
            content: "你是一个有用的AI助手，帮助用户回答问题。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`API错误: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("DeepSeek API返回结果:", data);
    
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error("API返回格式错误");
    }
  } catch (error) {
    console.error("DeepSeek API调用失败:", error);
    // 如果API调用失败，返回友好的错误信息
    return `很抱歉，无法连接到AI服务。错误详情: ${error.message}\n\n提示：请检查您的网络连接和API密钥配置。`;
  }
}

export default runChat;