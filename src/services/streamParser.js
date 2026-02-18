class StreamParser {
  constructor() {
    this.sseBuffer = '';
    this.renderBuffer = '';
    this.textDecoder = new TextDecoder('utf-8', { stream: true });
    this.abortController = null;
    this.flushInterval = null;
    this.isFlushing = false;
    this.currentOnChunk = null;
  }

  async fetchStream(messages, onChunk, onError, onComplete) {
    this.abortController = new AbortController();
    this.sseBuffer = '';
    this.renderBuffer = '';
    this.isFlushing = false;
    this.currentOnChunk = onChunk;
    
    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          this.flushAll();
          onComplete();
          this.stopFlush();
          break;
        }

        const chunk = this.textDecoder.decode(value, { stream: true });
        this.sseBuffer += chunk;
        
        const lines = this.sseBuffer.split('\n');
        this.sseBuffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              this.flushAll();
              onComplete();
              this.stopFlush();
              return;
            }

            try {
              const json = JSON.parse(data);
              
              if (json.error) {
                this.stopFlush();
                onError(new Error(json.error));
                return;
              }

              if (json.choices && json.choices.length > 0) {
                const delta = json.choices[0].delta;
                const content = delta?.content || '';
                
                if (content) {
                  this.addToRenderBuffer(content);
                }
              }
            } catch (jsonError) {
              console.error('JSON parse error:', jsonError);
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted');
        this.flushAll();
      } else {
        this.stopFlush();
        onError(error);
      }
    }
  }

  addToRenderBuffer(content) {
    this.renderBuffer += content;
    
    if (!this.isFlushing) {
      this.startFlush();
    }
  }

  startFlush() {
    this.isFlushing = true;
    this.flushInterval = setInterval(() => {
      this.flushChunk();
    }, 50);
  }

  stopFlush() {
    this.isFlushing = false;
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  flushChunk() {
    if (this.renderBuffer.length === 0) {
      return;
    }

    const chunkSize = Math.min(8, this.renderBuffer.length);
    const chunk = this.renderBuffer.substring(0, chunkSize);
    this.renderBuffer = this.renderBuffer.substring(chunkSize);

    if (this.currentOnChunk) {
      this.currentOnChunk(chunk);
    }
  }

  flushAll() {
    while (this.renderBuffer.length > 0) {
      this.flushChunk();
    }
  }

  abort() {
    this.stopFlush();
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  reset() {
    this.stopFlush();
    this.sseBuffer = '';
    this.renderBuffer = '';
    this.textDecoder = new TextDecoder('utf-8', { stream: true });
    this.abortController = null;
    this.isFlushing = false;
    this.currentOnChunk = null;
  }
}

export default new StreamParser();
