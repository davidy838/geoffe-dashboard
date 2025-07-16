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
  AccordionDetails,
  LinearProgress
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
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ScienceIcon from "@mui/icons-material/Science";
import CalculateIcon from '@mui/icons-material/Calculate';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import FunctionsIcon from '@mui/icons-material/Functions';

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

// Start Point to Labs Routes Component
const StartToLabsRoutes = ({ routes, showRoutes }) => {
  const map = useMap();
  const polylinesRef = useRef([]);

  useEffect(() => {
    // Clear existing polylines
    polylinesRef.current.forEach(polyline => {
      if (polyline && map.hasLayer(polyline)) {
        map.removeLayer(polyline);
      }
    });
    polylinesRef.current = [];

    if (!showRoutes || !routes || routes.length === 0) {
      return;
    }

    // Add new polylines - only show routes to closest labs (rank 1)
    routes.filter(route => route.rank === 1).forEach((route) => {
      let polyline;
      
      if (route.geometry) {
        // Create polyline from the road route geometry
        polyline = L.geoJSON(route.geometry, {
          style: {
            color: '#2196F3', // Solid blue color
            weight: 4,
            opacity: 0.8
          }
        });
      } else {
        // Fallback straight line
        const coordinates = [
          [route.from.latitude, route.from.longitude], 
          [route.to.latitude, route.to.longitude]
        ];
        polyline = L.polyline(coordinates, {
          color: '#2196F3', // Solid blue color
          weight: 3,
          opacity: 0.6
        });
      }
      
      polyline.addTo(map);
      polylinesRef.current.push(polyline);
    });

    // Cleanup function
    return () => {
      polylinesRef.current.forEach(polyline => {
        if (polyline && map.hasLayer(polyline)) {
          map.removeLayer(polyline);
        }
      });
      polylinesRef.current = [];
    };
  }, [routes, showRoutes, map]);

  return null;
};

