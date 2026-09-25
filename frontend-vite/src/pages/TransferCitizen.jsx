import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Card,
  CardContent,
  Chip,
  Avatar,
  InputAdornment,
  CircularProgress,
  Divider,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
} from '@mui/material';
import {
  PersonSearch,
  Hotel,
  CheckCircle,
  Cancel,
  LocationOn,
  SwapHoriz,
  Person,
  CalendarToday,
  Send,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const TransferCitizen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOfficer = user?.role === 'admin' || user?.role === 'officer';

  const [activeStep, setActiveStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState(null);
  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const [accommodations, setAccommodations] = useState([]);
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    expectedCheckOutDate: '',
    purpose: 'tourism',
    roomNumber: '',
    transferReason: '',
    notes: '',
  });

  useEffect(() => {
    if (!isOfficer) {
      toast.error('You do not have permission to access this page');
      navigate('/dashboard');
    }
    fetchAccommodations();
  }, [isOfficer, navigate]);

  const fetchAccommodations = async () => {
    try {
      // ✅ Try to load ALL accommodations for the transfer picker.
      // Falls back to /accommodations (officer-scoped) if transfer-options isn't available.
      let response;
      try {
        response = await api.get('/accommodations/transfer-options');
      } catch {
        response = await api.get('/accommodations');
      }
      setAccommodations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching accommodations:', error);
    }
  };

  const handleSearchCitizen = async () => {
    if (!searchQuery.trim()) {
      toast.warning('Please enter a search term');
      return;
    }

    setSearching(true);
    setError('');
    setSearchResults([]);

    try {
      const response = await api.get('/citizens/search', {
        params: { query: searchQuery }
      });

      let results = [];
      if (response.data && response.data.data) {
        results = response.data.data;
      } else if (response.data && response.data.citizens) {
        results = response.data.citizens;
      } else if (Array.isArray(response.data)) {
        results = response.data;
      }

      // Filter only citizens with active check-in
      const activeResults = results.filter(c =>
        c.currentAccommodation?.status === 'checked_in'
      );

      setSearchResults(activeResults);

      if (activeResults.length === 0) {
        toast.info('No citizens with active check-ins found');
      } else {
        toast.success(`Found ${activeResults.length} citizen(s) with active check-ins`);
      }
    } catch (error) {
      setError('Search failed. Please try again.');
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCitizen = async (citizen) => {
    setSelectedCitizen(citizen);
    setError('');
    setActiveStep(1);

    // Get active check-in details
    try {
      const response = await api.get(`/accommodations/active/${citizen._id}`);
      setActiveCheckIn(response.data.data);
    } catch (err) {
      setError('Failed to fetch active check-in details');
    }
  };

  const handleSelectAccommodation = (accommodation) => {
    if (accommodation._id === activeCheckIn?.accommodation?._id) {
      toast.warning('This is the current accommodation');
      setError('Please select a different accommodation');
      return;
    }
    setSelectedAccommodation(accommodation);
    setActiveStep(2);
  };

  // ✅ CHANGED: Now creates a transfer REQUEST (pending until target officer accepts/rejects)
  const handleTransfer = async () => {
    if (!formData.expectedCheckOutDate) {
      toast.error('Please enter expected check-out date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestData = {
        citizenId: selectedCitizen._id,
        toAccommodationId: selectedAccommodation._id,
        expectedCheckOutDate: formData.expectedCheckOutDate,
        purpose: formData.purpose || activeCheckIn.purpose,
        roomNumber: formData.roomNumber || '',
        reason: formData.transferReason || 'Transfer requested',
        notes: formData.notes || `Transfer request from ${activeCheckIn.accommodation.name} to ${selectedAccommodation.name}`,
      };

      console.log('🔄 Transfer request data:', requestData);

      const response = await api.post('/accommodations/transfer-request', requestData);
      console.log('✅ Transfer request response:', response.data);

      toast.success(`Transfer request sent to ${selectedAccommodation.name}. Waiting for their response.`);
      navigate('/transfers');
    } catch (error) {
      console.error('❌ Transfer request error:', error);
      setError(error.response?.data?.message || 'Failed to send transfer request');
      toast.error(error.response?.data?.message || 'Failed to send transfer request');
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return `http://localhost:5006/${photoPath}`;
  };

  const steps = ['Search Citizen', 'Select Accommodation', 'Confirm Transfer'];

  if (!isOfficer) {
    return null;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
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
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, position: 'relative', zIndex: 1 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            flexShrink: 0,
          }}>
            <SwapHoriz sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
              Transfer Citizen
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
              Request a citizen to move from one accommodation to another
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* STEP 1: Search Citizen */}
      {activeStep === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Find Citizen with Active Check-In
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={9}>
              <TextField
                fullWidth
                label="Search by name, passport, or nationality"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchCitizen()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonSearch color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSearchCitizen}
                disabled={searching}
                sx={{ height: 56 }}
              >
                {searching ? <CircularProgress size={24} /> : 'Search'}
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {searchResults.length > 0 ? (
            <Box>
              <Typography variant="subtitle2" gutterBottom color="textSecondary">
                {searchResults.length} citizen(s) with active check-ins found
              </Typography>
              <Grid container spacing={2}>
                {searchResults.map((citizen) => (
                  <Grid item xs={12} md={6} key={citizen._id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 4 },
                        border: selectedCitizen?._id === citizen._id ? 2 : 0,
                        borderColor: 'primary.main',
                      }}
                      onClick={() => handleSelectCitizen(citizen)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={getPhotoUrl(citizen.photo)}
                            sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}
                          >
                            {citizen.fullName?.charAt(0) || 'C'}
                          </Avatar>
                          <Box>
                            <Typography variant="h6">{citizen.fullName}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              Passport: {citizen.passportNumber}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Nationality: {citizen.nationality}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={`Current: ${citizen.currentAccommodation?.accommodationId?.name || 'N/A'}`}
                            color="info"
                            size="small"
                          />
                          <Chip
                            label={citizen.status || 'Active'}
                            color={citizen.status === 'active' ? 'success' : 'warning'}
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : searchQuery && !searching ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="textSecondary">
                No citizens with active check-ins found.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="textSecondary">
                Search for a citizen with an active check-in to transfer.
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* STEP 2: Select Accommodation */}
      {activeStep === 1 && selectedCitizen && activeCheckIn && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar
              src={getPhotoUrl(selectedCitizen.photo)}
              sx={{ width: 64, height: 64, bgcolor: 'warning.main' }}
            >
              {selectedCitizen.fullName?.charAt(0) || 'C'}
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedCitizen.fullName}</Typography>
              <Typography variant="body2" color="textSecondary">
                <SwapHoriz sx={{ fontSize: 14, mr: 0.5 }} />
                Current: {activeCheckIn.accommodation?.name || 'N/A'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <LocationOn sx={{ fontSize: 14, mr: 0.5 }} />
                {activeCheckIn.accommodation?.address?.city}, {activeCheckIn.accommodation?.address?.country}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => {
                setActiveStep(0);
                setSelectedCitizen(null);
                setActiveCheckIn(null);
              }}
              sx={{ ml: 'auto' }}
            >
              Change
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Select New Accommodation
          </Typography>

          <Grid container spacing={2}>
            {accommodations.length === 0 ? (
              <Grid item xs={12}>
                <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                  No accommodations available. Please register an accommodation first.
                </Typography>
              </Grid>
            ) : (
              accommodations.map((accommodation) => {
                const isCurrent = accommodation._id === activeCheckIn.accommodation?._id;
                return (
                  <Grid item xs={12} md={6} lg={4} key={accommodation._id}>
                    <Card
                      sx={{
                        cursor: isCurrent ? 'default' : 'pointer',
                        opacity: isCurrent ? 0.5 : 1,
                        '&:hover': { boxShadow: isCurrent ? 0 : 4 },
                        border: selectedAccommodation?._id === accommodation._id ? 2 : 0,
                        borderColor: 'primary.main',
                        height: '100%',
                      }}
                      onClick={() => !isCurrent && handleSelectAccommodation(accommodation)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Hotel color="primary" />
                          <Box flex={1}>
                            <Typography variant="h6">{accommodation.name}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              {accommodation.type?.replace('_', ' ') || 'N/A'}
                            </Typography>
                          </Box>
                          {isCurrent && (
                            <Chip label="Current" color="info" size="small" />
                          )}
                          <Chip
                            label={accommodation.status || 'Active'}
                            size="small"
                            color={accommodation.status === 'active' ? 'success' : 'default'}
                          />
                        </Box>

                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2">
                            {accommodation.address?.city}, {accommodation.address?.country}
                          </Typography>
                        </Box>

                        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                          <Typography variant="caption">
                            Occupants: {accommodation.currentOccupants || 0} / {accommodation.capacity || 0}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })
            )}
          </Grid>
        </Paper>
      )}

      {/* STEP 3: Confirm Transfer */}
      {activeStep === 2 && selectedCitizen && activeCheckIn && selectedAccommodation && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Transfer Details
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="textSecondary">Citizen</Typography>
                <Typography variant="body1">{selectedCitizen.fullName}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="textSecondary">From</Typography>
                <Typography variant="body1">{activeCheckIn.accommodation?.name}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="textSecondary">To</Typography>
                <Typography variant="body1">{selectedAccommodation.name}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expected Check-Out Date"
                type="date"
                value={formData.expectedCheckOutDate}
                onChange={(e) => setFormData({ ...formData, expectedCheckOutDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Room Number"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="e.g., 201, Suite A"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Purpose of Stay"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="tourism">Tourism</option>
                <option value="business">Business</option>
                <option value="education">Education</option>
                <option value="medical">Medical</option>
                <option value="family_visit">Family Visit</option>
                <option value="other">Other</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Transfer Reason"
                value={formData.transferReason}
                onChange={(e) => setFormData({ ...formData, transferReason: e.target.value })}
                placeholder="Why is this citizen being transferred?"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special notes about this transfer..."
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setActiveStep(1);
                setSelectedAccommodation(null);
              }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              size="large"
              color="warning"
              onClick={handleTransfer}
              disabled={loading || !formData.expectedCheckOutDate}
              startIcon={<Send />}
            >
              {loading ? 'Sending...' : 'Send Transfer Request'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default TransferCitizen;