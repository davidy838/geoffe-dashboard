import { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  useTheme, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  Tooltip,
  Alert,
  Snackbar,
  LinearProgress,
  Paper
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import FileUpload from "../../components/FileUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import PendingIcon from "@mui/icons-material/Pending";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import AnalyticsIcon from "@mui/icons-material/Analytics";

const ExcelFiles = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [analyzingFile, setAnalyzingFile] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showAnalysisProgress, setShowAnalysisProgress] = useState(false);

  // API Base URL - change this to match your API
  const API_BASE_URL = 'http://localhost:3001/api';

  // Fetch all files from API
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/files`);
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
      setSnackbar({ open: true, message: 'Failed to load files', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Upload file to API
  const uploadFileToAPI = async (fileData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fileData),
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadedFile = await response.json();
      setFiles(prevFiles => [uploadedFile, ...prevFiles]);
      setSnackbar({ open: true, message: 'File uploaded successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error uploading file:', error);
      setSnackbar({ open: true, message: 'Failed to upload file', severity: 'error' });
    }
  };

  // Delete file from API
  const deleteFileFromAPI = async (fileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
      setSnackbar({ open: true, message: 'File deleted successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error deleting file:', error);
      setSnackbar({ open: true, message: 'Failed to delete file', severity: 'error' });
    }
  };

  // Update dashboard with analysis results
  const updateDashboard = async (results) => {
    try {
      await fetch(`${API_BASE_URL}/dashboard/metrics/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(results),
      });
    } catch (error) {
      console.error('Error updating dashboard:', error);
    }
  };

  // Function to parse CSV data (similar to community analysis)
  const parseCSV = (csvText) => {
    try {
      console.log('Parsing CSV text length:', csvText.length);
      
      const lines = csvText.trim().split('\n');
      console.log('Number of lines:', lines.length);
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }
      
      // Parse headers - handle quoted headers
      const headerLine = lines[0];
      const headers = headerLine.split(',').map(header => header.trim().replace(/"/g, ''));
      console.log('Parsed headers:', headers);
      
      const data = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        // Split by comma, but handle quoted values
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim()); // Add the last value
        
        // Create row object
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
      
      console.log('Parsed data rows:', data.length);
      console.log('Sample data row:', data[0]);
      
      return { headers, data };
    } catch (error) {
      console.error('Error parsing CSV:', error);
      throw new Error(`Failed to parse CSV data: ${error.message}`);
    }
  };

  // Function to transform CSV data into dashboard format (similar to community analysis)
  const transformCSVDataForDashboard = (csvResults) => {
    // Extract key metrics from the CSV data
    const { headers, data } = csvResults;
    
    console.log('CSV Headers:', headers);
    console.log('CSV Data (first 3 rows):', data.slice(0, 3));
    
    // Look for the specific column names that contain the total values
    const totalSavingsColumn = headers.find(header => 
      header === "Total Savings ($)" || 
      header === "Total Savings" ||
      header.toLowerCase().includes('total savings')
    );
    
    const totalDistanceColumn = headers.find(header => 
      header === "Total Distance Savings (km)" || 
      header === "Total Distance Savings" ||
      header.toLowerCase().includes('total distance savings')
    );
    
    const totalDurationColumn = headers.find(header => 
      header === "Total Duration Savings (hours)" || 
      header === "Total Duration Savings" ||
      header.toLowerCase().includes('total duration savings')
    );
    
    const totalCO2Column = headers.find(header => 
      header === "Total CO2 Savings (kg)" || 
      header === "Total CO2 Savings" ||
      header.toLowerCase().includes('total co2 savings')
    );
    
    console.log('Found columns:');
    console.log('- Total Savings column:', totalSavingsColumn);
    console.log('- Total Distance column:', totalDistanceColumn);
    console.log('- Total Duration column:', totalDurationColumn);
    console.log('- Total CO2 column:', totalCO2Column);
    
    // Extract the single values from each column (assuming they're in the first data row)
    let totalSavings = 0;
    let totalDistanceSavings = 0;
    let totalDurationSavings = 0;
    let totalCO2Savings = 0;
    
    if (data.length > 0) {
      const firstRow = data[0];
      
      if (totalSavingsColumn && firstRow[totalSavingsColumn]) {
        totalSavings = parseFloat(firstRow[totalSavingsColumn]) || 0;
        console.log(`Extracted total savings from ${totalSavingsColumn}:`, totalSavings);
      }
      
      if (totalDistanceColumn && firstRow[totalDistanceColumn]) {
        totalDistanceSavings = parseFloat(firstRow[totalDistanceColumn]) || 0;
        console.log(`Extracted total distance from ${totalDistanceColumn}:`, totalDistanceSavings);
      }
      
      if (totalDurationColumn && firstRow[totalDurationColumn]) {
        totalDurationSavings = parseFloat(firstRow[totalDurationColumn]) || 0;
        console.log(`Extracted total duration from ${totalDurationColumn}:`, totalDurationSavings);
      }
      
      if (totalCO2Column && firstRow[totalCO2Column]) {
        totalCO2Savings = parseFloat(firstRow[totalCO2Column]) || 0;
        console.log(`Extracted total CO2 from ${totalCO2Column}:`, totalCO2Savings);
      }
    }
    
    // Create pathway data
    const pathwayData = [
      {
        pathway: "CSV Analysis",
        value: totalSavings
      }
    ];
    
    console.log('Final extracted values:');
    console.log('- Total Savings:', totalSavings);
    console.log('- Total Distance Savings:', totalDistanceSavings);
    console.log('- Total Duration Savings:', totalDurationSavings);
    console.log('- Total CO2 Savings:', totalCO2Savings);
    
    // Return data in the format expected by the dashboard
    return {
      analysisCompleted: true,
      timestamp: new Date().toISOString(),
      totalSavings: totalSavings,
      totalDistanceSavings: totalDistanceSavings,
      totalDurationSavings: totalDurationSavings,
      totalCO2Savings: totalCO2Savings,
      pathwayData: pathwayData,
      rawData: csvResults, // Include raw data for debugging
      summary: {
        totalRecords: data.length,
        totalColumns: headers.length,
        foundColumns: {
          totalSavings: totalSavingsColumn,
          totalDistance: totalDistanceColumn,
          totalDuration: totalDurationColumn,
          totalCO2: totalCO2Column
        }
      }
    };
  };

  // Enhanced analysis function that handles both Excel and CSV files
  const handleAnalyze = async (file) => {
    setAnalyzingFile(file);
    setShowAnalysisProgress(true);
    setAnalysisProgress(0);
    
    try {
      // Check if it's a CSV file
      const isCSV = file.fileName.toLowerCase().endsWith('.csv');
      
      if (isCSV) {
        // Handle CSV analysis directly
        await handleCSVAnalysis(file);
      } else {
        // Handle Excel analysis via API
        await handleExcelAnalysis(file);
      }
    } catch (error) {
      console.error('Error during analysis:', error);
      setSnackbar({ open: true, message: 'Analysis failed: ' + error.message, severity: 'error' });
      setShowAnalysisProgress(false);
      setAnalyzingFile(null);
    }
  };

  // Handle CSV analysis
  const handleCSVAnalysis = async (file) => {
    try {
      // Simulate analysis progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Fetch the CSV file content
      const response = await fetch(`${API_BASE_URL}/files/${file.id}/content`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch CSV content');
      }

      const csvData = await response.text();
      console.log('Raw CSV response:', csvData.substring(0, 500) + '...');
      
      // Parse CSV data
      const parsedData = parseCSV(csvData);
      
      // Transform data for dashboard
      const dashboardData = transformCSVDataForDashboard(parsedData);
      
      console.log('Dashboard data to be sent:', dashboardData);
      
      // Update dashboard with analysis results
      const updateResponse = await fetch(`${API_BASE_URL}/dashboard/metrics/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dashboardData),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update dashboard');
      }

      // Trigger dashboard update event for real-time refresh
      window.dispatchEvent(new CustomEvent('dashboard-update', {
        detail: {
          type: 'dashboard-update',
          data: dashboardData
        }
      }));

      setShowAnalysisProgress(false);
      setAnalyzingFile(null);
      setSnackbar({ open: true, message: 'CSV analysis completed successfully!', severity: 'success' });

    } catch (error) {
      console.error('Error during CSV analysis:', error);
      setShowAnalysisProgress(false);
      setAnalyzingFile(null);
      setSnackbar({ open: true, message: 'CSV analysis failed: ' + error.message, severity: 'error' });
    }
  };

  // Handle Excel analysis (existing functionality)
  const handleExcelAnalysis = async (file) => {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${file.id}/analyze`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }
      
      const data = await response.json();
      
      // Start polling for progress
      pollAnalysisProgress(data.analysisId);
    } catch (error) {
      console.error('Error starting Excel analysis:', error);
      setSnackbar({ open: true, message: 'Failed to start Excel analysis', severity: 'error' });
      setShowAnalysisProgress(false);
      setAnalyzingFile(null);
    }
  };

  // Poll analysis progress
  const pollAnalysisProgress = async (analysisId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/analysis/${analysisId}/status`);
        const data = await response.json();
        
        setAnalysisProgress(data.progress);
        
        if (data.status === 'completed') {
          clearInterval(interval);
          setShowAnalysisProgress(false);
          setAnalyzingFile(null);
          
          // Get results and update dashboard
          const resultsResponse = await fetch(`${API_BASE_URL}/analysis/${analysisId}/results`);
          const results = await resultsResponse.json();
          
          // Update dashboard
          await updateDashboard(results.results);
          
          setSnackbar({ open: true, message: 'File analyzed successfully!', severity: 'success' });
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setShowAnalysisProgress(false);
          setAnalyzingFile(null);
          setSnackbar({ open: true, message: 'Analysis failed', severity: 'error' });
        }
      } catch (error) {
        clearInterval(interval);
        setShowAnalysisProgress(false);
        setAnalyzingFile(null);
        setSnackbar({ open: true, message: 'Analysis failed', severity: 'error' });
      }
    }, 1000); // Poll every second
  };

  // Load files on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = (uploadedFile) => {
    // File was already uploaded to the API, just add to the list
    setFiles(prevFiles => [uploadedFile, ...prevFiles]);
    setSnackbar({ open: true, message: 'File uploaded successfully!', severity: 'success' });
  };

  const handleDeleteClick = (file) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (fileToDelete) {
      deleteFileFromAPI(fileToDelete.id);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setFileToDelete(null);
  };

  const handleDownload = (file) => {
    // In a real app, this would trigger a download from the server
    console.log(`Downloading file: ${file.fileName}`);
    // For demo purposes, we'll just show an alert
    alert(`Download started for: ${file.fileName}`);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "uploaded":
        return <CheckCircleIcon sx={{ color: colors.greenAccent[500] }} />;
      case "processing":
        return <PendingIcon sx={{ color: colors.blueAccent[500] }} />;
      case "error":
        return <ErrorIcon sx={{ color: colors.redAccent[500] }} />;
      default:
        return <PendingIcon sx={{ color: colors.grey[500] }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "uploaded":
        return colors.greenAccent[600];
      case "processing":
        return colors.blueAccent[600];
      case "error":
        return colors.redAccent[600];
      default:
        return colors.grey[600];
    }
  };

  const columns = [
    { 
      field: "id", 
      headerName: "ID", 
      width: 70 
    },
    {
      field: "fileName",
      headerName: "File Name",
      flex: 1,
      cellClassName: "name-column--cell",
      renderCell: ({ row }) => (
        <Box display="flex" alignItems="center" gap={1}>
          <InsertDriveFileIcon sx={{ color: colors.greenAccent[300] }} />
          <Typography>{row.fileName}</Typography>
        </Box>
      ),
    },
    {
      field: "fileSize",
      headerName: "File Size",
      width: 120,
      headerAlign: "left",
      align: "left",
    },
    {
      field: "uploadDate",
      headerName: "Upload Date",
      width: 130,
    },
    {
      field: "uploadedBy",
      headerName: "Uploaded By",
      width: 150,
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: ({ row }) => (
        <Box
          width="100%"
          m="0 auto"
          p="5px"
          display="flex"
          justifyContent="center"
          alignItems="center"
          backgroundColor={getStatusColor(row.status)}
          borderRadius="4px"
          gap={1}
        >
          {getStatusIcon(row.status)}
          <Typography color={colors.grey[100]} sx={{ ml: "5px", textTransform: "capitalize" }}>
            {row.status}
          </Typography>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      sortable: false,
      renderCell: ({ row }) => (
        <Box display="flex" gap={1}>
          <Tooltip title="Analyze file">
            <IconButton
              onClick={() => handleAnalyze(row)}
              disabled={analyzingFile?.id === row.id}
              sx={{ color: colors.blueAccent[300] }}
            >
              <AnalyticsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download file">
            <IconButton
              onClick={() => handleDownload(row)}
              sx={{ color: colors.greenAccent[300] }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete file">
            <IconButton
              onClick={() => handleDeleteClick(row)}
              sx={{ color: colors.redAccent[300] }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header title="EXCEL FILES" subtitle="Managing shared Excel files" />
      
      <FileUpload onFileUpload={handleFileUpload} />
      
      {/* Analysis Progress */}
      {showAnalysisProgress && analyzingFile && (
        <Box mb="20px">
          <Paper sx={{ p: 2, backgroundColor: colors.primary[400] }}>
            <Typography variant="h6" color={colors.grey[100]} mb={2}>
              Analyzing: {analyzingFile.fileName}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={analysisProgress} 
              sx={{ 
                height: 10, 
                borderRadius: 5,
                backgroundColor: colors.grey[700],
                "& .MuiLinearProgress-bar": {
                  backgroundColor: colors.blueAccent[500],
                }
              }} 
            />
            <Typography variant="body2" color={colors.grey[300]} mt={1}>
              {analysisProgress}% Complete
            </Typography>
          </Paper>
        </Box>
      )}
      
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
        }}
      >
        <DataGrid 
          checkboxSelection 
          rows={files} 
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          loading={loading}
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{fileToDelete?.fileName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExcelFiles;
