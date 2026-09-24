import { useCallback, useEffect, useMemo, useState } from "react";

const useSpeechSynthesis = () => {
  const [error, setError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isSupported = useMemo(() => "speechSynthesis" in window, []);

  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  const speak = useCallback((text) => {
    if (!isSupported) {
      setError("Text-to-speech is not supported in this browser");
      return;
    }

    if (!text?.trim()) {
      setError("No question text to read");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setError("");
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setError("Could not read the question aloud");
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const toggle = useCallback((text) => {
    if (isSpeaking) {
      stop();
      return;
    }

    speak(text);
  }, [isSpeaking, speak, stop]);

  return {
    error,
    isSpeaking,
    isSupported,
    speak,
    stop,
    toggle,
  };
};

export default useSpeechSynthesis;
