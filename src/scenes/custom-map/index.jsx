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

    // Add new polylines
    routes.forEach((route) => {
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
  const colors = tokens(theme.palette.mode);
  
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

  // Start point to labs routing state
  const [showStartToLabsRoutes, setShowStartToLabsRoutes] = useState(false);
  const [startToLabsRoutes, setStartToLabsRoutes] = useState([]);
  const [isCalculatingStartToLabs, setIsCalculatingStartToLabs] = useState(false);
  const [startToLabsProgress, setStartToLabsProgress] = useState(0);

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
              geocodedLabs.push({
                id: `lab-${Date.now()}-${i}`,
                name: lab.labName,
                type: 'lab',
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon),
                address: result.display_name,
                description: 'Laboratory facility'
              });
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
      
      if (geocodedLabs.length > 0) {
        setSnackbar({ 
          open: true, 
          message: `Successfully added ${geocodedLabs.length} labs to the map`, 
          severity: 'success' 
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
    if (!startPoint || uploadedLabs.length === 0) {
      setSnackbar({ open: true, message: 'Start point and labs are required', severity: 'warning' });
      return;
    }

    console.log('Starting route calculation for', uploadedLabs.length, 'labs');
    console.log('Start point:', startPoint);
    console.log('Labs:', uploadedLabs);

    setIsCalculatingStartToLabs(true);
    setShowStartToLabsRoutes(true);
    setStartToLabsProgress(0);

    try {
      const routes = [];
      let totalDistance = 0;
      let totalDuration = 0;

      for (let i = 0; i < uploadedLabs.length; i++) {
        const lab = uploadedLabs[i];
        console.log(`Processing lab ${i + 1}/${uploadedLabs.length}:`, lab.name);
        
        // Update progress
        setStartToLabsProgress(((i) / uploadedLabs.length) * 100);
        
        try {
          // Add delay to respect API rate limits
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
          }
          
          // Build coordinates string for OSRM API
          const coordinates = `${startPoint.longitude},${startPoint.latitude};${lab.longitude},${lab.latitude}`;
          console.log('API coordinates:', coordinates);
          
          // Call OSRM API with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`,
            { signal: controller.signal }
          );
          
          clearTimeout(timeoutId);
          console.log('API response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('API response data:', data);
            
            if (data.routes && data.routes.length > 0) {
              const route = data.routes[0];
              
              routes.push({
                id: `start-to-lab-${lab.id}`,
                from: startPoint,
                to: lab,
                distance: route.distance,
                duration: route.duration,
                geometry: route.geometry
              });
              
              totalDistance += route.distance;
              totalDuration += route.duration;
              
              console.log(`Route calculated for ${lab.name}:`, route.distance, 'm,', route.duration, 's');
            } else {
              console.log(`No route found for ${lab.name}, creating fallback`);
              // Create fallback route
              const fallbackDistance = Math.sqrt(
                Math.pow(startPoint.latitude - lab.latitude, 2) + 
                Math.pow(startPoint.longitude - lab.longitude, 2)
              ) * 111000; // Rough conversion to meters
              const fallbackDuration = fallbackDistance / 50000 * 3600; // 50 km/h estimate
              
              routes.push({
                id: `start-to-lab-${lab.id}`,
                from: startPoint,
                to: lab,
                distance: fallbackDistance,
                duration: fallbackDuration,
                geometry: null // No geometry for fallback
              });
              
              totalDistance += fallbackDistance;
              totalDuration += fallbackDuration;
            }
          } else {
            console.log(`API error for ${lab.name}, creating fallback`);
            // Create fallback route
            const fallbackDistance = Math.sqrt(
              Math.pow(startPoint.latitude - lab.latitude, 2) + 
              Math.pow(startPoint.longitude - lab.longitude, 2)
            ) * 111000; // Rough conversion to meters
            const fallbackDuration = fallbackDistance / 50000 * 3600; // 50 km/h estimate
            
            routes.push({
              id: `start-to-lab-${lab.id}`,
              from: startPoint,
              to: lab,
              distance: fallbackDistance,
              duration: fallbackDuration,
              geometry: null // No geometry for fallback
            });
            
            totalDistance += fallbackDistance;
            totalDuration += fallbackDuration;
          }
          
        } catch (error) {
          console.error(`Error calculating route to ${lab.name}:`, error);
          
          // Check if it's a timeout error
          if (error.name === 'AbortError') {
            console.log(`Timeout for ${lab.name}, creating fallback`);
          }
          
          // Create fallback route
          const fallbackDistance = Math.sqrt(
            Math.pow(startPoint.latitude - lab.latitude, 2) + 
            Math.pow(startPoint.longitude - lab.longitude, 2)
          ) * 111000; // Rough conversion to meters
          const fallbackDuration = fallbackDistance / 50000 * 3600; // 50 km/h estimate
          
          routes.push({
            id: `start-to-lab-${lab.id}`,
            from: startPoint,
            to: lab,
            distance: fallbackDistance,
            duration: fallbackDuration,
            geometry: null // No geometry for fallback
          });
          
          totalDistance += fallbackDistance;
          totalDuration += fallbackDuration;
        }
      }

      // Set progress to 100% when complete
      setStartToLabsProgress(100);

      console.log('Final routes:', routes);
      setStartToLabsRoutes(routes);
      
      setSnackbar({ 
        open: true, 
        message: `Calculated routes to ${routes.length} labs. Total: ${formatDistance(totalDistance)}, ${formatDuration(totalDuration)}`, 
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
    setShowCostCalculation(false);
    setCostResults(null);
    setSnackbar({ open: true, message: 'Start to labs routes cleared', severity: 'info' });
  };

  // Calculate costs for each age group based on routes
  const calculateCosts = () => {
    if (!startToLabsRoutes.length) {
      setSnackbar({ open: true, message: 'No routes available for cost calculation', severity: 'warning' });
      return;
    }

    const calculator = new PFCCalculator();
    
    // Calculate costs for each route
    const routeCosts = startToLabsRoutes.map(route => {
      const distanceKm = route.distance / 1000;
      return {
        route,
        child: calculator.calculateLabVisit({
          age: 10,
          distance: distanceKm,
          ...costParams
        }),
        adult: calculator.calculateLabVisit({
          age: 40,
          distance: distanceKm,
          ...costParams
        }),
        senior: calculator.calculateLabVisit({
          age: 70,
          distance: distanceKm,
          ...costParams
        })
      };
    });

    // Calculate totals for each age group
    const childTotal = routeCosts.reduce((sum, routeCost) => sum + routeCost.child.totalCost, 0);
    const adultTotal = routeCosts.reduce((sum, routeCost) => sum + routeCost.adult.totalCost, 0);
    const seniorTotal = routeCosts.reduce((sum, routeCost) => sum + routeCost.senior.totalCost, 0);
    const grandTotal = childTotal + adultTotal + seniorTotal;

    const results = {
      routeCosts, // Individual route costs
      child: calculator.calculateLabVisit({
        age: 10,
        distance: startToLabsRoutes[0]?.distance / 1000 || 35, // Single route cost for display
        ...costParams
      }),
      adult: calculator.calculateLabVisit({
        age: 40,
        distance: startToLabsRoutes[0]?.distance / 1000 || 35,
        ...costParams
      }),
      senior: calculator.calculateLabVisit({
        age: 70,
        distance: startToLabsRoutes[0]?.distance / 1000 || 35,
        ...costParams
      }),
      totals: {
        child: childTotal,
        adult: adultTotal,
        senior: seniorTotal,
        grand: grandTotal
      },
      summary: {
        totalRoutes: startToLabsRoutes.length,
        averageDistance: startToLabsRoutes.reduce((sum, route) => sum + route.distance, 0) / startToLabsRoutes.length / 1000,
        totalDistance: startToLabsRoutes.reduce((sum, route) => sum + route.distance, 0) / 1000
      }
    };

    setCostResults(results);
    setShowCostCalculation(true);
    setSnackbar({ open: true, message: 'Cost calculation completed', severity: 'success' });
  };

  // Download functions
  const downloadLabCostsCSV = () => {
    if (!costResults || !costResults.routeCosts) {
      setSnackbar({ open: true, message: 'No cost data available for download', severity: 'warning' });
      return;
    }

    try {
      // Create CSV headers
      const headers = [
        'Lab Name',
        'Lab Address',
        'Distance (km)',
        'Duration (min)',
        'Child (0-14) - Lost Productivity',
        'Child (0-14) - Informal Caregiving',
        'Child (0-14) - Out of Pocket',
        'Child (0-14) - Total Cost',
        'Adult (15-64) - Lost Productivity',
        'Adult (15-64) - Informal Caregiving',
        'Adult (15-64) - Out of Pocket',
        'Adult (15-64) - Total Cost',
        'Senior (65+) - Lost Productivity',
        'Senior (65+) - Informal Caregiving',
        'Senior (65+) - Out of Pocket',
        'Senior (65+) - Total Cost',
        'Grand Total (All Ages)'
      ];

      // Create CSV rows
      const rows = costResults.routeCosts.map(routeCost => {
        const { route, child, adult, senior } = routeCost;
        const grandTotal = child.totalCost + adult.totalCost + senior.totalCost;
        
        return [
          route.to.name,
          route.to.address,
          (route.distance / 1000).toFixed(2),
          Math.round(route.duration / 60),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(child.lostProductivity),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(child.informalCaregiving),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(child.outOfPocket),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(child.totalCost),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(adult.lostProductivity),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(adult.informalCaregiving),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(adult.outOfPocket),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(adult.totalCost),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(senior.lostProductivity),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(senior.informalCaregiving),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(senior.outOfPocket),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(senior.totalCost),
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(grandTotal)
        ];
      });

      // Add summary row
      rows.push([
        'TOTAL FOR ALL LABS',
        '',
        costResults.summary.totalDistance.toFixed(2),
        Math.round(costResults.routeCosts.reduce((sum, rc) => sum + rc.route.duration, 0) / 60),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(0), // Children no productivity loss
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.totals.child),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.routeCosts.reduce((sum, rc) => sum + rc.child.outOfPocket, 0)),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.totals.child),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.routeCosts.reduce((sum, rc) => sum + rc.adult.lostProductivity, 0)),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.routeCosts.reduce((sum, rc) => sum + rc.adult.informalCaregiving, 0)),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.routeCosts.reduce((sum, rc) => sum + rc.adult.outOfPocket, 0)),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.totals.adult),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(0), // Seniors no productivity loss
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.routeCosts.reduce((sum, rc) => sum + rc.senior.informalCaregiving, 0)),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.routeCosts.reduce((sum, rc) => sum + rc.senior.outOfPocket, 0)),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.totals.senior),
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(costResults.totals.grand)
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
      link.setAttribute('download', `lab_costs_analysis_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbar({ open: true, message: 'Lab costs CSV downloaded successfully', severity: 'success' });
    } catch (error) {
      console.error('Error downloading CSV:', error);
      setSnackbar({ open: true, message: 'Error downloading CSV file', severity: 'error' });
    }
  };

  const downloadCostFormulas = () => {
    try {
      const formulas = `# Lab Visit Cost Formulas

## Overview
This document contains the mathematical formulas used to calculate lab visit costs for different age groups.

## Base Constants
- Lab Wait Time: 0.25 hours
- Lab Appointment Time: 0.15 hours
- Car Cost per Kilometer: $0.48
- Caregiver Coefficient (0-14): 1.0
- Caregiver Coefficient (15+): 0.5

## Cost Components
Each lab visit has three cost components:
1. Lost Productivity (LP) - Wage loss for working-age patients
2. Informal Caregiving (IC) - Cost of caregiver time
3. Out of Pocket (OOP) - Direct expenses (travel, parking)

## Formulas by Age Group

### Children (0-14)
- Lost Productivity: $0.00 (no productivity loss for children)
- Informal Caregiving: (0.40 + duration) × wage × 1.0
- Out of Pocket: (distance × 0.48) + parking
- Total Cost: IC + OOP

### Working Age (15-64)
- Lost Productivity: (0.40 + duration) × wage
- Informal Caregiving: (0.40 + duration) × wage × 0.5
- Out of Pocket: (distance × 0.48) + parking
- Total Cost: LP + IC + OOP

### Seniors (65+)
- Lost Productivity: $0.00 (no productivity loss for seniors)
- Informal Caregiving: (0.40 + duration) × wage × 0.5
- Out of Pocket: (distance × 0.48) + parking
- Total Cost: IC + OOP

## Default Parameters
- Wage Rate: $30.54/hour
- Duration: 0.25 hours
- Parking Cost: $3.00
- Meal Cost: $0.00 (no meals for lab visits)

## Calculation Notes
- Total Time = Lab Wait (0.25h) + Lab Appointment (0.15h) + Duration
- Distance is converted from meters to kilometers for calculations
- All costs are in Canadian Dollars (CAD)
- Productivity loss only applies to working-age individuals (15-64)

Generated on: ${new Date().toLocaleString()}
`;

      const blob = new Blob([formulas], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `lab_cost_formulas_${new Date().toISOString().split('T')[0]}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbar({ open: true, message: 'Cost formulas downloaded successfully', severity: 'success' });
    } catch (error) {
      console.error('Error downloading formulas:', error);
      setSnackbar({ open: true, message: 'Error downloading cost formulas', severity: 'error' });
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

  // PFC Calculator class
  class PFCCalculator {
    constructor() {
      // Base constants
      this.fm_wait = 0.5;
      this.fm_appt = 0.26;
      this.caregiver_0_14 = 1.0;
      this.caregiver_15 = 0.5;
      this.car_cost_per_km = 0.48;
      
      // Service-specific constants
      this.ed_los_CTAS_III = 3.9;
      this.ed_los_CTAS_V = 2.7;
      this.hosp_los = 53.6;
      this.caregiver_0_14_hosp = 0.75;
      this.caregiver_15_hosp = 0.25;
      this.data_usage = 1.25;
      this.virtual_wait = 0.27;
      this.virtual_appt = 0.35;
    }

    // Helper function to determine age group
    getAgeGroup(age) {
      if (age >= 0 && age <= 14) return '0-14';
      if (age >= 15 && age <= 64) return '15-64';
      return '65+';
    }

    // Lab-specific constants
    get lab_wait() { return 0.25; }
    get lab_appt() { return 0.15; }

    // Calculate Lab Visit costs
    calculateLabVisit(params = {}) {
      const {
        wage = 30.54,
        distance = 35,
        duration = 0.25,
        age = 40,
        meal = 0,
        parking = 3
      } = params;

      const ageGroup = this.getAgeGroup(age);
      const totalTime = this.lab_wait + this.lab_appt + duration;

      let lp = 0; // Lost Productivity
      let ic = 0; // Informal Caregiving
      let oop = 0; // Out of Pocket

      // Lost Productivity (only for working age)
      if (ageGroup === '15-64') {
        lp = totalTime * wage;
      }

      // Informal Caregiving
      if (ageGroup === '0-14') {
        ic = totalTime * wage * this.caregiver_0_14;
      } else {
        ic = totalTime * wage * this.caregiver_15;
      }

      // Out of Pocket (travel + parking, no meal for lab visits)
      oop = (distance * this.car_cost_per_km) + meal + parking;

      return {
        serviceType: 'Lab Visit',
        ageGroup,
        lostProductivity: lp,
        informalCaregiving: ic,
        outOfPocket: oop,
        totalCost: lp + ic + oop,
        breakdown: {
          wage,
          distance,
          duration,
          age,
          meal,
          parking,
          totalTime
        }
      };
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
  }

  return (
    <Box m="20px">
      {/* Inject custom CSS */}
      <style>{mapStyles}</style>
      
      <Header 
        title="CUSTOM MAP" 
        subtitle="Interactive custom map with location management and routing" 
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
                  backgroundColor: colors.greenAccent[600],
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  padding: '12px',
                  '&:hover': { backgroundColor: colors.greenAccent[700] }
                }}
              >
                Add New Location
              </Button>
            </Grid>

            {/* Start Point Controls */}
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: colors.primary[400] }}>
                <CardContent>
                  <Typography variant="h6" color="grey.100" mb={2} display="flex" alignItems="center">
                    <LocationOnIcon sx={{ mr: 1, color: colors.greenAccent[500] }} />
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
                          backgroundColor: colors.greenAccent[600],
                          color: 'white',
                          '&:hover': { backgroundColor: colors.greenAccent[700] }
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
                            sx={{ color: colors.blueAccent[300], borderColor: colors.blueAccent[300] }}
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

            {/* File Upload Controls */}
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: colors.primary[400] }}>
                <CardContent>
                  <Typography variant="h6" color="grey.100" mb={2} display="flex" alignItems="center">
                    <ScienceIcon sx={{ mr: 1, color: colors.blueAccent[500] }} />
                    Upload Labs
                  </Typography>
                  
                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: isDragOver ? colors.blueAccent[300] : colors.primary[300],
                      borderRadius: '8px',
                      p: 4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: isDragOver ? colors.primary[500] : 'transparent',
                      '&:hover': {
                        borderColor: isDragOver ? colors.blueAccent[400] : colors.primary[400],
                        backgroundColor: isDragOver ? colors.primary[500] : colors.primary[500],
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
                    <UploadFileIcon sx={{ fontSize: 40, color: isDragOver ? colors.blueAccent[400] : colors.blueAccent[300], mb: 1 }} />
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
                          backgroundColor: colors.primary[500],
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: colors.blueAccent[500]
                          }
                        }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Start Point to Labs Routing */}
            {startPoint && uploadedLabs.length > 0 && (
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: colors.primary[400] }}>
                  <CardContent>
                    <Typography variant="h6" color="grey.100" mb={2} display="flex" alignItems="center">
                      <RouteIcon sx={{ mr: 1, color: '#FF6B6B' }} />
                      Start to Labs Routes
                    </Typography>
                    
                    {!showStartToLabsRoutes ? (
                      <Box>
                        <Typography variant="body2" color="grey.300" mb={2}>
                          Calculate routes from start point to all {uploadedLabs.length} labs
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
                          {isCalculatingStartToLabs ? 'Calculating Routes...' : 'Show Routes to All Labs'}
                        </Button>
                      </Box>
                    ) : (
                      <Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                          <Typography variant="body2" color="grey.300">
                            Routes calculated: {startToLabsRoutes.length}
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={clearStartToLabsRoutes}
                            sx={{ color: '#FF6B6B', borderColor: '#FF6B6B' }}
                          >
                            Clear Routes
                          </Button>
                        </Box>
                        
                        {isCalculatingStartToLabs && (
                          <Box mb={2}>
                            <Typography variant="body2" color="grey.300" mb={1}>
                              Calculating routes... {Math.round(startToLabsProgress)}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={startToLabsProgress} 
                              sx={{ 
                                backgroundColor: colors.primary[500],
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: '#FF6B6B'
                                }
                              }}
                            />
                          </Box>
                        )}
                        
                        <List dense>
                          {startToLabsRoutes.map((route, index) => (
                            <ListItem key={route.id} sx={{ px: 0, py: 0.5 }}>
                              <ListItemText
                                primary={
                                  <Typography variant="body2" color="grey.100" fontWeight="bold">
                                    {index + 1}. {route.to.name}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="caption" color="grey.400">
                                    {formatDistance(route.distance)} • {formatDuration(route.duration)}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                        
                        {startToLabsRoutes.length > 0 && (
                          <Box mt={2} p={2} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
                            <Typography variant="h6" color="grey.100" mb={1}>
                              Total Summary
                            </Typography>
                            <Grid container spacing={1}>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="grey.300">
                                  Total Distance:
                                </Typography>
                                <Typography variant="body1" color="grey.100" fontWeight="bold">
                                  {formatDistance(startToLabsRoutes.reduce((sum, route) => sum + route.distance, 0))}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="grey.300">
                                  Total Duration:
                                </Typography>
                                <Typography variant="body1" color="grey.100" fontWeight="bold">
                                  {formatDuration(startToLabsRoutes.reduce((sum, route) => sum + route.duration, 0))}
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
            {showStartToLabsRoutes && startToLabsRoutes.length > 0 && (
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: colors.primary[400] }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AttachMoneyIcon sx={{ color: '#FF6B6B' }} />
                        <Typography variant="h6" color="grey.100" fontWeight="bold">
                          Lab Visit Cost Analysis
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
                        <Box mb={3} p={2} sx={{ backgroundColor: colors.primary[600], borderRadius: 1 }}>
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
                        </Box>

                        {/* Cost Results by Age Group */}
                        <Typography variant="h6" color="grey.100" mb={2}>
                          Cost Breakdown by Age Group
                        </Typography>
                        <Grid container spacing={2}>
                          {/* Child (0-14) */}
                          <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, backgroundColor: colors.primary[600], border: '2px solid #FF6B6B' }}>
                              <Typography variant="h6" color="grey.100" mb={2} textAlign="center">
                                Children (0-14)
                              </Typography>
                              <Box mb={2}>
                                <Typography variant="h4" color="#FF6B6B" textAlign="center" fontWeight="bold">
                                  {new Intl.NumberFormat('en-CA', {
                                    style: 'currency',
                                    currency: 'CAD',
                                    minimumFractionDigits: 2
                                  }).format(costResults.child.totalCost)}
                                </Typography>
                                <Typography variant="body2" color="grey.300" textAlign="center">
                                  per lab visit
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
                                    }).format(costResults.child.informalCaregiving)}
                                  </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                  <Typography variant="body2" color="grey.300">Out of Pocket:</Typography>
                                  <Typography variant="body2" color="grey.100">
                                    {new Intl.NumberFormat('en-CA', {
                                      style: 'currency',
                                      currency: 'CAD',
                                      minimumFractionDigits: 2
                                    }).format(costResults.child.outOfPocket)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Paper>
                          </Grid>

                          {/* Adult (15-64) */}
                          <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, backgroundColor: colors.primary[600], border: '2px solid #4CAF50' }}>
                              <Typography variant="h6" color="grey.100" mb={2} textAlign="center">
                                Working Age (15-64)
                              </Typography>
                              <Box mb={2}>
                                <Typography variant="h4" color="#4CAF50" textAlign="center" fontWeight="bold">
                                  {new Intl.NumberFormat('en-CA', {
                                    style: 'currency',
                                    currency: 'CAD',
                                    minimumFractionDigits: 2
                                  }).format(costResults.adult.totalCost)}
                                </Typography>
                                <Typography variant="body2" color="grey.300" textAlign="center">
                                  per lab visit
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
                                    }).format(costResults.adult.lostProductivity)}
                                  </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                  <Typography variant="body2" color="grey.300">Informal Caregiving:</Typography>
                                  <Typography variant="body2" color="grey.100">
                                    {new Intl.NumberFormat('en-CA', {
                                      style: 'currency',
                                      currency: 'CAD',
                                      minimumFractionDigits: 2
                                    }).format(costResults.adult.informalCaregiving)}
                                  </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                  <Typography variant="body2" color="grey.300">Out of Pocket:</Typography>
                                  <Typography variant="body2" color="grey.100">
                                    {new Intl.NumberFormat('en-CA', {
                                      style: 'currency',
                                      currency: 'CAD',
                                      minimumFractionDigits: 2
                                    }).format(costResults.adult.outOfPocket)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Paper>
                          </Grid>

                          {/* Senior (65+) */}
                          <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, backgroundColor: colors.primary[600], border: '2px solid #2196F3' }}>
                              <Typography variant="h6" color="grey.100" mb={2} textAlign="center">
                                Seniors (65+)
                              </Typography>
                              <Box mb={2}>
                                <Typography variant="h4" color="#2196F3" textAlign="center" fontWeight="bold">
                                  {new Intl.NumberFormat('en-CA', {
                                    style: 'currency',
                                    currency: 'CAD',
                                    minimumFractionDigits: 2
                                  }).format(costResults.senior.totalCost)}
                                </Typography>
                                <Typography variant="body2" color="grey.300" textAlign="center">
                                  per lab visit
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
                                    }).format(costResults.senior.informalCaregiving)}
                                  </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                  <Typography variant="body2" color="grey.300">Out of Pocket:</Typography>
                                  <Typography variant="body2" color="grey.100">
                                    {new Intl.NumberFormat('en-CA', {
                                      style: 'currency',
                                      currency: 'CAD',
                                      minimumFractionDigits: 2
                                    }).format(costResults.senior.outOfPocket)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Paper>
                          </Grid>
                        </Grid>

                        {/* Total Costs for All Labs */}
                        <Box mt={3}>
                          <Typography variant="h6" color="grey.100" mb={2}>
                            Total Costs for All {costResults.summary.totalRoutes} Labs
                          </Typography>
                          <Grid container spacing={2}>
                            {/* Child Total */}
                            <Grid item xs={12} md={4}>
                              <Paper sx={{ p: 2, backgroundColor: colors.primary[600], border: '2px solid #FF6B6B' }}>
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
                                  total for all labs
                                </Typography>
                              </Paper>
                            </Grid>

                            {/* Adult Total */}
                            <Grid item xs={12} md={4}>
                              <Paper sx={{ p: 2, backgroundColor: colors.primary[600], border: '2px solid #4CAF50' }}>
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
                                  total for all labs
                                </Typography>
                              </Paper>
                            </Grid>

                            {/* Senior Total */}
                            <Grid item xs={12} md={4}>
                              <Paper sx={{ p: 2, backgroundColor: colors.primary[600], border: '2px solid #2196F3' }}>
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
                                  total for all labs
                                </Typography>
                              </Paper>
                            </Grid>
                          </Grid>
                        </Box>

                        {/* Grand Total */}
                        <Box mt={3}>
                          <Paper sx={{ p: 3, backgroundColor: colors.primary[600], border: '3px solid #FFD700' }}>
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
                            <Typography variant="body1" color="grey.300" textAlign="center">
                              Total cost for all {costResults.summary.totalRoutes} labs across all age groups
                            </Typography>
                          </Paper>
                        </Box>

                        {/* Summary Statistics */}
                        <Box mt={3} p={2} sx={{ backgroundColor: colors.primary[600], borderRadius: 1 }}>
                          <Typography variant="h6" color="grey.100" mb={2}>
                            Summary Statistics
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6} md={3}>
                              <Typography variant="body2" color="grey.300">Total Routes:</Typography>
                              <Typography variant="h6" color="grey.100">{costResults.summary.totalRoutes}</Typography>
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
                                }).format(Math.min(costResults.child.totalCost, costResults.adult.totalCost, costResults.senior.totalCost))} - 
                                {new Intl.NumberFormat('en-CA', {
                                  style: 'currency',
                                  currency: 'CAD',
                                  minimumFractionDigits: 2
                                }).format(Math.max(costResults.child.totalCost, costResults.adult.totalCost, costResults.senior.totalCost))}
                              </Typography>
                            </Grid>
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
              <Card sx={{ backgroundColor: colors.primary[400] }}>
                <CardContent>
                  <Typography variant="h6" color="grey.100" mb={2} display="flex" alignItems="center">
                    <MapIcon sx={{ mr: 1, color: colors.blueAccent[500] }} />
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
              <Card sx={{ backgroundColor: colors.primary[400], maxHeight: '300px', overflow: 'auto' }}>
                <CardContent>
                  <Typography variant="h6" color="grey.100" mb={2} display="flex" alignItems="center">
                    <LocationOnIcon sx={{ mr: 1, color: colors.blueAccent[500] }} />
                    Locations ({clinics.length + uploadedLabs.length})
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
                            sx={{ color: colors.blueAccent[300] }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => removeUploadedLab(lab.id)}
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
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Geocoding may take some time and includes delays to respect API rate limits.
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