const CustomMap = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode) || {};
  
  // Ensure colors object has fallback values
  const safeColors = {
    primary: {
      300: colors.primary?.[300] || '#0c101b',
      400: colors.primary?.[400] || '#1F2A40',
      500: colors.primary?.[500] || '#141b2d',
      600: colors.primary?.[600] || '#101624'
    },
    greenAccent: {
      300: colors.greenAccent?.[300] || '#2e7c67',
      400: colors.greenAccent?.[400] || '#3da58a',
      500: colors.greenAccent?.[500] || '#4cceac',
      600: colors.greenAccent?.[600] || '#70d8bd',
      700: colors.greenAccent?.[700] || '#94e2cd'
    },
    blueAccent: {
      300: colors.blueAccent?.[300] || '#a4a9fc',
      400: colors.blueAccent?.[400] || '#868dfb',
      500: colors.blueAccent?.[500] || '#6870fa',
      600: colors.blueAccent?.[600] || '#535ac8',
      700: colors.blueAccent?.[700] || '#3e4396'
    },
    redAccent: {
      300: colors.redAccent?.[300] || '#e99592',
      400: colors.redAccent?.[400] || '#e2726e',
      500: colors.redAccent?.[500] || '#db4f4a'
    }
  };
  
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Routing state
  const [routeWaypoints, setRouteWaypoints] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [startPointAddress, setStartPointAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // File upload state
  const [uploadedLabs, setUploadedLabs] = useState([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileUploadDialogOpen, setFileUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Start points upload state
  const [uploadedStartPoints, setUploadedStartPoints] = useState([]);
  const [isProcessingStartPointsFile, setIsProcessingStartPointsFile] = useState(false);
  const [startPointsUploadProgress, setStartPointsUploadProgress] = useState(0);
  const [isDragOverStartPoints, setIsDragOverStartPoints] = useState(false);

  // Encounters file upload state
  const [uploadedEncounters, setUploadedEncounters] = useState([]);
  const [isProcessingEncountersFile, setIsProcessingEncountersFile] = useState(false);
  const [encountersUploadProgress, setEncountersUploadProgress] = useState(0);
  const [isDragOverEncounters, setIsDragOverEncounters] = useState(false);
  const [encountersDialogOpen, setEncountersDialogOpen] = useState(false);
  const [selectedEncountersFile, setSelectedEncountersFile] = useState(null);

  // Start point to labs routing state
  const [showStartToLabsRoutes, setShowStartToLabsRoutes] = useState(false);
  const [startToLabsRoutes, setStartToLabsRoutes] = useState([]);
  const [isCalculatingStartToLabs, setIsCalculatingStartToLabs] = useState(false);
  const [startToLabsProgress, setStartToLabsProgress] = useState(0);
  const [startPointLabAnalysis, setStartPointLabAnalysis] = useState([]); // Store analysis for each start point

  // Cost calculation state
  const [showCostCalculation, setShowCostCalculation] = useState(false);
  const [costResults, setCostResults] = useState(null);
  const [costParams, setCostParams] = useState({
    wage: 30.54,
    meal: 0,
    parking: 3,
    duration: 0.25
  });

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
    { value: 'pediatric', label: 'Pediatric', color: '#E91E63' },
    { value: 'lab', label: 'Laboratory', color: '#607D8B' }
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

  // Handle global drag events to prevent default browser behavior
  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault();
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  // BC center coordinates
  const bcCenter = [54.0, -125.0];

  // Custom marker icons for different clinic types
  const createCustomIcon = (type) => {
    let color = '#666666';
    let icon = '🏥';
    
    if (type === 'start') {
      color = '#00FF00'; // Green for start point
      icon = '📍';
    } else if (type === 'lab') {
      color = '#607D8B'; // Blue-grey for labs
      icon = '🧪';
    } else {
      const clinicType = clinicTypes.find(t => t.value === type);
      color = clinicType?.color || '#666666';
      icon = '🏥';
    }
    
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
          <span style="font-size: 8px;">${icon}</span>
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
      // Check if editing a clinic or a lab
      if (editingClinic.id.startsWith('lab-')) {
        // Update uploaded lab
        setUploadedLabs(prev => prev.map(lab => 
          lab.id === editingClinic.id 
            ? { ...lab, name, type, latitude: lat, longitude: lng, address, description }
            : lab
        ));
        setSnackbar({ open: true, message: 'Lab updated successfully', severity: 'success' });
      } else {
        // Update existing clinic
        setClinics(prev => prev.map(clinic => 
          clinic.id === editingClinic.id 
            ? { ...clinic, name, type, latitude: lat, longitude: lng, address, description }
            : clinic
        ));
        setSnackbar({ open: true, message: 'Clinic updated successfully', severity: 'success' });
      }
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
    if (type === 'start') {
      return '#00FF00';
    }
    const clinicType = clinicTypes.find(t => t.value === type);
    return clinicType?.color || '#666666';
  };

  const getClinicTypeLabel = (type) => {
    if (type === 'start') {
      return 'Start Point';
    }
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

  // Geocoding and start point functions
  const geocodeAddress = async (address) => {
    if (!address.trim()) {
      setSnackbar({ open: true, message: 'Please enter an address', severity: 'error' });
      return;
    }

    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const newStartPoint = {
          id: 'start-point',
          name: 'Start Point',
          type: 'start',
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          address: result.display_name,
          description: 'Starting location for routes'
        };
        
        setStartPoint(newStartPoint);
        setSnackbar({ open: true, message: 'Start point added successfully', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Address not found. Please try a different address.', severity: 'error' });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setSnackbar({ open: true, message: 'Error geocoding address. Please try again.', severity: 'error' });
    } finally {
      setIsGeocoding(false);
    }
  };

  const removeStartPoint = () => {
    setStartPoint(null);
    setStartPointAddress('');
    setSnackbar({ open: true, message: 'Start point removed', severity: 'info' });
  };

  const addStartPointToRoute = () => {
    if (!startPoint) {
      setSnackbar({ open: true, message: 'No start point to add', severity: 'warning' });
      return;
    }
    
    if (routeWaypoints.length >= 10) {
      setSnackbar({ open: true, message: 'Maximum 10 waypoints allowed', severity: 'warning' });
      return;
    }
    
    // Check if start point is already in route
    if (routeWaypoints.some(wp => wp.id === startPoint.id)) {
      setSnackbar({ open: true, message: 'Start point already in route', severity: 'warning' });
      return;
    }
    
    const waypoint = {
      id: startPoint.id,
      name: startPoint.name,
      lat: startPoint.latitude,
      lng: startPoint.longitude,
      type: startPoint.type
    };
    
    setRouteWaypoints(prev => [waypoint, ...prev]); // Add start point at the beginning
    setSnackbar({ open: true, message: 'Start point added to route', severity: 'success' });
  };

  // File upload and processing functions
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.type === 'text/csv' ||
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.xls') ||
          file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setFileUploadDialogOpen(true);
      } else {
        setSnackbar({ open: true, message: 'Please select a valid Excel or CSV file (.xlsx, .xls, or .csv)', severity: 'error' });
      }
    }
  };

  const processExcelFile = async () => {
    if (!selectedFile) return;

    setIsProcessingFile(true);
    setUploadProgress(0);
    setFileUploadDialogOpen(false);

    try {
      // Read the file as text (CSV format)
      const text = await selectedFile.text();
      const lines = text.split('\n');
      
      console.log('File content preview:', lines.slice(0, 3)); // Debug: show first 3 lines
      
      // Find header row and column indices
      const headerRow = lines[0];
      const headers = headerRow.split(',').map(h => h.trim().replace(/"/g, ''));
      
      console.log('Found headers:', headers); // Debug: show all headers
      
      // More flexible column detection
      const labNameIndex = headers.findIndex(h => 
        h.toLowerCase().includes('lab name') || 
        h.toLowerCase().includes('name') ||
        h.toLowerCase().includes('lab') ||
        h.toLowerCase().includes('facility') ||
        h.toLowerCase().includes('location name')
      );
      
      const addressIndex = headers.findIndex(h => 
        h.toLowerCase().includes('full address') || 
        h.toLowerCase().includes('address') ||
        h.toLowerCase().includes('location') ||
        h.toLowerCase().includes('street') ||
        h.toLowerCase().includes('addr')
      );

      console.log('Lab name column index:', labNameIndex, 'Address column index:', addressIndex); // Debug

      if (labNameIndex === -1 || addressIndex === -1) {
        // Show more detailed error with found columns
        const foundColumns = headers.join(', ');
        throw new Error(`Required columns not found. Found columns: ${foundColumns}. Looking for columns containing "lab name" or "name" for lab names, and "full address" or "address" for addresses.`);
      }

      // Process data rows
      const labs = [];
      const totalRows = lines.length - 1; // Exclude header
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const labName = values[labNameIndex];
          const address = values[addressIndex];
          
          if (labName && address) {
            labs.push({ labName, address });
          }
        }
        
        // Update progress
        setUploadProgress((i / totalRows) * 50); // First 50% for parsing
      }

      console.log('Found labs:', labs.length); // Debug: show number of labs found

      // Geocode addresses
      const geocodedLabs = [];
      const labsOutsideBC = [];
      for (let i = 0; i < labs.length; i++) {
        const lab = labs[i];
        
        try {
          // Add delay to respect API rate limits
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
          }
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(lab.address)}&limit=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            
            if (data && data.length > 0) {
              const result = data[0];
              const latitude = parseFloat(result.lat);
              const longitude = parseFloat(result.lon);
              
              // Check if the lab is within British Columbia
              if (isWithinBritishColumbia(latitude, longitude)) {
                geocodedLabs.push({
                  id: `lab-${Date.now()}-${i}`,
                  name: lab.labName,
                  type: 'lab',
                  latitude: latitude,
                  longitude: longitude,
                  address: result.display_name,
                  description: 'Laboratory facility'
                });
              } else {
                // Store labs outside BC for reporting
                labsOutsideBC.push({
                  name: lab.labName,
                  address: lab.address,
                  latitude: latitude,
                  longitude: longitude,
                  geocodedAddress: result.display_name
                });
              }
            }
          }
          
          // Update progress (50-100% for geocoding)
          setUploadProgress(50 + ((i + 1) / labs.length) * 50);
          
        } catch (error) {
          console.error(`Error geocoding lab ${lab.labName}:`, error);
        }
      }

      // Add labs to the map
      setUploadedLabs(prev => [...prev, ...geocodedLabs]);
      
      // Prepare success message
      let message = `Successfully added ${geocodedLabs.length} labs to the map`;
      
      if (labsOutsideBC.length > 0) {
        message += `. ${labsOutsideBC.length} labs were outside British Columbia and were excluded.`;
        console.log('Labs outside BC:', labsOutsideBC);
      }
      
      if (geocodedLabs.length > 0) {
        setSnackbar({ 
          open: true, 
          message: message, 
          severity: 'success' 
        });
      } else if (labsOutsideBC.length > 0) {
        setSnackbar({ 
          open: true, 
          message: `No labs were within British Columbia. ${labsOutsideBC.length} labs were outside BC boundaries.`, 
          severity: 'warning' 
        });
      } else {
        setSnackbar({ 
          open: true, 
          message: 'No labs could be geocoded. Please check the addresses in your file.', 
          severity: 'warning' 
        });
      }

    } catch (error) {
      console.error('Error processing file:', error);
      setSnackbar({ 
        open: true, 
        message: `Error processing file: ${error.message}`, 
        severity: 'error' 
      });
    } finally {
      setIsProcessingFile(false);
      setUploadProgress(0);
      setSelectedFile(null);
    }
  };

  const removeUploadedLabs = () => {
    setUploadedLabs([]);
    setSnackbar({ open: true, message: 'All uploaded labs removed', severity: 'info' });
  };

  const removeUploadedLab = (labId) => {
    setUploadedLabs(prev => prev.filter(lab => lab.id !== labId));
    setSnackbar({ open: true, message: 'Lab removed successfully', severity: 'success' });
  };

  const handleEditLab = (lab) => {
    setEditingClinic(lab); // Reuse the same editing state
    setClinicForm({
      name: lab.name,
      type: lab.type,
      latitude: lab.latitude.toString(),
      longitude: lab.longitude.toString(),
      address: lab.address,
      description: lab.description
    });
    setDialogOpen(true);
  };

  // Start point to labs routing functions
  const calculateStartToLabsRoutes = async () => {
    // Use uploaded start points if available, otherwise use single start point
    const startPointsToAnalyze = uploadedStartPoints.length > 0 ? uploadedStartPoints : (startPoint ? [startPoint] : []);
    
    if (startPointsToAnalyze.length === 0 || uploadedLabs.length === 0) {
      setSnackbar({ open: true, message: 'Start points and labs are required', severity: 'warning' });
      return;
    }

    console.log('Starting route calculation for', startPointsToAnalyze.length, 'start points and', uploadedLabs.length, 'labs');

    setIsCalculatingStartToLabs(true);
    setShowStartToLabsRoutes(true);
    setStartToLabsProgress(0);

    try {
      const analysisResults = [];
      const allRoutes = [];
      let totalProgress = 0;
      const totalSteps = startPointsToAnalyze.length * 2; // Analysis + route calculation

      for (let spIndex = 0; spIndex < startPointsToAnalyze.length; spIndex++) {
        const startPoint = startPointsToAnalyze[spIndex];
        console.log(`Processing start point ${spIndex + 1}/${startPointsToAnalyze.length}:`, startPoint.name);
        
        // Step 1: Calculate haversine distances to all labs
        const labDistances = uploadedLabs.map(lab => ({
          lab,
          haversineDistance: calculateHaversineDistance(
            startPoint.latitude, startPoint.longitude,
            lab.latitude, lab.longitude
          )
        }));

        // Sort by haversine distance and get top 3
        labDistances.sort((a, b) => a.haversineDistance - b.haversineDistance);
        const top3Labs = labDistances.slice(0, 3);
        
        console.log(`Top 3 closest labs to ${startPoint.name}:`, top3Labs.map(t => `${t.lab.name} (${t.haversineDistance.toFixed(2)} km)`));
        
        // Update progress for analysis step
        totalProgress = ((spIndex * 2) / totalSteps) * 100;
        setStartToLabsProgress(totalProgress);

        // Step 2: Calculate real routes to top 3 labs
        const routeResults = [];
        for (let labIndex = 0; labIndex < top3Labs.length; labIndex++) {
          const labData = top3Labs[labIndex];
          const lab = labData.lab;
          
          try {
            // Add delay to respect API rate limits
            if (labIndex > 0 || spIndex > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
            }
            
            // Build coordinates string for OSRM API
            const coordinates = `${startPoint.longitude},${startPoint.latitude};${lab.longitude},${lab.latitude}`;
            console.log(`Calculating route: ${startPoint.name} to ${lab.name}`);
            
            // Call OSRM API with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(
              `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`,
              { signal: controller.signal }
            );
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                
                const routeResult = {
                  id: `start-${startPoint.id}-to-lab-${lab.id}`,
                  from: startPoint,
                  to: lab,
                  haversineDistance: labData.haversineDistance,
                  realDistance: route.distance,
                  realDuration: route.duration,
                  geometry: route.geometry,
                  rank: labIndex + 1
                };
                
                routeResults.push(routeResult);
                
                // Add to all routes for display
                allRoutes.push(routeResult);
                
                console.log(`Route calculated for ${startPoint.name} to ${lab.name}:`, route.distance, 'm,', route.duration, 's');
              } else {
                console.log(`No route found for ${startPoint.name} to ${lab.name}, creating fallback`);
                // Create fallback route
                const fallbackDistance = labData.haversineDistance * 1000; // Convert km to meters
                const fallbackDuration = fallbackDistance / 50000 * 3600; // 50 km/h estimate
                
                const routeResult = {
                  id: `start-${startPoint.id}-to-lab-${lab.id}`,
                  from: startPoint,
                  to: lab,
                  haversineDistance: labData.haversineDistance,
                  realDistance: fallbackDistance,
                  realDuration: fallbackDuration,
                  geometry: null,
                  rank: labIndex + 1
                };
                
                routeResults.push(routeResult);
                allRoutes.push(routeResult);
              }
            } else {
              console.log(`API error for ${startPoint.name} to ${lab.name}, creating fallback`);
              // Create fallback route
              const fallbackDistance = labData.haversineDistance * 1000; // Convert km to meters
              const fallbackDuration = fallbackDistance / 50000 * 3600; // 50 km/h estimate
              
              const routeResult = {
                id: `start-${startPoint.id}-to-lab-${lab.id}`,
                from: startPoint,
                to: lab,
                haversineDistance: labData.haversineDistance,
                realDistance: fallbackDistance,
                realDuration: fallbackDuration,
                geometry: null,
                rank: labIndex + 1
              };
              
              routeResults.push(routeResult);
              allRoutes.push(routeResult);
            }
            
          } catch (error) {
            console.error(`Error calculating route from ${startPoint.name} to ${lab.name}:`, error);
            
            // Create fallback route
            const fallbackDistance = labData.haversineDistance * 1000; // Convert km to meters
            const fallbackDuration = fallbackDistance / 50000 * 3600; // 50 km/h estimate
            
            const routeResult = {
              id: `start-${startPoint.id}-to-lab-${lab.id}`,
              from: startPoint,
              to: lab,
              haversineDistance: labData.haversineDistance,
              realDistance: fallbackDistance,
              realDuration: fallbackDuration,
              geometry: null,
              rank: labIndex + 1
            };
            
            routeResults.push(routeResult);
            allRoutes.push(routeResult);
          }
          
          // Update progress for route calculation step
          totalProgress = (((spIndex * 2) + 1) / totalSteps) * 100;
          setStartToLabsProgress(totalProgress);
        }

        // Find the closest lab (rank 1) for cost calculations
        const closestLabRoute = routeResults.find(r => r.rank === 1);
        
        // Store analysis for this start point
        analysisResults.push({
          startPoint,
          allRoutes: routeResults,
          closestLabRoute,
          top3Labs: top3Labs.map(t => t.lab)
        });
      }

      // Set progress to 100% when complete
      setStartToLabsProgress(100);

      console.log('Analysis results:', analysisResults);
      setStartPointLabAnalysis(analysisResults);
      setStartToLabsRoutes(allRoutes);
      
      const totalStartPoints = analysisResults.length;
      const totalRoutes = allRoutes.length;
      const closestRoutes = analysisResults.filter(r => r.closestLabRoute).length;
      
      setSnackbar({ 
        open: true, 
        message: `Analyzed ${totalStartPoints} start points. Calculated ${totalRoutes} routes (${closestRoutes} closest labs found).`, 
        severity: 'success' 
      });

    } catch (error) {
      console.error('Error calculating start to labs routes:', error);
      setSnackbar({ 
        open: true, 
        message: 'Error calculating routes to labs', 
        severity: 'error' 
      });
    } finally {
      setIsCalculatingStartToLabs(false);
      // Keep progress at 100% for a moment before resetting
      setTimeout(() => setStartToLabsProgress(0), 2000);
    }
  };

  const clearStartToLabsRoutes = () => {
    setShowStartToLabsRoutes(false);
    setStartToLabsRoutes([]);
    setStartToLabsProgress(0);
    setStartPointLabAnalysis([]);
    setShowCostCalculation(false);
    setCostResults(null);
    setSnackbar({ open: true, message: 'Start to labs routes cleared', severity: 'info' });
  };

  // Calculate costs for each age group based on routes
  const calculateCosts = () => {
    if (!startPointLabAnalysis.length) {
      setSnackbar({ open: true, message: 'No analysis available for cost calculation', severity: 'warning' });
      return;
    }

    const calculator = new PFCCalculator();
    
    // Calculate costs for each start point's closest lab
    const startPointCosts = startPointLabAnalysis.map(analysis => {
      if (!analysis.closestLabRoute) {
        return null;
      }
      
      const route = analysis.closestLabRoute;
      const distanceKm = route.realDistance / 1000; // Convert meters to km
      
      // Determine health authority (simplified - would need actual HA boundaries)
      const ha_name = calculator.getHealthAuthority(analysis.startPoint.latitude, analysis.startPoint.longitude);
      
      return {
        startPoint: analysis.startPoint,
        closestLab: route.to,
        route: route,
        healthAuthority: ha_name,
        child: calculator.calculateMDAppointment({
          distance: distanceKm,
          duration: costParams.duration,
          age: 10,
          ha_name: ha_name,
          service_type: 'MD'
        }),
        adult: calculator.calculateMDAppointment({
          distance: distanceKm,
          duration: costParams.duration,
          age: 40,
          ha_name: ha_name,
          service_type: 'MD'
        }),
        senior: calculator.calculateMDAppointment({
          distance: distanceKm,
          duration: costParams.duration,
          age: 70,
          ha_name: ha_name,
          service_type: 'MD'
        })
      };
    }).filter(cost => cost !== null);

    // Apply encounter multipliers if encounters data is available
    let encounterMultipliers = {};
    if (uploadedEncounters.length > 0) {
      // Create a lookup table for encounter counts by community and age group
      uploadedEncounters.forEach(enc => {
        const key = `${enc.community}-${enc.ageGroup}`;
        encounterMultipliers[key] = enc.encounters;
      });
    }

    // Calculate totals for each age group with encounter multipliers
    const childTotal = startPointCosts.reduce((sum, cost) => {
      const multiplier = encounterMultipliers[`${cost.startPoint.name}-0-14`] || 1;
      return sum + (cost.child.costs.total * multiplier);
    }, 0);
    
    const adultTotal = startPointCosts.reduce((sum, cost) => {
      const multiplier = encounterMultipliers[`${cost.startPoint.name}-15-64`] || 1;
      return sum + (cost.adult.costs.total * multiplier);
    }, 0);
    
    const seniorTotal = startPointCosts.reduce((sum, cost) => {
      const multiplier = encounterMultipliers[`${cost.startPoint.name}-65+`] || 1;
      return sum + (cost.senior.costs.total * multiplier);
    }, 0);
    
    const grandTotal = childTotal + adultTotal + seniorTotal;

    // Calculate subunit totals with encounter multipliers
    const totalLostProductivity = startPointCosts.reduce((sum, cost) => {
      const multiplier = encounterMultipliers[`${cost.startPoint.name}-15-64`] || 1;
      return sum + (cost.adult.costs.lostProductivity * multiplier);
    }, 0);
    
    const totalInformalCaregiving = startPointCosts.reduce((sum, cost) => {
      const childMultiplier = encounterMultipliers[`${cost.startPoint.name}-0-14`] || 1;
      const adultMultiplier = encounterMultipliers[`${cost.startPoint.name}-15-64`] || 1;
      const seniorMultiplier = encounterMultipliers[`${cost.startPoint.name}-65+`] || 1;
      
      return sum + 
        (cost.child.costs.informalCaregiving * childMultiplier) + 
        (cost.adult.costs.informalCaregiving * adultMultiplier) + 
        (cost.senior.costs.informalCaregiving * seniorMultiplier);
    }, 0);
    
    const totalOutOfPocket = startPointCosts.reduce((sum, cost) => {
      const childMultiplier = encounterMultipliers[`${cost.startPoint.name}-0-14`] || 1;
      const adultMultiplier = encounterMultipliers[`${cost.startPoint.name}-15-64`] || 1;
      const seniorMultiplier = encounterMultipliers[`${cost.startPoint.name}-65+`] || 1;
      
      return sum + 
        (cost.child.costs.outOfPocket * childMultiplier) + 
        (cost.adult.costs.outOfPocket * adultMultiplier) + 
        (cost.senior.costs.outOfPocket * seniorMultiplier);
    }, 0);

    // Calculate CO2 emissions totals with encounter multipliers
    const totalCO2 = startPointCosts.reduce((sum, cost) => {
      const childMultiplier = encounterMultipliers[`${cost.startPoint.name}-0-14`] || 1;
      const adultMultiplier = encounterMultipliers[`${cost.startPoint.name}-15-64`] || 1;
      const seniorMultiplier = encounterMultipliers[`${cost.startPoint.name}-65+`] || 1;
      
      // Use child emissions as base, but multiply by total encounters for this community
      const totalEncounters = (encounterMultipliers[`${cost.startPoint.name}-0-14`] || 0) +
                             (encounterMultipliers[`${cost.startPoint.name}-15-64`] || 0) +
                             (encounterMultipliers[`${cost.startPoint.name}-65+`] || 0);
      
      return sum + (cost.child.emissions.co2RoundTrip * Math.max(totalEncounters, 1));
    }, 0);

    const results = {
      startPointCosts, // Individual start point costs
      child: startPointCosts[0]?.child || calculator.calculateMDAppointment({
        distance: 35,
        duration: costParams.duration,
        age: 10,
        ha_name: 'Vancouver Coastal',
        service_type: 'MD'
      }),
      adult: startPointCosts[0]?.adult || calculator.calculateMDAppointment({
        distance: 35,
        duration: costParams.duration,
        age: 40,
        ha_name: 'Vancouver Coastal',
        service_type: 'MD'
      }),
      senior: startPointCosts[0]?.senior || calculator.calculateMDAppointment({
        distance: 35,
        duration: costParams.duration,
        age: 70,
        ha_name: 'Vancouver Coastal',
        service_type: 'MD'
      }),
      totals: {
        child: childTotal,
        adult: adultTotal,
        senior: seniorTotal,
        grand: grandTotal,
        lostProductivity: totalLostProductivity,
        informalCaregiving: totalInformalCaregiving,
        outOfPocket: totalOutOfPocket
      },
      emissions: {
        totalCO2: totalCO2,
        averageCO2: totalCO2 / startPointCosts.length
      },
      summary: {
        totalStartPoints: startPointCosts.length,
        averageDistance: startPointCosts.reduce((sum, cost) => sum + cost.route.realDistance, 0) / startPointCosts.length / 1000,
        totalDistance: startPointCosts.reduce((sum, cost) => sum + cost.route.realDistance, 0) / 1000,
        healthAuthorities: [...new Set(startPointCosts.map(cost => cost.healthAuthority))]
      },
      encounters: {
        data: uploadedEncounters,
        hasData: uploadedEncounters.length > 0,
        totalEncounters: uploadedEncounters.reduce((sum, enc) => sum + enc.encounters, 0),
        communitiesWithEncounters: [...new Set(uploadedEncounters.map(enc => enc.community))].length
      }
    };

    setCostResults(results);
    setShowCostCalculation(true);
    setSnackbar({ open: true, message: 'Cost calculation completed', severity: 'success' });
  };

  // Download functions
  const downloadLabCostsCSV = () => {
    if (!costResults || !costResults.startPointCosts) {
      setSnackbar({ open: true, message: 'No cost data available for download', severity: 'warning' });
      return;
    }

    try {
      // Create CSV headers
      const headers = [
        'Start Point Name',
        'Start Point Address',
        'Start Point Coordinates',
        'Closest Lab Name',
        'Closest Lab Address',
        'Health Authority',
        'Haversine Distance (km)',
        'Real Distance (km)',
        'Real Duration (min)',
        'Round Trip Distance (km)',
        'Travel Time (hrs)',
        'Appointment Time (hrs)',
        'Total Duration (hrs)',
        'CO2 Emissions (kg)',
        'Child (0-14) - Encounters',
        'Child (0-14) - Lost Productivity',
        'Child (0-14) - Informal Caregiving',
        'Child (0-14) - Out of Pocket',
        'Child (0-14) - Cost Per Encounter',
        'Child (0-14) - Total Cost',
        'Adult (15-64) - Encounters',
        'Adult (15-64) - Lost Productivity',
        'Adult (15-64) - Informal Caregiving',
        'Adult (15-64) - Out of Pocket',
        'Adult (15-64) - Cost Per Encounter',
        'Adult (15-64) - Total Cost',
        'Senior (65+) - Encounters',
        'Senior (65+) - Lost Productivity',
        'Senior (65+) - Informal Caregiving',
        'Senior (65+) - Out of Pocket',
        'Senior (65+) - Cost Per Encounter',
        'Senior (65+) - Total Cost',
        'Grand Total (All Ages)',
        'Caregiver Coefficient (Child)',
        'Caregiver Coefficient (Adult)',
        'Caregiver Coefficient (Senior)',
        'Parking Cost',
        'Wage Rate ($/hr)',
        'Car Cost ($/km)',
        'Meal Cost',
        'Accommodation Cost',
        'Data Usage Cost'
      ];

      // Create CSV rows
      const rows = costResults.startPointCosts.map(cost => {
        const { startPoint, closestLab, route, healthAuthority, child, adult, senior } = cost;
        
        // Get encounter counts for this community
        const childEncounters = costResults.encounters.data.find(enc => 
          enc.community === startPoint.name && enc.ageGroup === '0-14'
        )?.encounters || 1;
        
        const adultEncounters = costResults.encounters.data.find(enc => 
          enc.community === startPoint.name && enc.ageGroup === '15-64'
        )?.encounters || 1;
        
        const seniorEncounters = costResults.encounters.data.find(enc => 
          enc.community === startPoint.name && enc.ageGroup === '65+'
        )?.encounters || 1;
        
        // Calculate total costs with encounters
        const childTotalCost = child.costs.total * childEncounters;
        const adultTotalCost = adult.costs.total * adultEncounters;
        const seniorTotalCost = senior.costs.total * seniorEncounters;
        const grandTotal = childTotalCost + adultTotalCost + seniorTotalCost;
        
        return [
          startPoint.name,
          startPoint.address,
          `${startPoint.latitude.toFixed(6)}, ${startPoint.longitude.toFixed(6)}`,
          closestLab.name,
          closestLab.address,
          healthAuthority,
          route.haversineDistance.toFixed(2),
          (route.realDistance / 1000).toFixed(2),
          Math.round(route.realDuration / 60),
          child.distance.roundTrip.toFixed(2),
          child.duration.travel.toFixed(2),
          child.duration.appointment.toFixed(2),
          child.duration.total.toFixed(2),
          child.emissions.co2RoundTrip.toFixed(2),
          childEncounters,
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(child.costs.lostProductivity),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(child.costs.informalCaregiving),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(child.costs.outOfPocket),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(child.costs.total),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(childTotalCost),
          adultEncounters,
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(adult.costs.lostProductivity),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(adult.costs.informalCaregiving),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(adult.costs.outOfPocket),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(adult.costs.total),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(adultTotalCost),
          seniorEncounters,
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(senior.costs.lostProductivity),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(senior.costs.informalCaregiving),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(senior.costs.outOfPocket),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(senior.costs.total),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(seniorTotalCost),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(grandTotal),
          child.parameters.caregiverCoeff.toFixed(2),
          adult.parameters.caregiverCoeff.toFixed(2),
          senior.parameters.caregiverCoeff.toFixed(2),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(child.parameters.parkingCost),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(child.parameters.wage),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(child.parameters.carCost),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(child.parameters.mealCost),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(child.parameters.accommodation),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(child.parameters.dataUsage)
        ];
      });

      // Add summary row
      rows.push([
        'TOTAL FOR ALL START POINTS',
        '',
        '',
        '',
        '',
        costResults.summary.healthAuthorities.join(', '),
        costResults.startPointCosts.reduce((sum, cost) => sum + cost.route.haversineDistance, 0).toFixed(2),
        costResults.summary.totalDistance.toFixed(2),
        Math.round(costResults.startPointCosts.reduce((sum, cost) => sum + cost.route.realDuration, 0) / 60),
        costResults.startPointCosts.reduce((sum, cost) => sum + cost.child.distance.roundTrip, 0).toFixed(2),
        costResults.startPointCosts.reduce((sum, cost) => sum + cost.child.duration.travel, 0).toFixed(2),
        costResults.startPointCosts.reduce((sum, cost) => sum + cost.child.duration.appointment, 0).toFixed(2),
        costResults.startPointCosts.reduce((sum, cost) => sum + cost.child.duration.total, 0).toFixed(2),
        costResults.emissions.totalCO2.toFixed(2),
        costResults.encounters.data.filter(enc => enc.ageGroup === '0-14').reduce((sum, enc) => sum + enc.encounters, 0),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(0), // Children no productivity loss
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.totals.informalCaregiving),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.totals.outOfPocket),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.child.costs.total),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.totals.child),
        costResults.encounters.data.filter(enc => enc.ageGroup === '15-64').reduce((sum, enc) => sum + enc.encounters, 0),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.totals.lostProductivity),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.startPointCosts.reduce((sum, cost) => sum + cost.adult.costs.informalCaregiving, 0)),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.startPointCosts.reduce((sum, cost) => sum + cost.adult.costs.outOfPocket, 0)),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.adult.costs.total),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.totals.adult),
        costResults.encounters.data.filter(enc => enc.ageGroup === '65+').reduce((sum, enc) => sum + enc.encounters, 0),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(0), // Seniors no productivity loss
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.startPointCosts.reduce((sum, cost) => sum + cost.senior.costs.informalCaregiving, 0)),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.startPointCosts.reduce((sum, cost) => sum + cost.senior.costs.outOfPocket, 0)),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.senior.costs.total),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.totals.senior),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.totals.grand),
        '', // Caregiver coefficients vary by age group
        '',
        '',
        '', // Parking costs vary by HA
        '', // Wage rate is constant
        '', // Car cost is constant
        '', // Meal cost is constant
        '', // Accommodation cost is constant
        ''  // Data usage cost is constant
      ]);

      // Convert to CSV
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `start_point_MD_costs_analysis_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbar({ open: true, message: 'Start point MD costs CSV downloaded successfully', severity: 'success' });
    } catch (error) {
      console.error('Error downloading CSV:', error);
      setSnackbar({ open: true, message: 'Error downloading CSV file', severity: 'error' });
    }
  };

  const downloadCostFormulas = () => {
    try {
      const formulas = `# Patient and Family Cost (PFC) Calculation Methodology
