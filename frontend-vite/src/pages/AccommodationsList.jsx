import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  TablePagination,
  TextField,
  InputAdornment,
} from '@mui/material';
import { 
  Add, 
  Hotel, 
  LocationOn, 
  People, 
  ConfirmationNumber,
  Search,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const AccommodationsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const isAdmin = user?.role === 'admin';
  const isOfficer = user?.role === 'officer';
  const isViewer = user?.role === 'viewer';

  useEffect(() => {
    fetchAccommodations();
  }, [page, rowsPerPage]);

  const fetchAccommodations = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
      };
      const response = await api.get('/accommodations', { params });
      setAccommodations(response.data.data || response.data.accommodations || []);
      setTotal(response.data.total || response.data.count || 0);
    } catch (err) {
      console.error('Error fetching accommodations:', err);
      setError('Failed to load accommodations');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchAccommodations();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'full': return 'warning';
      case 'under_maintenance': return 'warning';
      default: return 'default';
    }
  };

  // Filter accommodations by search
  const filteredAccommodations = accommodations.filter(acc =>
    acc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.address?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.address?.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Accommodations</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchAccommodations}
            disabled={loading}
          >
            Refresh
          </Button>
          {/* ✅ Only Admin can add accommodations */}
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/accommodations/add')}
            >
              Register Accommodation
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* ✅ Viewer info message */}
      {isViewer && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>View-Only Mode:</strong> You can view accommodations but cannot make changes.
        </Alert>
      )}

      {/* ✅ Officer info message */}
      {isOfficer && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Officer Access:</strong> You can only view your assigned accommodation.
        </Alert>
      )}

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search by name, city, country, or registration..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" onClick={handleSearch}>
            Search
          </Button>
          <Button variant="outlined" onClick={() => {
            setSearchQuery('');
            fetchAccommodations();
          }}>
            Reset
          </Button>
        </Box>
      </Paper>

      {filteredAccommodations.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No accommodations found
          </Typography>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              sx={{ mt: 2 }}
              onClick={() => navigate('/accommodations/add')}
            >
              Register First Accommodation
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredAccommodations.map((acc) => (
            <Grid item xs={12} md={6} lg={4} key={acc._id}>
              <Card sx={{ 
                height: '100%', 
                transition: 'transform 0.2s', 
                '&:hover': { transform: 'translateY(-4px)' } 
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Hotel />
                      <Typography variant="h6">{acc.name}</Typography>
                    </Box>
                    <Chip
                      label={acc.status || 'Active'}
                      size="small"
                      color={getStatusColor(acc.status)}
                    />
                  </Box>

                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ConfirmationNumber fontSize="small" color="action" />
                    <Typography variant="caption" color="textSecondary">
                      Reg: {acc.registrationNumber || 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" color="textSecondary">
                      {acc.address?.city}, {acc.address?.country}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<People fontSize="small" />}
                      label={`${acc.currentOccupants || 0} / ${acc.capacity || 0} occupants`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={acc.type || 'N/A'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/accommodations/${acc._id}`)}
                    >
                      View Details
                    </Button>

                    {/* ✅ Only Admin can edit */}
                    {isAdmin && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate(`/accommodations/${acc._id}/edit`)}
                      >
                        Edit
                      </Button>
                    )}

                    {/* ✅ Only Admin can delete */}
                    {isAdmin && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this accommodation?')) {
                            try {
                              await api.delete(`/accommodations/${acc._id}`);
                              fetchAccommodations();
                            } catch (err) {
                              setError('Failed to delete accommodation');
                            }
                          }
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default AccommodationsList;