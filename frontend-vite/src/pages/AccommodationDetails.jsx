import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Hotel,
  LocationOn,
  People,
  ConfirmationNumber,
  Phone,
  Email,
  Business,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const AccommodationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accommodation, setAccommodation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccommodation();
  }, [id]);

  const fetchAccommodation = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/accommodations/${id}`);
      const data = response.data.data || response.data;
      setAccommodation(data);
    } catch (err) {
      console.error('Error fetching accommodation:', err);
      setError('Failed to load accommodation details');
      toast.error('Failed to load accommodation details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this accommodation?')) return;
    try {
      await api.delete(`/accommodations/${id}`);
      toast.success('Accommodation deleted successfully');
      navigate('/accommodations');
    } catch (err) {
      toast.error('Failed to delete accommodation');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!accommodation) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Accommodation not found</Alert>
      </Box>
    );
  }

  const capacity = accommodation.capacity || 0;
  const currentOccupants = accommodation.currentOccupants || 0;
  const available = capacity - currentOccupants;

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      {/* ==================== UNIFIED BLUE BANNER ==================== */}
      <Paper sx={{
        p: 3.5,
        mb: 3,
        borderRadius: 4,
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
        color: 'white',
        boxShadow: '0 8px 32px rgba(25, 118, 210, 0.30)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -60, right: -60,
          width: 200, height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -80, right: 120,
          width: 160, height: 160,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        },
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          position: 'relative',
          zIndex: 1,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              flexShrink: 0,
            }}>
              <Hotel sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
                {accommodation.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  Reg: {accommodation.registrationNumber || 'N/A'}
                </Typography>
                <Chip
                  label={accommodation.status || 'Active'}
                  size="small"
                  sx={{
                    bgcolor: accommodation.status === 'active' ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                />
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/accommodations')}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 700,
                px: 3, py: 1,
                bgcolor: 'rgba(255,255,255,0.15)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
              }}
            >
              Back
            </Button>
            {(user?.role === 'admin' || user?.role === 'officer') && (
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate(`/accommodations/${id}/edit`)}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3, py: 1,
                  bgcolor: 'white',
                  color: '#1565c0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&:hover': { bgcolor: '#f1f5f9' },
                }}
              >
                Edit
              </Button>
            )}
            {user?.role === 'admin' && (
              <Button
                variant="contained"
                startIcon={<Delete />}
                onClick={handleDelete}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3, py: 1,
                  bgcolor: 'rgba(239,68,68,0.9)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(220,38,38,1)' },
                }}
              >
                Delete
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Property Details
                </Typography>
                <Typography><strong>Type:</strong> {accommodation.type || 'N/A'}</Typography>
                <Typography><strong>Capacity:</strong> {capacity} rooms</Typography>
                <Typography><strong>Current Occupants:</strong> {currentOccupants}</Typography>
                <Typography>
                  <strong>Available:</strong>{' '}
                  <Chip
                    label={available > 0 ? `${available} available` : 'Fully Booked'}
                    color={available > 0 ? 'success' : 'error'}
                    size="small"
                  />
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Address
                </Typography>
                <Typography>{accommodation.address?.street || 'N/A'}</Typography>
                <Typography>{accommodation.address?.city || 'N/A'}</Typography>
                <Typography>{accommodation.address?.state || 'N/A'}</Typography>
                <Typography>{accommodation.address?.country || 'N/A'}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {accommodation.contact && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <People sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Contact Information
                  </Typography>
                  {accommodation.contact.phone && (
                    <Typography><Phone sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} /> {accommodation.contact.phone}</Typography>
                  )}
                  {accommodation.contact.email && (
                    <Typography><Email sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} /> {accommodation.contact.email}</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {accommodation.amenities && accommodation.amenities.length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Amenities</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {accommodation.amenities.map((amenity, index) => (
                      <Chip key={index} label={amenity} variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default AccommodationDetails;