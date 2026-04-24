import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

function AskBox({ onResult }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceStarting, setVoiceStarting] = useState(false);
  const recognitionRef = useRef(null);
  const baseQuestionRef = useRef("");
  const finalTranscriptRef = useRef("");
  const speechErrorRef = useRef(false);

  const getSpeechRecognition = () =>
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const joinTranscript = (...parts) =>
    parts
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ");

  const MicIcon = () => (
    <svg
      aria-hidden="true"
      className="mic-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v3" />
    </svg>
  );

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleAsk = async () => {
    if (!question.trim()) {
      setMessage("Please enter a question.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await axios.post(
        "http://127.0.0.1:5000/ask-question",
        {
          question: question,
        }
      );

      console.log("Backend response:", response.data);
      onResult(response.data);
    } catch (error) {
      console.error("Ask question error:", error);
      setMessage("Failed to get result from backend.");
      onResult({
        error: "Failed to connect to backend.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearQuestion = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setQuestion("");
    setListening(false);
    setVoiceStarting(false);
    setMessage("");
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      setMessage("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if ((listening || voiceStarting) && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      setVoiceStarting(false);
      setMessage("");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    baseQuestionRef.current = question;
    finalTranscriptRef.current = "";
    speechErrorRef.current = false;
    setVoiceStarting(true);
    setMessage("Preparing microphone...");

    recognition.onstart = () => {
      setVoiceStarting(false);
      setListening(true);
      setMessage("Speak now");
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscriptRef.current = joinTranscript(
            finalTranscriptRef.current,
            transcript
          );
        } else {
          interimTranscript = joinTranscript(interimTranscript, transcript);
        }
      }

      setQuestion(
        joinTranscript(
          baseQuestionRef.current,
          finalTranscriptRef.current,
          interimTranscript
        )
      );
    };

    recognition.onerror = (event) => {
      const errorMessages = {
        "not-allowed": "Microphone permission was denied.",
        "no-speech": "No speech detected. Please try again.",
        "audio-capture": "No microphone was found.",
      };

      setMessage(errorMessages[event.error] || "Voice input stopped unexpectedly.");
      setListening(false);
      setVoiceStarting(false);
      speechErrorRef.current = true;
    };

    recognition.onend = () => {
      setListening(false);
      setVoiceStarting(false);
      if (!speechErrorRef.current) {
        setMessage("");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="ask-card">
      <div className="section-head">
        <h2>Ask a Question</h2>
        <p>Use natural language to query your uploaded CSV dataset.</p>
      </div>

      <div className="ask-row">
        <div className="ask-input-wrap">
          <input
            type="text"
            placeholder="Example: show average Player_Id by Country"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="ask-input"
          />

          {question && (
            <button
              type="button"
              onClick={handleClearQuestion}
              className="clear-question-btn"
              aria-label="Clear question"
              title="Clear question"
            >
              X
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleVoiceInput}
          className={`voice-btn ${listening ? "listening" : ""} ${
            voiceStarting ? "starting" : ""
          }`}
          aria-label={
            listening || voiceStarting ? "Stop voice input" : "Start voice input"
          }
          title={listening || voiceStarting ? "Stop voice input" : "Start voice input"}
        >
          <MicIcon />
        </button>

        <button onClick={handleAsk} disabled={loading} className="primary-btn">
          {loading ? "Thinking..." : "Run Query"}
        </button>
      </div>

      {message && <p className="status-text">{message}</p>}
    </div>
  );
}

export default AskBox;