# Based on R Script: RSA-pediatrics cost analysis
# Generated: ${new Date().toLocaleString()}

## OVERVIEW
This document outlines the methodology for calculating patient and family costs (PFC) for healthcare services, specifically MD appointments, based on the R script analysis framework. The methodology accounts for travel distances, time costs, and various cost components by age group and health authority.

## SERVICE TYPE
Primary focus: MD (Medical Doctor) appointments
- Family Medicine Wait Time: 0.5 hours
- Family Medicine Appointment Time: 0.26 hours
- Total MD Time: 0.76 hours (plus additional duration parameter)

## AGE GROUPS
- Children (0-14 years)
- Working Age (15-64 years) 
- Seniors (65+ years)

## BASE PARAMETERS

### Economic Parameters
- Wage Rate: $30.54/hour
- Car Cost: $0.48/km
- Meal Cost: $15.00
- Accommodation Cost: $100.00
- Data Usage Cost: $1.25
- CO2 Emission Rate: 0.15 kg/km

### Health Authority Parking Costs
- Fraser: $3.00
- Interior: $3.00
- Island: $2.00
- Northern: $8.00
- Vancouver Coastal: $2.00

## CAREGIVER COEFFICIENTS
Caregiver coefficients vary by age group and service type:
- Children (0-14), Non-Hospital: 1.0
- Children (0-14), Hospital: 0.75
- Adults/Seniors, Non-Hospital: 0.5
- Adults/Seniors, Hospital: 0.25

## COST CALCULATION METHODOLOGY

### 1. Distance and Time Calculations
- One-way Distance: Real route distance from start point to destination
- Round Trip Distance: One-way distance × 2
- Travel Time: Round trip distance ÷ 50 km/h (average speed)
- Appointment Time: MD time (0.76h) + additional duration parameter
- Total Duration: Travel time + appointment time

### 2. Subunit Cost Calculations

#### Lost Productivity (LP)
Only applies to working age (15-64):
- Non-Virtual: wage × (appointment_time + round_trip_duration)
- Virtual: wage × appointment_time
- Children and Seniors: $0.00

#### Informal Caregiving (IC)
Applies to all age groups:
- Non-Virtual: caregiver_coefficient × wage × (appointment_time + round_trip_duration)
- Virtual: caregiver_coefficient × wage × appointment_time

#### Out of Pocket (OOP)
Varies by service type:
- MD: parking_cost + (round_trip_distance × car_cost)
- Virtual: data_usage_cost
- Other services: parking_cost + meal_cost + (round_trip_distance × car_cost)

### 3. Total Unit Cost
Total Cost = Lost Productivity + Informal Caregiving + Out of Pocket

### 4. CO2 Emissions
CO2 Emissions = one_way_distance × 0.15 kg/km

## FORMULA BREAKDOWN BY AGE GROUP

### Children (0-14)
- Lost Productivity: $0.00
- Informal Caregiving: 1.0 × wage × (appointment_time + round_trip_duration)
- Out of Pocket: parking_cost + (round_trip_distance × car_cost)
- Total: IC + OOP

### Working Age (15-64)
- Lost Productivity: wage × (appointment_time + round_trip_duration)
- Informal Caregiving: 0.5 × wage × (appointment_time + round_trip_duration)
- Out of Pocket: parking_cost + (round_trip_distance × car_cost)
- Total: LP + IC + OOP

### Seniors (65+)
- Lost Productivity: $0.00
- Informal Caregiving: 0.5 × wage × (appointment_time + round_trip_duration)
- Out of Pocket: parking_cost + (round_trip_distance × car_cost)
- Total: IC + OOP

## EXAMPLE CALCULATION

