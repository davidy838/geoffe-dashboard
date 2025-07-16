import React, { useState } from "react";
import { 
  Box, 
  Typography, 
  useTheme, 
  Card, 
  CardContent, 
  Button, 
  Grid, 
  Paper,
  Container,
  Dialog,
  DialogContent,
  IconButton
} from "@mui/material";
import { tokens } from "../../theme";
import { useNavigate } from "react-router-dom";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MapIcon from '@mui/icons-material/Map';
import CalculateIcon from '@mui/icons-material/Calculate';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import DownloadIcon from '@mui/icons-material/Download';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import HandshakeIcon from '@mui/icons-material/Handshake';
import CloseIcon from '@mui/icons-material/Close';

const TitlePage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);

  // Reference images from public folder
  const picture1 = '/0D2D266E-9D8E-4817-B1BF-8A79D003E1ED.jpeg';
  const picture2 = '/0E099B3C-2517-4C04-BC11-E921AF3B4D27.jpeg';

  const heidiCalculationExample = {
    image: '/B7B-starting-example.jpeg',
    title: "Heidi Calculation Example",
    description: "HEiDi (HealthLink BC Emergency iDoctor-in-assistance) is a physician support service for HealthLink BC 8-1-1. This service provides free health information for patients with non-emergency health inquiries, with HEiDi physicians assisting 8-1-1 nurses with urgent health inquiries. HEiDi physicians give patients just-in-time information and comfort, and ensure appropriate triage to health services. This discerning triage decreases ED wait times and can safely refer patients back to their family physicians. HEiDi provides 8-1-1 support from 10am-10pm daily. Through GEOFFE, we analyzed how much HEiDi could save communities by reducing unnecessary emergency department visits and improving healthcare access efficiency."
  };

  const features = [
    {
      icon: <CalculateIcon sx={{ fontSize: 40, color: colors.blueAccent[500] }} />,
      title: "Default Costs",
      description: "View how GEOFFE calculates patient-paid costs for accessing different health services by health authority.",
      color: colors.blueAccent[500]
    },
    {
      icon: <MapIcon sx={{ fontSize: 40, color: colors.greenAccent[500] }} />,
      title: "Community Map",
      description: "View interactive maps of costs, travel distances/durations, and carbon emissions by BC Community Health Service Areas (CHSA).",
      color: colors.greenAccent[500]
    },
    {
      icon: <CalculateIcon sx={{ fontSize: 40, color: colors.redAccent[500] }} />,
      title: "Custom Costs Calculator",
      description: "Input your own cost parameters to estimate the costs paid by patients in various scenarios.",
      color: colors.redAccent[500]
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40, color: colors.blueAccent[400] }} />,
      title: "Intervention Comparator",
      description: "Simulate a study by inputting your own service parameters to estimate what patients pay in a group comparison.",
      color: colors.blueAccent[400]
    },
    {
      icon: <DownloadIcon sx={{ fontSize: 40, color: colors.grey[300] }} />,
      title: "Report Download",
      description: "Add your outputs from GEOFFE to a downloadable report on patient financial hardships and healthcare costs.",
      color: colors.grey[300]
    },
    {
      icon: <PeopleIcon sx={{ fontSize: 40, color: colors.greenAccent[400] }} />,
      title: "Medicine Wheel",
      description: "See how GEOFFE's cost estimates are integrated in the Indigenous Medicine Wheel to support decolonizing knowledge - *IN DEVELOPMENT*.",
      color: colors.greenAccent[400]
    }
  ];

  const collaborations = [
    {
      name: "UBC",
      description: "University of British Columbia researchers"
    },
    {
      name: "First Nations Health Authority",
      description: "Indigenous health leadership and expertise"
    },
    {
      name: "RCCbc",
      description: "Rural Coordination Centre of BC"
    }
  ];

  const handleStartAnalysis = () => {
    navigate('/custom-map');
  };

  const handleImageClick = (imageSrc) => {
    setSelectedImage(imageSrc);
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  return (
    <Box m="20px">
      <Container maxWidth="xl">
        {/* Hero Section */}
        <Box 
          sx={{ 
            background: `linear-gradient(135deg, rgba(31, 42, 64, 0.2) 0%, rgba(20, 27, 45, 0.2) 100%), url('/geoffe-background.jpeg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            borderRadius: 4,
            p: 6,
            mb: 4,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <Typography 
            variant="h1" 
            color="grey.100" 
            fontWeight="bold" 
            mb={2}
            sx={{ 
              fontSize: { xs: '2.5rem', md: '4rem' },
              textShadow: '3px 3px 6px rgba(0,0,0,0.8)'
            }}
          >
            Welcome to GEOFFE!
          </Typography>
          
          <Typography 
            variant="h5" 
            color="grey.100" 
            mb={3}
            sx={{ 
              fontSize: { xs: '1.1rem', md: '1.5rem' },
              maxWidth: '900px',
              mx: 'auto',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              fontWeight: '500'
            }}
          >
            The Geospatial Economic Outcomes Framework for Equity (GEOFFE) platform is a set of economic methods to evaluate patient and family costs due to medical travel. This information may be used to evaluate new health policy or technology that can reduce the need to travel for medical reasons.
          </Typography>

          <Typography 
            variant="h6" 
            color="grey.100" 
            mb={4}
            sx={{ 
              fontSize: { xs: '1rem', md: '1.2rem' },
              maxWidth: '800px',
              mx: 'auto',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              fontWeight: '500'
            }}
          >
            Navigate to different sections using the menu above to explore GEOFFE's costs, community maps, and more.
          </Typography>

          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={handleStartAnalysis}
            sx={{
              backgroundColor: colors.greenAccent[600],
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              padding: '16px 32px',
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
              '&:hover': { 
                backgroundColor: colors.greenAccent[700],
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 25px rgba(0,0,0,0.8)'
              },
              transition: 'all 0.3s ease-in-out'
            }}
          >
            Create a travel scenario here
          </Button>
        </Box>

        {/* What is GEOFFE Section */}
        <Card sx={{ backgroundColor: colors.primary[400], mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h3" color="grey.100" mb={3} fontWeight="bold">
              What is GEOFFE?
            </Typography>
            <Typography variant="h6" color="grey.300" lineHeight={1.8}>
              The <strong>Geospatial Economic Outcomes Framework for Equity (GEOFFE)</strong> is an interactive platform designed to report on regional inequities in cost-sharing for healthcare across British Columbia. Our goal is to leverage data to provide insights for patients, policymakers, and researchers.
            </Typography>
          </CardContent>
        </Card>

        {/* Community Health Mapping Section - Large and Prominent */}
        <Typography variant="h3" color="grey.100" mb={3} fontWeight="bold">
          Community Health Mapping
        </Typography>
        <Card sx={{ backgroundColor: colors.primary[400], mb: 4 }}>
          <CardContent sx={{ p: 0 }}>
            <img 
              src={picture2} 
              alt="Community Health Mapping" 
              style={{ 
                width: '100%', 
                height: '500px', 
                objectFit: 'cover',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                cursor: 'pointer'
              }}
              onClick={() => handleImageClick(picture2)}
            />
            <Box sx={{ p: 6 }}>
              <Typography variant="h4" color="grey.100" mb={3} fontWeight="bold">
                Visualize Health Service Accessibility and Cost Distribution
              </Typography>
              <Typography variant="h6" color="grey.300" lineHeight={1.8}>
                Explore interactive maps that show healthcare costs, travel distances, durations, and carbon emissions across BC Community Health Service Areas (CHSA). Our comprehensive mapping tools help identify regional inequities and provide actionable insights for improving healthcare access and reducing patient financial burdens.
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Features Section */}
        <Typography variant="h3" color="grey.100" mb={3} fontWeight="bold">
          Features of GEOFFE
        </Typography>
        <Grid container spacing={3} mb={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card 
                sx={{ 
                  backgroundColor: colors.primary[400], 
                  height: '100%',
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                  }
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box mb={2}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" color="grey.100" mb={2} fontWeight="bold">
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="grey.300" lineHeight={1.6}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Photos Section */}
        <Typography variant="h3" color="grey.100" mb={3} fontWeight="bold">
          GEOFFE in Action
        </Typography>
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent sx={{ p: 0 }}>
                <img 
                  src={picture1} 
                  alt="GEOFFE Platform Screenshot 1" 
                  style={{ 
                    width: '100%', 
                    height: '400px', 
                    objectFit: 'cover',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleImageClick(picture1)}
                />
                <Box sx={{ p: 4 }}>
                  <Typography variant="h5" color="grey.100" mb={2} fontWeight="bold">
                    Interactive Cost Analysis
                  </Typography>
                  <Typography variant="body1" color="grey.300" lineHeight={1.6}>
                    Explore healthcare costs across different regions and demographics with our comprehensive analysis tools. Understand the financial impact of healthcare access and identify opportunities for cost optimization and improved patient outcomes.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Heidi Calculation Example Section */}
        <Typography variant="h3" color="grey.100" mb={3} fontWeight="bold">
          Heidi Calculation Example
        </Typography>
        <Card sx={{ backgroundColor: colors.primary[400], mb: 4 }}>
          <CardContent sx={{ p: 0 }}>
            <img 
              src={heidiCalculationExample.image} 
              alt="Heidi Calculation Example" 
              style={{ 
                width: '100%', 
                height: '400px', 
                objectFit: 'cover',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                cursor: 'pointer'
              }}
              onClick={() => handleImageClick(heidiCalculationExample.image)}
            />
            <Box sx={{ p: 4 }}>
              <Typography variant="h4" color="grey.100" mb={2} fontWeight="bold">
                {heidiCalculationExample.title}
              </Typography>
              <Typography variant="body1" color="grey.300" lineHeight={1.8}>
                {heidiCalculationExample.description}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Collaboration Section */}
        <Card sx={{ backgroundColor: colors.primary[400], mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <HandshakeIcon sx={{ fontSize: 40, color: colors.blueAccent[500], mr: 2 }} />
              <Typography variant="h3" color="grey.100" fontWeight="bold">
                Collaboration for Change
              </Typography>
            </Box>
            <Typography variant="h6" color="grey.300" mb={3} lineHeight={1.8}>
              GEOFFE is a collaboration between researchers at UBC, the First Nations Health Authority, and the Rural Coordination Centre of BC (RCCbc). We aim to provide actionable insights into healthcare costs relative to income and the cost of living.
            </Typography>
            
            <Grid container spacing={3}>
              {collaborations.map((collab, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Paper sx={{ p: 3, backgroundColor: colors.primary[500], textAlign: 'center' }}>
                    <Typography variant="h5" color="grey.100" mb={1} fontWeight="bold">
                      {collab.name}
                    </Typography>
                    <Typography variant="body2" color="grey.300">
                      {collab.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Community Engagement Section */}
        <Grid container spacing={4} mb={4}>
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: colors.primary[400], height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <PeopleIcon sx={{ fontSize: 40, color: colors.greenAccent[500], mr: 2 }} />
                  <Typography variant="h4" color="grey.100" fontWeight="bold">
                    Community Engagement
                  </Typography>
                </Box>
                <Typography variant="body1" color="grey.300" lineHeight={1.8}>
                  Our platform was developed with input from patients with lived experience, community planners, and cultural consultants. We held regular dialogue sessions with patients to ensure their experiences are reflected in our work.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: colors.primary[400], height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <SchoolIcon sx={{ fontSize: 40, color: colors.redAccent[500], mr: 2 }} />
                  <Typography variant="h4" color="grey.100" fontWeight="bold">
                    Knowledge Mobilization
                  </Typography>
                </Box>
                <Typography variant="body1" color="grey.300" lineHeight={1.8}>
                  We are committed to mobilizing knowledge and ensuring effective communication among research partners, engaging with community members to strengthen relationships and enhance the platform's impact.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Call to Action */}
        <Box 
          sx={{ 
            background: `linear-gradient(135deg, ${colors.greenAccent[600]} 0%, ${colors.greenAccent[700]} 100%)`,
            borderRadius: 4,
            p: 6,
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}
        >
          <Typography variant="h3" color="white" mb={3} fontWeight="bold">
            Ready to Explore Healthcare Costs?
          </Typography>
          <Typography variant="h6" color="white" mb={4} sx={{ opacity: 0.9 }}>
            Start your analysis with our interactive custom map and cost calculation tools
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={handleStartAnalysis}
            sx={{
              backgroundColor: 'white',
              color: colors.greenAccent[700],
              fontSize: '1.2rem',
              fontWeight: 'bold',
              padding: '16px 32px',
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              '&:hover': { 
                backgroundColor: 'white',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 25px rgba(0,0,0,0.3)'
              },
              transition: 'all 0.3s ease-in-out'
            }}
          >
            Create a travel scenario here
          </Button>
        </Box>
      </Container>

      {/* Image Dialog */}
      <Dialog open={!!selectedImage} onClose={handleCloseImage} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <img 
              src={selectedImage} 
              alt="Enlarged" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain'
              }}
            />
            <IconButton 
              sx={{ position: 'absolute', top: 10, right: 10, color: 'white', backgroundColor: 'rgba(0,0,0,0.5)' }} 
              onClick={handleCloseImage}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TitlePage; 