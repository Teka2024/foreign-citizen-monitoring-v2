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
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material';
import { Search, Refresh, Visibility } from '@mui/icons-material';
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
  const [citizenMap, setCitizenMap] = useState({}); // Map passport -> citizen name

  const isOfficer = user?.role === 'admin' || user?.role === 'officer';

  useEffect(() => {
    if (isOfficer) {
      fetchAllCitizens();
    } else {
      setError('You do not have permission to view this page');
      setLoading(false);
    }
  }, []);

  // Step 1: Fetch all citizens first to get names
  const fetchAllCitizens = async () => {
    try {
      console.log('📊 Fetching all citizens...');
      const response = await api.get('/citizens', { params: { limit: 1000 } });
      const citizens = response.data.data || response.data.citizens || [];
      console.log(`✅ Found ${citizens.length} citizens`);
      
      // Create a map: passportNumber -> citizen name
      const map = {};
      citizens.forEach(citizen => {
        if (citizen.passportNumber) {
          // Use fullName if available, otherwise name
          const name = citizen.fullName || citizen.name || citizen.passportNumber;
          map[citizen.passportNumber] = name;
        }
      });
      setCitizenMap(map);
      console.log('📊 Citizen map created:', Object.keys(map).length, 'entries');
      
      // Now fetch history
      fetchHistory(map);
    } catch (err) {
      console.error('❌ Error fetching citizens:', err);
      // Still try to fetch history without names
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
      
      // Enrich history data with names from the map
      const enrichedData = data.map(record => {
        const passport = record.citizen?.passportNumber;
        if (passport && map[passport]) {
          // Add the name to the citizen object
          if (record.citizen) {
            record.citizen.fullName = map[passport];
          }
        }
        return record;
      });
      
      setHistory(enrichedData);
      setFilteredData(enrichedData);
      
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
    
    if (filtered.length === 0) {
      toast.info('No matching records found');
    }
  };

  // ✅ Get citizen name - now uses the enriched data
  const getCitizenName = (record) => {
    if (!record) return 'N/A';
    const citizen = record.citizen;
    if (!citizen) return 'N/A';
    
    // Try fullName (now enriched from the map)
    if (citizen.fullName) return citizen.fullName;
    // Try name
    if (citizen.name) return citizen.name;
    // Fallback to passport number
    if (citizen.passportNumber) return citizen.passportNumber;
    
    return 'N/A';
  };

  // ✅ Get passport number
  const getPassportNumber = (record) => {
    return record.citizen?.passportNumber || 'N/A';
  };

  // ✅ Get nationality
  const getNationality = (record) => {
    return record.citizen?.nationality || 'N/A';
  };

  // ✅ Get initials from citizen name
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
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'Active';
      case 'checked_out': return 'Checked Out';
      case 'overstayed': return 'Overstayed';
      case 'cancelled': return 'Cancelled';
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
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Check-In / Check-Out History
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              View all accommodation check-in and check-out records
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
            onClick={fetchAllCitizens}
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
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    {searchQuery ? 'No matching records found' : 'No check-in/out records found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((record, index) => {
                const citizenName = getCitizenName(record);
                const passport = getPassportNumber(record);
                const nationality = getNationality(record);
                const initials = getInitials(record);
                const checkInDate = record.checkInDate ? new Date(record.checkInDate) : null;
                const checkOutDate = record.actualCheckOutDate ? new Date(record.actualCheckOutDate) : null;
                const daysStayed = getDaysStayed(record.checkInDate, record.actualCheckOutDate);

                return (
                  <TableRow key={record._id} hover>
                    <TableCell>{index + 1}</TableCell>
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
      </TableContainer>
    </Box>
  );
};

export default CheckInHistory;