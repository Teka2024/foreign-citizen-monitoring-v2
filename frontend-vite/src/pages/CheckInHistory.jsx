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
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material';
import { Search, Refresh, Visibility, History } from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const CheckInHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [citizenMap, setCitizenMap] = useState({});

  // ✅ Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const isOfficer = user?.role === 'admin' || user?.role === 'officer';

  useEffect(() => {
    if (isOfficer) {
      fetchAllCitizens();
    } else {
      setError('You do not have permission to view this page');
      setLoading(false);
    }
  }, []);

  const fetchAllCitizens = async () => {
    try {
      console.log('📊 Fetching all citizens...');
      const response = await api.get('/citizens', { params: { limit: 1000 } });
      const citizens = response.data.data || response.data.citizens || [];
      console.log(`✅ Found ${citizens.length} citizens`);

      const map = {};
      citizens.forEach(citizen => {
        if (citizen.passportNumber) {
          const name = citizen.fullName || citizen.name || citizen.passportNumber;
          map[citizen.passportNumber] = name;
        }
      });
      setCitizenMap(map);
      console.log('📊 Citizen map created:', Object.keys(map).length, 'entries');

      fetchHistory(map);
    } catch (err) {
      console.error('❌ Error fetching citizens:', err);
      fetchHistory({});
    }
  };

  const fetchHistory = async (map = {}) => {
    setLoading(true);
    setError('');
    try {
      console.log('📊 Fetching check-in history...');
      const response = await api.get('/accommodations/history/all');

      let data = [];
      if (response.data && response.data.data) {
        data = response.data.data;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data && response.data.history) {
        data = response.data.history;
      } else {
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            data = response.data[key];
            break;
          }
        }
      }

      console.log('📊 Extracted data:', data);
      console.log('📊 Number of records:', data.length);

      const enrichedData = data.map(record => {
        const passport = record.citizen?.passportNumber;
        if (passport && map[passport]) {
          if (record.citizen) {
            record.citizen.fullName = map[passport];
          }
        }
        return record;
      });

      setHistory(enrichedData);
      setFilteredData(enrichedData);
      setPage(0); // ✅ Reset to first page when data loads

      if (data.length === 0) {
        toast.info('No check-in history found');
      } else {
        toast.success(`Found ${data.length} records`);
      }
    } catch (err) {
      console.error('❌ Error fetching history:', err);
      setError(err.response?.data?.message || 'Failed to load check-in history');
      toast.error('Failed to load check-in history');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredData(history);
      setPage(0);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = history.filter(item => {
      const citizenName = getCitizenName(item).toLowerCase();
      const passport = getPassportNumber(item).toLowerCase();
      const accommodation = item.accommodation?.name?.toLowerCase() || '';
      return citizenName.includes(query) || passport.includes(query) || accommodation.includes(query);
    });

    setFilteredData(filtered);
    setPage(0); // ✅ Reset to first page when filter changes

    if (filtered.length === 0) {
      toast.info('No matching records found');
    }
  };

  // ✅ Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ✅ Slice data for the current page
  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getCitizenName = (record) => {
    if (!record) return 'N/A';
    const citizen = record.citizen;
    if (!citizen) return 'N/A';

    if (citizen.fullName) return citizen.fullName;
    if (citizen.name) return citizen.name;
    if (citizen.passportNumber) return citizen.passportNumber;

    return 'N/A';
  };

  const getPassportNumber = (record) => {
    return record.citizen?.passportNumber || 'N/A';
  };

  const getNationality = (record) => {
    return record.citizen?.nationality || 'N/A';
  };

  const getInitials = (record) => {
    if (!record) return 'U';
    const citizen = record.citizen;
    if (!citizen) return 'U';

    const name = citizen.fullName || citizen.name || citizen.passportNumber || '';
    if (!name) return 'U';

    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'checked_out': return 'default';
      case 'overstayed': return 'error';
      case 'cancelled': return 'warning';
      case 'transferred': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'Active';
      case 'checked_out': return 'Checked Out';
      case 'overstayed': return 'Overstayed';
      case 'cancelled': return 'Cancelled';
      case 'transferred': return 'Transferred';
      default: return status || 'N/A';
    }
  };

  const getDaysStayed = (checkInDate, checkOutDate) => {
    if (!checkInDate) return 'N/A';
    const start = new Date(checkInDate);
    const end = checkOutDate ? new Date(checkOutDate) : new Date();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day';
    return `${diffDays} days`;
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
              <History sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
                Check-In / Check-Out History
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
                View all accommodation check-in and check-out records
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchAllCitizens}
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

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by citizen name, passport, or accommodation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" onClick={handleSearch}>
            Search
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setSearchQuery('');
              setFilteredData(history);
              setPage(0);
            }}
          >
            Clear
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell><strong>#</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Passport</strong></TableCell>
              <TableCell><strong>Nationality</strong></TableCell>
              <TableCell><strong>Accommodation</strong></TableCell>
              <TableCell><strong>Check-In</strong></TableCell>
              <TableCell><strong>Check-Out</strong></TableCell>
              <TableCell><strong>Days Stayed</strong></TableCell>
              <TableCell><strong>Room</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Detail</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    {searchQuery ? 'No matching records found' : 'No check-in/out records found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((record, index) => {
                const citizenName = getCitizenName(record);
                const passport = getPassportNumber(record);
                const nationality = getNationality(record);
                const initials = getInitials(record);
                const checkInDate = record.checkInDate ? new Date(record.checkInDate) : null;
                const checkOutDate = record.actualCheckOutDate ? new Date(record.actualCheckOutDate) : null;
                const daysStayed = getDaysStayed(record.checkInDate, record.actualCheckOutDate);

                // ✅ Global row number (continues across pages)
                const globalIndex = page * rowsPerPage + index + 1;

                return (
                  <TableRow key={record._id} hover>
                    <TableCell>{globalIndex}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.7rem' }}>
                          {initials}
                        </Avatar>
                        {citizenName}
                      </Box>
                    </TableCell>
                    <TableCell>{passport}</TableCell>
                    <TableCell>
                      <Chip
                        label={nationality}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span>🏨</span>
                        {record.accommodation?.name || 'N/A'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {checkInDate ? format(checkInDate, 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {checkOutDate ?
                        format(checkOutDate, 'MMM dd, yyyy') :
                        <Chip label="Not Checked Out" size="small" color="warning" />
                      }
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={daysStayed}
                        size="small"
                        color={record.status === 'active' ? 'primary' : 'default'}
                        variant={record.status === 'active' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>{record.roomNumber || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(record.status)}
                        color={getStatusColor(record.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Citizen Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            if (record.citizen?._id) {
                              window.location.href = `/citizens/${record.citizen._id}`;
                            }
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* ✅ Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 15, 20, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default CheckInHistory;