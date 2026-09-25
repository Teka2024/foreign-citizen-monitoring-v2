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
  Avatar,
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

  // ✅ FIX: Accept optional statusOverride to avoid React state closure bug
  const fetchAlerts = async (statusOverride = null) => {
    setLoading(true);
    setError('');
    try {
      const statusToUse = statusOverride !== null ? statusOverride : filter;
      const url = statusToUse === 'all' ? '/alerts' : `/alerts?status=${statusToUse}`;
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
      // ✅ Preserve current filter when refreshing after status change
      fetchAlerts(filter);
      fetchStats();
    } catch (err) {
      toast.error('Failed to update alert status');
    }
  };

  const handleViewAlert = (alert) => {
    setSelectedAlert(alert);
    setOpenDialog(true);
  };

  // ✅ FIX: Handler for filter button clicks — updates state AND fetches with the new value
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    fetchAlerts(newFilter);
    fetchStats();
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
              <NotificationsActive sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
                Alerts
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
                Monitor and manage system alerts and notifications
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => { fetchAlerts(filter); fetchStats(); }}
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
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Total', value: stats.total, color: '#1976d2', icon: <NotificationsActive /> },
          { label: 'New', value: stats.new, color: '#ef5350', icon: <NotificationsActive /> },
          { label: 'Acknowledged', value: stats.acknowledged, color: '#ffa726', icon: <Visibility /> },
          { label: 'Investigating', value: stats.investigating, color: '#29b6f6', icon: <Info /> },
          { label: 'Resolved', value: stats.resolved, color: '#66bb6a', icon: <CheckCircle /> },
        ].map((item, i) => (
          <Grid item xs={12} sm={6} md={2.4} key={i}>
            <Card sx={{
              borderLeft: `3px solid ${item.color}`,
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${item.color}20` },
            }}>
              <CardContent>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                  {item.label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: item.color }}>
                    {item.value}
                  </Typography>
                  <Avatar sx={{ bgcolor: `${item.color}15`, color: item.color, width: 36, height: 36 }}>
                    {item.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
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
            onClick={() => handleFilterChange('all')}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            All
          </Button>
          <Button
            variant={filter === 'new' ? 'contained' : 'outlined'}
            color="error"
            onClick={() => handleFilterChange('new')}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            New
          </Button>
          <Button
            variant={filter === 'acknowledged' ? 'contained' : 'outlined'}
            color="warning"
            onClick={() => handleFilterChange('acknowledged')}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Acknowledged
          </Button>
          <Button
            variant={filter === 'investigating' ? 'contained' : 'outlined'}
            color="info"
            onClick={() => handleFilterChange('investigating')}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Investigating
          </Button>
          <Button
            variant={filter === 'resolved' ? 'contained' : 'outlined'}
            color="success"
            onClick={() => handleFilterChange('resolved')}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Resolved
          </Button>
        </Box>
      </Paper>

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
                    <Chip label={alert.type} color={getTypeColor(alert.type)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={alert.severity} color={getSeverityColor(alert.severity)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {alert.message}
                    </Typography>
                  </TableCell>
                  <TableCell>{alert.citizenId?.fullName || 'N/A'}</TableCell>
                  <TableCell>{formatDate(alert.createdAt)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleViewAlert(alert)} title="View">
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip label={selectedAlert?.status} color={getStatusColor(selectedAlert?.status)} size="small" />
            <Chip label={selectedAlert?.type} color={getTypeColor(selectedAlert?.type)} size="small" />
            <Chip label={selectedAlert?.severity} color={getSeverityColor(selectedAlert?.severity)} size="small" />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>{selectedAlert.message}</Typography>
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