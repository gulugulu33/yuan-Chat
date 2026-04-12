import React, { useContext, useEffect } from "react";
import { Virtuoso } from "react-virtuoso";
import "./Main.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";
import MarkdownRenderer from "../MarkdownRenderer/MarkdownRenderer";

const MessageRow = ({ message }) => (
  <div className={`message-item ${message.role === "assistant" ? "ai-message" : "user-message"}`}>
    <img
      src={message.role === "assistant" ? assets.gemini_icon : assets.user_icon}
      alt=""
      className="message-avatar"
    />
    <div className="message-content">
      {message.status === "generating" && !message.content ? (
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
      {message.status === "aborted" && <span className="message-status">已中断</span>}
      {message.status === "failed" && <span className="message-status error">生成失败</span>}
    </div>
  </div>
);

const Main = () => {
  const {
    abortGeneration,
    handleKeyPress,
    input,
    isAtBottom,
    isGenerating,
    isVoiceSupported,
    messages,
    onSent,
    setInput,
    setIsAtBottom,
    showResult,
    toggleVoiceInput,
    updateSessionMessages,
    virtuosoRef,
    voiceError,
    voiceInputStatus,
    voiceTranscript,
    scrollToBottom
  } = useContext(Context);

  const handleInputChange = (event) => {
    const value = event.target.value;
    setInput(value);
    updateSessionMessages(messages, { input: value });
  };

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    scrollToBottom(isGenerating ? "auto" : "smooth");
  }, [isGenerating, messages.length, scrollToBottom]);

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
              <div className="card" onClick={() => onSent('简要总结一下"城市规划"这个概念')}>
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
            <div className="chat-messages">
              <Virtuoso
                ref={virtuosoRef}
                className="chat-virtuoso"
                data={messages}
                followOutput={isAtBottom ? "auto" : false}
                itemContent={(index, message) => <MessageRow key={message.id || index} message={message} />}
                atBottomStateChange={(bottom) => setIsAtBottom(bottom)}
                overscan={240}
              />
            </div>
          </div>
        )}

        <div className="main-bottom">
          <div className="search-box">
            <input
              onChange={handleInputChange}
              value={voiceInputStatus === "recording" ? voiceTranscript || input : input}
              type="text"
              onKeyDown={handleKeyPress}
              placeholder="在这里输入提示"
            />
            <div className="search-actions">
              <img src={assets.gallery_icon} alt="" />
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`icon-button mic-button mic-${voiceInputStatus}`}
                title={
                  !isVoiceSupported
                    ? "当前浏览器不支持语音输入"
                    : voiceInputStatus === "recording"
                      ? "结束录音"
                      : "开始语音输入"
                }
                disabled={!isVoiceSupported || voiceInputStatus === "processing"}
              >
                <img src={assets.mic_icon} alt="麦克风图标" className="mic-button-icon" />
              </button>
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
          {(voiceInputStatus !== "idle" || voiceError) && (
            <div className="voice-status-bar">
              <span className={`voice-status-chip ${voiceInputStatus}`}>
                {voiceInputStatus === "recording"
                  ? "录音中"
                  : voiceInputStatus === "processing"
                    ? "识别中"
                    : "语音输入"}
              </span>
              <p>{voiceError || (voiceInputStatus === "recording" ? "请开始说话，点击麦克风结束录音。" : "正在处理语音内容…")}</p>
            </div>
          )}
          <p className="bottom-info">yuanAI 可能会显示不准确的信息，请仔细检查其回复。</p>
        </div>
      </div>
    </div>
  );
};

export default Main;