For a 40-year-old patient traveling 35 km one-way to Vancouver Coastal Health Authority:

### Inputs
- Distance: 35 km (one-way)
- Round Trip: 70 km
- Duration: 0.25 hours additional
- Appointment Time: 0.76 + 0.25 = 1.01 hours
- Travel Time: 70 ÷ 50 = 1.40 hours
- Total Duration: 1.40 + 1.01 = 2.41 hours
- Health Authority: Vancouver Coastal (parking: $2.00)
- Age Group: 15-64 (Working Age)

### Calculations
- Lost Productivity: $30.54 × 2.41 = $73.60
- Informal Caregiving: 0.5 × $30.54 × 2.41 = $36.80
- Out of Pocket: $2.00 + (70 × $0.48) = $35.60
- Total Cost: $73.60 + $36.80 + $35.60 = $146.00
- CO2 Emissions: 35 × 0.15 = 5.25 kg

## DATA STRUCTURE

### Input Data Required
- Start Point Coordinates (latitude, longitude)
- Destination Coordinates (latitude, longitude)
- Real Route Distance (meters)
- Real Route Duration (seconds)
- Health Authority
- Age Group
- Service Type

### Output Data Generated
- Round Trip Distance (km)
- Round Trip Duration (hours)
- Appointment Time (hours)
- CO2 Emissions (kg)
- Lost Productivity Cost ($)
- Informal Caregiving Cost ($)
- Out of Pocket Cost ($)
- Total Unit Cost ($)
- Caregiver Coefficient
- All Input Parameters

## VALIDATION NOTES

1. All costs are in Canadian Dollars (CAD)
2. Distances are converted from meters to kilometers
3. Durations are converted from seconds to hours
4. Round trip calculations double the one-way values
5. Health authority parking costs vary by region
6. CO2 emissions are calculated for one-way distance only
7. Virtual appointments have different cost structures
8. Hospital services have different caregiver coefficients

## REFERENCES
Based on R script: RSA-pediatrics cost analysis
Methodology adapted for web-based calculation tool
All parameters sourced from BC healthcare cost studies

