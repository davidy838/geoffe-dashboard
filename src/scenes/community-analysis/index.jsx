import { useState, useRef } from "react";
import { 
  Box, 
  Typography, 
  useTheme, 
  Alert,
  Paper,
  LinearProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Snackbar
} from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

const CommunityAnalysis = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showAnalysisProgress, setShowAnalysisProgress] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // File states
  const [locationsFile, setLocationsFile] = useState(null);
  const [selectedEncounter, setSelectedEncounter] = useState('');
  const [selectedPathway, setSelectedPathway] = useState('');
  
  const fileInputRef = useRef(null);

  // API Base URL
  const API_BASE_URL = 'http://localhost:3001/api';

  // Available files for dropdowns
  const encounterFiles = [
    { value: 'cate_complete.csv', label: 'CATe Complete Encounters' },
    { value: 'RUDI.csv', label: 'RUDi Encounters' },
    { value: 'PPRS_encounterscomplete.csv', label: 'PPRS Complete Encounters' },
    { value: 'Mabal.csv', label: 'MaBAL Encounters' },
    { value: 'HEIDI_encounterscomplete.csv', label: 'HEiDi Complete Encounters' }
  ];

  const pathwayFiles = [
    { value: 'MABAL_cost.csv', label: 'MaBAL Costs' },
    { value: 'CATE1.csv', label: 'CATe Costs' },
    { value: 'PPRS1.csv', label: 'PPRS Costs' },
    { value: 'RUDI.csv', label: 'RUDi Costs' },
    { value: 'HEIDI1.csv', label: 'HEiDi Costs' }
  ];

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
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setUploading(false);
            setLocationsFile(file);
            setSnackbar({ open: true, message: 'Locations file uploaded successfully!', severity: 'success' });
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

  const handleAnalyze = async () => {
    // Validate all selections
    if (!locationsFile) {
      setSnackbar({ open: true, message: 'Please upload a locations file', severity: 'error' });
      return;
    }
    if (!selectedEncounter) {
      setSnackbar({ open: true, message: 'Please select an encounters file', severity: 'error' });
      return;
    }
    if (!selectedPathway) {
      setSnackbar({ open: true, message: 'Please select a pathways file', severity: 'error' });
      return;
    }

    setAnalyzing(true);
    setShowAnalysisProgress(true);
    setAnalysisProgress(0);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('community_file', locationsFile);
      formData.append('charlie_file', selectedEncounter);
      formData.append('costs_file', selectedPathway);
      
      // Send files to API
      const response = await fetch(`${API_BASE_URL}/merge-community-costs-65plus`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      // Get the CSV response
      const csvData = await response.text();
      
      console.log('Raw CSV response:', csvData.substring(0, 500) + '...');
      
      // Parse CSV data
      const parsedData = parseCSV(csvData);
      
      // Simulate analysis progress
      const interval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setShowAnalysisProgress(false);
            setAnalyzing(false);
            
            // Process the analysis results and update dashboard
            processAnalysisResults(parsedData);
            
            setSnackbar({ open: true, message: 'Analysis completed successfully!', severity: 'success' });
            return 100;
          }
          return prev + 5;
        });
      }, 200);

    } catch (error) {
      console.error('Error during analysis:', error);
      setShowAnalysisProgress(false);
      setAnalyzing(false);
      setSnackbar({ open: true, message: 'Analysis failed: ' + error.message, severity: 'error' });
    }
  };

  // Process analysis results and update dashboard
  const processAnalysisResults = async (parsedData) => {
    try {
      // Transform the CSV data into the format expected by the dashboard
      const dashboardData = transformDataForDashboard(parsedData);
      
      console.log('Dashboard data to be sent:', dashboardData);
      
      // Update dashboard with analysis results - similar to file upload page
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

      console.log('Dashboard updated successfully with analysis results');

    } catch (error) {
      console.error('Error processing analysis results:', error);
      setSnackbar({ open: true, message: 'Analysis completed but failed to update dashboard: ' + error.message, severity: 'warning' });
    }
  };

  // Function to parse CSV data
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

  // Function to transform CSV data into dashboard format
  const transformDataForDashboard = (csvResults) => {
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
    
    // Create pathway data (you may need to adjust this based on your CSV structure)
    const pathwayData = [
      {
        pathway: "Community Analysis",
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

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box m="20px">
      <Header 
        title="COMMUNITY COST ANALYSIS" 
        subtitle="Upload locations file and select encounters and pathways for analysis" 
      />

      <Grid container spacing={3}>
        {/* Locations File Upload */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400], height: '100%' }}>
            <CardContent>
              <Typography variant="h6" color="white" fontWeight="bold" mb={2}>
                Upload Locations File
              </Typography>
              
              <Paper
                elevation={dragActive ? 8 : 2}
                sx={{
                  border: `2px dashed ${dragActive ? colors.blueAccent[500] : colors.grey[400]}`,
                  borderRadius: "8px",
                  p: "20px",
                  textAlign: "center",
                  backgroundColor: dragActive ? colors.blueAccent[900] : colors.primary[500],
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
                  {uploading ? "Uploading file..." : dragActive ? "Drop your file here" : "Drag & drop locations file"}
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

              {locationsFile && (
                <Box mt={2} display="flex" alignItems="center" gap={1}>
                  <CheckCircleIcon sx={{ color: colors.greenAccent[500] }} />
                  <Typography variant="body2" color={colors.greenAccent[500]}>
                    {locationsFile.name} uploaded successfully
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Encounters File Selection */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400], height: '100%' }}>
            <CardContent>
              <Typography variant="h6" color="white" fontWeight="bold" mb={2}>
                Select Encounters File
              </Typography>
              
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.grey[300] }}>Choose Encounters File</InputLabel>
                <Select
                  value={selectedEncounter}
                  onChange={(e) => setSelectedEncounter(e.target.value)}
                  sx={{
                    color: colors.grey[100],
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.grey[600],
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.grey[500],
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.blueAccent[500],
                    },
                  }}
                >
                  {encounterFiles.map((file) => (
                    <MenuItem key={file.value} value={file.value}>
                      {file.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedEncounter && (
                <Box mt={2} display="flex" alignItems="center" gap={1}>
                  <CheckCircleIcon sx={{ color: colors.greenAccent[500] }} />
                  <Typography variant="body2" color={colors.greenAccent[500]}>
                    {encounterFiles.find(f => f.value === selectedEncounter)?.label} selected
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pathways File Selection */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400], height: '100%' }}>
            <CardContent>
              <Typography variant="h6" color="white" fontWeight="bold" mb={2}>
                Select Pathways File
              </Typography>
              
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.grey[300] }}>Choose Pathways File</InputLabel>
                <Select
                  value={selectedPathway}
                  onChange={(e) => setSelectedPathway(e.target.value)}
                  sx={{
                    color: colors.grey[100],
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.grey[600],
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.grey[500],
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.blueAccent[500],
                    },
                  }}
                >
                  {pathwayFiles.map((file) => (
                    <MenuItem key={file.value} value={file.value}>
                      {file.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedPathway && (
                <Box mt={2} display="flex" alignItems="center" gap={1}>
                  <CheckCircleIcon sx={{ color: colors.greenAccent[500] }} />
                  <Typography variant="body2" color={colors.greenAccent[500]}>
                    {pathwayFiles.find(f => f.value === selectedPathway)?.label} selected
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Analyze Button */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400], height: '100%' }}>
            <CardContent>
              <Typography variant="h6" color="white" fontWeight="bold" mb={2}>
                Start Analysis
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<AnalyticsIcon />}
                onClick={handleAnalyze}
                disabled={analyzing || !locationsFile || !selectedEncounter || !selectedPathway}
                sx={{
                  backgroundColor: colors.greenAccent[600],
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  padding: '12px 30px',
                  width: '100%',
                  height: '60px',
                  '&:hover': { 
                    backgroundColor: colors.greenAccent[700],
                  },
                  '&:disabled': {
                    backgroundColor: colors.grey[600],
                    color: colors.grey[400],
                  }
                }}
              >
                {analyzing ? 'Analyzing...' : 'Analyze Files'}
              </Button>

              <Typography variant="body2" color={colors.grey[300]} mt={2}>
                All three files must be selected before analysis can begin
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analysis Progress */}
      {showAnalysisProgress && (
        <Box mt={3}>
          <Paper sx={{ p: 3, backgroundColor: colors.primary[400] }}>
            <Typography variant="h6" color={colors.grey[100]} mb={2}>
              Analyzing Community Cost Data...
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

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

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

export default CommunityAnalysis; 