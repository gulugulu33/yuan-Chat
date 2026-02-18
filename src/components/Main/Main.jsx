import React, { useContext, useEffect } from "react";
import "./Main.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";
import MarkdownRenderer from "../MarkdownRenderer/MarkdownRenderer";

const Main = () => {
  const {
    onSent,
    recentPrompt,
    showResult,
    loading,
    resultData,
    setInput,
    input,
    handleKeyPress,
    openVoiceSearch,
    voiceSearch,
    recordingAnimation,
    messages,
    isGenerating,
    abortGeneration,
    chatContainerRef,
    handleScroll,
    updateSessionMessages
  } = useContext(Context);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    updateSessionMessages(messages, { input: value });
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="main">
      <div className="nav">
        <p>yuanAI</p>
        <img src={assets.user_icon} alt="" />
      </div>
      <div className="main-container">
        {!showResult ? (
          <>
            <div className="greet">
              <p>
                <span>hello, yuan</span>
              </p>
              <p>How can I help you?</p>
            </div>
            <div className="cards">
              <div className="card" onClick={() => onSent("建议一些即将自驾游时可以去的美丽景点")}>
                <p>建议一些即将自驾游时可以去的美丽景点</p>
                <img src={assets.compass_icon} alt="" />
              </div>
              <div className="card" onClick={() => onSent("简要总结一下\"城市规划\"这个概念")}>
                <p>简要总结一下"城市规划"这个概念</p>
                <img src={assets.bulb_icon} alt="" />
              </div>
              <div className="card" onClick={() => onSent("为我们的团队拓展活动集思广益")}>
                <p>为我们的团队拓展活动集思广益</p>
                <img src={assets.message_icon} alt="" />
              </div>
              <div className="card" onClick={() => onSent("提升以下代码的可读性")}>
                <p>提升以下代码的可读性</p>
                <img src={assets.code_icon} alt="" />
              </div>
            </div>
          </>
        ) : (
          <div className="result">
            <div className="chat-messages" ref={chatContainerRef} onScroll={handleScroll}>
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`message-item ${message.role === 'assistant' ? 'ai-message' : 'user-message'}`}
                >
                  <img 
                    src={message.role === 'assistant' ? assets.gemini_icon : assets.user_icon} 
                    alt="" 
                    className="message-avatar"
                  />
                  <div className="message-content">
                    {message.status === 'generating' && !message.content ? (
                      <div className="loader">
                        <hr />
                        <hr />
                        <hr />
                      </div>
                    ) : (
                      <div className="markdown-content">
                        <MarkdownRenderer content={message.content} />
                      </div>
                    )}
                    {message.status === 'aborted' && (
                      <span className="message-status">已中断</span>
                    )}
                    {message.status === 'failed' && (
                      <span className="message-status error">生成失败</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="main-bottom">
          <div className="search-box">
            <input
              onChange={handleInputChange}
              value={input}
              type="text"
              onKeyDown={handleKeyPress}
              placeholder="在这里输入提示"
            />
            <div>
              <img src={assets.gallery_icon} alt="" />
              <img
                src={assets.mic_icon}
                alt="麦克风图标"
                onClick={openVoiceSearch}
                className={`mic-icon ${voiceSearch ? "active" : ""} ${
                  recordingAnimation ? "recording" : ""
                }`}
              />
              {isGenerating ? (
                <img 
                  src={assets.send_icon} 
                  alt="" 
                  onClick={abortGeneration}
                  className="stop-icon"
                  title="停止生成"
                />
              ) : input ? (
                <img onClick={() => onSent()} src={assets.send_icon} alt="" />
              ) : null}
            </div>
          </div>
          <p className="bottom-info">
            yuanAI 可能会显示不准确的信息，请仔细检查其回复。
          </p>
        </div>
      </div>
    </div>
  );
};

export default Main;
