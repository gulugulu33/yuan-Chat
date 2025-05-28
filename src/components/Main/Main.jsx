import React, { useContext } from "react";
import "./Main.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";

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
    recordingAnimation
  } = useContext(Context);

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
              <div className="card">
                <p>建议一些即将自驾游时可以去的美丽景点</p>
                <img src={assets.compass_icon} alt="" />
              </div>
              <div className="card">
                <p>简要总结一下“城市规划”这个概念</p>
                <img src={assets.bulb_icon} alt="" />
              </div>
              <div className="card">
                <p>为我们的团队拓展活动集思广益</p>
                <img src={assets.message_icon} alt="" />
              </div>
              <div className="card">
                <p>提升以下代码的可读性</p>
                <img src={assets.code_icon} alt="" />
              </div>
            </div>
          </>
        ) : (
          <div className="result">
            <div className="result-title">
              <img src={assets.user_icon} alt="" />
              <p>{recentPrompt}</p>
            </div>
            <div className="result-data">
              <img src={assets.gemini_icon} alt="" />
              {loading ? (
                <div className="loader">
                  <hr />
                  <hr />
                  <hr />
                </div>
              ) : (
                <p dangerouslySetInnerHTML={{ __html: resultData }}></p>
              )}
            </div>
          </div>
        )}

        <div className="main-bottom">
          <div className="search-box">
            <input
              onChange={(e) => setInput(e.target.value)}
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
              {input ? (
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
