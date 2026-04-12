import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const VOICE_STATES = {
  IDLE: "idle",
  RECORDING: "recording",
  PROCESSING: "processing"
};

const ERROR_MESSAGES = {
  "audio-capture": "无法访问麦克风，请检查设备权限。",
  "network": "语音识别网络异常，请稍后重试。",
  "no-speech": "没有检测到语音，请再试一次。",
  "not-allowed": "麦克风权限被拒绝，请在浏览器中开启后重试。",
  "service-not-allowed": "当前环境不允许使用语音识别服务。"
};

const getSpeechRecognition = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const useSpeechRecognition = ({ onTranscript }) => {
  const recognitionRef = useRef(null);
  const statusBeforeEndRef = useRef(VOICE_STATES.IDLE);
  const finalTranscriptRef = useRef("");
  const abortRequestedRef = useRef(false);

  const [status, setStatus] = useState(VOICE_STATES.IDLE);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  const isSupported = useMemo(() => Boolean(getSpeechRecognition()), []);

  const resetState = useCallback(() => {
    finalTranscriptRef.current = "";
    setTranscript("");
    setError("");
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current || status === VOICE_STATES.IDLE) {
      return;
    }

    abortRequestedRef.current = true;
    statusBeforeEndRef.current = VOICE_STATES.PROCESSING;
    setStatus(VOICE_STATES.PROCESSING);
    recognitionRef.current.stop();
  }, [status]);

  const start = useCallback(() => {
    if (!isSupported) {
      setError("当前浏览器不支持语音输入。");
      return;
    }

    if (!recognitionRef.current || status !== VOICE_STATES.IDLE) {
      return;
    }

    resetState();
    abortRequestedRef.current = false;
    statusBeforeEndRef.current = VOICE_STATES.RECORDING;
    setStatus(VOICE_STATES.RECORDING);
    recognitionRef.current.start();
  }, [isSupported, resetState, status]);

  const toggle = useCallback(() => {
    if (status === VOICE_STATES.RECORDING) {
      stop();
      return;
    }

    if (status === VOICE_STATES.IDLE) {
      start();
    }
  }, [start, status, stop]);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let nextFinalTranscript = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript || "";

        if (result.isFinal) {
          nextFinalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      finalTranscriptRef.current = nextFinalTranscript;
      setTranscript(`${nextFinalTranscript}${interimTranscript}`.trim());
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" && abortRequestedRef.current) {
        return;
      }

      const nextError = ERROR_MESSAGES[event.error] || "语音识别被中断，请稍后重试。";
      setError(nextError);
      statusBeforeEndRef.current = VOICE_STATES.IDLE;
      setStatus(VOICE_STATES.IDLE);
    };

    recognition.onend = () => {
      const transcriptText = finalTranscriptRef.current.trim();
      const previousStatus = statusBeforeEndRef.current;
      abortRequestedRef.current = false;

      if (previousStatus === VOICE_STATES.RECORDING) {
        setError("录音已中断，请重新开始。");
        setStatus(VOICE_STATES.IDLE);
        return;
      }

      if (previousStatus === VOICE_STATES.PROCESSING) {
        if (transcriptText) {
          onTranscript(transcriptText);
          resetState();
        } else {
          setError("未识别到有效语音内容。");
        }
      }

      statusBeforeEndRef.current = VOICE_STATES.IDLE;
      setStatus(VOICE_STATES.IDLE);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [onTranscript, resetState]);

  return {
    error,
    isSupported,
    start,
    status,
    stop,
    toggle,
    transcript
  };
};

export { VOICE_STATES };
