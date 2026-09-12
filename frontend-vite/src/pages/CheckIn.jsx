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
} from '@mui/material';
import {
  PersonSearch,
  LocationOn,
  CheckCircle,
  Business,
  Person,
  CalendarToday,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const CheckIn = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOfficer = user?.role === 'admin' || user?.role === 'officer';

  // ✅ Redirect if not officer
  useEffect(() => {
    if (!isOfficer) {
      toast.error('You do not have permission to access this page');
      navigate('/dashboard');
    }
  }, [isOfficer, navigate]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState(null);
  const [error, setError] = useState('');
  const [accommodations, setAccommodations] = useState([]);
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    checkInDate: new Date().toISOString().split('T')[0],
    expectedCheckOutDate: '',
    roomNumber: '',
    purpose: 'tourism',
    notes: '',
  });

  useEffect(() => {
    if (isOfficer) {
      fetchAccommodations();
    }
  }, [isOfficer]);

  const fetchAccommodations = async () => {
    try {
      const response = await api.get('/accommodations');
      const data = response.data.data || response.data.accommodations || [];
      setAccommodations(data);
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
      } else {
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            results = response.data[key];
            break;
          }
        }
      }

      setSearchResults(results);

      if (results.length === 0) {
        toast.info('No citizens found');
      } else {
        toast.success(`Found ${results.length} citizen(s)`);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Search failed. Please try again.');
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCitizen = (citizen) => {
    if (citizen.currentAccommodation?.status === 'checked_in') {
      toast.warning('This citizen is already checked in');
      setError('Citizen is already checked in. Please check out first.');
      return;
    }
    setSelectedCitizen(citizen);
    setError('');
    setStep(2);
    toast.success(`Selected ${citizen.fullName}`);
  };

  const handleSelectAccommodation = (accommodation) => {
    const capacity = typeof accommodation.capacity === 'object' 
      ? accommodation.capacity?.available || 0 
      : accommodation.capacity || 0;
    const currentOccupants = accommodation.currentOccupants || 0;
    
    if (currentOccupants >= capacity && capacity > 0) {
      toast.warning('This accommodation is fully booked');
      setError('Accommodation is at full capacity');
      return;
    }
    
    setSelectedAccommodation(accommodation);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!formData.expectedCheckOutDate) {
      toast.error('Please enter expected check-out date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const checkInData = {
        citizenId: selectedCitizen._id,
        accommodationId: selectedAccommodation._id,
        checkInDate: new Date(formData.checkInDate).toISOString(),
        expectedCheckOutDate: new Date(formData.expectedCheckOutDate).toISOString(),
        roomNumber: formData.roomNumber || '',
        purpose: formData.purpose || 'tourism',
        notes: formData.notes || '',
      };

      await api.post('/accommodations/check-in', checkInData);
      toast.success('Citizen checked in successfully!');
      navigate('/citizens');
    } catch (error) {
      setError(error.response?.data?.message || 'Check-in failed');
      toast.error(error.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return `http://localhost:5006/${photoPath}`;
  };

  const getCapacityValue = (capacity) => {
    if (typeof capacity === 'object' && capacity !== null) {
      return capacity.available || 0;
    }
    return capacity || 0;
  };

  // If not officer, show nothing (redirecting)
  if (!isOfficer) {
    return null;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h5" gutterBottom>
          Check-In Citizen
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Register a foreign citizen's accommodation check-in
        </Typography>
      </Paper>

      {/* Stepper */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color={step === 1 ? 'primary.main' : 'textSecondary'}>
                1. Search Citizen
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color={step === 2 ? 'primary.main' : 'textSecondary'}>
                2. Select Accommodation
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color={step === 3 ? 'primary.main' : 'textSecondary'}>
                3. Confirm Details
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* STEP 1: Search Citizen */}
      {step === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Find Citizen
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
                {searchResults.length} citizen(s) found
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
                            <Typography variant="body2" color="textSecondary">
                              DOB: {citizen.dateOfBirth ? format(new Date(citizen.dateOfBirth), 'MMM dd, yyyy') : 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={citizen.status || 'Active'}
                            color={citizen.status === 'active' ? 'success' : 'warning'}
                            size="small"
                          />
                          <Chip
                            label={`Risk: ${citizen.riskLevel || 'Low'}`}
                            color={citizen.riskLevel === 'low' ? 'success' : 'error'}
                            size="small"
                          />
                          <Chip
                            label={`Visa: ${citizen.visaType || 'N/A'}`}
                            size="small"
                            variant="outlined"
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
                No citizens found. Try a different search term.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="textSecondary">
                Enter a search term and click Search to find citizens.
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* STEP 2: Select Accommodation */}
      {step === 2 && selectedCitizen && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar
              src={getPhotoUrl(selectedCitizen.photo)}
              sx={{ width: 64, height: 64, bgcolor: 'success.main' }}
            >
              {selectedCitizen.fullName?.charAt(0) || 'C'}
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedCitizen.fullName}</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.5 }}>
                <Typography variant="body2" color="textSecondary">
                  <Person sx={{ fontSize: 14, mr: 0.5 }} />
                  {selectedCitizen.passportNumber}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <Person sx={{ fontSize: 14, mr: 0.5 }} />
                  {selectedCitizen.nationality}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <CalendarToday sx={{ fontSize: 14, mr: 0.5 }} />
                  {selectedCitizen.dateOfBirth ? format(new Date(selectedCitizen.dateOfBirth), 'MMM dd, yyyy') : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  label={selectedCitizen.status || 'Active'}
                  color={selectedCitizen.status === 'active' ? 'success' : 'warning'}
                  size="small"
                />
                <Chip
                  label={`Risk: ${selectedCitizen.riskLevel || 'Low'}`}
                  color={selectedCitizen.riskLevel === 'low' ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </Box>
            <Button
              variant="outlined"
              onClick={() => {
                setStep(1);
                setSelectedCitizen(null);
              }}
              sx={{ ml: 'auto' }}
            >
              Change
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Select Accommodation
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
                const capacity = getCapacityValue(accommodation.capacity);
                const currentOccupants = accommodation.currentOccupants || 0;
                const available = capacity - currentOccupants;

                return (
                  <Grid item xs={12} md={6} lg={4} key={accommodation._id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 4 },
                        border: selectedAccommodation?._id === accommodation._id ? 2 : 0,
                        borderColor: 'primary.main',
                        height: '100%',
                      }}
                      onClick={() => handleSelectAccommodation(accommodation)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Business color="primary" />
                          <Box flex={1}>
                            <Typography variant="h6">{accommodation.name}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              {accommodation.type?.replace('_', ' ') || 'N/A'}
                            </Typography>
                          </Box>
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
                            Occupants: {currentOccupants} / {capacity}
                          </Typography>
                          <Typography variant="caption" color={available > 0 ? 'success.main' : 'error.main'}>
                            {available > 0 ? `${available} available` : 'FULL'}
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

      {/* STEP 3: Confirm Details */}
      {step === 3 && selectedCitizen && selectedAccommodation && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Check-In Details
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="textSecondary">Citizen</Typography>
                <Typography variant="body1">{selectedCitizen.fullName}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="textSecondary">Passport</Typography>
                <Typography variant="body1">{selectedCitizen.passportNumber}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="textSecondary">Accommodation</Typography>
                <Typography variant="body1">{selectedAccommodation.name}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Check-In Date"
                type="date"
                name="checkInDate"
                value={formData.checkInDate}
                onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expected Check-Out Date"
                type="date"
                name="expectedCheckOutDate"
                value={formData.expectedCheckOutDate}
                onChange={(e) => setFormData({ ...formData, expectedCheckOutDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                inputProps={{ min: formData.checkInDate }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Room Number"
                name="roomNumber"
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
                name="purpose"
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional Notes"
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special notes about this check-in..."
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setStep(2);
                setSelectedAccommodation(null);
              }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading || !formData.expectedCheckOutDate}
              startIcon={<CheckCircle />}
            >
              {loading ? 'Processing...' : 'Complete Check-In'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default CheckIn;