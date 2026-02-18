import { createContext, useState, useEffect, useRef } from "react";
import streamParser from "../services/streamParser";

export const Context = createContext();

const ContextProvider = (props) => {
  const [input, setInput] = useState("");
  const [recentPrompt, setRecentPrompt] = useState('');
  const [prevPrompt, setPrevprompt] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: '你好！我是你的AI助手，有什么可以帮助你的吗？',
      timestamp: new Date().toLocaleString()
    }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [recordingAnimation, setRecordingAnimation] = useState(false);
  
  const chatContainerRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current && !isUserScrollingRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      isUserScrollingRef.current = !isAtBottom;
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 1000);
    }
  };

  useEffect(() => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceSearch(false);
      setInput(transcript);
      onSent(transcript);
      setInput("");
      setRecordingAnimation(false);
    };

    recognition.onend = () => {
      setVoiceSearch(false);
      setRecordingAnimation(false);
    };

    setRecognition(recognition);
  }, []);

  const openVoiceSearch = () => {
    if (!voiceSearch) {
      recognition.start();
      setVoiceSearch(true);
      setRecordingAnimation(true);
    }
  };

  const newChat = () => {
    setLoading(false);
    setShowResult(false);
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        content: '你好！我是你的AI助手，有什么可以帮助你的吗？',
        timestamp: new Date().toLocaleString()
      }
    ]);
    setResultData("");
  };

  const onSent = async (prompt) => {
    if (isGenerating) return;

    const messageText = prompt !== undefined ? prompt : input;
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toLocaleString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setShowResult(true);
    setIsGenerating(true);
    setRecentPrompt(messageText);

    if (prompt === undefined) {
      setPrevprompt(prev => [...prev, messageText]);
    }

    const aiMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleString(),
      status: 'generating'
    };

    setMessages(prev => [...prev, aiMessage]);

    try {
      const apiMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      apiMessages.push({ role: 'user', content: messageText });

      let fullContent = '';
      
      await streamParser.fetchStream(
        apiMessages,
        (chunk) => {
          fullContent += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, content: fullContent }
              : msg
          ));
          scrollToBottom();
        },
        (error) => {
          console.error('Stream error:', error);
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, status: 'failed', content: fullContent || '生成失败，请重试' }
              : msg
          ));
          setIsGenerating(false);
        },
        () => {
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, status: 'completed', content: fullContent }
              : msg
          ));
          setIsGenerating(false);
          setResultData(fullContent);
        }
      );
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessage.id 
          ? { ...msg, status: 'failed', content: '生成失败，请重试' }
          : msg
      ));
      setIsGenerating(false);
    }
  };

  const abortGeneration = () => {
    streamParser.abort();
    setIsGenerating(false);
    setMessages(prev => prev.map(msg => 
      msg.status === 'generating' 
        ? { ...msg, status: 'aborted' }
        : msg
    ));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSent();
    }
  };

  const contextValue = {
    prevPrompt,
    setPrevprompt,
    onSent,
    setRecentPrompt,
    recentPrompt,
    showResult,
    loading,
    resultData,
    input,
    setInput,
    newChat,
    handleKeyPress,
    voiceSearch,
    openVoiceSearch,
    recordingAnimation,
    setRecordingAnimation,
    messages,
    isGenerating,
    abortGeneration,
    chatContainerRef,
    handleScroll
  };

  return (
    <Context.Provider value={contextValue}>
      {props.children}
    </Context.Provider>
  );
};

export default ContextProvider;