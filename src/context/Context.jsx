import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import streamParser from "../services/streamParser";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

export const Context = createContext();

const ContextProvider = (props) => {
  const [input, setInput] = useState("");
  const [recentPrompt, setRecentPrompt] = useState("");
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState("");
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const virtuosoRef = useRef(null);

  const createNewSession = useCallback(() => {
    const newSession = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      showResult: false,
      resultData: "",
      isGenerating: false,
      input: ""
    };

    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setShowResult(false);
    setResultData("");
    setInput("");
    setLoading(false);
    setIsGenerating(false);
    setIsAtBottom(true);
  }, []);

  const loadSession = useCallback(
    (sessionId) => {
      const session = sessions.find((item) => item.id === sessionId);
      if (!session) {
        return;
      }

      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      setShowResult(session.showResult !== undefined ? session.showResult : session.messages.length > 0);
      setRecentPrompt(session.title);
      setResultData(session.resultData || "");
      setIsGenerating(session.isGenerating || false);
      setInput(session.input || "");
      setIsAtBottom(true);
    },
    [sessions]
  );

  const deleteSession = useCallback(
    (sessionId) => {
      setSessions((prev) => {
        const updatedSessions = prev.filter((session) => session.id !== sessionId);

        if (currentSessionId === sessionId) {
          if (updatedSessions.length > 0) {
            setTimeout(() => loadSession(updatedSessions[0].id), 0);
          } else {
            setTimeout(() => createNewSession(), 0);
          }
        }

        return updatedSessions;
      });
    },
    [createNewSession, currentSessionId, loadSession]
  );

  const updateSessionMessages = useCallback(
    (newMessages, additionalState = {}) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,
                messages: newMessages,
                title:
                  newMessages.find((message) => message.role === "user")?.content?.slice(0, 20) ||
                  "New Chat",
                showResult:
                  additionalState.showResult !== undefined ? additionalState.showResult : session.showResult,
                resultData:
                  additionalState.resultData !== undefined ? additionalState.resultData : session.resultData,
                isGenerating:
                  additionalState.isGenerating !== undefined
                    ? additionalState.isGenerating
                    : session.isGenerating,
                input: additionalState.input !== undefined ? additionalState.input : session.input
              }
            : session
        )
      );
    },
    [currentSessionId]
  );

  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    }
  }, [createNewSession, sessions.length]);

  const scrollToBottom = useCallback(
    (behavior = "auto") => {
      if (!virtuosoRef.current) {
        return;
      }

      virtuosoRef.current.scrollToIndex({
        align: "end",
        behavior,
        index: Math.max(messages.length - 1, 0)
      });
    },
    [messages.length]
  );

  const onSent = useCallback(
    async (prompt) => {
      if (isGenerating) {
        return;
      }

      const messageText = prompt !== undefined ? prompt : input;
      if (!messageText.trim()) {
        return;
      }

      const normalizedText = messageText.trim();
      const userMessage = {
        id: Date.now(),
        role: "user",
        content: normalizedText,
        timestamp: new Date().toLocaleString()
      };

      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      updateSessionMessages(nextMessages, { showResult: true, input: "", isGenerating: true });
      setInput("");
      setShowResult(true);
      setIsGenerating(true);
      setLoading(true);
      setRecentPrompt(normalizedText);
      setIsAtBottom(true);

      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "",
        timestamp: new Date().toLocaleString(),
        status: "generating"
      };

      const messagesWithAI = [...nextMessages, aiMessage];
      setMessages(messagesWithAI);
      updateSessionMessages(messagesWithAI, { showResult: true, input: "", isGenerating: true });

      try {
        const apiMessages = nextMessages.map((message) => ({
          role: message.role,
          content: message.content
        }));

        await streamParser.fetchStream(
          apiMessages,
          (chunk) => {
            let streamedContent = "";
            const updatedMessages = messagesWithAI.map((message) => {
              if (message.id !== aiMessage.id) {
                return message;
              }

              streamedContent = `${message.content}${chunk}`;
              return {
                ...message,
                content: streamedContent
              };
            });

            messagesWithAI.splice(0, messagesWithAI.length, ...updatedMessages);
            setMessages(updatedMessages);
            updateSessionMessages(updatedMessages, { resultData: streamedContent });
          },
          (error) => {
            console.error("Stream error:", error);
            const errorMessages = messagesWithAI.map((message) =>
              message.id === aiMessage.id
                ? {
                    ...message,
                    status: "failed",
                    content: message.content || "生成失败，请重试"
                  }
                : message
            );
            setMessages(errorMessages);
            updateSessionMessages(errorMessages, { isGenerating: false });
            setIsGenerating(false);
            setLoading(false);
          },
          () => {
            let completedContent = "";
            const completedMessages = messagesWithAI.map((message) => {
              if (message.id !== aiMessage.id) {
                return message;
              }

              completedContent = message.content;
              return {
                ...message,
                status: "completed",
                content: message.content
              };
            });

            setMessages(completedMessages);
            updateSessionMessages(completedMessages, {
              resultData: completedContent,
              isGenerating: false
            });
            setIsGenerating(false);
            setLoading(false);
            setResultData(completedContent);
          }
        );
      } catch (error) {
        console.error("Error:", error);
        const errorMessages = messagesWithAI.map((message) =>
          message.id === aiMessage.id
            ? { ...message, status: "failed", content: "生成失败，请重试" }
            : message
        );
        setMessages(errorMessages);
        updateSessionMessages(errorMessages, { isGenerating: false });
        setIsGenerating(false);
        setLoading(false);
      }
    },
    [input, isGenerating, messages, updateSessionMessages]
  );

  const handleVoiceTranscript = useCallback(
    (transcript) => {
      setInput(transcript);
      onSent(transcript);
    },
    [onSent]
  );

  const {
    error: voiceError,
    isSupported: isVoiceSupported,
    status: voiceInputStatus,
    toggle: toggleVoiceInput,
    transcript: voiceTranscript
  } = useSpeechRecognition({ onTranscript: handleVoiceTranscript });

  const abortGeneration = useCallback(() => {
    streamParser.abort();
    setIsGenerating(false);
    setLoading(false);
    const updatedMessages = messages.map((message) =>
      message.status === "generating" ? { ...message, status: "aborted" } : message
    );
    setMessages(updatedMessages);
    updateSessionMessages(updatedMessages, { isGenerating: false });
  }, [messages, updateSessionMessages]);

  const handleKeyPress = useCallback(
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        onSent();
      }
    },
    [onSent]
  );

  const contextValue = useMemo(
    () => ({
      abortGeneration,
      createNewSession,
      currentSessionId,
      deleteSession,
      handleKeyPress,
      input,
      isAtBottom,
      isGenerating,
      isVoiceSupported,
      loadSession,
      loading,
      messages,
      onSent,
      recentPrompt,
      resultData,
      scrollToBottom,
      sessions,
      setInput,
      setIsAtBottom,
      setRecentPrompt,
      showResult,
      toggleVoiceInput,
      updateSessionMessages,
      virtuosoRef,
      voiceError,
      voiceInputStatus,
      voiceTranscript
    }),
    [
      abortGeneration,
      createNewSession,
      currentSessionId,
      deleteSession,
      handleKeyPress,
      input,
      isAtBottom,
      isGenerating,
      isVoiceSupported,
      loadSession,
      loading,
      messages,
      onSent,
      recentPrompt,
      resultData,
      scrollToBottom,
      sessions,
      showResult,
      toggleVoiceInput,
      updateSessionMessages,
      voiceError,
      voiceInputStatus,
      voiceTranscript
    ]
  );

  return <Context.Provider value={contextValue}>{props.children}</Context.Provider>;
};

export default ContextProvider;
