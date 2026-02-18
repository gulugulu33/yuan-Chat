import http from 'http';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.XUNFEI_API_KEY;
const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }
  
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk;
    });
    
    req.on('end', () => {
      try {
        const requestData = JSON.parse(body);
        const { messages } = requestData;
        
        console.log('收到请求:', messages);
        handleStreamRequest(messages, res);
      } catch (error) {
        console.error('解析请求体错误:', error);
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: '请求格式错误' }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', message: 'AI Chat API is running' }));
  } else {
    res.statusCode = 404;
    res.end();
  }
});

function handleStreamRequest(messages, res) {
  const requestBody = {
    model: 'xop3qwen1b7',
    messages: messages,
    max_tokens: 4000,
    temperature: 0.7,
    stream: true
  };
  
  const options = {
    hostname: 'maas-api.cn-huabei-1.xf-yun.com',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'User-Agent': 'Node.js-Client',
      'Accept': '*/*'
    }
  };
  
  console.log('发送到MaaS的请求体:', JSON.stringify(requestBody, null, 2));
  
  const maasReq = https.request(options, (maasRes) => {
    console.log('MaaS API 响应状态码:', maasRes.statusCode);
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    
    maasRes.pipe(res);
    
    maasRes.on('end', () => {
      console.log('响应结束');
    });
  });
  
  maasReq.on('error', (error) => {
    console.error('请求错误:', error);
    
    res.write(`data: {"error": "流式请求失败：${error.message}"} \n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  });
  
  maasReq.on('timeout', () => {
    console.error('请求超时');
    maasReq.destroy();
    
    res.write(`data: {"error": "请求超时"} \n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  });
  
  maasReq.write(JSON.stringify(requestBody));
  maasReq.end();
  
  console.log('请求已发送');
}

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
