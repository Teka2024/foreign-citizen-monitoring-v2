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

  // ✅ Safely get capacity values
  const capacity = accommodation.capacity || 0;
  const currentOccupants = accommodation.currentOccupants || 0;
  const available = capacity - currentOccupants;

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/accommodations')}>
          Back
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {(user?.role === 'admin' || user?.role === 'officer') && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate(`/accommodations/${id}/edit`)}
            >
              Edit
            </Button>
          )}
          {user?.role === 'admin' && (
            <Button
              variant="contained"
              color="error"
              startIcon={<Delete />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          )}
        </Box>
      </Box>

      {/* Main Content */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Hotel sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">{accommodation.name}</Typography>
            <Typography variant="subtitle1" color="textSecondary">
              <ConfirmationNumber sx={{ fontSize: 14, mr: 0.5 }} />
              Reg: {accommodation.registrationNumber || 'N/A'}
            </Typography>
          </Box>
          <Chip
            label={accommodation.status || 'Active'}
            color={accommodation.status === 'active' ? 'success' : 'warning'}
            sx={{ ml: 'auto' }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          {/* Type & Capacity */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Business sx={{ mr: 1 }} />
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

          {/* Address */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <LocationOn sx={{ mr: 1 }} />
                  Address
                </Typography>
                <Typography>{accommodation.address?.street || 'N/A'}</Typography>
                <Typography>{accommodation.address?.city || 'N/A'}</Typography>
                <Typography>{accommodation.address?.state || 'N/A'}</Typography>
                <Typography>{accommodation.address?.country || 'N/A'}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact */}
          {accommodation.contact && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <People sx={{ mr: 1 }} />
                    Contact Information
                  </Typography>
                  {accommodation.contact.phone && (
                    <Typography><Phone sx={{ fontSize: 14, mr: 0.5 }} /> {accommodation.contact.phone}</Typography>
                  )}
                  {accommodation.contact.email && (
                    <Typography><Email sx={{ fontSize: 14, mr: 0.5 }} /> {accommodation.contact.email}</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Amenities */}
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