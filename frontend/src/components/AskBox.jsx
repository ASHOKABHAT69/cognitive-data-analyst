import React, { useState } from "react";
import axios from "axios";

function AskBox({ onResult }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  return (
    <div className="ask-card">
      <div className="section-head">
        <h2>Ask a Question</h2>
        <p>Use natural language to query your uploaded CSV dataset.</p>
      </div>

      <div className="ask-row">
        <input
          type="text"
          placeholder="Example: show average Player_Id by Country"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="ask-input"
        />

        <button onClick={handleAsk} disabled={loading} className="primary-btn">
          {loading ? "Thinking..." : "Run Query"}
        </button>
      </div>

      {message && <p className="status-text">{message}</p>}
    </div>
  );
}

export default AskBox;