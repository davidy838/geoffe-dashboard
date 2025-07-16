import { useState } from "react";
import { 
  Box, 
  Typography, 
  useTheme, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  Chip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { mockDataCalculationFormulas } from "../../data/mockData";
import Header from "../../components/Header";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ScienceIcon from "@mui/icons-material/Science";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CategoryIcon from "@mui/icons-material/Category";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BuildIcon from "@mui/icons-material/Build";

const CalculationFormulas = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [selectedFormula, setSelectedFormula] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [appliedFormula, setAppliedFormula] = useState(null);

  const handleFormulaSelect = (formula) => {
    setSelectedFormula(formula);
    setShowDetails(true);
  };

  const handleApplyFormula = () => {
    if (selectedFormula) {
      setAppliedFormula(selectedFormula);
      setShowSuccess(true);
      setShowDetails(false);
      setSelectedFormula(null);
    }
  };

  const columns = [
    { 
      field: "name", 
      headerName: "Pathway Name", 
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "description",
      headerName: "Description",
      flex: 2,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          {params.row.description}
        </Typography>
      ),
    },
    {
      field: "category",
      headerName: "Category",
      flex: 1,
      renderCell: (params) => (
        <Chip 
          label={params.row.category} 
          size="small"
          sx={{ 
            backgroundColor: colors.blueAccent[700],
            color: 'white',
            fontSize: '0.75rem'
          }}
        />
      ),
    },
    {
      field: "rtvsServices",
      headerName: "RTVS Services (Intervention)",
      flex: 2,
      renderCell: (params) => (
        <Tooltip 
          title={params.row.rtvsServices}
          placement="top"
          arrow
          sx={{ maxWidth: '400px' }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.75rem',
              cursor: 'pointer',
              color: colors.greenAccent[500],
              fontWeight: '500',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '200px'
            }}
          >
            {params.row.rtvsServices}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "withoutRtvs",
      headerName: "Without RTVS (Comparator)",
      flex: 2,
      renderCell: (params) => (
        <Tooltip 
          title={params.row.withoutRtvs}
          placement="top"
          arrow
          sx={{ maxWidth: '400px' }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.75rem',
              cursor: 'pointer',
              color: colors.redAccent[500],
              fontWeight: '500',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '200px'
            }}
          >
            {params.row.withoutRtvs}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "avgTime",
      headerName: "Avg Time",
      flex: 1,
      renderCell: (params) => (
        <Typography color={colors.blueAccent[500]} fontWeight="bold">
          {params.row.avgTime}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <Tooltip title="View Details">
            <IconButton 
              size="small"
              onClick={() => handleFormulaSelect(params.row)}
              sx={{ color: colors.blueAccent[500] }}
            >
              <InfoIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Apply Formula">
            <IconButton 
              size="small"
              onClick={() => handleFormulaSelect(params.row)}
              sx={{ color: colors.greenAccent[500] }}
            >
              <PlayArrowIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header 
        title="CALCULATION FORMULAS" 
        subtitle="Healthcare pathway cost calculation formulas and their characteristics" 
      />

      {appliedFormula && (
        <Box mb="20px">
          <Alert 
            severity="success" 
            icon={<CheckCircleIcon />}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => setAppliedFormula(null)}
              >
                Dismiss
              </Button>
            }
          >
            Successfully applied <strong>{appliedFormula.name}</strong> calculation formula. 
            This formula will now be used for cost calculations in the system.
          </Alert>
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
            fontWeight: "bold",
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
          rows={mockDataCalculationFormulas} 
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
        />
      </Box>

      {/* Formula Details Dialog */}
      <Dialog 
        open={showDetails} 
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: colors.primary[400], color: 'white' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <ScienceIcon />
            <Typography variant="h6">
              {selectedFormula?.name} - Calculation Formula Details
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: colors.primary[400], p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" color="white" gutterBottom>
                {selectedFormula?.description}
              </Typography>
              <Divider sx={{ mb: 2, backgroundColor: colors.grey[600] }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: colors.primary[500] }}>
                <CardContent>
                  <Typography variant="h6" color="white" gutterBottom>
                    Formula
                  </Typography>
                  <Typography variant="body1" color="grey.300" sx={{ fontFamily: 'monospace' }}>
                    {selectedFormula?.formula}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: colors.primary[500] }}>
                <CardContent>
                  <Typography variant="h6" color="white" gutterBottom>
                    Key Metrics
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <AccessTimeIcon sx={{ color: colors.blueAccent[500] }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Average Time" 
                        secondary={selectedFormula?.avgTime}
                        sx={{ '& .MuiListItemText-primary': { color: 'white' }, '& .MuiListItemText-secondary': { color: colors.blueAccent[500] } }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CategoryIcon sx={{ color: colors.redAccent[500] }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Category" 
                        secondary={selectedFormula?.category}
                        sx={{ '& .MuiListItemText-primary': { color: 'white' }, '& .MuiListItemText-secondary': { color: colors.redAccent[500] } }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <LocationOnIcon sx={{ color: colors.greenAccent[500] }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Coverage" 
                        secondary={selectedFormula?.coverage}
                        sx={{ '& .MuiListItemText-primary': { color: 'white' }, '& .MuiListItemText-secondary': { color: colors.greenAccent[500] } }}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: colors.primary[500] }}>
                <CardContent>
                  <Typography variant="h6" color="white" gutterBottom>
                    RTVS Services (Intervention)
                  </Typography>
                  <Typography variant="body2" color="grey.300" sx={{ lineHeight: 1.6 }}>
                    {selectedFormula?.rtvsServices}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: colors.primary[500] }}>
                <CardContent>
                  <Typography variant="h6" color="white" gutterBottom>
                    Without RTVS (Comparator)
                  </Typography>
                  <Typography variant="body2" color="grey.300" sx={{ lineHeight: 1.6 }}>
                    {selectedFormula?.withoutRtvs}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ backgroundColor: colors.primary[500] }}>
                <CardContent>
                  <Typography variant="h6" color="white" gutterBottom>
                    Requirements
                  </Typography>
                  <Typography variant="body2" color="grey.300">
                    {selectedFormula?.requirements}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: colors.primary[400], p: 2 }}>
          <Button 
            onClick={() => setShowDetails(false)}
            sx={{ color: 'white' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApplyFormula}
            variant="contained"
            startIcon={<PlayArrowIcon />}
            sx={{
              backgroundColor: colors.greenAccent[600],
              color: 'white',
              '&:hover': { backgroundColor: colors.greenAccent[700] }
            }}
          >
            Apply This Formula
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Message */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Formula applied successfully! The system will now use this calculation method.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CalculationFormulas;
