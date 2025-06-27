import { useState, useRef } from "react";
import {
  Box,
  Typography,
  Alert,
  Paper,
  LinearProgress,
} from "@mui/material";
import { tokens } from "../theme";
import { useTheme } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const FileUpload = ({ onFileUpload }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // API Base URL
  const API_BASE_URL = 'http://localhost:3001/api';

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    const file = files[0];
    
    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload only Excel files (.xlsx, .xls) or CSV files (.csv)");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setError("");
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload file to API
      const response = await fetch(`${API_BASE_URL}/files/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setUploading(false);
            onFileUpload(result.file);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error.message || 'Failed to upload file');
      setUploading(false);
      setUploadProgress(0);
    }
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <Box mb="20px">
      <Paper
        elevation={dragActive ? 8 : 2}
        sx={{
          border: `2px dashed ${dragActive ? colors.blueAccent[500] : colors.grey[400]}`,
          borderRadius: "8px",
          p: "20px",
          textAlign: "center",
          backgroundColor: dragActive ? colors.blueAccent[900] : colors.primary[400],
          transition: "all 0.3s ease",
          cursor: uploading ? "not-allowed" : "pointer",
          opacity: uploading ? 0.7 : 1,
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={uploading ? undefined : onButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleChange}
          style={{ display: "none" }}
          disabled={uploading}
        />
        
        <CloudUploadIcon 
          sx={{ 
            fontSize: 48, 
            color: dragActive ? colors.blueAccent[300] : colors.grey[300],
            mb: 2 
          }} 
        />
        
        <Typography variant="h6" color={colors.grey[100]} mb={1}>
          {uploading ? "Uploading file..." : dragActive ? "Drop your file here" : "Drag & drop files here"}
        </Typography>
        
        <Typography variant="body2" color={colors.grey[300]} mb={2}>
          {uploading ? "Please wait..." : "or click to browse files"}
        </Typography>
        
        <Typography variant="caption" color={colors.grey[400]}>
          Supported formats: .xlsx, .xls, .csv (Max size: 10MB)
        </Typography>
      </Paper>

      {uploading && (
        <Box mt={2}>
          <Typography variant="body2" color={colors.grey[100]} mb={1}>
            Uploading file...
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={uploadProgress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: colors.grey[700],
              "& .MuiLinearProgress-bar": {
                backgroundColor: colors.greenAccent[500],
              }
            }} 
          />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload; 