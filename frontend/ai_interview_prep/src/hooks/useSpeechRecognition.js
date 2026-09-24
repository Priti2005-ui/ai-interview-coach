import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const getSpeechRecognition = () =>
  window.SpeechRecognition || window.webkitSpeechRecognition;

const getSpeechErrorMessage = (error) => {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Microphone permission was blocked. Allow microphone access in your browser settings, then try Start Voice again.";
  }

  if (error === "audio-capture") {
    return "No microphone was found. Connect or enable a microphone, then try again.";
  }

  if (error === "network") {
    return "Speech recognition needs a working browser speech service. Check your connection and try again.";
  }

  if (error === "no-speech") {
    return "No speech was detected. Try speaking closer to the microphone.";
  }

  return error || "Speech recognition failed";
};

const useSpeechRecognition = () => {
  const recognitionRef = useRef(null);
  const startedAtRef = useRef(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const isSupported = useMemo(() => Boolean(getSpeechRecognition()), []);

  useEffect(() => {
    if (!isSupported) return undefined;

    const SpeechRecognition = getSpeechRecognition();
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let nextTranscript = "";

      for (let index = 0; index < event.results.length; index += 1) {
        nextTranscript += event.results[index][0].transcript;
      }

      if (nextTranscript.trim()) {
        setTranscript(nextTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      setError(getSpeechErrorMessage(event.error));
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [isSupported]);

  useEffect(() => {
    if (!isListening) return undefined;

    const timer = setInterval(() => {
      if (!startedAtRef.current) return;

      setDurationSeconds(
        Math.floor((Date.now() - startedAtRef.current) / 1000)
      );
    }, 500);

    return () => clearInterval(timer);
  }, [isListening]);

  const startListening = useCallback(() => {
    if (isListening) return;

    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser");
      return;
    }

    setError("");
    startedAtRef.current = Date.now();
    setDurationSeconds(0);

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setError("Could not start voice input. Please try again.");
      startedAtRef.current = null;
      setIsListening(false);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    startedAtRef.current = null;
    setDurationSeconds(0);
    setIsListening(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setError("");
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }

    startListening();
  }, [isListening, startListening, stopListening]);

  return {
    error,
    clearTranscript,
    durationSeconds,
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
    toggleListening,
  };
};

export default useSpeechRecognition;
