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
  IconButton,
  InputAdornment,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
} from '@mui/material';
import {
  PersonSearch,
  CheckCircle,
  Cancel,
  Hotel,
  CalendarToday,
  Person,
  FlightTakeoff,
  SwapHoriz,
  CloudUpload,
  Delete,
  PictureAsPdf,
  Description,
  Logout,
  Send,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const CheckOut = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOfficer = user?.role === 'admin' || user?.role === 'officer';

  const [activeStep, setActiveStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState(null);
  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  const [checkOutReason, setCheckOutReason] = useState('depart');

  const [flightTicket, setFlightTicket] = useState(null);
  const [flightTicketPreview, setFlightTicketPreview] = useState(null);
  const [flightNumber, setFlightNumber] = useState('');
  const [flightDate, setFlightDate] = useState('');
  const [departureNotes, setDepartureNotes] = useState('');

  const [accommodations, setAccommodations] = useState([]);
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);
  const [transferFormData, setTransferFormData] = useState({
    expectedCheckOutDate: '',
    purpose: 'tourism',
    roomNumber: '',
    transferReason: '',
    notes: '',
  });

  const steps = ['Search Citizen', 'Select Reason', 'Confirm'];

  useEffect(() => {
    if (!isOfficer) {
      toast.error('You do not have permission to access this page');
      navigate('/dashboard');
    }
    fetchAccommodations();
  }, [isOfficer, navigate]);

  const fetchAccommodations = async () => {
    try {
      // ✅ Try to load ALL accommodations for the transfer picker
      // (transfer-options endpoint returns all regardless of officer scope)
      let response;
      try {
        response = await api.get('/accommodations/transfer-options');
      } catch {
        // fallback to /accommodations if transfer-options isn't available
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

    try {
      const response = await api.get(`/accommodations/active/${citizen._id}`);
      console.log('📦 Active check-in response:', response.data);

      const checkIn = response.data.data;

      if (checkIn) {
        setActiveCheckIn(checkIn);
      } else {
        setError('No active check-in found for this citizen.');
        toast.warning('No active check-in found');
        setActiveStep(0);
        setSelectedCitizen(null);
      }
    } catch (err) {
      console.error('❌ Error fetching active check-in:', err);
      setError('Failed to fetch active check-in details');
      toast.error('Failed to fetch active check-in details');
    }
  };

  const handleFlightTicketChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File must be less than 5MB');
        return;
      }
      setFlightTicket(file);
      setFlightTicketPreview(URL.createObjectURL(file));
    }
  };

  const removeFlightTicket = () => {
    setFlightTicket(null);
    setFlightTicketPreview(null);
  };

  const handleSelectAccommodation = (accommodation) => {
    if (accommodation._id === activeCheckIn?.accommodation?._id) {
      toast.warning('This is the current accommodation');
      setError('Please select a different accommodation');
      return;
    }
    setSelectedAccommodation(accommodation);
  };

  // ✅ CHANGED: Now creates a transfer REQUEST (pending), not an immediate transfer
  const handleTransfer = async () => {
    if (!transferFormData.expectedCheckOutDate) {
      toast.error('Please enter expected check-out date');
      return;
    }
    if (!selectedAccommodation) {
      toast.error('Please select a new accommodation');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestData = {
        citizenId: selectedCitizen._id,
        toAccommodationId: selectedAccommodation._id,
        expectedCheckOutDate: transferFormData.expectedCheckOutDate,
        purpose: transferFormData.purpose || 'tourism',
        roomNumber: transferFormData.roomNumber || '',
        reason: transferFormData.transferReason || 'Transfer requested',
        notes: transferFormData.notes || `Transfer request from ${activeCheckIn.accommodation.name} to ${selectedAccommodation.name}`,
      };

      await api.post('/accommodations/transfer-request', requestData);
      toast.success(`Transfer request sent to ${selectedAccommodation.name}. Waiting for their response.`);
      navigate('/transfers');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send transfer request');
      toast.error(error.response?.data?.message || 'Failed to send transfer request');
    } finally {
      setLoading(false);
    }
  };

  const handleDepart = async () => {
    if (!flightTicket) {
      toast.error('Please upload flight ticket');
      return;
    }
    if (!flightNumber) {
      toast.error('Please enter flight number');
      return;
    }
    if (!flightDate) {
      toast.error('Please select flight date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('citizenId', selectedCitizen._id);
      formDataToSend.append('checkOutDate', new Date().toISOString());
      formDataToSend.append('flightNumber', flightNumber);
      formDataToSend.append('flightDate', flightDate);
      formDataToSend.append('notes', departureNotes || '');
      formDataToSend.append('flightTicket', flightTicket);

      await api.post('/accommodations/check-out/depart', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Citizen checked out successfully!');
      navigate('/citizens');
    } catch (error) {
      console.error('❌ Departure error:', error);
      setError(error.response?.data?.message || 'Check-out failed');
      toast.error(error.response?.data?.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 1) {
      if (checkOutReason === 'depart') {
        setActiveStep(2);
      } else if (checkOutReason === 'transfer') {
        if (!selectedAccommodation) {
          toast.error('Please select a new accommodation');
          return;
        }
        if (!transferFormData.expectedCheckOutDate) {
          toast.error('Please enter expected check-out date');
          return;
        }
        handleTransfer();
        return;
      }
    } else if (activeStep === 2) {
      handleDepart();
    }
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return `http://localhost:5006/${photoPath}`;
  };

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
            <Logout sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
              Check-Out / Transfer Citizen
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
              Check out a citizen (Depart) or request a transfer to another accommodation
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

      {/* STEP 0: Search Citizen */}
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
                Search for a citizen with an active check-in.
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* STEP 1: Select Reason */}
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
                <Hotel sx={{ fontSize: 14, mr: 0.5 }} />
                Current: {activeCheckIn.accommodation?.name || 'N/A'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <CalendarToday sx={{ fontSize: 14, mr: 0.5 }} />
                Checked In: {activeCheckIn.checkInDate ? format(new Date(activeCheckIn.checkInDate), 'MMM dd, yyyy') : 'N/A'}
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

          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <FormLabel component="legend" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
              Select Check-Out Reason
            </FormLabel>
            <RadioGroup
              value={checkOutReason}
              onChange={(e) => setCheckOutReason(e.target.value)}
              sx={{ mt: 2 }}
            >
              <FormControlLabel
                value="depart"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="bold">Depart</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Citizen is leaving the country. Requires flight ticket upload.
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="transfer"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="bold">Transfer</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Request the citizen to move to another accommodation. The receiving accommodation will accept or reject.
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          {checkOutReason === 'transfer' && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
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

              {selectedAccommodation && (
                <Box sx={{ mt: 3 }}>
                  <Alert severity="success">
                    Selected: <strong>{selectedAccommodation.name}</strong>
                  </Alert>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Expected Check-Out Date"
                        type="date"
                        value={transferFormData.expectedCheckOutDate}
                        onChange={(e) => setTransferFormData({ ...transferFormData, expectedCheckOutDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Room Number"
                        value={transferFormData.roomNumber}
                        onChange={(e) => setTransferFormData({ ...transferFormData, roomNumber: e.target.value })}
                        placeholder="e.g., 201, Suite A"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        label="Purpose of Stay"
                        value={transferFormData.purpose}
                        onChange={(e) => setTransferFormData({ ...transferFormData, purpose: e.target.value })}
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
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Transfer Reason"
                        value={transferFormData.transferReason}
                        onChange={(e) => setTransferFormData({ ...transferFormData, transferReason: e.target.value })}
                        placeholder="Why is this citizen being transferred?"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Additional Notes"
                        value={transferFormData.notes}
                        onChange={(e) => setTransferFormData({ ...transferFormData, notes: e.target.value })}
                        placeholder="Any special notes about this transfer..."
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          )}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleNext}
              disabled={
                checkOutReason === 'transfer' && !selectedAccommodation
              }
              startIcon={checkOutReason === 'transfer' ? <Send /> : undefined}
            >
              {checkOutReason === 'depart'
                ? 'Next →'
                : (loading ? 'Sending...' : 'Send Transfer Request')}
            </Button>
          </Box>
        </Paper>
      )}

      {/* STEP 2: Depart (Flight Ticket Upload) */}
      {activeStep === 2 && selectedCitizen && checkOutReason === 'depart' && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Departure Details
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Citizen:</strong> {selectedCitizen.fullName} |
            <strong> Passport:</strong> {selectedCitizen.passportNumber} |
            <strong> Current Accommodation:</strong> {activeCheckIn?.accommodation?.name || 'N/A'}
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                <FlightTakeoff sx={{ mr: 1, verticalAlign: 'middle' }} />
                Flight Ticket
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                Upload the citizen's flight ticket (PDF or image)
              </Typography>

              {flightTicketPreview ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  {flightTicket?.type?.includes('image') ? (
                    <img src={flightTicketPreview} alt="Flight Ticket" style={{ maxHeight: 100, maxWidth: 200 }} />
                  ) : (
                    <Description sx={{ fontSize: 40, color: 'grey.400' }} />
                  )}
                  <Box>
                    <Typography variant="body2">{flightTicket?.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {(flightTicket?.size / 1024).toFixed(1)} KB
                    </Typography>
                  </Box>
                  <IconButton color="error" onClick={removeFlightTicket} sx={{ ml: 'auto' }}>
                    <Delete />
                  </IconButton>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  sx={{ height: 56, width: '100%' }}
                >
                  Upload Flight Ticket
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    hidden
                    onChange={handleFlightTicketChange}
                  />
                </Button>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Flight Number"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                placeholder="e.g., ET123"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Flight Date"
                type="date"
                value={flightDate}
                onChange={(e) => setFlightDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes (Optional)"
                value={departureNotes}
                onChange={(e) => setDepartureNotes(e.target.value)}
                placeholder="Any additional notes about the departure..."
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setActiveStep(1);
                setFlightTicket(null);
                setFlightTicketPreview(null);
                setFlightNumber('');
                setFlightDate('');
                setDepartureNotes('');
              }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              size="large"
              color="error"
              onClick={handleNext}
              disabled={!flightTicket || !flightNumber || !flightDate}
              startIcon={<FlightTakeoff />}
            >
              {loading ? 'Processing...' : 'Confirm Departure'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default CheckOut;