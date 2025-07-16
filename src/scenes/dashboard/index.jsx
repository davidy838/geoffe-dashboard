import { useState, useEffect } from "react";
import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { mockTransactions } from "../../data/mockData";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import ScheduleIcon from "@mui/icons-material/Schedule";
import NatureIcon from "@mui/icons-material/Nature";
import Header from "../../components/Header";
import LineChart from "../../components/LineChart";
import BarChart from "../../components/BarChart";
import StatBox from "../../components/StatBox";
import ProgressCircle from "../../components/ProgressCircle";
import BCHeatmap from "../../components/BCHeatmap";

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  // API Base URL - change this to match your API
  const API_BASE_URL = 'http://localhost:3001/api';
  
  const [dashboardData, setDashboardData] = useState({
    totalSavings: 0,
    totalDistanceSavings: 0,
    totalDurationSavings: 0,
    totalCO2Savings: 0,
    lastUpdated: null,
    sourceFile: null,
    pathwayData: [],
    analysisResults: null
  });
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/dashboard/metrics`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      
      // Transform the data if it comes from community analysis
      if (data.analysisCompleted && data.rawData) {
        const transformedData = transformAnalysisData(data);
        setDashboardData(transformedData);
      } else {
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Use default values if API fails
      setDashboardData({
        totalSavings: 12361,
        totalDistanceSavings: 431225,
        totalDurationSavings: 32441,
        totalCO2Savings: 1325134,
        lastUpdated: null,
        sourceFile: null,
        pathwayData: [],
        analysisResults: null
      });
    } finally {
      setLoading(false);
    }
  };

  // Transform analysis data for dashboard display
  const transformAnalysisData = (analysisData) => {
    const { rawData, totalSavings, pathwayData, summary } = analysisData;
    
    // Extract key metrics from the CSV data
    let distanceSavings = 0;
    let durationSavings = 0;
    let co2Savings = 0;
    
    if (rawData && rawData.data) {
      rawData.data.forEach(row => {
        // Look for distance-related columns
        Object.keys(row).forEach(key => {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('distance') || lowerKey.includes('km')) {
            distanceSavings += parseFloat(row[key]) || 0;
          }
          if (lowerKey.includes('duration') || lowerKey.includes('time') || lowerKey.includes('hours')) {
            durationSavings += parseFloat(row[key]) || 0;
          }
          if (lowerKey.includes('co2') || lowerKey.includes('carbon') || lowerKey.includes('emission')) {
            co2Savings += parseFloat(row[key]) || 0;
          }
        });
      });
    }
    
    return {
      totalSavings: totalSavings || 0,
      totalDistanceSavings: distanceSavings,
      totalDurationSavings: durationSavings,
      totalCO2Savings: co2Savings,
      lastUpdated: analysisData.timestamp,
      sourceFile: `Community Analysis - ${analysisData.timestamp ? new Date(analysisData.timestamp).toLocaleDateString() : 'Recent'}`,
      pathwayData: pathwayData || [],
      analysisResults: analysisData,
      summary: summary
    };
  };

  // Listen for dashboard updates from other components
  useEffect(() => {
    const handleDashboardUpdate = (event) => {
      if (event.detail && event.detail.type === 'dashboard-update') {
        fetchDashboardData();
      }
    };

    window.addEventListener('dashboard-update', handleDashboardUpdate);
    return () => window.removeEventListener('dashboard-update', handleDashboardUpdate);
  }, []);

  // Load dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Poll for dashboard updates (optional)
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Download reports function
  const handleDownloadReports = async () => {
    setDownloading(true);
    try {
      // First, try to fetch the file to ensure it exists
      const response = await fetch('/data/Reports/Copy of GEOFFE API Report-14.pdf');
      
      if (!response.ok) {
        throw new Error('Report file not found');
      }

      // Get the file as a blob
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'GEOFFE API Report-14.pdf';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);
      
      console.log('Download completed successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      
      // Fallback: try to open in new tab
      try {
        window.open('/data/Reports/Copy of GEOFFE API Report-14.pdf', '_blank');
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
        alert('Unable to download the report. Please try again later.');
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="GEOFFE DASHBOARD" subtitle="Welcome to your dashboard" />

        <Box>
          <Button
            onClick={handleDownloadReports}
            disabled={downloading}
            sx={{
              backgroundColor: colors.blueAccent[700],
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
              '&:hover': {
                backgroundColor: colors.blueAccent[600],
              },
              '&:disabled': {
                backgroundColor: colors.grey[600],
                color: colors.grey[400],
              }
            }}
          >
            <DownloadOutlinedIcon sx={{ mr: "10px" }} />
            {downloading ? "Downloading..." : "Download Reports"}
          </Button>
        </Box>
      </Box>

      {/* Dashboard Data Source Info */}
      {dashboardData.sourceFile && (
        <Box mb="20px">
          <Typography variant="body2" color={colors.grey[300]}>
            Data source: {dashboardData.sourceFile}
            {dashboardData.lastUpdated && ` (Last updated: ${new Date(dashboardData.lastUpdated).toLocaleString()})`}
          </Typography>
        </Box>
      )}

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="140px"
        gap="20px"
      >
        {/* ROW 1 */}
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={loading ? "Loading..." : dashboardData.totalSavings.toLocaleString()}
            subtitle="Total Savings ($)"
            progress="0.75"
            increase="+14%"
            icon={
              <AttachMoneyIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={loading ? "Loading..." : dashboardData.totalDistanceSavings.toLocaleString()}
            subtitle="Total Distance Savings (km)"
            progress="0.50"
            increase="+21%"
            icon={
              <DirectionsCarIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={loading ? "Loading..." : dashboardData.totalDurationSavings.toLocaleString()}
            subtitle="Total Duration Savings (hours)"
            progress="0.30"
            increase="+5%"
            icon={
              <ScheduleIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={loading ? "Loading..." : dashboardData.totalCO2Savings.toLocaleString()}
            subtitle="Total CO2 Savings (kg)"
            progress="0.80"
            increase="+43%"
            icon={
              <NatureIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>

        {/* ROW 2 */}
        <Box
          gridColumn="span 8"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Box
            mt="25px"
            p="0 30px"
            display="flex "
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="h5"
                fontWeight="600"
                color={colors.grey[100]}
              >
                Savings Per Pathway
              </Typography>
              <Typography
                variant="h3"
                fontWeight="bold"
                color={colors.greenAccent[500]}
              >
                {loading ? "Loading..." : `$${dashboardData.totalSavings.toLocaleString()}`}
              </Typography>
            </Box>
            <Box>
              <IconButton>
                <DownloadOutlinedIcon
                  sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
                />
              </IconButton>
            </Box>
          </Box>
          <Box height="250px" m="-20px 0 0 0">
            <LineChart isDashboard={true} />
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          overflow="auto"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottom={`4px solid ${colors.primary[500]}`}
            colors={colors.grey[100]}
            p="15px"
          >
            <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
              Recent Calculations
            </Typography>
          </Box>
          {mockTransactions.map((transaction, i) => (
            <Box
              key={`${transaction.txId}-${i}`}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              borderBottom={`4px solid ${colors.primary[500]}`}
              p="15px"
            >
              <Box>
                <Typography
                  color={colors.greenAccent[500]}
                  variant="h5"
                  fontWeight="600"
                >
                  {transaction.txId}
                </Typography>
                <Typography color={colors.grey[100]}>
                  {transaction.user}
                </Typography>
              </Box>
              <Box color={colors.grey[100]}>{transaction.date}</Box>
              <Box
                backgroundColor={colors.greenAccent[500]}
                p="5px 10px"
                borderRadius="4px"
              >
                ${transaction.cost}
              </Box>
            </Box>
          ))}
        </Box>

        {/* ROW 3 */}
        <Box
          gridColumn="span 4"
          gridRow="span 3"
          backgroundColor={colors.primary[400]}
          p="30px"
        >
          <Typography variant="h5" fontWeight="600">
            RTVS Pathways
          </Typography>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            mt="25px"
          >
            <ProgressCircle size="125" />
            <Typography
              variant="h5"
              color={colors.greenAccent[500]}
              sx={{ mt: "15px" }}
            >
              $34,225,891 
            </Typography>
            <Typography>Includes FNHA Pathways</Typography>
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 3"
          backgroundColor={colors.primary[400]}
        >
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{ padding: "30px 30px 0 30px" }}
          >
            Savings Per Pathway
          </Typography>
          <Box height="350px" mt="-20px">
            <BarChart isDashboard={true} />
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 3"
          backgroundColor={colors.primary[400]}
          padding="30px"
        >
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{ marginBottom: "15px" }}
          >
            BC CHSA Unit Costs
          </Typography>
          <Box height="300px">
            <BCHeatmap isCompact={true} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
