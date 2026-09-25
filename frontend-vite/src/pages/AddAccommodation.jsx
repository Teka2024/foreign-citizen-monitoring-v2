import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
} from '@mui/material';
import { Hotel, ArrowBack } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../api/axios';

const AddAccommodation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'hotel',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'Ethiopia',
    },
    capacity: 0,
    status: 'active',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('📤 Sending accommodation data:', formData);

      const response = await api.post('/accommodations', formData);
      console.log('✅ Response:', response.data);

      toast.success('Accommodation registered successfully!');
      navigate('/accommodations');
    } catch (err) {
      console.error('❌ Error:', err.response?.data || err);
      setError(err.response?.data?.message || 'Failed to register accommodation');
      toast.error(err.response?.data?.message || 'Failed to register accommodation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
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
                Register Accommodation
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
                Add a new accommodation to the system
              </Typography>
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
              Back to List
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Accommodation Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="Type"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <MenuItem value="hotel">Hotel</MenuItem>
                <MenuItem value="apartment">Apartment</MenuItem>
                <MenuItem value="house">House</MenuItem>
                <MenuItem value="hostel">Hostel</MenuItem>
                <MenuItem value="guest_house">Guest House</MenuItem>
                <MenuItem value="private_residence">Private Residence</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Capacity"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Street Address"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="City"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State/Province"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Country"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="full">Full</MenuItem>
                <MenuItem value="under_maintenance">Under Maintenance</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register Accommodation'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/accommodations')}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AddAccommodation;