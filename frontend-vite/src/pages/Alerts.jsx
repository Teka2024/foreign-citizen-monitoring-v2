import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert as MuiAlert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Refresh,
  CheckCircle,
  Cancel,
  Visibility,
  NotificationsActive,
  NotificationsOff,
  Warning,
  Info,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Alerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    acknowledged: 0,
    investigating: 0,
    resolved: 0,
  });
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAlerts();
    fetchStats();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const url = filter === 'all' ? '/alerts' : `/alerts?status=${filter}`;
      const response = await api.get(url);
      console.log('📊 Alerts response:', response.data);
      setAlerts(response.data.data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts');
      toast.error('Failed to load alerts');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/alerts/stats/summary');
      console.log('📊 Stats response:', response.data);
      setStats(response.data.data || {
        total: 0,
        new: 0,
        acknowledged: 0,
        investigating: 0,
        resolved: 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats({
        total: 0,
        new: 0,
        acknowledged: 0,
        investigating: 0,
        resolved: 0,
      });
    }
  };

  const handleStatusChange = async (alertId, newStatus) => {
    try {
      await api.put(`/alerts/${alertId}`, { status: newStatus });
      toast.success(`Alert ${newStatus}`);
      fetchAlerts();
      fetchStats();
    } catch (err) {
      toast.error('Failed to update alert status');
    }
  };

  const handleViewAlert = (alert) => {
    setSelectedAlert(alert);
    setOpenDialog(true);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'success';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'error';
      case 'acknowledged': return 'warning';
      case 'investigating': return 'info';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new': return <NotificationsActive />;
      case 'acknowledged': return <Visibility />;
      case 'investigating': return <Info />;
      case 'resolved': return <CheckCircle />;
      default: return <NotificationsOff />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'overstay': return 'error';
      case 'accommodation': return 'warning';
      case 'security': return 'error';
      case 'visa_expiring': return 'warning';
      case 'notification': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Alerts
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Monitor and manage system alerts and notifications
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
            onClick={() => { fetchAlerts(); fetchStats(); }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="textSecondary">Total</Typography>
              <Typography variant="h5">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderLeft: '4px solid #f44336' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary">New</Typography>
              <Typography variant="h4" color="error">{stats.new}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderLeft: '4px solid #ff9800' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary">Acknowledged</Typography>
              <Typography variant="h4" color="warning">{stats.acknowledged}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderLeft: '4px solid #2196f3' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary">Investigating</Typography>
              <Typography variant="h4" color="info">{stats.investigating}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderLeft: '4px solid #4caf50' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary">Resolved</Typography>
              <Typography variant="h4" color="success">{stats.resolved}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <MuiAlert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </MuiAlert>
      )}

      {/* Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => { setFilter('all'); fetchAlerts(); }}
          >
            All
          </Button>
          <Button
            variant={filter === 'new' ? 'contained' : 'outlined'}
            color="error"
            onClick={() => { setFilter('new'); fetchAlerts(); }}
          >
            New
          </Button>
          <Button
            variant={filter === 'acknowledged' ? 'contained' : 'outlined'}
            color="warning"
            onClick={() => { setFilter('acknowledged'); fetchAlerts(); }}
          >
            Acknowledged
          </Button>
          <Button
            variant={filter === 'investigating' ? 'contained' : 'outlined'}
            color="info"
            onClick={() => { setFilter('investigating'); fetchAlerts(); }}
          >
            Investigating
          </Button>
          <Button
            variant={filter === 'resolved' ? 'contained' : 'outlined'}
            color="success"
            onClick={() => { setFilter('resolved'); fetchAlerts(); }}
          >
            Resolved
          </Button>
        </Box>
      </Paper>

      {/* Alerts Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Severity</strong></TableCell>
              <TableCell><strong>Message</strong></TableCell>
              <TableCell><strong>Citizen</strong></TableCell>
              <TableCell><strong>Created</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No alerts found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => (
                <TableRow key={alert._id} hover>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(alert.status)}
                      label={alert.status}
                      color={getStatusColor(alert.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={alert.type}
                      color={getTypeColor(alert.type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={alert.severity}
                      color={getSeverityColor(alert.severity)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {alert.message}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {alert.citizenId?.fullName || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {formatDate(alert.createdAt)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleViewAlert(alert)}
                      title="View"
                    >
                      <Visibility />
                    </IconButton>
                    {alert.status !== 'resolved' && (
                      <>
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleStatusChange(alert._id, 'acknowledged')}
                          title="Acknowledge"
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleStatusChange(alert._id, 'resolved')}
                          title="Resolve"
                        >
                          <CheckCircle />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Alert Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={selectedAlert?.status}
              color={getStatusColor(selectedAlert?.status)}
              size="small"
            />
            <Chip
              label={selectedAlert?.type}
              color={getTypeColor(selectedAlert?.type)}
              size="small"
            />
            <Chip
              label={selectedAlert?.severity}
              color={getSeverityColor(selectedAlert?.severity)}
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedAlert.message}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Citizen</Typography>
                  <Typography>{selectedAlert.citizenId?.fullName || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Created By</Typography>
                  <Typography>{selectedAlert.createdBy?.fullName || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Created At</Typography>
                  <Typography>{formatDate(selectedAlert.createdAt)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Assigned To</Typography>
                  <Typography>{selectedAlert.assignedTo?.fullName || 'Unassigned'}</Typography>
                </Grid>
                {selectedAlert.resolution && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Resolution</Typography>
                    <Typography>{selectedAlert.resolution}</Typography>
                  </Grid>
                )}
                {selectedAlert.notes && selectedAlert.notes.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Notes</Typography>
                    {selectedAlert.notes.map((note, index) => (
                      <Box key={index} sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1, mt: 1 }}>
                        <Typography variant="body2">{note.note}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {note.officer?.fullName || 'Unknown'} - {formatDate(note.date)}
                        </Typography>
                      </Box>
                    ))}
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          {selectedAlert?.status !== 'resolved' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                handleStatusChange(selectedAlert._id, 'resolved');
                setOpenDialog(false);
              }}
            >
              Resolve
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Alerts;