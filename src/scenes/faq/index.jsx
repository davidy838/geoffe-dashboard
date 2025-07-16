import { Box, useTheme, Card, CardContent, Grid, Chip } from "@mui/material";
import Header from "../../components/Header";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { tokens } from "../../theme";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import MapIcon from "@mui/icons-material/Map";
import CalculateIcon from "@mui/icons-material/Calculate";
import StorageIcon from "@mui/icons-material/Storage";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const FAQ = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <Box m="20px">
      <Header 
        title="DASHBOARD OVERVIEW" 
        subtitle="Comprehensive guide to the healthcare pathway cost analysis dashboard" 
      />

      {/* Overview Card */}
      <Card sx={{ backgroundColor: colors.primary[400], mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <DashboardIcon sx={{ mr: 2, color: colors.greenAccent[500], fontSize: 40 }} />
            <Typography variant="h4" color="white" fontWeight="bold">
              Healthcare Pathway Cost Analysis Dashboard
            </Typography>
          </Box>
          <Typography variant="body1" color="grey.300" sx={{ lineHeight: 1.8 }}>
            This comprehensive dashboard provides real-time analysis and visualization of healthcare pathway costs, 
            patient outcomes, and service delivery metrics across British Columbia. The system tracks nine key 
            healthcare pathways including emergency services, mental health support, rural healthcare, and 
            Indigenous health services.
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3} mb={3}>
        {/* Key Metrics Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400], height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AnalyticsIcon sx={{ mr: 1, color: colors.blueAccent[500] }} />
                <Typography variant="h6" color="white" fontWeight="bold">
                  Key Metrics Tracked
                </Typography>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={1}>
                <Chip label="Cost Savings" color="success" size="small" />
                <Chip label="Patient Outcomes" color="primary" size="small" />
                <Chip label="Service Utilization" color="secondary" size="small" />
                <Chip label="Geographic Coverage" color="warning" size="small" />
                <Chip label="Response Times" color="info" size="small" />
                <Chip label="Resource Allocation" color="error" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Healthcare Pathways Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: colors.primary[400], height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUpIcon sx={{ mr: 1, color: colors.greenAccent[500] }} />
                <Typography variant="h6" color="white" fontWeight="bold">
                  Healthcare Pathways
                </Typography>
              </Box>
              <Typography variant="body2" color="grey.300" sx={{ lineHeight: 1.6 }}>
                <strong>9 Active Pathways:</strong> MaBAL, HEiDi, CHARLiE, RUDi, VERRa, FNvDOD, 
                FNvSUPS, CATe, and PPRSS. Each pathway serves specific healthcare needs from 
                emergency response to preventive care, with detailed cost analysis and outcome tracking.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color={colors.greenAccent[500]} variant="h5">
            Dashboard Overview & Main Features
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
            The main dashboard provides a comprehensive overview of healthcare pathway performance with:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Real-time Cost Savings:</strong> Displays total savings across all pathways with detailed breakdowns
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Geographic Heatmap:</strong> Interactive map showing cost distribution and pathway coverage across BC
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Recent Calculations:</strong> Latest pathway cost analyses and updates
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Performance Metrics:</strong> Key indicators including patient outcomes, response times, and resource utilization
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Trend Analysis:</strong> Historical data visualization showing pathway performance over time
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color={colors.greenAccent[500]} variant="h5">
            Data Visualization & Analytics
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
            The dashboard includes multiple visualization tools for comprehensive data analysis:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Bar Charts:</strong> Compare cost savings and performance metrics across different pathways
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Pie Charts:</strong> Show distribution of resources and patient demographics
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Line Charts:</strong> Track trends and performance over time periods
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Geographic Maps:</strong> Interactive heatmaps displaying regional cost variations and service coverage
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Data Tables:</strong> Detailed breakdowns of calculations and pathway characteristics
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color={colors.greenAccent[500]} variant="h5">
            Healthcare Pathways & Services
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
            The dashboard tracks nine specialized healthcare pathways, each designed for specific patient needs:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>MaBAL (Maternity and Babies Advice Line):</strong> Provides maternal and infant care support, reducing unnecessary MD visits by 50%
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>HEiDi (HealthLink BC Emergency iDoctor-in-assistance):</strong> Emergency virtual care reducing ED visits by 60.2%
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>CHARLiE (Child Health Advice in Real-Time Electronically):</strong> Pediatric care support avoiding 41% of in-person visits
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>RUDi (Rural Urgent Doctor in-aid):</strong> Rural emergency services preventing 50% of ED visits
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>VERRa (Virtual Emergency Room Rural assistance):</strong> Virtual ED access for rural communities
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>FNvDOD & FNvSUPS:</strong> Culturally safe care for First Nations communities
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>CATe (COVID Anti-viral Treatment eTeam):</strong> COVID-19 treatment reducing hospitalizations by 86%
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>PPRSS (Primary Prevention and Remote Screening Services):</strong> Preventive care avoiding 75.2% of clinic visits
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color={colors.greenAccent[500]} variant="h5">
            Cost Analysis & Calculation Tools
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
            Advanced calculation and analysis features for healthcare cost management:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Cost Parameters:</strong> Configurable factors including fuel costs, driver rates, equipment costs, and administrative overhead
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Calculation Formulas:</strong> Detailed mathematical models for each pathway with intervention vs. comparator analysis
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Excel Data Integration:</strong> Import and analyze external data files for comprehensive reporting
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Real-time Updates:</strong> Live calculation updates as parameters and data change
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Comparative Analysis:</strong> Side-by-side comparison of pathway performance and cost-effectiveness
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color={colors.greenAccent[500]} variant="h5">
            Geographic & Regional Analysis
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
            Advanced mapping and geographic analysis capabilities:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Interactive Heatmaps:</strong> Visual representation of cost distribution across BC using CHSA polygons
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Regional Cost Analysis:</strong> Detailed breakdown of healthcare costs by geographic region
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Service Coverage Mapping:</strong> Visualization of pathway availability and accessibility
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Rural vs Urban Analysis:</strong> Comparative cost analysis between rural and urban healthcare delivery
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Distance-based Calculations:</strong> Cost analysis incorporating travel distances and geographic factors
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color={colors.greenAccent[500]} variant="h5">
            User Interface & Navigation
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
            Intuitive interface designed for healthcare professionals and administrators:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Responsive Design:</strong> Optimized for desktop, tablet, and mobile devices
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Dark/Light Theme:</strong> Customizable interface themes for different work environments
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Collapsible Sidebar:</strong> Space-efficient navigation with expandable menu options
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Interactive Elements:</strong> Hover effects, tooltips, and clickable data points for enhanced user experience
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Export Capabilities:</strong> Download reports and visualizations for external use
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color={colors.greenAccent[500]} variant="h5">
            Data Sources & Integration
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
            Comprehensive data integration from multiple healthcare sources:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Health Authority Data:</strong> Real-time data from BC health authorities and facilities
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Geographic Data:</strong> CHSA (Community Health Service Area) boundaries and demographic information
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Cost Data:</strong> Transportation, equipment, and personnel cost databases
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>Patient Outcomes:</strong> Clinical data and patient satisfaction metrics
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              <strong>External Files:</strong> Excel and CSV file import capabilities for custom analysis
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default FAQ;
