import { useState, useEffect } from "react";
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Divider,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Paper
} from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const CostParams = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [currentDashboardData, setCurrentDashboardData] = useState(null);
  const [calculatedImpact, setCalculatedImpact] = useState(null);
  const [formValues, setFormValues] = useState(initialValues);

  // API Base URL
  const API_BASE_URL = 'http://localhost:3001/api';

  // Fetch current dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/metrics`);
      if (response.ok) {
        const data = await response.json();
        setCurrentDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  // Calculate cost impact based on parameter changes
  const calculateCostImpact = (newValues, oldValues = initialValues) => {
    if (!currentDashboardData) return null;

    // Calculate more realistic multipliers with smaller impact
    const fuelCostMultiplier = 1 + ((newValues.costPerLiter - parseFloat(oldValues.costPerLiter)) / parseFloat(oldValues.costPerLiter)) * 0.3;
    const efficiencyMultiplier = 1 + ((parseFloat(oldValues.fuelEfficiency) - newValues.fuelEfficiency) / parseFloat(oldValues.fuelEfficiency)) * 0.2;
    const distanceCostMultiplier = 1 + ((newValues.costPerKm - parseFloat(oldValues.costPerKm)) / parseFloat(oldValues.costPerKm)) * 0.25;
    const timeCostMultiplier = 1 + ((newValues.driverHourlyRate - parseFloat(oldValues.driverHourlyRate)) / parseFloat(oldValues.driverHourlyRate)) * 0.15;
    const speedMultiplier = 1 + ((parseFloat(oldValues.averageSpeed) - newValues.averageSpeed) / parseFloat(oldValues.averageSpeed)) * 0.1;
    const waitTimeMultiplier = 1 + ((newValues.waitTimePerTrip - parseFloat(oldValues.waitTimePerTrip)) / parseFloat(oldValues.waitTimePerTrip)) * 0.1;
    const patientCostMultiplier = 1 + ((newValues.patientAccompanimentCost - parseFloat(oldValues.patientAccompanimentCost)) / parseFloat(oldValues.patientAccompanimentCost)) * 0.2;
    const productivityMultiplier = 1 + ((newValues.lostProductivityCost - parseFloat(oldValues.lostProductivityCost)) / parseFloat(oldValues.lostProductivityCost)) * 0.15;
    const caregivingMultiplier = 1 + ((newValues.informalCaregivingCost - parseFloat(oldValues.informalCaregivingCost)) / parseFloat(oldValues.informalCaregivingCost)) * 0.1;
    const parkingMultiplier = 1 + ((newValues.parkingCost - parseFloat(oldValues.parkingCost)) / parseFloat(oldValues.parkingCost)) * 0.05;
    const maintenanceMultiplier = 1 + ((newValues.vehicleMaintenanceCost - parseFloat(oldValues.vehicleMaintenanceCost)) / parseFloat(oldValues.vehicleMaintenanceCost)) * 0.1;
    const overheadMultiplier = 1 + ((newValues.administrativeOverhead - parseFloat(oldValues.administrativeOverhead)) / 100) * 0.2;

    // Calculate overall impact on total savings (all parameters affect this)
    const totalSavingsImpact = (
      fuelCostMultiplier * 
      efficiencyMultiplier * 
      distanceCostMultiplier * 
      timeCostMultiplier * 
      speedMultiplier * 
      waitTimeMultiplier * 
      patientCostMultiplier * 
      productivityMultiplier * 
      caregivingMultiplier * 
      parkingMultiplier * 
      maintenanceMultiplier * 
      overheadMultiplier
    );

    // Distance savings are primarily affected by travel-related parameters
    // Higher fuel costs and distance costs make travel more expensive, increasing distance savings
    // Better fuel efficiency reduces the need for travel, increasing distance savings
    const distanceSavingsImpact = 1 + 
      (fuelCostMultiplier - 1) * 0.4 +      // Fuel cost has high impact on distance decisions
      (efficiencyMultiplier - 1) * 0.3 +    // Efficiency affects travel decisions
      (distanceCostMultiplier - 1) * 0.3 +  // Direct distance-based costs
      (maintenanceMultiplier - 1) * 0.1;    // Maintenance costs affect travel decisions

    // Duration savings are affected by time-related parameters
    // Higher driver rates, slower speeds, and longer wait times make travel more time-expensive
    const durationSavingsImpact = 1 + 
      (timeCostMultiplier - 1) * 0.4 +      // Driver hourly rate affects time value
      (speedMultiplier - 1) * 0.3 +         // Average speed affects travel time
      (waitTimeMultiplier - 1) * 0.3;       // Wait time affects total duration

    // CO2 savings are primarily affected by fuel efficiency and travel decisions
    // Better efficiency reduces CO2 per km, but may increase total travel
    // Higher fuel costs may reduce travel, reducing CO2
    const co2SavingsImpact = 1 + 
      (efficiencyMultiplier - 1) * 0.5 +    // Efficiency directly affects CO2 per km
      (fuelCostMultiplier - 1) * 0.2 +      // Higher fuel costs may reduce travel
      (distanceCostMultiplier - 1) * 0.2 +  // Distance costs affect travel decisions
      (speedMultiplier - 1) * 0.1;          // Speed affects fuel consumption

    return {
      totalSavings: Math.round(currentDashboardData.totalSavings * totalSavingsImpact),
      totalDistanceSavings: Math.round(currentDashboardData.totalDistanceSavings * distanceSavingsImpact),
      totalDurationSavings: Math.round(currentDashboardData.totalDurationSavings * durationSavingsImpact),
      totalCO2Savings: Math.round(currentDashboardData.totalCO2Savings * co2SavingsImpact),
      multipliers: {
        fuelCost: fuelCostMultiplier,
        efficiency: efficiencyMultiplier,
        distanceCost: distanceCostMultiplier,
        timeCost: timeCostMultiplier,
        speed: speedMultiplier,
        waitTime: waitTimeMultiplier,
        patientCost: patientCostMultiplier,
        productivity: productivityMultiplier,
        caregiving: caregivingMultiplier,
        parking: parkingMultiplier,
        maintenance: maintenanceMultiplier,
        overhead: overheadMultiplier
      },
      impactBreakdown: {
        distanceFactors: {
          fuelCost: (fuelCostMultiplier - 1) * 0.4,
          efficiency: (efficiencyMultiplier - 1) * 0.3,
          distanceCost: (distanceCostMultiplier - 1) * 0.3,
          maintenance: (maintenanceMultiplier - 1) * 0.1
        },
        durationFactors: {
          timeCost: (timeCostMultiplier - 1) * 0.4,
          speed: (speedMultiplier - 1) * 0.3,
          waitTime: (waitTimeMultiplier - 1) * 0.3
        },
        co2Factors: {
          efficiency: (efficiencyMultiplier - 1) * 0.5,
          fuelCost: (fuelCostMultiplier - 1) * 0.2,
          distanceCost: (distanceCostMultiplier - 1) * 0.2,
          speed: (speedMultiplier - 1) * 0.1
        }
      }
    };
  };

  // Update dashboard with new calculated values
  const updateDashboardWithNewParams = async (newValues) => {
    try {
      const impact = calculateCostImpact(newValues);
      if (!impact) return;

      const updatedDashboardData = {
        ...currentDashboardData,
        totalSavings: impact.totalSavings,
        totalDistanceSavings: impact.totalDistanceSavings,
        totalDurationSavings: impact.totalDurationSavings,
        totalCO2Savings: impact.totalCO2Savings,
        lastUpdated: new Date().toISOString(),
        sourceFile: `Cost Parameters Update - ${new Date().toLocaleDateString()}`,
        costParameters: newValues
      };

      const response = await fetch(`${API_BASE_URL}/dashboard/metrics/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedDashboardData),
      });

      if (response.ok) {
        // Trigger dashboard update event for real-time refresh
        window.dispatchEvent(new CustomEvent('dashboard-update', {
          detail: {
            type: 'dashboard-update',
            data: updatedDashboardData
          }
        }));

        setCurrentDashboardData(updatedDashboardData);
        setCalculatedImpact(impact);
        setShowSuccess(true);
      } else {
        throw new Error('Failed to update dashboard');
      }
    } catch (error) {
      console.error('Error updating dashboard:', error);
      setShowError(true);
    }
  };

  const handleFormSubmit = async (values) => {
    console.log("Saving cost parameters:", values);
    await updateDashboardWithNewParams(values);
  };

  const handleReset = () => {
    setShowSuccess(false);
    setShowError(false);
    setCalculatedImpact(null);
  };

  // Load dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate impact when form values change
  useEffect(() => {
    const impact = calculateCostImpact(formValues);
    setCalculatedImpact(impact);
  }, [formValues, currentDashboardData]);

  return (
    <Box m="20px">
      <Header 
        title="COST CALCULATION PARAMETERS" 
        subtitle="Configure factors used in patient cost calculations" 
      />

      <Box mb="20px">
        <Alert severity="info" sx={{ mb: 2 }}>
          These parameters are used to calculate patient transportation costs, including fuel costs, 
          distance-based calculations, and other factors that impact the total cost of care pathways.
          Changes will automatically update the dashboard calculations.
        </Alert>
      </Box>

      {/* Current Dashboard Values */}
      {currentDashboardData && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'primary.400' }}>
          <Typography variant="h6" color="grey.100" mb={2} display="flex" alignItems="center">
            <TrendingUpIcon sx={{ mr: 1, color: 'greenAccent.500' }} />
            Current Dashboard Values
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="grey.300">Total Savings:</Typography>
              <Typography variant="h6" color="greenAccent.500">
                ${currentDashboardData.totalSavings?.toLocaleString() || '0'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="grey.300">Distance Savings:</Typography>
              <Typography variant="h6" color="blueAccent.500">
                {currentDashboardData.totalDistanceSavings?.toLocaleString() || '0'} km
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="grey.300">Duration Savings:</Typography>
              <Typography variant="h6" color="orangeAccent.500">
                {currentDashboardData.totalDurationSavings?.toLocaleString() || '0'} hours
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="grey.300">CO2 Savings:</Typography>
              <Typography variant="h6" color="greenAccent.400">
                {currentDashboardData.totalCO2Savings?.toLocaleString() || '0'} kg
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={costParamsSchema}
      >
        {({
          values,
          errors,
          touched,
          handleBlur,
          handleChange,
          handleSubmit,
          resetForm,
        }) => {
          // Update form values state when values change
          if (JSON.stringify(values) !== JSON.stringify(formValues)) {
            setFormValues(values);
          }

          return (
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Fuel and Transportation Costs */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%', backgroundColor: 'primary.400' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <LocalGasStationIcon sx={{ mr: 1, color: 'greenAccent.500' }} />
                        <Typography variant="h6" fontWeight="600" color="grey.100">
                          Fuel & Transportation
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      
                      <TextField
                        fullWidth
                        variant="filled"
                        type="number"
                        label="Cost per Liter of Fuel ($)"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.costPerLiter}
                        name="costPerLiter"
                        error={!!touched.costPerLiter && !!errors.costPerLiter}
                        helperText={touched.costPerLiter && errors.costPerLiter}
                        sx={{ mb: 2 }}
                      />
                      
                      <TextField
                        fullWidth
                        variant="filled"
                        type="number"
                        label="Vehicle Fuel Efficiency (L/100km)"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.fuelEfficiency}
                        name="fuelEfficiency"
                        error={!!touched.fuelEfficiency && !!errors.fuelEfficiency}
                        helperText={touched.fuelEfficiency && errors.fuelEfficiency}
                        sx={{ mb: 2 }}
                      />
                      
                      <TextField
                        fullWidth
                        variant="filled"
                        type="number"
                        label="Cost per Kilometer ($)"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.costPerKm}
                        name="costPerKm"
                        error={!!touched.costPerKm && !!errors.costPerKm}
                        helperText={touched.costPerKm && errors.costPerKm}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Time and Labor Costs */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%', backgroundColor: 'primary.400' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <AccessTimeIcon sx={{ mr: 1, color: 'blueAccent.500' }} />
                        <Typography variant="h6" fontWeight="600" color="grey.100">
                          Time & Labor
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      
                      <TextField
                        fullWidth
                        variant="filled"
                        type="number"
                        label="Driver Hourly Rate ($/hour)"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.driverHourlyRate}
                        name="driverHourlyRate"
                        error={!!touched.driverHourlyRate && !!errors.driverHourlyRate}
                        helperText={touched.driverHourlyRate && errors.driverHourlyRate}
                        sx={{ mb: 2 }}
                      />
                      
                      <TextField
                        fullWidth
                        variant="filled"
                        type="number"
                        label="Average Speed (km/h)"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.averageSpeed}
                        name="averageSpeed"
                        error={!!touched.averageSpeed && !!errors.averageSpeed}
                        helperText={touched.averageSpeed && errors.averageSpeed}
                        sx={{ mb: 2 }}
                      />
                      
                      <TextField
                        fullWidth
                        variant="filled"
                        type="number"
                        label="Wait Time per Trip (minutes)"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.waitTimePerTrip}
                        name="waitTimePerTrip"
                        error={!!touched.waitTimePerTrip && !!errors.waitTimePerTrip}
                        helperText={touched.waitTimePerTrip && errors.waitTimePerTrip}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Patient and Care Costs */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%', backgroundColor: 'primary.400' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <PersonIcon sx={{ mr: 1, color: 'redAccent.500' }} />
                        <Typography variant="h6" fontWeight="600" color="grey.100">
                          Patient & Care
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      
                      <TextField
                        fullWidth
                        variant="filled"
                        type="number"
                        label="Patient Accompaniment Cost ($/trip)"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.patientAccompanimentCost}
                        name="patientAccompanimentCost"
                        error={!!touched.patientAccompanimentCost && !!errors.patientAccompanimentCost}
                        helperText={touched.patientAccompanimentCost && errors.patientAccompanimentCost}
                        sx={{ mb: 2 }}
                      />
                      
                      <TextField
                        fullWidth
                        variant="filled"
                        type="number"
                        label="Lost Productivity Cost ($/hour)"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.lostProductivityCost}
                        name="lostProductivityCost"
                        error={!!touched.lostProductivityCost && !!errors.lostProductivityCost}
                        helperText={touched.lostProductivityCost && errors.lostProductivityCost}
                        sx={{ mb: 2 }}
                      />
                      
                      <TextField
                        fullWidth
                        variant="filled"
                        type="number"
                        label="Informal Caregiving Cost ($/hour)"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.informalCaregivingCost}
                        name="informalCaregivingCost"
                        error={!!touched.informalCaregivingCost && !!errors.informalCaregivingCost}
                        helperText={touched.informalCaregivingCost && errors.informalCaregivingCost}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Additional Costs */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%', backgroundColor: 'primary.400' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <AttachMoneyIcon sx={{ mr: 1, color: 'greenAccent.500' }} />
                        <Typography variant="h6" fontWeight="600" color="grey.100">
                          Additional Costs
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      
                      <TextField
                        fullWidth
                        variant="filled"
                        type="number"
                        label="Parking Cost ($/visit)"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.parkingCost}
                        name="parkingCost"
                        error={!!touched.parkingCost && !!errors.parkingCost}
                        helperText={touched.parkingCost && errors.parkingCost}
                        sx={{ mb: 2 }}
                      />
                      
                      <TextField
                        fullWidth
                        variant="filled"
                        type="number"
                        label="Vehicle Maintenance Cost ($/km)"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.vehicleMaintenanceCost}
                        name="vehicleMaintenanceCost"
                        error={!!touched.vehicleMaintenanceCost && !!errors.vehicleMaintenanceCost}
                        helperText={touched.vehicleMaintenanceCost && errors.vehicleMaintenanceCost}
                        sx={{ mb: 2 }}
                      />
                      
                      <TextField
                        fullWidth
                        variant="filled"
                        type="number"
                        label="Administrative Overhead (%)"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.administrativeOverhead}
                        name="administrativeOverhead"
                        error={!!touched.administrativeOverhead && !!errors.administrativeOverhead}
                        helperText={touched.administrativeOverhead && errors.administrativeOverhead}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Calculated Impact Preview */}
              {calculatedImpact && currentDashboardData && (
                <Paper sx={{ p: 2, mt: 3, backgroundColor: 'primary.400' }}>
                  <Typography variant="h6" color="grey.100" mb={2} display="flex" alignItems="center">
                    <TrendingUpIcon sx={{ mr: 1, color: 'blueAccent.500' }} />
                    Projected Dashboard Impact
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="grey.300">New Total Savings:</Typography>
                      <Typography variant="h6" color="greenAccent.500">
                        ${calculatedImpact.totalSavings?.toLocaleString() || '0'}
                      </Typography>
                      <Typography variant="caption" color="grey.400">
                        {calculatedImpact.totalSavings > currentDashboardData.totalSavings ? '+' : ''}
                        {((calculatedImpact.totalSavings - currentDashboardData.totalSavings) / currentDashboardData.totalSavings * 100).toFixed(1)}% change
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="grey.300">New Distance Savings:</Typography>
                      <Typography variant="h6" color="blueAccent.500">
                        {calculatedImpact.totalDistanceSavings?.toLocaleString() || '0'} km
                      </Typography>
                      <Typography variant="caption" color="grey.400">
                        {calculatedImpact.totalDistanceSavings > currentDashboardData.totalDistanceSavings ? '+' : ''}
                        {((calculatedImpact.totalDistanceSavings - currentDashboardData.totalDistanceSavings) / currentDashboardData.totalDistanceSavings * 100).toFixed(1)}% change
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="grey.300">New Duration Savings:</Typography>
                      <Typography variant="h6" color="orangeAccent.500">
                        {calculatedImpact.totalDurationSavings?.toLocaleString() || '0'} hours
                      </Typography>
                      <Typography variant="caption" color="grey.400">
                        {calculatedImpact.totalDurationSavings > currentDashboardData.totalDurationSavings ? '+' : ''}
                        {((calculatedImpact.totalDurationSavings - currentDashboardData.totalDurationSavings) / currentDashboardData.totalDurationSavings * 100).toFixed(1)}% change
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="grey.300">New CO2 Savings:</Typography>
                      <Typography variant="h6" color="greenAccent.400">
                        {calculatedImpact.totalCO2Savings?.toLocaleString() || '0'} kg
                      </Typography>
                      <Typography variant="caption" color="grey.400">
                        {calculatedImpact.totalCO2Savings > currentDashboardData.totalCO2Savings ? '+' : ''}
                        {((calculatedImpact.totalCO2Savings - currentDashboardData.totalCO2Savings) / currentDashboardData.totalCO2Savings * 100).toFixed(1)}% change
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Parameter Impact Breakdown */}
                  {calculatedImpact.impactBreakdown && (
                    <Box mt={3}>
                      <Typography variant="subtitle1" color="grey.100" mb={2}>
                        Parameter Impact Breakdown:
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="blueAccent.300" fontWeight="bold" mb={1}>
                            Distance Savings Factors:
                          </Typography>
                          <Box component="ul" sx={{ pl: 2, m: 0 }}>
                            <Typography component="li" variant="caption" color="grey.300">
                              Fuel Cost: {((calculatedImpact.impactBreakdown.distanceFactors.fuelCost) * 100).toFixed(1)}%
                            </Typography>
                            <Typography component="li" variant="caption" color="grey.300">
                              Fuel Efficiency: {((calculatedImpact.impactBreakdown.distanceFactors.efficiency) * 100).toFixed(1)}%
                            </Typography>
                            <Typography component="li" variant="caption" color="grey.300">
                              Distance Cost: {((calculatedImpact.impactBreakdown.distanceFactors.distanceCost) * 100).toFixed(1)}%
                            </Typography>
                            <Typography component="li" variant="caption" color="grey.300">
                              Maintenance: {((calculatedImpact.impactBreakdown.distanceFactors.maintenance) * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="orangeAccent.300" fontWeight="bold" mb={1}>
                            Duration Savings Factors:
                          </Typography>
                          <Box component="ul" sx={{ pl: 2, m: 0 }}>
                            <Typography component="li" variant="caption" color="grey.300">
                              Driver Rate: {((calculatedImpact.impactBreakdown.durationFactors.timeCost) * 100).toFixed(1)}%
                            </Typography>
                            <Typography component="li" variant="caption" color="grey.300">
                              Average Speed: {((calculatedImpact.impactBreakdown.durationFactors.speed) * 100).toFixed(1)}%
                            </Typography>
                            <Typography component="li" variant="caption" color="grey.300">
                              Wait Time: {((calculatedImpact.impactBreakdown.durationFactors.waitTime) * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="greenAccent.300" fontWeight="bold" mb={1}>
                            CO2 Savings Factors:
                          </Typography>
                          <Box component="ul" sx={{ pl: 2, m: 0 }}>
                            <Typography component="li" variant="caption" color="grey.300">
                              Fuel Efficiency: {((calculatedImpact.impactBreakdown.co2Factors.efficiency) * 100).toFixed(1)}%
                            </Typography>
                            <Typography component="li" variant="caption" color="grey.300">
                              Fuel Cost: {((calculatedImpact.impactBreakdown.co2Factors.fuelCost) * 100).toFixed(1)}%
                            </Typography>
                            <Typography component="li" variant="caption" color="grey.300">
                              Distance Cost: {((calculatedImpact.impactBreakdown.co2Factors.distanceCost) * 100).toFixed(1)}%
                            </Typography>
                            <Typography component="li" variant="caption" color="grey.300">
                              Speed: {((calculatedImpact.impactBreakdown.co2Factors.speed) * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Paper>
              )}

              {/* Action Buttons */}
              <Box display="flex" justifyContent="center" gap={2} mt="30px">
                <Tooltip title="Reset to default values">
                  <IconButton 
                    onClick={() => {
                      resetForm();
                      handleReset();
                    }}
                    sx={{ 
                      backgroundColor: 'grey.600',
                      color: 'white',
                      '&:hover': { backgroundColor: 'grey.700' }
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                
                <Button 
                  type="submit" 
                  variant="contained" 
                  startIcon={<SaveIcon />}
                  sx={{
                    backgroundColor: 'greenAccent.600',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    padding: '12px 30px',
                    '&:hover': { backgroundColor: 'greenAccent.700' }
                  }}
                >
                  Save Parameters & Update Dashboard
                </Button>
              </Box>
            </form>
          );
        }}
      </Formik>

      {/* Success/Error Messages */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Cost parameters saved successfully and dashboard updated!
        </Alert>
      </Snackbar>

      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowError(false)} severity="error" sx={{ width: '100%' }}>
          Error saving parameters. Please try again.
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Validation schema
const costParamsSchema = yup.object().shape({
  costPerLiter: yup.number().positive("Must be positive").required("Required"),
  fuelEfficiency: yup.number().positive("Must be positive").required("Required"),
  costPerKm: yup.number().positive("Must be positive").required("Required"),
  driverHourlyRate: yup.number().positive("Must be positive").required("Required"),
  averageSpeed: yup.number().positive("Must be positive").required("Required"),
  waitTimePerTrip: yup.number().min(0, "Cannot be negative").required("Required"),
  patientAccompanimentCost: yup.number().min(0, "Cannot be negative").required("Required"),
  lostProductivityCost: yup.number().min(0, "Cannot be negative").required("Required"),
  informalCaregivingCost: yup.number().min(0, "Cannot be negative").required("Required"),
  parkingCost: yup.number().min(0, "Cannot be negative").required("Required"),
  vehicleMaintenanceCost: yup.number().min(0, "Cannot be negative").required("Required"),
  administrativeOverhead: yup.number().min(0, "Cannot be negative").max(100, "Cannot exceed 100%").required("Required"),
});

// Initial values
const initialValues = {
  costPerLiter: "1.85",
  fuelEfficiency: "8.5",
  costPerKm: "0.45",
  driverHourlyRate: "25.00",
  averageSpeed: "60",
  waitTimePerTrip: "15",
  patientAccompanimentCost: "50.00",
  lostProductivityCost: "35.00",
  informalCaregivingCost: "20.00",
  parkingCost: "5.00",
  vehicleMaintenanceCost: "0.15",
  administrativeOverhead: "10",
};

export default CostParams; 