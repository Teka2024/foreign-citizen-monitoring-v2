import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { toast } from 'react-toastify';
import api from '../api/axios';

const EditCitizen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    passportNumber: '',
    nationality: '',
    dateOfBirth: '',
    gender: 'male',
    visaType: 'tourist',
    visaNumber: '',
    entryDate: '',
    expectedExitDate: '',
    entryPort: '',
    personalContact: {
      phone: '',
      email: '',
    },
    riskLevel: 'low',
    status: 'active',
  });

  useEffect(() => {
    fetchCitizen();
  }, [id]);

  const fetchCitizen = async () => {
    try {
      const response = await api.get(`/citizens/${id}`);
      const citizen = response.data.data;
      setFormData({
        fullName: citizen.fullName || '',
        passportNumber: citizen.passportNumber || '',
        nationality: citizen.nationality || '',
        dateOfBirth: citizen.dateOfBirth ? citizen.dateOfBirth.split('T')[0] : '',
        gender: citizen.gender || 'male',
        visaType: citizen.visaType || 'tourist',
        visaNumber: citizen.visaNumber || '',
        entryDate: citizen.entryDate ? citizen.entryDate.split('T')[0] : '',
        expectedExitDate: citizen.expectedExitDate ? citizen.expectedExitDate.split('T')[0] : '',
        entryPort: citizen.entryPort || '',
        personalContact: {
          phone: citizen.personalContact?.phone || '',
          email: citizen.personalContact?.email || '',
        },
        riskLevel: citizen.riskLevel || 'low',
        status: citizen.status || 'active',
      });
    } catch (err) {
      setError('Failed to load citizen data');
      toast.error('Failed to load citizen data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.put(`/citizens/${id}`, formData);
      toast.success('Citizen updated successfully!');
      navigate('/citizens');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update citizen');
      toast.error(err.response?.data?.message || 'Failed to update citizen');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Edit Citizen
      </Typography>

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
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Passport Number"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleChange}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Nationality"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="Risk Level"
                name="riskLevel"
                value={formData.riskLevel}
                onChange={handleChange}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="Visa Type"
                name="visaType"
                value={formData.visaType}
                onChange={handleChange}
              >
                <MenuItem value="tourist">Tourist</MenuItem>
                <MenuItem value="business">Business</MenuItem>
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="work">Work</MenuItem>
                <MenuItem value="diplomatic">Diplomatic</MenuItem>
                <MenuItem value="transit">Transit</MenuItem>
                <MenuItem value="resident">Resident</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Visa Number"
                name="visaNumber"
                value={formData.visaNumber}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Entry Date"
                name="entryDate"
                type="date"
                value={formData.entryDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Expected Exit Date"
                name="expectedExitDate"
                type="date"
                value={formData.expectedExitDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Entry Port"
                name="entryPort"
                value={formData.entryPort}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Phone Number"
                name="personalContact.phone"
                value={formData.personalContact.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="personalContact.email"
                type="email"
                value={formData.personalContact.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="overstayed">Overstayed</MenuItem>
                <MenuItem value="exited">Exited</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
                <MenuItem value="deported">Deported</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/citizens')}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default EditCitizen;