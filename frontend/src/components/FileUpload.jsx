import React, { useRef, useState } from "react";
import axios from "axios";

function FileUpload({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleSelectedFile = (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage("Please upload only a CSV file.");
      return;
    }

    setSelectedFile(file);
    setMessage("");
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
      setMessage("Please select a CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setLoading(true);
      setMessage("");

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
      setMessage("CSV uploaded successfully.");
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Failed to upload CSV.");
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

      {message && <p className="status-text">{message}</p>}
    </div>
  );
}

export default FileUpload;