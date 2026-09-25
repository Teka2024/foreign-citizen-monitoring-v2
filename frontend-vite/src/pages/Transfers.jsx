import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Chip,
  Button,
  Avatar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  SwapHoriz,
  Refresh,
  CheckCircle,
  Cancel,
  Hotel,
  ArrowForward,
  HourglassEmpty,
  Visibility,
  Person,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Transfers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');
  const [rejectDialog, setRejectDialog] = useState({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState('');
  const [detailDialog, setDetailDialog] = useState({ open: false, request: null });

  const isOfficer = user?.role === 'admin' || user?.role === 'officer';

  useEffect(() => {
    if (!isOfficer) {
      toast.error('You do not have permission to access this page');
      navigate('/dashboard');
      return;
    }
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/accommodations/transfer-requests');
      setRequests(response.data.data || []);
    } catch (err) {
      console.error('Error fetching transfer requests:', err);
      setError('Failed to load transfer requests');
      toast.error('Failed to load transfer requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const myAccommodationId = (() => {
    if (user?.role === 'officer') {
      return (user.accommodationId?._id || user.accommodationId || '').toString();
    }
    return null;
  })();

  const incomingRequests = requests.filter(
    (r) => r.status === 'pending' && myAccommodationId && r.toAccommodation?._id?.toString() === myAccommodationId
  );

  const outgoingRequests = requests.filter(
    (r) => r.status === 'pending' && myAccommodationId && r.fromAccommodation?._id?.toString() === myAccommodationId
  );

  const historyRequests = requests.filter((r) => r.status !== 'pending');

  const handleAccept = async (id) => {
    try {
      await api.post(`/accommodations/transfer-request/${id}/accept`);
      toast.success('Transfer accepted — citizen moved successfully');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept transfer');
    }
  };

  const openRejectDialog = (id) => {
    setRejectDialog({ open: true, id });
    setRejectReason('');
  };

  const handleReject = async () => {
    try {
      await api.post(`/accommodations/transfer-request/${rejectDialog.id}/reject`, {
        rejectionReason: rejectReason || 'No reason provided',
      });
      toast.success('Transfer rejected');
      setRejectDialog({ open: false, id: null });
      setRejectReason('');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject transfer');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this transfer request?')) return;
    try {
      await api.post(`/accommodations/transfer-request/${id}/cancel`);
      toast.success('Transfer request cancelled');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel transfer');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return `http://localhost:5006/${photoPath}`;
  };

  // ✅ Get citizen's display name (fallback to firstName + middleName + lastName)
  const getCitizenName = (citizen) => {
    if (!citizen) return 'N/A';
    if (citizen.fullName) return citizen.fullName;
    const parts = [citizen.firstName, citizen.middleName, citizen.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'N/A';
  };

  // ==================== TABLE RENDERER ====================
  const renderTable = (data, mode = 'incoming') => (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase' }}>
              Photo
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase' }}>
              Citizen
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase' }}>
              Passport
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase' }}>
              From
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase' }}>
              To
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase' }}>
              Requested Date
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase' }}>
              Status
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase' }}>
              Reason
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase' }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((req) => (
            <TableRow
              key={req._id}
              hover
              sx={{
                '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.03)' },
                transition: 'background-color 0.2s ease',
              }}
            >
              {/* Photo */}
              <TableCell>
                <Avatar
                  src={getPhotoUrl(req.citizen?.photo)}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'primary.main',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  {getCitizenName(req.citizen).charAt(0)}
                </Avatar>
              </TableCell>

              {/* Citizen */}
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {getCitizenName(req.citizen)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {req.citizen?.nationality || ''}
                </Typography>
              </TableCell>

              {/* Passport */}
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {req.citizen?.passportNumber || 'N/A'}
                </Typography>
              </TableCell>

              {/* From */}
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Hotel sx={{ fontSize: 14, color: '#6b7280' }} />
                  <Typography variant="body2">
                    {req.fromAccommodation?.name || 'N/A'}
                  </Typography>
                </Box>
              </TableCell>

              {/* To */}
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ArrowForward sx={{ fontSize: 14, color: '#1976d2' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#1976d2' }}>
                    {req.toAccommodation?.name || 'N/A'}
                  </Typography>
                </Box>
              </TableCell>

              {/* Requested Date */}
              <TableCell>
                <Typography variant="body2">
                  {req.createdAt
                    ? format(new Date(req.createdAt), 'MMM dd, yyyy')
                    : 'N/A'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {req.createdAt ? format(new Date(req.createdAt), 'HH:mm') : ''}
                </Typography>
              </TableCell>

              {/* Status */}
              <TableCell>
                <Chip
                  icon={
                    req.status === 'pending' ? <HourglassEmpty sx={{ fontSize: 14 }} /> :
                    req.status === 'accepted' ? <CheckCircle sx={{ fontSize: 14 }} /> :
                    req.status === 'rejected' ? <Cancel sx={{ fontSize: 14 }} /> :
                    undefined
                  }
                  label={req.status}
                  color={getStatusColor(req.status)}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    fontSize: '0.7rem',
                  }}
                />
              </TableCell>

              {/* Reason */}
              <TableCell>
                <Tooltip title={req.reason || 'No reason provided'} arrow>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ maxWidth: 180, color: '#6b7280', fontSize: '0.8rem' }}
                  >
                    {req.reason || '—'}
                  </Typography>
                </Tooltip>
              </TableCell>

              {/* Actions */}
              <TableCell align="right">
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => setDetailDialog({ open: true, request: req })}
                      sx={{ color: '#6b7280' }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  {mode === 'incoming' && req.status === 'pending' && (
                    <>
                      <Tooltip title="Accept Transfer">
                        <IconButton
                          size="small"
                          onClick={() => handleAccept(req._id)}
                          sx={{
                            color: '#22c55e',
                            '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.08)' },
                          }}
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject Transfer">
                        <IconButton
                          size="small"
                          onClick={() => openRejectDialog(req._id)}
                          sx={{
                            color: '#ef5350',
                            '&:hover': { bgcolor: 'rgba(239, 83, 80, 0.08)' },
                          }}
                        >
                          <Cancel fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}

                  {mode === 'outgoing' && req.status === 'pending' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleCancel(req._id)}
                      sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.75rem' }}
                    >
                      Cancel
                    </Button>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (!isOfficer) return null;

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* BANNER */}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}>
              <SwapHoriz sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
                Transfer Requests
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
                Accept, reject, or track citizen transfer requests
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchRequests}
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Tabs */}
          <Paper sx={{ mb: 3, borderRadius: 2 }}>
            <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ px: 2 }}>
              <Tab
                label={`Incoming (${incomingRequests.length})`}
                icon={<Person />}
                iconPosition="start"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
              <Tab
                label={`Outgoing (${outgoingRequests.length})`}
                icon={<HourglassEmpty />}
                iconPosition="start"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
              <Tab
                label={`History (${historyRequests.length})`}
                icon={<CheckCircle />}
                iconPosition="start"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
            </Tabs>
          </Paper>

          {tab === 0 && (
            incomingRequests.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                <Person sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                <Typography variant="body1" color="textSecondary">
                  No incoming transfer requests.
                </Typography>
              </Paper>
            ) : renderTable(incomingRequests, 'incoming')
          )}

          {tab === 1 && (
            outgoingRequests.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                <HourglassEmpty sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                <Typography variant="body1" color="textSecondary">
                  No outgoing transfer requests.
                </Typography>
              </Paper>
            ) : renderTable(outgoingRequests, 'outgoing')
          )}

          {tab === 2 && (
            historyRequests.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                <CheckCircle sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                <Typography variant="body1" color="textSecondary">
                  No transfer history yet.
                </Typography>
              </Paper>
            ) : renderTable(historyRequests, 'history')
          )}
        </>
      )}

      {/* REJECT DIALOG */}
      <Dialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, id: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Transfer Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this transfer.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., No available rooms, Booking conflict..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, id: null })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject}>
            Reject Transfer
          </Button>
        </DialogActions>
      </Dialog>

      {/* DETAIL DIALOG */}
      <Dialog
        open={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, request: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Transfer Request Details</DialogTitle>
        <DialogContent>
          {detailDialog.request && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  src={getPhotoUrl(detailDialog.request.citizen?.photo)}
                  sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}
                >
                  {getCitizenName(detailDialog.request.citizen).charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {getCitizenName(detailDialog.request.citizen)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Passport: {detailDialog.request.citizen?.passportNumber || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">From</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {detailDialog.request.fromAccommodation?.name || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">To</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#1976d2' }}>
                    {detailDialog.request.toAccommodation?.name || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Requested Date</Typography>
                  <Typography variant="body2">
                    {detailDialog.request.createdAt
                      ? format(new Date(detailDialog.request.createdAt), 'MMM dd, yyyy HH:mm')
                      : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Expected Check-Out</Typography>
                  <Typography variant="body2">
                    {detailDialog.request.expectedCheckOutDate
                      ? format(new Date(detailDialog.request.expectedCheckOutDate), 'MMM dd, yyyy')
                      : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Purpose</Typography>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {detailDialog.request.purpose?.replace('_', ' ') || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Room Number</Typography>
                  <Typography variant="body2">
                    {detailDialog.request.roomNumber || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Status</Typography>
                  <Chip
                    label={detailDialog.request.status}
                    color={getStatusColor(detailDialog.request.status)}
                    size="small"
                    sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                  />
                </Box>
                {detailDialog.request.reason && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" color="textSecondary">Reason</Typography>
                    <Typography variant="body2">{detailDialog.request.reason}</Typography>
                  </Box>
                )}
                {detailDialog.request.notes && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" color="textSecondary">Notes</Typography>
                    <Typography variant="body2">{detailDialog.request.notes}</Typography>
                  </Box>
                )}
                {detailDialog.request.rejectionReason && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" color="textSecondary">Rejection Reason</Typography>
                    <Typography variant="body2" sx={{ color: '#ef5350' }}>
                      {detailDialog.request.rejectionReason}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog({ open: false, request: null })}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Transfers;