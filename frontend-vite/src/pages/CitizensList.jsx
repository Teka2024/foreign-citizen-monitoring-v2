// frontend/src/pages/CitizensList.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Typography,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { Search, Add, Visibility, Edit, Delete, Refresh, People } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const CitizensList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = user?.role === 'admin';
  const isOfficer = user?.role === 'officer';
  const isViewer = user?.role === 'viewer';

  useEffect(() => {
    fetchCitizens();
  }, [page, rowsPerPage]);

  const fetchCitizens = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchQuery && { search: searchQuery }),
      };
      const response = await api.get('/citizens', { params });
      setCitizens(response.data.data || response.data.citizens || []);
      setTotal(response.data.total || response.data.count || 0);
    } catch (err) {
      console.error('Error fetching citizens:', err);
      setError('Failed to load citizens. Please try again.');
      setCitizens([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchCitizens();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this citizen?')) return;
    try {
      await api.delete(`/citizens/${id}`);
      fetchCitizens();
    } catch (err) {
      setError('Failed to delete citizen');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'overstayed': return 'warning';
      case 'exited': return 'info';
      case 'expired': return 'error';
      case 'deported': return 'error';
      default: return 'default';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'success';
    }
  };

  const getDocumentDisplay = (citizen) => {
    const entryDocType = citizen.entryDocType || 'visa';
    if (entryDocType === 'visa') {
      const visaType = citizen.visaType || 'Visa';
      return { label: visaType.charAt(0).toUpperCase() + visaType.slice(1), color: 'primary', icon: '🛂' };
    }
    if (entryDocType === 'id') {
      const idType = citizen.idType
        ? citizen.idType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : 'ID';
      return { label: idType, color: 'info', icon: '🆔' };
    }
    if (entryDocType === 'stamp') {
      const stampType = citizen.stampType
        ? citizen.stampType.charAt(0).toUpperCase() + citizen.stampType.slice(1) + ' Stamp'
        : 'Stamp';
      return { label: stampType, color: 'warning', icon: '📌' };
    }
    if (entryDocType === 'other') {
      return { label: citizen.otherDocName || 'Other Document', color: 'secondary', icon: '📄' };
    }
    return { label: 'N/A', color: 'default', icon: '' };
  };

  const getDocumentTooltip = (citizen) => {
    const entryDocType = citizen.entryDocType || 'visa';
    if (entryDocType === 'visa') return `Entry Document: Visa\nVisa Type: ${citizen.visaType || 'N/A'}`;
    if (entryDocType === 'id') return `Entry Document: ID\nID Type: ${citizen.idType || 'N/A'}`;
    if (entryDocType === 'stamp') return `Entry Document: Stamp\nStamp Type: ${citizen.stampType || 'N/A'}`;
    if (entryDocType === 'other') return `Entry Document: Other\nDocument: ${citizen.otherDocName || 'N/A'}`;
    return 'Entry Document: N/A';
  };

  if (loading && citizens.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
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
            }}>
              <People sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
                Citizens
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
                Manage all registered foreign citizens
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchCitizens}
              disabled={loading}
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
                '&.Mui-disabled': { color: 'rgba(255,255,255,0.5)' },
              }}
            >
              Refresh
            </Button>
            {(isAdmin || isOfficer) && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/citizens/add')}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3, py: 1,
                  bgcolor: 'white',
                  color: '#1565c0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&:hover': { bgcolor: '#f1f5f9' },
                }}
              >
                Add Citizen
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {isViewer && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>View-Only Mode:</strong> You can view citizen information but cannot edit or delete.
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search by name, passport, or nationality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ flex: 1 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleSearch}>
                    <Search />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Passport</strong></TableCell>
              <TableCell><strong>Nationality</strong></TableCell>
              <TableCell><strong>Entry Document</strong></TableCell>
              <TableCell><strong>Entry Date</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Risk</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {citizens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No citizens found. Click "Add Citizen" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              citizens.map((citizen) => {
                const docDisplay = getDocumentDisplay(citizen);
                return (
                  <TableRow key={citizen._id} hover>
                    <TableCell>{citizen.fullName}</TableCell>
                    <TableCell>{citizen.passportNumber}</TableCell>
                    <TableCell>{citizen.nationality}</TableCell>
                    <TableCell>
                      <Tooltip title={getDocumentTooltip(citizen)} arrow>
                        <Chip
                          label={`${docDisplay.icon} ${docDisplay.label}`}
                          color={docDisplay.color}
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {citizen.entryDate ? new Date(citizen.entryDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={citizen.status || 'Active'}
                        color={getStatusColor(citizen.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={citizen.riskLevel || 'Low'}
                        color={getRiskColor(citizen.riskLevel)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => navigate(`/citizens/${citizen._id}`)}
                        size="small"
                        title="View Details"
                      >
                        <Visibility />
                      </IconButton>
                      {(isAdmin || isOfficer) && (
                        <IconButton
                          onClick={() => navigate(`/citizens/${citizen._id}/edit`)}
                          size="small"
                          color="primary"
                          title="Edit Citizen"
                        >
                          <Edit />
                        </IconButton>
                      )}
                      {isAdmin && (
                        <IconButton
                          onClick={() => handleDelete(citizen._id)}
                          size="small"
                          color="error"
                          title="Delete Citizen"
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default CitizensList;