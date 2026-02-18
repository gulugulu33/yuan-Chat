import { createContext, useState, useEffect, useRef, useCallback } from "react";
import streamParser from "../services/streamParser";

export const Context = createContext();

const ContextProvider = (props) => {
  const [input, setInput] = useState("");
  const [recentPrompt, setRecentPrompt] = useState('');
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState('');
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [recordingAnimation, setRecordingAnimation] = useState(false);
  
  const chatContainerRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  const createNewSession = useCallback(() => {
    const newSession = {
      id: Date.now(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      showResult: false,
      resultData: '',
      isGenerating: false,
      input: ''
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setShowResult(false);
    setResultData("");
    setInput("");
    setLoading(false);
    setIsGenerating(false);
  }, []);

  const loadSession = useCallback((sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      setShowResult(session.showResult !== undefined ? session.showResult : session.messages.length > 0);
      setRecentPrompt(session.title);
      setResultData(session.resultData || '');
      setIsGenerating(session.isGenerating || false);
      setInput(session.input || '');
    }
  }, [sessions]);

  const deleteSession = useCallback((sessionId) => {
    setSessions(prev => {
      const updatedSessions = prev.filter(s => s.id !== sessionId);
      
      if (currentSessionId === sessionId) {
        if (updatedSessions.length > 0) {
          setTimeout(() => loadSession(updatedSessions[0].id), 0);
        } else {
          setTimeout(() => createNewSession(), 0);
        }
      }
      
      return updatedSessions;
    });
  }, [currentSessionId, loadSession, createNewSession]);

  const updateSessionMessages = useCallback((newMessages, additionalState = {}) => {
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? { 
            ...session, 
            messages: newMessages, 
            title: newMessages.find(m => m.role === 'user')?.content?.slice(0, 20) || 'New Chat',
            showResult: additionalState.showResult !== undefined ? additionalState.showResult : session.showResult,
            resultData: additionalState.resultData !== undefined ? additionalState.resultData : session.resultData,
            isGenerating: additionalState.isGenerating !== undefined ? additionalState.isGenerating : session.isGenerating,
            input: additionalState.input !== undefined ? additionalState.input : session.input
          }
        : session
    ));
  }, [currentSessionId]);

  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    }
  }, [sessions.length, createNewSession]);

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

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    updateSessionMessages(newMessages, { showResult: true, isGenerating: true, input: '' });
    setInput("");
    setShowResult(true);
    setIsGenerating(true);
    setRecentPrompt(messageText);

    const aiMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleString(),
      status: 'generating'
    };

    const messagesWithAI = [...newMessages, aiMessage];
    setMessages(messagesWithAI);

    try {
      const apiMessages = newMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      apiMessages.push({ role: 'user', content: messageText });

      let fullContent = '';
      
      await streamParser.fetchStream(
        apiMessages,
        (chunk) => {
          fullContent += chunk;
          const updatedMessages = messagesWithAI.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, content: fullContent }
              : msg
          );
          setMessages(updatedMessages);
          updateSessionMessages(updatedMessages, { resultData: fullContent });
          scrollToBottom();
        },
        (error) => {
          console.error('Stream error:', error);
          const errorMessages = messagesWithAI.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, status: 'failed', content: fullContent || '生成失败，请重试' }
              : msg
          );
          setMessages(errorMessages);
          updateSessionMessages(errorMessages, { isGenerating: false });
          setIsGenerating(false);
        },
        () => {
          const completedMessages = messagesWithAI.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, status: 'completed', content: fullContent }
              : msg
          );
          setMessages(completedMessages);
          updateSessionMessages(completedMessages, { resultData: fullContent, isGenerating: false });
          setIsGenerating(false);
          setResultData(fullContent);
        }
      );
    } catch (error) {
      console.error('Error:', error);
      const errorMessages = messagesWithAI.map(msg => 
        msg.id === aiMessage.id 
          ? { ...msg, status: 'failed', content: '生成失败，请重试' }
          : msg
      );
      setMessages(errorMessages);
      updateSessionMessages(errorMessages, { isGenerating: false });
      setIsGenerating(false);
    }
  };

  const abortGeneration = () => {
    streamParser.abort();
    setIsGenerating(false);
    const updatedMessages = messages.map(msg => 
      msg.status === 'generating' 
        ? { ...msg, status: 'aborted' }
        : msg
    );
    setMessages(updatedMessages);
    updateSessionMessages(updatedMessages, { isGenerating: false });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSent();
    }
  };

  const contextValue = {
    sessions,
    currentSessionId,
    createNewSession,
    loadSession,
    deleteSession,
    onSent,
    setRecentPrompt,
    recentPrompt,
    showResult,
    loading,
    resultData,
    input,
    setInput,
    handleKeyPress,
    voiceSearch,
    openVoiceSearch,
    recordingAnimation,
    setRecordingAnimation,
    messages,
    isGenerating,
    abortGeneration,
    chatContainerRef,
    handleScroll,
    updateSessionMessages
  };

  return (
    <Context.Provider value={contextValue}>
      {props.children}
    </Context.Provider>
  );
};

export default ContextProvider;