Generated by GEOFFE Dashboard - Custom Map Analysis Tool
`;

      const blob = new Blob([formulas], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `PFC_calculation_methodology_${new Date().toISOString().split('T')[0]}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbar({ open: true, message: 'PFC calculation methodology downloaded successfully', severity: 'success' });
    } catch (error) {
      console.error('Error downloading formulas:', error);
      setSnackbar({ open: true, message: 'Error downloading PFC methodology', severity: 'error' });
    }
  };

  const downloadReport = () => {
    try {
      // Create a link to the existing report file
      const link = document.createElement('a');
      link.setAttribute('href', '/data/Reports/Copy of GEOFFE API Report-14.pdf');
      link.setAttribute('download', 'GEOFFE_API_Report.pdf');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbar({ open: true, message: 'Report downloaded successfully', severity: 'success' });
    } catch (error) {
      console.error('Error downloading report:', error);
      setSnackbar({ open: true, message: 'Error downloading report. Please check if the report file exists.', severity: 'error' });
    }
  };

  // PFC Calculator class - Updated to match R script methodology
  class PFCCalculator {
    constructor() {
      // Base constants from R script
      this.wage = 30.54;
      this.meal_cost = 15;
      this.accomm = 100;
      this.car_cost = 0.48;
      this.data_usage = 1.25;
      this.co2_rate = 0.15; // kg/km
      
      // Service-specific constants
      this.fm_wait = 0.5;
      this.fm_appt = 0.26;
      this.MD_time = this.fm_wait + this.fm_appt;
      
      // Health Authority parking costs (alphabetical order)
      this.ha_parking = {
        'Fraser': 3,
        'Interior': 3,
        'Island': 2,
        'Northern': 8,
        'Vancouver Coastal': 2
      };
    }

    // Helper function to determine age group
    getAgeGroup(age) {
      if (age >= 0 && age <= 14) return '0-14';
      if (age >= 15 && age <= 64) return '15-64';
      return '65+';
    }

    // Helper function to determine Health Authority (simplified - would need actual HA data)
    getHealthAuthority(latitude, longitude) {
      // Simplified mapping - in real implementation, this would use actual HA boundaries
      // For now, return a default
      return 'Vancouver Coastal';
    }

    // Calculate caregiver coefficient based on age group and service type
    getCaregiverCoeff(ageGroup, serviceType) {
      if (ageGroup === '0-14' && serviceType !== 'Hosp') {
        return 1.0;
      } else if (ageGroup === '0-14' && serviceType === 'Hosp') {
        return 0.75;
      } else if (ageGroup !== '0-14' && serviceType === 'Hosp') {
        return 0.25;
      } else if (ageGroup !== '0-14' && serviceType !== 'Hosp') {
        return 0.5;
      }
      return 0.5; // default
    }

    // Calculate MD appointment costs (main service type from R script)
    calculateMDAppointment(params = {}) {
      const {
        distance = 35, // one-way distance in km
        duration = 0.25, // additional time in hours
        age = 40,
        ha_name = 'Vancouver Coastal',
        service_type = 'MD'
      } = params;

      const ageGroup = this.getAgeGroup(age);
      const appt_time = this.MD_time + duration;
      
      // Round trip calculations (as per R script)
      const street_distance = distance * 2; // round trip
      // Fix: Round trip duration should be travel time (estimated from distance) + appointment time
      const travel_time = (distance * 2) / 50; // Assume 50 km/h average speed for round trip
      const street_duration = travel_time + appt_time; // Total time including travel and appointment
      
      // Get parking cost for health authority
      const parking_cost = this.ha_parking[ha_name] || 3; // default to 3 if HA not found
      
      // Get caregiver coefficient
      const caregiver_coeff = this.getCaregiverCoeff(ageGroup, service_type);

      // Calculate subunit costs
      let subunit_LP = 0; // Lost Productivity
      let subunit_IC = 0; // Informal Caregiving
      let subunit_OOP = 0; // Out of Pocket

      // Lost Productivity (only for ages 15-64, non-virtual)
      if (ageGroup === '15-64' && service_type !== 'Virtual') {
        subunit_LP = this.wage * street_duration;
      } else if (ageGroup === '15-64' && service_type === 'Virtual') {
        subunit_LP = this.wage * appt_time;
      }

      // Informal Caregiving (for all age groups)
      if (service_type !== 'Virtual') {
        subunit_IC = caregiver_coeff * this.wage * street_duration;
      } else {
        subunit_IC = caregiver_coeff * this.wage * appt_time;
      }

      // Out of Pocket (varies by service type)
      if (service_type === 'MD') {
        subunit_OOP = parking_cost + (street_distance * this.car_cost);
      } else if (service_type === 'Virtual') {
        subunit_OOP = this.data_usage;
      } else {
        // Default for other service types
        subunit_OOP = parking_cost + (street_distance * this.car_cost);
      }

      // Total unit cost
      const unit_cost = subunit_IC + subunit_LP + subunit_OOP;

      // CO2 emissions (round trip)
      const co2_roundtrip = distance * this.co2_rate;

      return {
        serviceType: service_type,
        ageGroup,
        healthAuthority: ha_name,
        distance: {
          oneWay: distance,
          roundTrip: street_distance
        },
        duration: {
          appointment: appt_time,
          travel: travel_time,
          total: street_duration
        },
        costs: {
          lostProductivity: subunit_LP,
          informalCaregiving: subunit_IC,
          outOfPocket: subunit_OOP,
          total: unit_cost
        },
        parameters: {
          wage: this.wage,
          parkingCost: parking_cost,
          carCost: this.car_cost,
          caregiverCoeff: caregiver_coeff,
          mealCost: this.meal_cost,
          accommodation: this.accomm,
          dataUsage: this.data_usage
        },
        emissions: {
          co2RoundTrip: co2_roundtrip
        },
        breakdown: {
          appointmentTime: appt_time,
          travelTime: travel_time,
          streetDistance: street_distance,
          streetDuration: street_duration
        }
      };
    }

    // Calculate costs for different service types
    calculateServiceCosts(params = {}) {
      const {
        distance = 35,
        duration = 0.25,
        age = 40,
        ha_name = 'Vancouver Coastal',
        service_type = 'MD'
      } = params;

      // For now, focus on MD appointments as per R script
      return this.calculateMDAppointment({
        distance,
        duration,
        age,
        ha_name,
        service_type
      });
    }

    // Format cost for display
    formatCost(cost) {
      return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(cost);
    }

    // Get all health authorities
    getHealthAuthorities() {
      return Object.keys(this.ha_parking);
    }

    // Get parking cost for health authority
    getParkingCost(ha_name) {
      return this.ha_parking[ha_name] || 3;
    }
  }

  // Function to check if coordinates are within British Columbia boundaries
  const isWithinBritishColumbia = (latitude, longitude) => {
    // British Columbia approximate boundaries
    // North: ~60°N, South: ~48.5°N, West: ~139°W, East: ~114°W
    const bcBounds = {
      north: 60.0,
      south: 48.5,
      west: -139.0,
      east: -114.0
    };
    
    return latitude >= bcBounds.south && 
           latitude <= bcBounds.north && 
           longitude >= bcBounds.west && 
           longitude <= bcBounds.east;
  };

  // Function to calculate haversine distance between two points
  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Start points file upload and processing functions
  const handleStartPointsFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.type === 'text/csv' ||
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.xls') ||
          file.name.endsWith('.csv')) {
        processStartPointsFile(file);
      } else {
        setSnackbar({ open: true, message: 'Please select a valid Excel or CSV file (.xlsx, .xls, or .csv)', severity: 'error' });
      }
    }
  };

  const processStartPointsFile = async (file) => {
    setIsProcessingStartPointsFile(true);
    setStartPointsUploadProgress(0);

    try {
      // Read the file as text (CSV format)
      const text = await file.text();
      const lines = text.split('\n');
      
      console.log('Start points file content preview:', lines.slice(0, 3));
      
      // Find header row and column indices
      const headerRow = lines[0];
      const headers = headerRow.split(',').map(h => h.trim().replace(/"/g, ''));
      
      console.log('Found start points headers:', headers);
      
      // Look for required columns
      const titleIndex = headers.findIndex(h => 
        h.toLowerCase().includes('title') || 
        h.toLowerCase().includes('name') ||
        h.toLowerCase().includes('community')
      );
      
      const latitudeIndex = headers.findIndex(h => 
        h.toLowerCase().includes('latitude') || 
        h.toLowerCase().includes('lat')
      );
      
      const longitudeIndex = headers.findIndex(h => 
        h.toLowerCase().includes('longitude') || 
        h.toLowerCase().includes('long') ||
        h.toLowerCase().includes('lng')
      );

      console.log('Title column index:', titleIndex, 'Latitude column index:', latitudeIndex, 'Longitude column index:', longitudeIndex);

      if (titleIndex === -1 || latitudeIndex === -1 || longitudeIndex === -1) {
        const foundColumns = headers.join(', ');
        throw new Error(`Required columns not found. Found columns: ${foundColumns}. Looking for columns containing "Title" or "Name", "Latitude" or "Lat", and "Longitude" or "Long".`);
      }

      // Process data rows
      const startPoints = [];
      const totalRows = lines.length - 1; // Exclude header
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const title = values[titleIndex];
          const latitude = parseFloat(values[latitudeIndex]);
          const longitude = parseFloat(values[longitudeIndex]);
          
          if (title && !isNaN(latitude) && !isNaN(longitude)) {
            startPoints.push({ title, latitude, longitude });
          }
        }
        
        // Update progress
        setStartPointsUploadProgress((i / totalRows) * 100);
      }

      console.log('Found start points:', startPoints.length);

      // Convert to start point format
      const formattedStartPoints = startPoints.map((point, index) => ({
        id: `startpoint-${Date.now()}-${index}`,
        name: point.title,
        type: 'start',
        latitude: point.latitude,
        longitude: point.longitude,
        address: `${point.title} (${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)})`,
        description: 'Uploaded start point'
      }));

      // Add start points to the map
      setUploadedStartPoints(prev => [...prev, ...formattedStartPoints]);
      
      if (formattedStartPoints.length > 0) {
        setSnackbar({ 
          open: true, 
          message: `Successfully added ${formattedStartPoints.length} start points to the map`, 
          severity: 'success' 
        });
      } else {
        setSnackbar({ 
          open: true, 
          message: 'No valid start points found in the file. Please check the format.', 
          severity: 'warning' 
        });
      }

    } catch (error) {
      console.error('Error processing start points file:', error);
      setSnackbar({ 
        open: true, 
        message: `Error processing start points file: ${error.message}`, 
        severity: 'error' 
      });
    } finally {
      setIsProcessingStartPointsFile(false);
      setStartPointsUploadProgress(0);
    }
  };

  const removeUploadedStartPoints = () => {
    setUploadedStartPoints([]);
    setSnackbar({ open: true, message: 'All uploaded start points removed', severity: 'info' });
  };

  const removeUploadedStartPoint = (startPointId) => {
    setUploadedStartPoints(prev => prev.filter(point => point.id !== startPointId));
    setSnackbar({ open: true, message: 'Start point removed successfully', severity: 'success' });
  };

  // Encounters file handling functions
  const handleEncountersFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.type === 'text/csv' ||
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.xls') ||
          file.name.endsWith('.csv')) {
        setSelectedEncountersFile(file);
        setEncountersDialogOpen(true);
      } else {
        setSnackbar({ open: true, message: 'Please select a valid Excel or CSV file (.xlsx, .xls, or .csv)', severity: 'error' });
      }
    }
  };

  const processEncountersFile = async () => {
    if (!selectedEncountersFile) return;

    setIsProcessingEncountersFile(true);
    setEncountersUploadProgress(0);
    setEncountersDialogOpen(false);

    try {
      // Read the file as text (CSV format)
      const text = await selectedEncountersFile.text();
      const lines = text.split('\n');
      
      console.log('Encounters file content preview:', lines.slice(0, 3));
      
      // Find header row and column indices
      const headerRow = lines[0];
      const headers = headerRow.split(',').map(h => h.trim().replace(/"/g, ''));
      
      console.log('Found encounters headers:', headers);
      
      // Look for required columns
      const communityIndex = headers.findIndex(h => 
        h.toLowerCase().includes('community') || 
        h.toLowerCase().includes('location') ||
        h.toLowerCase().includes('name')
      );
      
      const ageGroupIndex = headers.findIndex(h => 
        h.toLowerCase().includes('age group') || 
        h.toLowerCase().includes('agegroup') ||
        h.toLowerCase().includes('age') ||
        h.toLowerCase().includes('age_group')
      );
      
      const encounterIndex = headers.findIndex(h => 
        h.toLowerCase().includes('encounter') || 
        h.toLowerCase().includes('count') ||
        h.toLowerCase().includes('number') ||
        h.toLowerCase().includes('visits')
      );

      console.log('Community column index:', communityIndex, 'Age Group column index:', ageGroupIndex, 'Encounter column index:', encounterIndex);

      if (communityIndex === -1 || ageGroupIndex === -1 || encounterIndex === -1) {
        const foundColumns = headers.join(', ');
        throw new Error(`Required columns not found. Found columns: ${foundColumns}. Looking for columns containing "Community", "Age Group", and "Encounter".`);
      }

      // Process data rows
      const encounters = [];
      const totalRows = lines.length - 1; // Exclude header
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const community = values[communityIndex];
          const ageGroup = values[ageGroupIndex];
          const encounterCount = parseInt(values[encounterIndex]);
          
          if (community && ageGroup && !isNaN(encounterCount) && encounterCount > 0) {
            // Normalize age group format
            let normalizedAgeGroup = ageGroup;
            if (ageGroup.includes('0-14') || ageGroup.includes('child')) {
              normalizedAgeGroup = '0-14';
            } else if (ageGroup.includes('15-64') || ageGroup.includes('adult') || ageGroup.includes('working')) {
              normalizedAgeGroup = '15-64';
            } else if (ageGroup.includes('65+') || ageGroup.includes('senior')) {
              normalizedAgeGroup = '65+';
            }
            
            encounters.push({ 
              community, 
              ageGroup: normalizedAgeGroup, 
              encounters: encounterCount 
            });
          }
        }
        
        // Update progress
        setEncountersUploadProgress((i / totalRows) * 100);
      }

      console.log('Found encounters:', encounters);

      // Validate that communities match uploaded start points
      const uploadedCommunityNames = uploadedStartPoints.map(sp => sp.name);
      const validEncounters = encounters.filter(enc => 
        uploadedCommunityNames.includes(enc.community)
      );
      
      const invalidCommunities = encounters.filter(enc => 
        !uploadedCommunityNames.includes(enc.community)
      ).map(enc => enc.community);

      if (validEncounters.length === 0) {
        throw new Error(`No encounters found for uploaded communities. Uploaded communities: ${uploadedCommunityNames.join(', ')}. Found communities: ${encounters.map(e => e.community).join(', ')}`);
      }

      // Add encounters to state
      setUploadedEncounters(validEncounters);
      
      // Prepare success message
      let message = `Successfully processed ${validEncounters.length} encounter records`;
      
      if (invalidCommunities.length > 0) {
        const uniqueInvalid = [...new Set(invalidCommunities)];
        message += `. ${uniqueInvalid.length} communities were not found in uploaded start points and were excluded: ${uniqueInvalid.join(', ')}`;
      }
      
      setSnackbar({ 
        open: true, 
        message: message, 
        severity: 'success' 
      });

    } catch (error) {
      console.error('Error processing encounters file:', error);
      setSnackbar({ 
        open: true, 
        message: `Error processing encounters file: ${error.message}`, 
        severity: 'error' 
      });
    } finally {
      setIsProcessingEncountersFile(false);
      setEncountersUploadProgress(0);
      setSelectedEncountersFile(null);
    }
  };

  const removeUploadedEncounters = () => {
    setUploadedEncounters([]);
    setSnackbar({ open: true, message: 'All encounter data removed', severity: 'info' });
  };

  return (
    <Box m="20px">
      {/* Inject custom CSS */}
      <style>{mapStyles}</style>
      
      <Header 
        title="CUSTOM MAP" 
        subtitle="Interactive custom map with location management and routing" 
      />

      {/* Page Description */}
      <Box 
        sx={{ 
          background: `linear-gradient(135deg, ${safeColors.primary[400]} 0%, ${safeColors.primary[600]} 100%)`,
          borderRadius: 3,
          p: 4,
          mb: 4,
          border: `2px solid ${safeColors.blueAccent[500]}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
      >
        <Typography variant="h4" color="grey.100" mb={3} fontWeight="bold" textAlign="center">
          Custom Travel Scenario Analysis
        </Typography>
        <Typography variant="h6" color="grey.300" lineHeight={1.8} textAlign="center" sx={{ maxWidth: '1200px', mx: 'auto' }}>
          The inputs uploaded to the GEOFFE platform are used to generate a report that users can download which summarizes the changes in the distance patients need to travel, the costs they have to pay including lost productivity, informal caregiving, out-of-pocket expenses related to medical travel.
        </Typography>
        <Typography variant="body1" color="grey.400" mt={2} textAlign="center" sx={{ fontStyle: 'italic' }}>
          Upload your start points, labs, and encounter data to create a comprehensive cost analysis for your healthcare travel scenario.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Map Section */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '70vh', backgroundColor: safeColors.primary[400] }}>
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
                                backgroundColor: safeColors.blueAccent[600],
                                color: 'white',
                                '&:hover': { backgroundColor: safeColors.blueAccent[700] }
                              }}
                            >
                              Add to Route
                            </Button>
                          </Box>
                        </Box>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Start Point marker */}
                  {startPoint && (
                    <Marker
                      key={startPoint.id}
                      position={[startPoint.latitude, startPoint.longitude]}
                      icon={createCustomIcon(startPoint.type)}
                      eventHandlers={{
                        click: () => setSelectedClinic(startPoint),
                      }}
                    >
                      <Popup>
                        <Box sx={{ minWidth: 200 }}>
                          <Typography variant="h6" fontWeight="bold" mb={1}>
                            {startPoint.name}
                          </Typography>
                          <Chip
                            label={getClinicTypeLabel(startPoint.type)}
                            size="small"
                            sx={{
                              backgroundColor: getClinicTypeColor(startPoint.type),
                              color: 'white',
                              mb: 1
                            }}
                          />
                          <Typography variant="body2" mb={1}>
                            {startPoint.address}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {startPoint.description}
                          </Typography>
                          <Box mt={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={removeStartPoint}
                              sx={{ mr: 1 }}
                            >
                              Remove
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<RouteIcon />}
                              onClick={addStartPointToRoute}
                              sx={{
                                backgroundColor: safeColors.blueAccent[600],
                                color: 'white',
                                '&:hover': { backgroundColor: safeColors.blueAccent[700] }
                              }}
                            >
                              Add to Route
                            </Button>
                          </Box>
                        </Box>
                      </Popup>
                    </Marker>
                  )}

                  {/* Uploaded Labs markers */}
                  {uploadedLabs.map((lab) => (
                    <Marker
                      key={lab.id}
                      position={[lab.latitude, lab.longitude]}
                      icon={createCustomIcon('lab')}
                      eventHandlers={{
                        click: () => setSelectedClinic(lab),
                      }}
                    >
                      <Popup>
                        <Box sx={{ minWidth: 200 }}>
                          <Typography variant="h6" fontWeight="bold" mb={1}>
                            {lab.name}
                          </Typography>
                          <Chip
                            label={getClinicTypeLabel(lab.type)}
                            size="small"
                            sx={{
                              backgroundColor: getClinicTypeColor(lab.type),
                              color: 'white',
                              mb: 1
                            }}
                          />
                          <Typography variant="body2" mb={1}>
                            {lab.address}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {lab.description}
                          </Typography>
                          <Box mt={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleEditLab(lab)}
                              sx={{ mr: 1 }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => removeUploadedLab(lab.id)}
                            >
                              Delete
                            </Button>
                          </Box>
                          <Box mt={1}>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<RouteIcon />}
                              onClick={() => addToRoute(lab)}
                              sx={{
                                backgroundColor: safeColors.blueAccent[600],
                                color: 'white',
                                '&:hover': { backgroundColor: safeColors.blueAccent[700] }
                              }}
                            >
                              Add to Route
                            </Button>
                          </Box>
                        </Box>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Uploaded Start Points markers */}
                  {uploadedStartPoints.map((startPoint) => (
                    <Marker
                      key={startPoint.id}
                      position={[startPoint.latitude, startPoint.longitude]}
                      icon={createCustomIcon('start')}
                      eventHandlers={{
                        click: () => setSelectedClinic(startPoint),
                      }}
                    >
                      <Popup>
                        <Box sx={{ minWidth: 200 }}>
                          <Typography variant="h6" fontWeight="bold" mb={1}>
                            {startPoint.name}
                          </Typography>
                          <Chip
                            label="Start Point"
                            size="small"
                            sx={{
                              backgroundColor: '#00FF00',
                              color: 'white',
                              mb: 1
                            }}
                          />
                          <Typography variant="body2" mb={1}>
                            {startPoint.address}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {startPoint.description}
                          </Typography>
                          <Box mt={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => removeUploadedStartPoint(startPoint.id)}
                              sx={{ mr: 1 }}
                            >
                              Remove
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<RouteIcon />}
                              onClick={() => addToRoute(startPoint)}
                              sx={{
                                backgroundColor: safeColors.blueAccent[600],
                                color: 'white',
                                '&:hover': { backgroundColor: safeColors.blueAccent[700] }
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

                  {/* Start Point to Labs Routes */}
                  {showStartToLabsRoutes && (
                    <StartToLabsRoutes 
                      routes={startToLabsRoutes} 
                      showRoutes={showStartToLabsRoutes}
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
                  backgroundColor: safeColors.greenAccent[600],
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  padding: '12px',
                  '&:hover': { backgroundColor: safeColors.greenAccent[700] }
                }}
              >
                Add New Location
              </Button>
            </Grid>

            {/* Start Point Controls */}
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: safeColors.primary[400] }}>
                <CardContent>
                  <Typography variant="h6" color="grey.100" mb={2} display="flex" alignItems="center">
                    <LocationOnIcon sx={{ mr: 1, color: safeColors.greenAccent[500] }} />
                    Start Point
                  </Typography>
                  
                  {!startPoint ? (
                    <Box>
                      <TextField
                        fullWidth
                        label="Enter Address"
                        value={startPointAddress}
                        onChange={(e) => setStartPointAddress(e.target.value)}
                        placeholder="e.g., 123 Main St, Vancouver, BC"
                        size="small"
                        sx={{ mb: 2 }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            geocodeAddress(startPointAddress);
                          }
                        }}
                      />
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => geocodeAddress(startPointAddress)}
                        disabled={isGeocoding || !startPointAddress.trim()}
                        sx={{
                          backgroundColor: safeColors.greenAccent[600],
                          color: 'white',
                          '&:hover': { backgroundColor: safeColors.greenAccent[700] }
                        }}
                      >
                        {isGeocoding ? 'Finding Location...' : 'Set Start Point'}
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: '#00FF00',
                            border: '2px solid white',
                            mr: 1
                          }}
                        />
                        <Typography variant="body2" color="grey.100" fontWeight="bold">
                          {startPoint.address}
                        </Typography>
                      </Box>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            size="small"
                            variant="outlined"
                            onClick={addStartPointToRoute}
                            sx={{ color: safeColors.blueAccent[300], borderColor: safeColors.blueAccent[300] }}
                          >
                            Add to Route
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={removeStartPoint}
                          >
                            Remove
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Start Points Upload Controls */}
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: safeColors.primary[400] }}>
                <CardContent>
                  <Typography variant="h6" color="grey.100" mb={2} display="flex" alignItems="center">
                    <LocationOnIcon sx={{ mr: 1, color: safeColors.redAccent[500] }} />
                    Upload Start Points
                  </Typography>
                  
                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: isDragOverStartPoints ? safeColors.redAccent[300] : safeColors.primary[300],
                      borderRadius: '8px',
                      p: 4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: isDragOverStartPoints ? safeColors.primary[500] : 'transparent',
                      '&:hover': {
                        borderColor: isDragOverStartPoints ? safeColors.redAccent[400] : safeColors.primary[400],
                        backgroundColor: isDragOverStartPoints ? safeColors.primary[500] : safeColors.primary[500],
                      },
                      transition: 'all 0.3s ease-in-out',
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOverStartPoints(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragOverStartPoints(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOverStartPoints(false);
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        handleStartPointsFileSelect({ target: { files: [file] } });
                      }
                    }}
                    onClick={() => {
                      document.getElementById('startpoints-file-upload').click();
                    }}
                  >
                    <input
                      accept=".xlsx,.xls,text/csv"
                      style={{ display: 'none' }}
                      id="startpoints-file-upload"
                      type="file"
                      onChange={handleStartPointsFileSelect}
                    />
                    <UploadFileIcon sx={{ fontSize: 40, color: isDragOverStartPoints ? safeColors.redAccent[400] : safeColors.redAccent[300], mb: 1 }} />
                    <Typography variant="body2" color="grey.300" mb={1}>
                      {isDragOverStartPoints ? 'Drop Excel or CSV file here' : 'Drag & drop Excel or CSV file here, or click to select'}
                    </Typography>
                    <Typography variant="caption" color="grey.400">
                      Required columns: Title, Community Latitude, Community Longitude
                    </Typography>
                  </Box>
                  
                  {uploadedStartPoints.length > 0 && (
                    <Box>
                      <Typography variant="body2" color="grey.300" mb={1}>
                        Uploaded Start Points: {uploadedStartPoints.length}
                      </Typography>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={removeUploadedStartPoints}
                      >
                        Remove All Start Points
                      </Button>
                    </Box>
                  )}
                    
                  {isProcessingStartPointsFile && (
                    <Box mt={2}>
                      <Typography variant="body2" color="grey.300" mb={1}>
                        Processing start points file... {Math.round(startPointsUploadProgress)}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={startPointsUploadProgress} 
                        sx={{ 
                          backgroundColor: safeColors.primary[500],
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: safeColors.redAccent[500]
                          }
                        }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Encounters Upload Controls */}
            {uploadedStartPoints.length > 0 && (
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: safeColors.primary[400] }}>
                  <CardContent>
                    <Typography variant="h6" color="grey.100" mb={2} display="flex" alignItems="center">
                      <AttachMoneyIcon sx={{ mr: 1, color: safeColors.greenAccent[500] }} />
                      Upload Encounters Data
                    </Typography>
                    
                    <Box
                      sx={{
                        border: '2px dashed',
                        borderColor: isDragOverEncounters ? safeColors.greenAccent[300] : safeColors.primary[300],
                        borderRadius: '8px',
                        p: 4,
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: isDragOverEncounters ? safeColors.primary[500] : 'transparent',
                        '&:hover': {
                          borderColor: isDragOverEncounters ? safeColors.greenAccent[400] : safeColors.primary[400],
                          backgroundColor: isDragOverEncounters ? safeColors.primary[500] : safeColors.primary[500],
                        },
                        transition: 'all 0.3s ease-in-out',
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOverEncounters(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDragOverEncounters(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOverEncounters(false);
                        const file = e.dataTransfer.files[0];
                        if (file) {
                          handleEncountersFileSelect({ target: { files: [file] } });
                        }
                      }}
                      onClick={() => {
                        document.getElementById('encounters-file-upload').click();
                      }}
                    >
                      <input
                        accept=".xlsx,.xls,text/csv"
                        style={{ display: 'none' }}
                        id="encounters-file-upload"
                        type="file"
                        onChange={handleEncountersFileSelect}
                      />
                      <UploadFileIcon sx={{ fontSize: 40, color: isDragOverEncounters ? safeColors.greenAccent[400] : safeColors.greenAccent[300], mb: 1 }} />
                      <Typography variant="body2" color="grey.300" mb={1}>
                        {isDragOverEncounters ? 'Drop Excel or CSV file here' : 'Drag & drop Excel or CSV file here, or click to select'}
                      </Typography>
                      <Typography variant="caption" color="grey.400">
                        Required columns: Community, Age Group (0-14, 15-64, 65+), Encounter
                      </Typography>
                    </Box>
                    
                    {uploadedEncounters.length > 0 && (
                      <Box>
                        <Typography variant="body2" color="grey.300" mb={1}>
                          Uploaded Encounters: {uploadedEncounters.length} records
                        </Typography>
                        <Typography variant="body2" color="grey.300" mb={1}>
                          Total Encounters: {uploadedEncounters.reduce((sum, enc) => sum + enc.encounters, 0)}
                        </Typography>
                        <Button
                          fullWidth
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={removeUploadedEncounters}
                        >
                          Remove All Encounters
                        </Button>
                      </Box>
                    )}
                      
                    {isProcessingEncountersFile && (
                      <Box mt={2}>
                        <Typography variant="body2" color="grey.300" mb={1}>
                          Processing encounters file... {Math.round(encountersUploadProgress)}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={encountersUploadProgress} 
                          sx={{ 
                            backgroundColor: safeColors.primary[500],
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: safeColors.greenAccent[500]
                            }
                          }}
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* File Upload Controls */}
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: safeColors.primary[400] }}>
                <CardContent>
                  <Typography variant="h6" color="grey.100" mb={2} display="flex" alignItems="center">
                    <ScienceIcon sx={{ mr: 1, color: safeColors.blueAccent[500] }} />
                    Upload Labs
                  </Typography>
                  
                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: isDragOver ? safeColors.blueAccent[300] : safeColors.primary[300],
                      borderRadius: '8px',
                      p: 4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: isDragOver ? safeColors.primary[500] : 'transparent',
                      '&:hover': {
                        borderColor: isDragOver ? safeColors.blueAccent[400] : safeColors.primary[400],
                        backgroundColor: isDragOver ? safeColors.primary[500] : safeColors.primary[500],
                      },
                      transition: 'all 0.3s ease-in-out',
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        handleFileSelect({ target: { files: [file] } });
                      }
                    }}
                    onClick={() => {
                      document.getElementById('lab-file-upload').click();
                    }}
                  >
                    <input
                      accept=".xlsx,.xls,text/csv"
                      style={{ display: 'none' }}
                      id="lab-file-upload"
                      type="file"
                      onChange={handleFileSelect}
                    />
                    <UploadFileIcon sx={{ fontSize: 40, color: isDragOver ? safeColors.blueAccent[400] : safeColors.blueAccent[300], mb: 1 }} />
                    <Typography variant="body2" color="grey.300" mb={1}>
                      {isDragOver ? 'Drop Excel or CSV file here' : 'Drag & drop Excel or CSV file here, or click to select'}
                    </Typography>
                    <Typography variant="caption" color="grey.400">
                      Supports .xlsx, .xls, and .csv files
                    </Typography>
                  </Box>
                  
                  {uploadedLabs.length > 0 && (
                    <Box>
                      <Typography variant="body2" color="grey.300" mb={1}>
                        Uploaded Labs: {uploadedLabs.length}
                      </Typography>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={removeUploadedLabs}
                      >
                        Remove All Labs
                      </Button>
                    </Box>
                  )}
                    
                  {isProcessingFile && (
                    <Box mt={2}>
                      <Typography variant="body2" color="grey.300" mb={1}>
                        Processing file... {Math.round(uploadProgress)}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={uploadProgress} 
                        sx={{ 
                          backgroundColor: safeColors.primary[500],
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: safeColors.blueAccent[500]
                          }
                        }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Start Point to Labs Routing */}
            {(startPoint || uploadedStartPoints.length > 0) && uploadedLabs.length > 0 && (
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: safeColors.primary[400] }}>
                  <CardContent>
                    <Typography variant="h6" color="grey.100" mb={2} display="flex" alignItems="center">
                      <RouteIcon sx={{ mr: 1, color: '#FF6B6B' }} />
                      Start to Labs Analysis
                    </Typography>
                    
                    {!showStartToLabsRoutes ? (
                      <Box>
                        <Typography variant="body2" color="grey.300" mb={2}>
                          {uploadedStartPoints.length > 0 
                            ? `Analyze routes from ${uploadedStartPoints.length} start points to find closest labs`
                            : `Calculate routes from start point to all ${uploadedLabs.length} labs`
                          }
                        </Typography>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={calculateStartToLabsRoutes}
                          disabled={isCalculatingStartToLabs}
                          sx={{
                            backgroundColor: '#FF6B6B',
                            color: 'white',
                            '&:hover': { backgroundColor: '#FF5252' }
                          }}
                        >
                          {isCalculatingStartToLabs ? 'Analyzing Routes...' : 'Analyze Routes to Labs'}
                        </Button>
                      </Box>
                    ) : (
                      <Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                          <Typography variant="body2" color="grey.300">
                            Analysis complete: {startPointLabAnalysis.length} start points analyzed
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={clearStartToLabsRoutes}
                            sx={{ color: '#FF6B6B', borderColor: '#FF6B6B' }}
                          >
                            Clear Analysis
                          </Button>
                        </Box>
                        
                        {isCalculatingStartToLabs && (
                          <Box mb={2}>
                            <Typography variant="body2" color="grey.300" mb={1}>
                              Analyzing routes... {Math.round(startToLabsProgress)}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={startToLabsProgress} 
                              sx={{ 
                                backgroundColor: safeColors.primary[500],
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: '#FF6B6B'
                                }
                              }}
                            />
                          </Box>
                        )}
                        
                        {/* Show analysis results */}
                        {startPointLabAnalysis.map((analysis, index) => (
                          <Accordion key={analysis.startPoint.id} sx={{ backgroundColor: safeColors.primary[500], mb: 1 }}>
                            <AccordionSummary>
                              <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                                <Typography variant="body2" color="grey.100" fontWeight="bold">
                                  {index + 1}. {analysis.startPoint.name}
                                </Typography>
                                {analysis.closestLabRoute && (
                                  <Chip
                                    label={`Closest: ${analysis.closestLabRoute.to.name}`}
                                    size="small"
                                    sx={{
                                      backgroundColor: '#4CAF50',
                                      color: 'white',
                                      fontSize: '10px'
                                    }}
                                  />
                                )}
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Box>
                                <Typography variant="body2" color="grey.300" mb={1}>
                                  Top 3 closest labs:
                                </Typography>
                                <List dense>
                                  {analysis.allRoutes.map((route, routeIndex) => (
                                    <ListItem key={route.id} sx={{ px: 0, py: 0.5 }}>
                                      <ListItemText
                                        primary={
                                          <Typography variant="body2" color="grey.100" fontWeight="bold">
                                            {routeIndex + 1}. {route.to.name}
                                          </Typography>
                                        }
                                        secondary={
                                          <Typography variant="caption" color="grey.400">
                                            Haversine: {route.haversineDistance.toFixed(2)} km • 
                                            Real: {formatDistance(route.realDistance)} • 
                                            {formatDuration(route.realDuration)}
                                            {route.rank === 1 && ' (Closest)'}
                                          </Typography>
                                        }
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </Box>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                        
                        {startPointLabAnalysis.length > 0 && (
                          <Box mt={2} p={2} sx={{ backgroundColor: safeColors.primary[500], borderRadius: 1 }}>
                            <Typography variant="h6" color="grey.100" mb={1}>
                              Analysis Summary
                            </Typography>
                            <Grid container spacing={1}>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="grey.300">
                                  Start Points:
                                </Typography>
                                <Typography variant="body1" color="grey.100" fontWeight="bold">
                                  {startPointLabAnalysis.length}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="grey.300">
                                  Total Routes:
                                </Typography>
                                <Typography variant="body1" color="grey.100" fontWeight="bold">
                                  {startToLabsRoutes.length}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="grey.300">
                                  Closest Labs Found:
                                </Typography>
                                <Typography variant="body1" color="grey.100" fontWeight="bold">
                                  {startPointLabAnalysis.filter(r => r.closestLabRoute).length}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="grey.300">
                                  Average Distance:
                                </Typography>
                                <Typography variant="body1" color="grey.100" fontWeight="bold">
                                  {startPointLabAnalysis.length > 0 
                                    ? formatDistance(startPointLabAnalysis.reduce((sum, analysis) => 
                                        sum + (analysis.closestLabRoute?.realDistance || 0), 0) / startPointLabAnalysis.length)
                                    : '0 m'
                                  }
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Cost Calculation Section */}
            {showStartToLabsRoutes && startPointLabAnalysis.length > 0 && (
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: safeColors.primary[400] }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AttachMoneyIcon sx={{ color: '#FF6B6B' }} />
                        <Typography variant="h6" color="grey.100" fontWeight="bold">
                          MD Appointment Cost Analysis
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <Button
                          variant="contained"
                          startIcon={<CalculateIcon />}
                          onClick={calculateCosts}
                          sx={{
                            backgroundColor: '#FF6B6B',
                            color: 'white',
                            '&:hover': { backgroundColor: '#FF5252' }
                          }}
                        >
                          Calculate Costs
                        </Button>
                      </Box>
                    </Box>

                    {showCostCalculation && costResults && (
                      <Box>
                        {/* Download Options */}
                        <Box mb={3} p={2} sx={{ backgroundColor: safeColors.primary[600], borderRadius: 1 }}>
                          <Typography variant="h6" color="grey.100" mb={2}>
                            Download Options
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                              <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={downloadLabCostsCSV}
                                sx={{
                                  color: '#4CAF50',
                                  borderColor: '#4CAF50',
                                  '&:hover': { borderColor: '#45a049', backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                                }}
                              >
                                Download CSV
                              </Button>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<FunctionsIcon />}
                                onClick={downloadCostFormulas}
                                sx={{
                                  color: '#2196F3',
                                  borderColor: '#2196F3',
                                  '&:hover': { borderColor: '#1976D2', backgroundColor: 'rgba(33, 150, 243, 0.1)' }
                                }}
                              >
                                Cost Formulas
                              </Button>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<DescriptionIcon />}
                                onClick={downloadReport}
                                sx={{
                                  color: '#FF9800',
                                  borderColor: '#FF9800',
                                  '&:hover': { borderColor: '#F57C00', backgroundColor: 'rgba(255, 152, 0, 0.1)' }
                                }}
                              >
                                Download Report
                              </Button>
                            </Grid>
                          </Grid>
                        </Box>

                        {/* Cost Parameters */}
                        <Box mb={3}>
                          <Typography variant="h6" color="grey.100" mb={2}>
                            Cost Parameters
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6} md={3}>
                              <TextField
                                label="Wage Rate ($/hr)"
                                type="number"
                                value={costParams.wage}
                                onChange={(e) => setCostParams({...costParams, wage: parseFloat(e.target.value) || 0})}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    color: 'grey.100',
                                    '& fieldset': { borderColor: 'grey.600' },
                                    '&:hover fieldset': { borderColor: 'grey.500' }
                                  },
                                  '& .MuiInputLabel-root': { color: 'grey.300' }
                                }}
                              />
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <TextField
                                label="Parking Cost ($)"
                                type="number"
                                value={costParams.parking}
                                onChange={(e) => setCostParams({...costParams, parking: parseFloat(e.target.value) || 0})}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    color: 'grey.100',
                                    '& fieldset': { borderColor: 'grey.600' },
                                    '&:hover fieldset': { borderColor: 'grey.500' }
                                  },
                                  '& .MuiInputLabel-root': { color: 'grey.300' }
                                }}
                              />
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <TextField
                                label="Duration (hrs)"
                                type="number"
                                value={costParams.duration}
                                onChange={(e) => setCostParams({...costParams, duration: parseFloat(e.target.value) || 0})}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    color: 'grey.100',
                                    '& fieldset': { borderColor: 'grey.600' },
                                    '&:hover fieldset': { borderColor: 'grey.500' }
                                  },
                                  '& .MuiInputLabel-root': { color: 'grey.300' }
                                }}
                              />
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <TextField
                                label="Average Distance (km)"
                                type="number"
                                value={costResults.summary.averageDistance.toFixed(1)}
                                disabled
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    color: 'grey.100',
                                    '& fieldset': { borderColor: 'grey.600' }
                                  },
                                  '& .MuiInputLabel-root': { color: 'grey.300' }
                                }}
                              />
                            </Grid>
                          </Grid>
                          
                          {/* Encounters Information */}
                          {costResults.encounters.hasData && (
                            <Box mt={2} p={2} sx={{ backgroundColor: safeColors.primary[600], borderRadius: 1, border: '2px solid #FF9800' }}>
                              <Typography variant="h6" color="grey.100" mb={1} display="flex" alignItems="center">
                                <AttachMoneyIcon sx={{ mr: 1, color: '#FF9800' }} />
                                Encounters Data Applied
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={6} md={3}>
                                  <Typography variant="body2" color="grey.300">
                                    Total Encounters:
                                  </Typography>
                                  <Typography variant="h6" color="#FF9800" fontWeight="bold">
                                    {costResults.encounters.totalEncounters.toLocaleString()}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                  <Typography variant="body2" color="grey.300">
                                    Communities:
                                  </Typography>
                                  <Typography variant="h6" color="#FF9800" fontWeight="bold">
                                    {costResults.encounters.communitiesWithEncounters}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                  <Typography variant="body2" color="grey.300">
                                    Child Encounters:
                                  </Typography>
                                  <Typography variant="h6" color="#FF9800" fontWeight="bold">
                                    {costResults.encounters.data.filter(enc => enc.ageGroup === '0-14').reduce((sum, enc) => sum + enc.encounters, 0).toLocaleString()}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                  <Typography variant="body2" color="grey.300">
                                    Adult Encounters:
                                  </Typography>
                                  <Typography variant="h6" color="#FF9800" fontWeight="bold">
                                    {costResults.encounters.data.filter(enc => enc.ageGroup === '15-64').reduce((sum, enc) => sum + enc.encounters, 0).toLocaleString()}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                  <Typography variant="body2" color="grey.300">
                                    Senior Encounters:
                                  </Typography>
                                  <Typography variant="h6" color="#FF9800" fontWeight="bold">
                                    {costResults.encounters.data.filter(enc => enc.ageGroup === '65+').reduce((sum, enc) => sum + enc.encounters, 0).toLocaleString()}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                  <Typography variant="body2" color="grey.300">
                                    Cost Multiplier:
                                  </Typography>
                                  <Typography variant="h6" color="#FF9800" fontWeight="bold">
                                    {costResults.encounters.totalEncounters > 0 ? 
                                      (costResults.encounters.totalEncounters / costResults.summary.totalStartPoints).toFixed(1) + 'x' : '1x'
                                    }
                                  </Typography>
                                </Grid>
                              </Grid>
                              <Typography variant="body2" color="grey.300" mt={1}>
                                <strong>Note:</strong> All costs shown below are multiplied by encounter counts for realistic total estimates.
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {/* Cost Results by Age Group */}
                        <Typography variant="h6" color="grey.100" mb={2}>
                          Cost Breakdown by Age Group
                        </Typography>
                        <Grid container spacing={2}>
                          {/* Child (0-14) */}
                          <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, backgroundColor: safeColors.primary[600], border: '2px solid #FF6B6B' }}>
                              <Typography variant="h6" color="grey.100" mb={2} textAlign="center">
                                Children (0-14)
                              </Typography>
                              <Box mb={2}>
                                <Typography variant="h4" color="#FF6B6B" textAlign="center" fontWeight="bold">
                                  {new Intl.NumberFormat('en-CA', {
                                    style: 'currency',
                                    currency: 'CAD',
                                    minimumFractionDigits: 2
                                  }).format(costResults.child.costs.total)}
                                </Typography>
                                <Typography variant="body2" color="grey.300" textAlign="center">
                                  per MD appointment
                                </Typography>
                              </Box>
                              <Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                  <Typography variant="body2" color="grey.300">Lost Productivity:</Typography>
                                  <Typography variant="body2" color="grey.100">$0.00</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                  <Typography variant="body2" color="grey.300">Informal Caregiving:</Typography>
                                  <Typography variant="body2" color="grey.100">
                                    {new Intl.NumberFormat('en-CA', {
                                      style: 'currency',
                                      currency: 'CAD',
                                      minimumFractionDigits: 2
                                    }).format(costResults.child.costs.informalCaregiving)}
                                  </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                  <Typography variant="body2" color="grey.300">Out of Pocket:</Typography>
                                  <Typography variant="body2" color="grey.100">
                                    {new Intl.NumberFormat('en-CA', {
                                      style: 'currency',
                                      currency: 'CAD',
                                      minimumFractionDigits: 2
                                    }).format(costResults.child.costs.outOfPocket)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Paper>
                          </Grid>

                          {/* Adult (15-64) */}
                          <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, backgroundColor: safeColors.primary[600], border: '2px solid #4CAF50' }}>
                              <Typography variant="h6" color="grey.100" mb={2} textAlign="center">
                                Working Age (15-64)
                              </Typography>
                              <Box mb={2}>
                                <Typography variant="h4" color="#4CAF50" textAlign="center" fontWeight="bold">
                                  {new Intl.NumberFormat('en-CA', {
                                    style: 'currency',
                                    currency: 'CAD',
                                    minimumFractionDigits: 2
                                  }).format(costResults.adult.costs.total)}
                                </Typography>
                                <Typography variant="body2" color="grey.300" textAlign="center">
                                  per MD appointment
                                </Typography>
                              </Box>
                              <Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                  <Typography variant="body2" color="grey.300">Lost Productivity:</Typography>
                                  <Typography variant="body2" color="grey.100">
                                    {new Intl.NumberFormat('en-CA', {
                                      style: 'currency',
                                      currency: 'CAD',
                                      minimumFractionDigits: 2
                                    }).format(costResults.adult.costs.lostProductivity)}
                                  </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                  <Typography variant="body2" color="grey.300">Informal Caregiving:</Typography>
                                  <Typography variant="body2" color="grey.100">
                                    {new Intl.NumberFormat('en-CA', {
                                      style: 'currency',
                                      currency: 'CAD',
                                      minimumFractionDigits: 2
                                    }).format(costResults.adult.costs.informalCaregiving)}
                                  </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                  <Typography variant="body2" color="grey.300">Out of Pocket:</Typography>
                                  <Typography variant="body2" color="grey.100">
                                    {new Intl.NumberFormat('en-CA', {
                                      style: 'currency',
                                      currency: 'CAD',
                                      minimumFractionDigits: 2
                                    }).format(costResults.adult.costs.outOfPocket)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Paper>
                          </Grid>

                          {/* Senior (65+) */}
                          <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, backgroundColor: safeColors.primary[600], border: '2px solid #2196F3' }}>
                              <Typography variant="h6" color="grey.100" mb={2} textAlign="center">
                                Seniors (65+)
                              </Typography>
                              <Box mb={2}>
                                <Typography variant="h4" color="#2196F3" textAlign="center" fontWeight="bold">
                                  {new Intl.NumberFormat('en-CA', {
                                    style: 'currency',
                                    currency: 'CAD',
                                    minimumFractionDigits: 2
                                  }).format(costResults.senior.costs.total)}
                                </Typography>
                                <Typography variant="body2" color="grey.300" textAlign="center">
                                  per MD appointment
                                </Typography>
                              </Box>
                              <Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                  <Typography variant="body2" color="grey.300">Lost Productivity:</Typography>
                                  <Typography variant="body2" color="grey.100">$0.00</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                  <Typography variant="body2" color="grey.300">Informal Caregiving:</Typography>
                                  <Typography variant="body2" color="grey.100">
                                    {new Intl.NumberFormat('en-CA', {
                                      style: 'currency',
                                      currency: 'CAD',
                                      minimumFractionDigits: 2
                                    }).format(costResults.senior.costs.informalCaregiving)}
                                  </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                  <Typography variant="body2" color="grey.300">Out of Pocket:</Typography>
                                  <Typography variant="body2" color="grey.100">
                                    {new Intl.NumberFormat('en-CA', {
                                      style: 'currency',
                                      currency: 'CAD',
                                      minimumFractionDigits: 2
                                    }).format(costResults.senior.costs.outOfPocket)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Paper>
                          </Grid>
                        </Grid>

                        {/* CO2 Emissions Summary */}
                        <Box mt={3}>
                          <Typography variant="h6" color="grey.100" mb={2}>
                            Environmental Impact
                          </Typography>
                          <Paper sx={{ p: 2, backgroundColor: safeColors.primary[600], border: '2px solid #4CAF50' }}>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="grey.300">
                                  Total CO2 Emissions:
                                </Typography>
                                <Typography variant="h4" color="#4CAF50" fontWeight="bold">
                                  {costResults.emissions.totalCO2.toFixed(2)} kg
                                </Typography>
                                <Typography variant="body2" color="grey.300">
                                  for all {costResults.summary.totalStartPoints} start points
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="grey.300">
                                  Average CO2 per Trip:
                                </Typography>
                                <Typography variant="h4" color="#4CAF50" fontWeight="bold">
                                  {costResults.emissions.averageCO2.toFixed(2)} kg
                                </Typography>
                                <Typography variant="body2" color="grey.300">
                                  per one-way trip
                                </Typography>
                              </Grid>
                            </Grid>
                          </Paper>
                        </Box>

                        {/* Total Costs for All Start Points */}
                        <Box mt={3}>
                          <Typography variant="h6" color="grey.100" mb={2}>
                            Total Costs for All {costResults.summary.totalStartPoints} Start Points
                          </Typography>
                          <Grid container spacing={2}>
                            {/* Child Total */}
                            <Grid item xs={12} md={4}>
                              <Paper sx={{ p: 2, backgroundColor: safeColors.primary[600], border: '2px solid #FF6B6B' }}>
                                <Typography variant="h6" color="grey.100" mb={1} textAlign="center">
                                  Children (0-14)
                                </Typography>
                                <Typography variant="h3" color="#FF6B6B" textAlign="center" fontWeight="bold">
                                  {new Intl.NumberFormat('en-CA', {
                                    style: 'currency',
                                    currency: 'CAD',
                                    minimumFractionDigits: 2
                                  }).format(costResults.totals.child)}
                                </Typography>
                                <Typography variant="body2" color="grey.300" textAlign="center">
                                  total for all start points
                                </Typography>
                              </Paper>
                            </Grid>

                            {/* Adult Total */}
                            <Grid item xs={12} md={4}>
                              <Paper sx={{ p: 2, backgroundColor: safeColors.primary[600], border: '2px solid #4CAF50' }}>
                                <Typography variant="h6" color="grey.100" mb={1} textAlign="center">
                                  Working Age (15-64)
                                </Typography>
                                <Typography variant="h3" color="#4CAF50" textAlign="center" fontWeight="bold">
                                  {new Intl.NumberFormat('en-CA', {
                                    style: 'currency',
                                    currency: 'CAD',
                                    minimumFractionDigits: 2
                                  }).format(costResults.totals.adult)}
                                </Typography>
                                <Typography variant="body2" color="grey.300" textAlign="center">
                                  total for all start points
                                </Typography>
                              </Paper>
                            </Grid>

                            {/* Senior Total */}
                            <Grid item xs={12} md={4}>
                              <Paper sx={{ p: 2, backgroundColor: safeColors.primary[600], border: '2px solid #2196F3' }}>
                                <Typography variant="h6" color="grey.100" mb={1} textAlign="center">
                                  Seniors (65+)
                                </Typography>
                                <Typography variant="h3" color="#2196F3" textAlign="center" fontWeight="bold">
                                  {new Intl.NumberFormat('en-CA', {
                                    style: 'currency',
                                    currency: 'CAD',
                                    minimumFractionDigits: 2
                                  }).format(costResults.totals.senior)}
                                </Typography>
                                <Typography variant="body2" color="grey.300" textAlign="center">
                                  total for all start points
                                </Typography>
                              </Paper>
                            </Grid>
                          </Grid>
                        </Box>

                        {/* Grand Total */}
                        <Box mt={3}>
                          <Paper sx={{ p: 3, backgroundColor: safeColors.primary[600], border: '3px solid #FFD700' }}>
                            <Typography variant="h5" color="grey.100" mb={2} textAlign="center" fontWeight="bold">
                              Grand Total for All Age Groups
                            </Typography>
                            <Typography variant="h2" color="#FFD700" textAlign="center" fontWeight="bold">
                              {new Intl.NumberFormat('en-CA', {
                                style: 'currency',
                                currency: 'CAD',
                                minimumFractionDigits: 2
                              }).format(costResults.totals.grand)}
                            </Typography>
                            <Typography variant="body1" color="grey.300" textAlign="center" mb={3}>
                              Total cost for all {costResults.summary.totalStartPoints} start points across all age groups
                            </Typography>
                            
                            {/* Subunit Totals */}
                            <Grid container spacing={2} mt={2}>
                              <Grid item xs={12} md={4}>
                                <Box textAlign="center" p={2} sx={{ backgroundColor: safeColors.primary[500], borderRadius: 1 }}>
                                  <Typography variant="h6" color="grey.100" mb={1}>
                                    Lost Productivity
                                  </Typography>
                                  <Typography variant="h4" color="#FF6B6B" fontWeight="bold">
                                    {new Intl.NumberFormat('en-CA', {
                                      style: 'currency',
                                      currency: 'CAD',
                                      minimumFractionDigits: 2
                                    }).format(costResults.totals.lostProductivity)}
                                  </Typography>
                                  <Typography variant="body2" color="grey.300">
                                    Working age only
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Box textAlign="center" p={2} sx={{ backgroundColor: safeColors.primary[500], borderRadius: 1 }}>
                                  <Typography variant="h6" color="grey.100" mb={1}>
                                    Informal Caregiving
                                  </Typography>
                                  <Typography variant="h4" color="#4CAF50" fontWeight="bold">
                                    {new Intl.NumberFormat('en-CA', {
                                      style: 'currency',
                                      currency: 'CAD',
                                      minimumFractionDigits: 2
                                    }).format(costResults.totals.informalCaregiving)}
                                  </Typography>
                                  <Typography variant="body2" color="grey.300">
                                    All age groups
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Box textAlign="center" p={2} sx={{ backgroundColor: safeColors.primary[500], borderRadius: 1 }}>
                                  <Typography variant="h6" color="grey.100" mb={1}>
                                    Out of Pocket
                                  </Typography>
                                  <Typography variant="h4" color="#2196F3" fontWeight="bold">
                                    {new Intl.NumberFormat('en-CA', {
                                      style: 'currency',
                                      currency: 'CAD',
                                      minimumFractionDigits: 2
                                    }).format(costResults.totals.outOfPocket)}
                                  </Typography>
                                  <Typography variant="body2" color="grey.300">
                                    All age groups
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </Paper>
                        </Box>

                        {/* Summary Statistics */}
                        <Box mt={3} p={2} sx={{ backgroundColor: safeColors.primary[600], borderRadius: 1 }}>
                          <Typography variant="h6" color="grey.100" mb={2}>
                            Summary Statistics
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6} md={3}>
                              <Typography variant="body2" color="grey.300">Total Start Points:</Typography>
                              <Typography variant="h6" color="grey.100">{costResults.summary.totalStartPoints}</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography variant="body2" color="grey.300">Average Distance:</Typography>
                              <Typography variant="h6" color="grey.100">{costResults.summary.averageDistance.toFixed(1)} km</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography variant="body2" color="grey.300">Total Distance:</Typography>
                              <Typography variant="h6" color="grey.100">{costResults.summary.totalDistance.toFixed(1)} km</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography variant="body2" color="grey.300">Cost Range:</Typography>
                              <Typography variant="h6" color="grey.100">
                                {new Intl.NumberFormat('en-CA', {
                                  style: 'currency',
                                  currency: 'CAD',
                                  minimumFractionDigits: 2
                                }).format(Math.min(costResults.child.costs.total, costResults.adult.costs.total, costResults.senior.costs.total))} - 
                                {new Intl.NumberFormat('en-CA', {
                                  style: 'currency',
                                  currency: 'CAD',
                                  minimumFractionDigits: 2
                                }).format(Math.max(costResults.child.costs.total, costResults.adult.costs.total, costResults.senior.costs.total))}
                              </Typography>
                            </Grid>
                            {costResults.encounters.hasData && (
                              <>
                                <Grid item xs={6} md={3}>
                                  <Typography variant="body2" color="grey.300">Total Encounters:</Typography>
                                  <Typography variant="h6" color="#FF9800">{costResults.encounters.totalEncounters.toLocaleString()}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                  <Typography variant="body2" color="grey.300">Avg Encounters/Community:</Typography>
                                  <Typography variant="h6" color="#FF9800">
                                    {Math.round(costResults.encounters.totalEncounters / costResults.encounters.communitiesWithEncounters).toLocaleString()}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                  <Typography variant="body2" color="grey.300">Cost per Encounter:</Typography>
                                  <Typography variant="h6" color="#FF9800">
                                    {new Intl.NumberFormat('en-CA', {
                                      style: 'currency',
                                      currency: 'CAD',
                                      minimumFractionDigits: 2
                                    }).format(costResults.totals.grand / costResults.encounters.totalEncounters)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                  <Typography variant="body2" color="grey.300">CO2 per Encounter:</Typography>
                                  <Typography variant="h6" color="#FF9800">
                                    {(costResults.emissions.totalCO2 / costResults.encounters.totalEncounters).toFixed(2)} kg
                                  </Typography>
                                </Grid>
                              </>
                            )}
                          </Grid>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Route Controls */}
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: safeColors.primary[400] }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" color="grey.100" display="flex" alignItems="center">
                      <RouteIcon sx={{ mr: 1, color: safeColors.blueAccent[500] }} />
                      Route Planning
                    </Typography>
                    {routeWaypoints.length > 0 && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ClearIcon />}
                        onClick={clearRoute}
                        sx={{ color: safeColors.redAccent[300], borderColor: safeColors.redAccent[300] }}
                      >
                        Clear
                      </Button>
                    )}
                  </Box>
                  
                  {routeWaypoints.length === 0 ? (
                    <Typography variant="body2" color="grey.400" textAlign="center">
                      Click on location markers and select "Add to Route" to plan a route
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
                                sx={{ color: safeColors.redAccent[300] }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                      
                      {routeInfo && routeWaypoints.length >= 2 && (
                        <Box mt={2} p={2} sx={{ backgroundColor: safeColors.primary[500], borderRadius: 1 }}>
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
                        <Box mt={2} p={2} sx={{ backgroundColor: safeColors.primary[500], borderRadius: 1 }}>
                          <Typography variant="body2" color="grey.300" textAlign="center">
                            Add another location to see route distance and duration
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
              <Card sx={{ backgroundColor: safeColors.primary[400] }}>
                <CardContent>
                  <Typography variant="h6" color="grey.100" mb={2} display="flex" alignItems="center">
                    <MapIcon sx={{ mr: 1, color: safeColors.blueAccent[500] }} />
                    Location Types
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
              <Card sx={{ backgroundColor: safeColors.primary[400], maxHeight: '300px', overflow: 'auto' }}>
                <CardContent>
                  <Typography variant="h6" color="grey.100" mb={2} display="flex" alignItems="center">
                    <LocationOnIcon sx={{ mr: 1, color: safeColors.blueAccent[500] }} />
                    Locations ({clinics.length + uploadedLabs.length + uploadedStartPoints.length})
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
                            sx={{ color: safeColors.blueAccent[300] }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClinic(clinic.id)}
                            sx={{ color: safeColors.redAccent[300] }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                    {uploadedLabs.map((lab) => (
                      <ListItem key={lab.id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Typography variant="body2" color="grey.100" fontWeight="bold">
                              {lab.name}
                            </Typography>
                          }
                        />
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={getClinicTypeLabel(lab.type)}
                            size="small"
                            sx={{
                              backgroundColor: getClinicTypeColor(lab.type),
                              color: 'white',
                              fontSize: '10px',
                              height: '20px'
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleEditLab(lab)}
                            sx={{ color: safeColors.blueAccent[300] }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => removeUploadedLab(lab.id)}
                            sx={{ color: safeColors.redAccent[300] }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                    {uploadedStartPoints.map((startPoint) => (
                      <ListItem key={startPoint.id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Typography variant="body2" color="grey.100" fontWeight="bold">
                              {startPoint.name}
                            </Typography>
                          }
                        />
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label="Start Point"
                            size="small"
                            sx={{
                              backgroundColor: '#00FF00',
                              color: 'white',
                              fontSize: '10px',
                              height: '20px'
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => removeUploadedStartPoint(startPoint.id)}
                            sx={{ color: safeColors.redAccent[300] }}
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
          {editingClinic 
            ? (editingClinic.id.startsWith('lab-') ? 'Edit Lab' : 'Edit Location')
            : 'Add New Location'
          }
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location Name"
                value={clinicForm.name}
                onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Location Type</InputLabel>
                <Select
                  value={clinicForm.type}
                  onChange={(e) => setClinicForm({ ...clinicForm, type: e.target.value })}
                  label="Location Type"
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
            {editingClinic 
              ? (editingClinic.id.startsWith('lab-') ? 'Update Lab' : 'Update Location')
              : 'Add Location'
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Upload Confirmation Dialog */}
      <Dialog open={fileUploadDialogOpen} onClose={() => setFileUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Upload Lab Data
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body1" mb={2}>
              File: <strong>{selectedFile?.name}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              This will process the Excel file and geocode the lab addresses. The file should contain:
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                • A column named "Lab Name" (or similar) with lab names
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                • A column named "Full Address" (or similar) with complete addresses
              </Typography>
            </Box>
            <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2">
                <strong>Important:</strong> The file must be saved as CSV format (.csv) or be a simple Excel file that can be read as text. 
                Column names should contain keywords like "name", "lab", "address", "location", etc.
              </Typography>
            </Alert>
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Geocoding may take some time and includes delays to respect API rate limits.
              </Typography>
            </Alert>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>BC Boundary Filter:</strong> Only labs located within British Columbia, Canada will be added to the map. 
                Labs outside BC boundaries will be automatically excluded.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileUploadDialogOpen(false)}>Cancel</Button>
          <Button onClick={processExcelFile} variant="contained" color="primary">
            Process File
          </Button>
        </DialogActions>
      </Dialog>

      {/* Encounters File Upload Confirmation Dialog */}
      <Dialog open={encountersDialogOpen} onClose={() => setEncountersDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Upload Encounters Data
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body1" mb={2}>
              File: <strong>{selectedEncountersFile?.name}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              This will process the encounters file and multiply costs by encounter counts. The file should contain:
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                • A column named "Community" (or similar) with community names
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                • A column named "Age Group" with values like "0-14", "15-64", "65+"
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                • A column named "Encounter" (or similar) with encounter counts
              </Typography>
            </Box>
            <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2">
                <strong>Important:</strong> Community names must exactly match the names in your uploaded start points file.
                Only encounters for matching communities will be processed.
              </Typography>
            </Alert>
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2">
                <strong>Age Groups:</strong> Supported formats include "0-14", "15-64", "65+", "child", "adult", "senior", etc.
                The system will automatically normalize these to standard formats.
              </Typography>
            </Alert>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Cost Calculation:</strong> Costs will be multiplied by encounter counts for each community and age group
                to provide realistic total cost estimates.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEncountersDialogOpen(false)}>Cancel</Button>
          <Button onClick={processEncountersFile} variant="contained" color="primary">
            Process File
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

export default CustomMap; 