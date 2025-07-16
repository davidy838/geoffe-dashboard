import React, { useState, useEffect, useRef } from "react";
import { 
  Box, 
  Typography, 
  useTheme, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid, 
  IconButton, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import AddLocationIcon from "@mui/icons-material/AddLocation";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MapIcon from "@mui/icons-material/Map";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import RouteIcon from "@mui/icons-material/Route";
import DirectionsIcon from "@mui/icons-material/Directions";
import ClearIcon from "@mui/icons-material/Clear";

// React Leaflet imports
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom CSS for Leaflet map
const mapStyles = `
  .leaflet-container {
    height: 100%;
    width: 100%;
    border-radius: 8px;
  }
  
  .leaflet-popup-content-wrapper {
    border-radius: 8px;
  }
  
  .leaflet-popup-content {
    margin: 8px 12px;
  }
  
  .custom-marker {
    background: transparent;
    border: none;
  }
  
  .leaflet-control-zoom {
    border: none !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
  }
  
  .leaflet-control-zoom a {
    background-color: white !important;
    color: #333 !important;
    border: 1px solid #ccc !important;
  }
  
  .leaflet-control-zoom a:hover {
    background-color: #f8f9fa !important;
  }
  
  .leaflet-routing-container {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    max-width: 300px;
  }
  
  .leaflet-routing-container h2 {
    font-size: 14px;
    margin: 8px 12px;
    color: #333;
  }
  
  .leaflet-routing-alt {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .leaflet-routing-alt h3 {
    font-size: 12px;
    margin: 4px 8px;
    color: #666;
  }
  
  .leaflet-routing-alt tr {
    font-size: 11px;
  }
`;

// Routing Component
const RoutingControl = ({ waypoints, onRouteFound }) => {
  const map = useMap();
  const routeSegmentsRef = useRef(new Map()); // Store individual route segments
  const waypointsRef = useRef(waypoints);
  const isUpdatingRef = useRef(false);
  const previousWaypointsRef = useRef(null);

  // Update waypoints ref when waypoints change
  useEffect(() => {
    waypointsRef.current = waypoints;
  }, [waypoints]);

  useEffect(() => {
    console.log('RoutingControl: waypoints changed', waypoints.map(wp => wp.name));
    console.log('Previous waypoints:', previousWaypointsRef.current?.map(wp => wp.name));
    
    // Prevent multiple simultaneous updates
    if (isUpdatingRef.current) {
      console.log('Update already in progress, skipping');
      return;
    }
    
    // Check if waypoints actually changed (not just reference)
    const waypointsChanged = !previousWaypointsRef.current || 
      previousWaypointsRef.current.length !== waypoints.length ||
      !previousWaypointsRef.current.every((wp, index) => wp.id === waypoints[index]?.id);
    
    console.log('Waypoints changed:', waypointsChanged);
    
    if (!waypointsChanged) {
      console.log('No actual waypoint changes, skipping update');
      return;
    }
    
    // Store the previous waypoints before updating
    const oldWaypoints = previousWaypointsRef.current;
    previousWaypointsRef.current = waypoints;
    
    // Clear route info if not enough waypoints
    if (!waypoints || waypoints.length < 2) {
      console.log('Not enough waypoints, clearing all routes');
      clearAllRoutes();
      onRouteFound(null);
      return;
    }
    
    // Update routes efficiently
    updateRoutes(oldWaypoints);

    async function updateRoutes(oldWaypoints) {
      try {
        isUpdatingRef.current = true;
        
        // Clear existing routes that are no longer valid
        clearInvalidRoutes(oldWaypoints);
        
        // Calculate routes between consecutive waypoints
        const routePromises = [];
        
        for (let i = 0; i < waypoints.length - 1; i++) {
          const from = waypoints[i];
          const to = waypoints[i + 1];
          const segmentKey = `${from.id}-${to.id}`;
          
          // Only create route if it doesn't already exist
          if (!routeSegmentsRef.current.has(segmentKey)) {
            console.log(`Creating new route segment: ${segmentKey}`);
            const routePromise = createRouteSegment(from, to, segmentKey);
            routePromises.push(routePromise);
          } else {
            console.log(`Route segment already exists: ${segmentKey}`);
          }
        }
        
        // Wait for all new route segments to be created
        if (routePromises.length > 0) {
          await Promise.all(routePromises);
        }
        
        // Check if waypoints haven't changed during the update
        if (waypointsRef.current !== waypoints) {
          console.log('Waypoints changed during route update, aborting');
          return;
        }
        
        // Calculate total distance and duration
        let totalDistance = 0;
        let totalDuration = 0;
        
        for (const [key, segment] of routeSegmentsRef.current) {
          if (segment.distance && segment.duration) {
            totalDistance += segment.distance;
            totalDuration += segment.duration;
          }
        }
        
        // Update route info
        if (totalDistance > 0 && totalDuration > 0) {
          onRouteFound({
            distance: totalDistance,
            duration: totalDuration,
            coordinates: [] // We don't need to track all coordinates for the summary
          });
        }
        
      } catch (error) {
        console.error('Error updating routes:', error);
        createFallbackRoutes();
      } finally {
        isUpdatingRef.current = false;
      }
    }

    async function createRouteSegment(from, to, segmentKey) {
      try {
        console.log(`Creating route segment: ${from.name} to ${to.name}`);
        
        // Build coordinates string for OSRM API
        const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`;
        
        // Call OSRM API directly
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`
        );
        
        if (!response.ok) {
          throw new Error(`OSRM API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if waypoints haven't changed during the API call
        if (waypointsRef.current !== waypoints) {
          console.log('Waypoints changed during API call, aborting');
          return;
        }
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          
          // Create polyline from the road route geometry
          const polyline = L.geoJSON(route.geometry, {
            style: {
              color: '#2196F3',
              weight: 6,
              opacity: 0.8
            }
          }).addTo(map);
          
          // Store the segment information
          routeSegmentsRef.current.set(segmentKey, {
            polyline: polyline,
            distance: route.distance,
            duration: route.duration,
            from: from,
            to: to
          });
          
          console.log(`Route segment created: ${from.name} to ${to.name}`);
        } else {
          throw new Error('No route found in OSRM response');
        }
        
      } catch (error) {
        console.error(`Error creating route segment ${segmentKey}:`, error);
        // Create fallback segment
        createFallbackSegment(from, to, segmentKey);
      }
    }

    function createFallbackSegment(from, to, segmentKey) {
      try {
        console.log(`Creating fallback segment: ${from.name} to ${to.name}`);
        
        // Create a simple polyline connecting the two points
        const coordinates = [[from.lat, from.lng], [to.lat, to.lng]];
        const polyline = L.polyline(coordinates, {
          color: '#FF9800',
          weight: 4,
          opacity: 0.6,
          dashArray: '10, 10'
        }).addTo(map);

        // Calculate approximate distance
        const distance = map.distance([from.lat, from.lng], [to.lat, to.lng]);
        const duration = distance / 50000 * 3600; // Rough estimate: 50 km/h average

        // Store the segment information
        routeSegmentsRef.current.set(segmentKey, {
          polyline: polyline,
          distance: distance,
          duration: duration,
          from: from,
          to: to
        });

        console.log(`Fallback segment created: ${from.name} to ${to.name}`);

      } catch (error) {
        console.error(`Error creating fallback segment ${segmentKey}:`, error);
      }
    }

    function createFallbackRoutes() {
      try {
        console.log('Creating fallback routes for all waypoints');
        
        // Create simple polylines connecting consecutive waypoints
        for (let i = 0; i < waypoints.length - 1; i++) {
          const from = waypoints[i];
          const to = waypoints[i + 1];
          const segmentKey = `${from.id}-${to.id}`;
          
          createFallbackSegment(from, to, segmentKey);
        }

        // Calculate total distance and duration
        let totalDistance = 0;
        let totalDuration = 0;
        
        for (const [key, segment] of routeSegmentsRef.current) {
          if (segment.distance && segment.duration) {
            totalDistance += segment.distance;
            totalDuration += segment.duration;
          }
        }
        
        onRouteFound({
          distance: totalDistance,
          duration: totalDuration,
          coordinates: []
        });

        console.log('Fallback routes created');

      } catch (error) {
        console.error('Error creating fallback routes:', error);
      }
    }

    function clearAllRoutes() {
      // Remove all route segments
      for (const [key, segment] of routeSegmentsRef.current) {
        if (segment.polyline) {
          map.removeLayer(segment.polyline);
        }
      }
      routeSegmentsRef.current.clear();
    }

    function clearInvalidRoutes(oldWaypoints) {
      console.log('clearInvalidRoutes called with waypoints:', waypoints.map(wp => wp.name));
      console.log('Old waypoints:', oldWaypoints?.map(wp => wp.name));
      console.log('Current route segments:', Array.from(routeSegmentsRef.current.keys()));
      
      // Get current valid segment keys
      const validSegmentKeys = new Set();
      for (let i = 0; i < waypoints.length - 1; i++) {
        const from = waypoints[i];
        const to = waypoints[i + 1];
        const segmentKey = `${from.id}-${to.id}`;
        validSegmentKeys.add(segmentKey);
      }
      
      console.log('Valid segment keys:', Array.from(validSegmentKeys));
      
      // Remove segments that are no longer valid
      const segmentsToRemove = [];
      for (const [key, segment] of routeSegmentsRef.current) {
        if (!validSegmentKeys.has(key)) {
          segmentsToRemove.push(key);
        }
      }
      
      console.log('Segments to remove:', segmentsToRemove);
      
      // Remove the invalid segments
      for (const key of segmentsToRemove) {
        console.log(`Removing invalid route segment: ${key}`);
        const segment = routeSegmentsRef.current.get(key);
        if (segment && segment.polyline) {
          map.removeLayer(segment.polyline);
          console.log(`Removed polyline from map for segment: ${key}`);
        }
        routeSegmentsRef.current.delete(key);
        console.log(`Deleted segment from tracking: ${key}`);
      }
      
      console.log('Remaining route segments:', Array.from(routeSegmentsRef.current.keys()));
    }

    return () => {
      clearAllRoutes();
    };
  }, [waypoints, map, onRouteFound]);

  return null;
}

const ClinicMap = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Routing state
  const [routeWaypoints, setRouteWaypoints] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);

  // Clinic form state
  const [clinicForm, setClinicForm] = useState({
    name: '',
    type: '',
    latitude: '',
    longitude: '',
    address: '',
    description: ''
  });

  // Clinic types with colors
  const clinicTypes = [
    { value: 'primary', label: 'Primary Care', color: '#4CAF50' },
    { value: 'specialty', label: 'Specialty Clinic', color: '#2196F3' },
    { value: 'urgent', label: 'Urgent Care', color: '#FF9800' },
    { value: 'emergency', label: 'Emergency', color: '#F44336' },
    { value: 'diagnostic', label: 'Diagnostic Center', color: '#9C27B0' },
    { value: 'rehabilitation', label: 'Rehabilitation', color: '#00BCD4' },
    { value: 'mental_health', label: 'Mental Health', color: '#795548' },
    { value: 'pediatric', label: 'Pediatric', color: '#E91E63' }
  ];

  // Sample clinic data with real BC coordinates
  const sampleClinics = [
    {
      id: 1,
      name: 'Vancouver General Hospital',
      type: 'emergency',
      latitude: 49.2619,
      longitude: -123.1234,
      address: '855 West 12th Avenue, Vancouver',
      description: 'Major hospital with emergency services'
    },
    {
      id: 2,
      name: 'BC Children\'s Hospital',
      type: 'pediatric',
      latitude: 49.2488,
      longitude: -123.1190,
      address: '4480 Oak Street, Vancouver',
      description: 'Specialized pediatric care'
    },
    {
      id: 3,
      name: 'St. Paul\'s Hospital',
      type: 'specialty',
      latitude: 49.2794,
      longitude: -123.1298,
      address: '1081 Burrard Street, Vancouver',
      description: 'Specialty medical services'
    },
    {
      id: 4,
      name: 'Royal Jubilee Hospital',
      type: 'emergency',
      latitude: 48.4284,
      longitude: -123.3656,
      address: '1952 Bay Street, Victoria',
      description: 'Major hospital in Victoria'
    },
    {
      id: 5,
      name: 'Kelowna General Hospital',
      type: 'emergency',
      latitude: 49.8877,
      longitude: -119.4960,
      address: '2268 Pandosy Street, Kelowna',
      description: 'Major hospital in the Okanagan'
    },
    {
      id: 6,
      name: 'Royal Inland Hospital',
      type: 'emergency',
      latitude: 50.6745,
      longitude: -120.3273,
      address: '311 Columbia Street, Kamloops',
      description: 'Major hospital in Kamloops'
    }
  ];

  // Initialize with sample data
  useEffect(() => {
    setClinics(sampleClinics);
  }, []);

  // BC center coordinates
  const bcCenter = [54.0, -125.0];

  // Custom marker icons for different clinic types
  const createCustomIcon = (type) => {
    const clinicType = clinicTypes.find(t => t.value === type);
    const color = clinicType?.color || '#666666';
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          <span style="font-size: 8px;">🏥</span>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  const handleAddClinic = () => {
    setEditingClinic(null);
    setClinicForm({
      name: '',
      type: '',
      latitude: '',
      longitude: '',
      address: '',
      description: ''
    });
    setDialogOpen(true);
  };

  const handleEditClinic = (clinic) => {
    setEditingClinic(clinic);
    setClinicForm({
      name: clinic.name,
      type: clinic.type,
      latitude: clinic.latitude.toString(),
      longitude: clinic.longitude.toString(),
      address: clinic.address,
      description: clinic.description
    });
    setDialogOpen(true);
  };

  const handleDeleteClinic = (clinicId) => {
    setClinics(prev => prev.filter(clinic => clinic.id !== clinicId));
    setSnackbar({ open: true, message: 'Clinic deleted successfully', severity: 'success' });
  };

  const handleSaveClinic = () => {
    const { name, type, latitude, longitude, address, description } = clinicForm;
    
    if (!name || !type || !latitude || !longitude) {
      setSnackbar({ open: true, message: 'Please fill in all required fields', severity: 'error' });
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setSnackbar({ open: true, message: 'Please enter valid coordinates', severity: 'error' });
      return;
    }

    if (editingClinic) {
      // Update existing clinic
      setClinics(prev => prev.map(clinic => 
        clinic.id === editingClinic.id 
          ? { ...clinic, name, type, latitude: lat, longitude: lng, address, description }
          : clinic
      ));
      setSnackbar({ open: true, message: 'Clinic updated successfully', severity: 'success' });
    } else {
      // Add new clinic
      const newClinic = {
        id: Date.now(),
        name,
        type,
        latitude: lat,
        longitude: lng,
        address,
        description
      };
      setClinics(prev => [...prev, newClinic]);
      setSnackbar({ open: true, message: 'Clinic added successfully', severity: 'success' });
    }

    setDialogOpen(false);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getClinicTypeColor = (type) => {
    const clinicType = clinicTypes.find(t => t.value === type);
    return clinicType?.color || '#666666';
  };

  const getClinicTypeLabel = (type) => {
    const clinicType = clinicTypes.find(t => t.value === type);
    return clinicType?.label || type;
  };

  // Routing functions
  const addToRoute = (clinic) => {
    if (routeWaypoints.length >= 10) {
      setSnackbar({ open: true, message: 'Maximum 10 waypoints allowed', severity: 'warning' });
      return;
    }
    
    // Check if clinic is already in route
    if (routeWaypoints.some(wp => wp.id === clinic.id)) {
      setSnackbar({ open: true, message: 'Clinic already in route', severity: 'warning' });
      return;
    }
    
    const waypoint = {
      id: clinic.id,
      name: clinic.name,
      lat: clinic.latitude,
      lng: clinic.longitude,
      type: clinic.type
    };
    
    setRouteWaypoints(prev => [...prev, waypoint]);
    
    // Only show routing if we have 2 or more waypoints
    if (routeWaypoints.length >= 2) {
      // setShowRouting(true); // This state is removed
    }
  };

  const removeFromRoute = (waypointId) => {
    setRouteWaypoints(prev => {
      const newWaypoints = prev.filter(wp => wp.id !== waypointId);
      
      // Clear route info if less than 2 waypoints
      if (newWaypoints.length < 2) {
        setRouteInfo(null);
      }
      
      return newWaypoints;
    });
  };

  const clearRoute = () => {
    setRouteWaypoints([]);
    setRouteInfo(null);
  };

  const onRouteFound = (routeData) => {
    // If routeData is null, clear the route info
    if (routeData === null) {
      setRouteInfo(null);
      return;
    }
    
    // Only set route info if we still have 2+ waypoints
    if (routeWaypoints.length >= 2) {
      setRouteInfo(routeData);
    }
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Box m="20px">
      {/* Inject custom CSS */}
      <style>{mapStyles}</style>
      
      <Header 
        title="BC CLINIC MAP" 
        subtitle="Interactive map of healthcare facilities across British Columbia" 
      />

      <Grid container spacing={3}>
        {/* Map Section */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '70vh', backgroundColor: colors.primary[400] }}>
            <CardContent sx={{ p: 0, height: '100%', position: 'relative' }}>
              <Box sx={{ height: '100%', width: '100%' }}>
                <MapContainer
                  center={bcCenter}
                  zoom={6}
                  style={{ height: '100%', width: '100%', borderRadius: '8px' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Clinic markers */}
                  {clinics.map((clinic) => (
                    <Marker
                      key={clinic.id}
                      position={[clinic.latitude, clinic.longitude]}
                      icon={createCustomIcon(clinic.type)}
                      eventHandlers={{
                        click: () => setSelectedClinic(clinic),
                      }}
                    >
                      <Popup>
                        <Box sx={{ minWidth: 200 }}>
                          <Typography variant="h6" fontWeight="bold" mb={1}>
                            {clinic.name}
                          </Typography>
                          <Chip
                            label={getClinicTypeLabel(clinic.type)}
                            size="small"
                            sx={{
                              backgroundColor: getClinicTypeColor(clinic.type),
                              color: 'white',
                              mb: 1
                            }}
                          />
                          <Typography variant="body2" mb={1}>
                            {clinic.address}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {clinic.description}
                          </Typography>
                          <Box mt={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleEditClinic(clinic)}
                              sx={{ mr: 1 }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleDeleteClinic(clinic.id)}
                            >
                              Delete
                            </Button>
                          </Box>
                          <Box mt={1}>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<RouteIcon />}
                              onClick={() => addToRoute(clinic)}
                              sx={{
                                backgroundColor: colors.blueAccent[600],
                                color: 'white',
                                '&:hover': { backgroundColor: colors.blueAccent[700] }
                              }}
                            >
                              Add to Route
                            </Button>
                          </Box>
                        </Box>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Routing Control */}
                  {routeWaypoints.length >= 2 && (
                    <RoutingControl 
                      waypoints={routeWaypoints} 
                      onRouteFound={onRouteFound}
                    />
                  )}
                </MapContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Controls Section */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={2}>
            {/* Add Clinic Button */}
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddLocationIcon />}
                onClick={handleAddClinic}
                sx={{
                  backgroundColor: colors.greenAccent[600],
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  padding: '12px',
                  '&:hover': { backgroundColor: colors.greenAccent[700] }
                }}
              >
                Add New Clinic
              </Button>
            </Grid>

            {/* Route Controls */}
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: colors.primary[400] }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" color="grey.100" display="flex" alignItems="center">
                      <RouteIcon sx={{ mr: 1, color: colors.blueAccent[500] }} />
                      Route Planning
                    </Typography>
                    {routeWaypoints.length > 0 && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ClearIcon />}
                        onClick={clearRoute}
                        sx={{ color: colors.redAccent[300], borderColor: colors.redAccent[300] }}
                      >
                        Clear
                      </Button>
                    )}
                  </Box>
                  
                  {routeWaypoints.length === 0 ? (
                    <Typography variant="body2" color="grey.400" textAlign="center">
                      Click on clinic markers and select "Add to Route" to plan a route
                    </Typography>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="grey.300" mb={1}>
                        Route Waypoints ({routeWaypoints.length}/10):
                      </Typography>
                      <List dense>
                        {routeWaypoints.map((waypoint, index) => (
                          <ListItem key={waypoint.id} sx={{ px: 0, py: 0.5 }}>
                            <ListItemText
                              primary={
                                <Typography variant="body2" color="grey.100" fontWeight="bold">
                                  {index + 1}. {waypoint.name}
                                </Typography>
                              }
                            />
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip
                                label={getClinicTypeLabel(waypoint.type)}
                                size="small"
                                sx={{
                                  backgroundColor: getClinicTypeColor(waypoint.type),
                                  color: 'white',
                                  fontSize: '10px',
                                  height: '18px'
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => removeFromRoute(waypoint.id)}
                                sx={{ color: colors.redAccent[300] }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                      
                      {routeInfo && routeWaypoints.length >= 2 && (
                        <Box mt={2} p={2} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
                          <Typography variant="h6" color="grey.100" mb={1}>
                            Route Summary
                          </Typography>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="grey.300">
                                Distance:
                              </Typography>
                              <Typography variant="body1" color="grey.100" fontWeight="bold">
                                {formatDistance(routeInfo.distance)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="grey.300">
                                Duration:
                              </Typography>
                              <Typography variant="body1" color="grey.100" fontWeight="bold">
                                {formatDuration(routeInfo.duration)}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                      
                      {routeWaypoints.length === 1 && (
                        <Box mt={2} p={2} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
                          <Typography variant="body2" color="grey.300" textAlign="center">
                            Add another clinic to see route distance and duration
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Clinic Type Legend */}
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: colors.primary[400] }}>
                <CardContent>
                  <Typography variant="h6" color="grey.100" mb={2} display="flex" alignItems="center">
                    <MapIcon sx={{ mr: 1, color: colors.blueAccent[500] }} />
                    Clinic Types
                  </Typography>
                  <Grid container spacing={1}>
                    {clinicTypes.map((type) => (
                      <Grid item xs={6} key={type.value}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: type.color,
                              border: '2px solid white',
                              mr: 1
                            }}
                          />
                          <Typography variant="caption" color="grey.300">
                            {type.label}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Clinics List */}
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: colors.primary[400], maxHeight: '300px', overflow: 'auto' }}>
                <CardContent>
                  <Typography variant="h6" color="grey.100" mb={2} display="flex" alignItems="center">
                    <LocationOnIcon sx={{ mr: 1, color: colors.blueAccent[500] }} />
                    Clinics ({clinics.length})
                  </Typography>
                  <List dense>
                    {clinics.map((clinic) => (
                      <ListItem key={clinic.id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Typography variant="body2" color="grey.100" fontWeight="bold">
                              {clinic.name}
                            </Typography>
                          }
                        />
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={getClinicTypeLabel(clinic.type)}
                            size="small"
                            sx={{
                              backgroundColor: getClinicTypeColor(clinic.type),
                              color: 'white',
                              fontSize: '10px',
                              height: '20px'
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleEditClinic(clinic)}
                            sx={{ color: colors.blueAccent[300] }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClinic(clinic.id)}
                            sx={{ color: colors.redAccent[300] }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Add/Edit Clinic Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingClinic ? 'Edit Clinic' : 'Add New Clinic'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Clinic Name"
                value={clinicForm.name}
                onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Clinic Type</InputLabel>
                <Select
                  value={clinicForm.type}
                  onChange={(e) => setClinicForm({ ...clinicForm, type: e.target.value })}
                  label="Clinic Type"
                >
                  {clinicTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box display="flex" alignItems="center">
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: type.color,
                            mr: 1
                          }}
                        />
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                value={clinicForm.latitude}
                onChange={(e) => setClinicForm({ ...clinicForm, latitude: e.target.value })}
                required
                inputProps={{ step: "any" }}
                helperText="e.g., 49.2619"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                value={clinicForm.longitude}
                onChange={(e) => setClinicForm({ ...clinicForm, longitude: e.target.value })}
                required
                inputProps={{ step: "any" }}
                helperText="e.g., -123.1234"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={clinicForm.address}
                onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={clinicForm.description}
                onChange={(e) => setClinicForm({ ...clinicForm, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveClinic} variant="contained">
            {editingClinic ? 'Update' : 'Add'} Clinic
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default ClinicMap; 