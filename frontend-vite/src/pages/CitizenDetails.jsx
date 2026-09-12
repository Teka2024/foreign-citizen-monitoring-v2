import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Avatar,
  Divider,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  Hotel,
  Warning as WarningIcon,
  Edit,
  Add,
  Close,
  Cancel,
  Notes,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios'; // ✅ FIXED import

const CitizenDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [citizen, setCitizen] = useState(null);
  const [accommodationHistory, setAccommodationHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [openNoteDialog, setOpenNoteDialog] = useState(false);
  const [openCheckOutDialog, setOpenCheckOutDialog] = useState(false);
  const [note, setNote] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [checkOutNotes, setCheckOutNotes] = useState('');

  useEffect(() => {
    fetchCitizenDetails();
  }, [id]);

  const fetchCitizenDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/citizens/${id}`);
      // ✅ FIXED: Handle response data correctly
      const citizenData = response.data.data || response.data.citizen;
      setCitizen(citizenData);
      setAccommodationHistory(response.data.accommodationHistory || []);
      setAlerts(response.data.alerts || []);
    } catch (error) {
      console.error('Error fetching citizen details:', error);
      toast.error('Failed to load citizen details');
      navigate('/citizens');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) {
      toast.warning('Please enter a note');
      return;
    }

    try {
      await api.post(`/citizens/${id}/notes`, { note });
      toast.success('Note added successfully');
      setOpenNoteDialog(false);
      setNote('');
      fetchCitizenDetails();
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleCheckOut = async () => {
    if (!checkOutDate) {
      toast.warning('Please select a check-out date');
      return;
    }

    try {
      await api.post('/accommodations/check-out', {
        citizenId: id,
        checkOutDate: checkOutDate,
        notes: checkOutNotes,
      });
      toast.success('Citizen checked out successfully');
      setOpenCheckOutDialog(false);
      fetchCitizenDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to check out');
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (!citizen) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Citizen not found</Alert>
      </Box>
    );
  }

  const isOverstayed = differenceInDays(new Date(), new Date(citizen.expectedExitDate)) > 0;
  const daysRemaining = differenceInDays(new Date(citizen.expectedExitDate), new Date());

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'white', color: 'primary.main' }}>
              {citizen.fullName?.charAt(0) || 'C'}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h5">{citizen.fullName}</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Chip
                label={`Passport: ${citizen.passportNumber}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
              <Chip
                label={`Nationality: ${citizen.nationality}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
              <Chip
                label={`Status: ${citizen.status || 'Active'}`}
                size="small"
                color={citizen.status === 'active' ? 'success' : 'warning'}
              />
              <Chip
                label={`Risk: ${citizen.riskLevel || 'Low'}`}
                size="small"
                color={citizen.riskLevel === 'low' ? 'success' : 'error'}
              />
              {isOverstayed && (
                <Chip
                  label={`Overstayed by ${Math.abs(daysRemaining)} days`}
                  size="small"
                  color="error"
                />
              )}
            </Box>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
                onClick={() => navigate(`/citizens/${id}/edit`)}
              >
                Edit
              </Button>
              {citizen.currentAccommodation?.status === 'checked_in' && (
                <Button
                  variant="contained"
                  startIcon={<Cancel />}
                  sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}
                  onClick={() => setOpenCheckOutDialog(true)}
                >
                  Check Out
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{ px: 2 }}
        >
          <Tab label="Overview" icon={<Person />} iconPosition="start" />
          <Tab label="Accommodation" icon={<Hotel />} iconPosition="start" />
          <Tab label="Alerts" icon={<WarningIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Personal Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Full Name
                    </Typography>
                    <Typography variant="body1">{citizen.fullName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Date of Birth
                    </Typography>
                    <Typography variant="body1">
                      {citizen.dateOfBirth ? format(new Date(citizen.dateOfBirth), 'MMM dd, yyyy') : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Gender
                    </Typography>
                    <Typography variant="body1">{citizen.gender || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Nationality
                    </Typography>
                    <Typography variant="body1">{citizen.nationality}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Visa Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Visa Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Visa Type
                    </Typography>
                    <Typography variant="body1">{citizen.visaType || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Visa Number
                    </Typography>
                    <Typography variant="body1">{citizen.visaNumber || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Entry Date
                    </Typography>
                    <Typography variant="body1">
                      {citizen.entryDate ? format(new Date(citizen.entryDate), 'MMM dd, yyyy') : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Expected Exit
                    </Typography>
                    <Typography variant="body1">
                      {citizen.expectedExitDate ? format(new Date(citizen.expectedExitDate), 'MMM dd, yyyy') : 'N/A'}
                      {daysRemaining >= 0 && citizen.expectedExitDate && (
                        <Chip
                          label={`${daysRemaining} days remaining`}
                          size="small"
                          color={daysRemaining > 30 ? 'success' : 'warning'}
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      Entry Port
                    </Typography>
                    <Typography variant="body1">{citizen.entryPort || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      Phone
                    </Typography>
                    <Typography variant="body1">
                      {citizen.personalContact?.phone || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {citizen.personalContact?.email || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Monitoring Notes */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Monitoring Notes</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => setOpenNoteDialog(true)}
                  >
                    Add Note
                  </Button>
                </Box>
                <Divider sx={{ my: 2 }} />
                {citizen.monitoringNotes?.length > 0 ? (
                  citizen.monitoringNotes.map((note, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">
                          {note.officer?.fullName || 'Unknown Officer'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {format(new Date(note.date), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {note.note}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No monitoring notes yet
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Accommodation History Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Accommodation History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {accommodationHistory.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Accommodation</TableCell>
                      <TableCell>Check-In</TableCell>
                      <TableCell>Check-Out</TableCell>
                      <TableCell>Room</TableCell>
                      <TableCell>Detail</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accommodationHistory.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>{record.accommodationId?.name || 'N/A'}</TableCell>
                        <TableCell>{record.checkInDate ? format(new Date(record.checkInDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell>
                          {record.checkOutDate ? format(new Date(record.checkOutDate), 'MMM dd, yyyy') : 'Active'}
                        </TableCell>
                        <TableCell>{record.roomNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {record.detail || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>   
                          <Chip
                            label={record.status}
                            size="small"
                            color={record.status === 'active' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No accommodation history found
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alerts Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Alerts
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <Box
                  key={alert._id}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 1,
                    border: 1,
                    borderColor: alert.severity === 'critical' ? 'error.main' :
                               alert.severity === 'high' ? 'warning.main' : 'info.main',
                    bgcolor: alert.severity === 'critical' ? 'error.light' :
                             alert.severity === 'high' ? 'warning.light' : 'info.light',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">{alert.message}</Typography>
                    <Chip
                      label={alert.status}
                      size="small"
                      color={alert.status === 'resolved' ? 'success' : 'warning'}
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {alert.createdAt ? format(new Date(alert.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">
                No alerts for this citizen
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Note Dialog */}
      <Dialog open={openNoteDialog} onClose={() => setOpenNoteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add Monitoring Note</Typography>
            <IconButton onClick={() => setOpenNoteDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Enter monitoring note..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNoteDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddNote} disabled={!note.trim()}>
            Add Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check Out Dialog */}
      <Dialog open={openCheckOutDialog} onClose={() => setOpenCheckOutDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Check Out Citizen</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Confirm check-out for {citizen.fullName}
            </Typography>
            <TextField
              fullWidth
              label="Check-Out Date"
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={checkOutNotes}
              onChange={(e) => setCheckOutNotes(e.target.value)}
              placeholder="Optional notes about check-out..."
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCheckOutDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCheckOut}
            disabled={!checkOutDate}
          >
            Confirm Check Out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CitizenDetails;