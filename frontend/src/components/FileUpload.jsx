import React, { useRef, useState } from "react";
import axios from "axios";

function FileUpload({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const getUploadErrorMessage = (error) => {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item.msg || item.message || JSON.stringify(item))
        .join(" ");
    }

    if (error.response?.status) {
      return `Server returned ${error.response.status}. Please check the CSV format.`;
    }

    if (error.request) {
      return "Could not connect to the backend. Make sure the backend server is running.";
    }

    return error.message || "Failed to upload CSV.";
  };

  const handleSelectedFile = (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      showMessage("Please upload only a CSV file.", "error");
      return;
    }

    setSelectedFile(file);
    showMessage("");
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleSelectedFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files[0];
    handleSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showMessage("Please select a CSV file first.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setLoading(true);
      showMessage("");

      const response = await axios.post(
        "http://127.0.0.1:5000/upload-csv",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      onUploadSuccess(response.data);
      showMessage("CSV uploaded successfully.", "success");
    } catch (error) {
      console.error("Upload error:", error);
      showMessage(`Failed to upload CSV. ${getUploadErrorMessage(error)}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-card">
      <div className="section-head">
        <h2>Upload Dataset</h2>
        <p>Drag and drop your CSV file here or browse from your computer.</p>
      </div>

      <div
        className={`drop-zone ${dragActive ? "drag-active" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden-input"
        />

        <div className="drop-icon">⬆</div>
        <h3>{selectedFile ? selectedFile.name : "Drop CSV file here"}</h3>
        <p>or click to browse</p>
      </div>

      <div className="upload-action-row">
        <button onClick={handleUpload} disabled={loading} className="primary-btn">
          {loading ? "Uploading..." : "Upload Dataset"}
        </button>
      </div>

      {message && (
        <p className={`status-text ${messageType === "error" ? "error-text" : ""}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default FileUpload;
