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
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Badge,
  Collapse,
} from '@mui/material';
import {
  Refresh,
  Warning,
  Error as ErrorIcon,
  CheckCircle,
  Person,
  Visibility,
  Search,
  Clear,
  FilterList,
  Hotel,
  ExpandLess,
  ExpandMore,
  Flag,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const OverstayMonitoring = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    summary: { overstayedCount: 0, expiringSoonCount: 0, totalCitizensChecked: 0 },
    overstayed: [],
    expiringSoon: [],
    allData: []
  });
  const [filteredOverstayed, setFilteredOverstayed] = useState([]);
  const [filteredExpiring, setFilteredExpiring] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [docTypeFilter, setDocTypeFilter] = useState('all');
  const [accommodationFilter, setAccommodationFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  const [citizenCache, setCitizenCache] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, searchQuery, statusFilter, docTypeFilter, accommodationFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/dashboard/overstay-monitoring');
      const responseData = response.data.data;

      const enrichedOverstayed = await Promise.all((responseData.overstayed || []).map(async (item) => {
        const enriched = await enrichCitizenData(item);
        return enriched;
      }));

      const enrichedExpiring = await Promise.all((responseData.expiringSoon || []).map(async (item) => {
        const enriched = await enrichCitizenData(item);
        return enriched;
      }));

      setData({
        ...responseData,
        overstayed: enrichedOverstayed,
        expiringSoon: enrichedExpiring
      });
      setFilteredOverstayed(enrichedOverstayed);
      setFilteredExpiring(enrichedExpiring);
    } catch (err) {
      setError('Failed to load overstay data');
      toast.error('Failed to load overstay data');
    } finally {
      setLoading(false);
    }
  };

  const enrichCitizenData = async (item) => {
    try {
      if (citizenCache[item.citizenId]) {
        const cached = citizenCache[item.citizenId];
        return {
          ...item,
          nationality: cached.nationality || 'N/A',
          fullName: cached.fullName || item.fullName || 'N/A',
          currentAccommodation: cached.currentAccommodation || item.currentAccommodation || 'N/A',
        };
      }

      const citizenResponse = await api.get(`/citizens/${item.citizenId}`);

      let citizen = null;
      if (citizenResponse.data && citizenResponse.data.citizen) {
        citizen = citizenResponse.data.citizen;
      } else if (citizenResponse.data && citizenResponse.data.data) {
        citizen = citizenResponse.data.data;
      } else {
        citizen = citizenResponse.data;
      }

      let nationality = 'N/A';
      if (citizen) {
        if (citizen.nationality) {
          nationality = citizen.nationality;
        } else if (citizen.nationality || citizen.country) {
          nationality = citizen.nationality || citizen.country || 'N/A';
        }
      }

      let fullName = item.fullName || 'N/A';
      if (citizen) {
        if (citizen.fullName) {
          fullName = citizen.fullName;
        } else if (citizen.name) {
          fullName = citizen.name;
        } else if (citizen.firstName && citizen.lastName) {
          fullName = `${citizen.firstName} ${citizen.lastName}`;
        }
      }

      let accommodationName = 'N/A';
      if (citizen && citizen.currentAccommodation) {
        if (citizen.currentAccommodation.accommodationId?.name) {
          accommodationName = citizen.currentAccommodation.accommodationId.name;
        } else if (typeof citizen.currentAccommodation.accommodationId === 'string') {
          try {
            const accResponse = await api.get(`/accommodations/${citizen.currentAccommodation.accommodationId}`);
            if (accResponse.data && accResponse.data.data) {
              accommodationName = accResponse.data.data.name || 'N/A';
            } else if (accResponse.data && accResponse.data.accommodation) {
              accommodationName = accResponse.data.accommodation.name || 'N/A';
            }
          } catch (err) {
            // ignore
          }
        }
      }

      if (accommodationName === 'N/A') {
        try {
          const historyResponse = await api.get(`/accommodations/history/${item.citizenId}`);
          const history = historyResponse.data.data || historyResponse.data || [];
          const activeCheckIn = history.find(h => h.status === 'active' || h.status === 'active_check_in');
          if (activeCheckIn) {
            if (activeCheckIn.accommodation?.name) {
              accommodationName = activeCheckIn.accommodation.name;
            } else if (activeCheckIn.accommodationId?.name) {
              accommodationName = activeCheckIn.accommodationId.name;
            }
          }
        } catch (err) {
          // ignore
        }
      }

      const enrichedItem = {
        ...item,
        nationality: nationality,
        fullName: fullName,
        currentAccommodation: accommodationName,
      };

      setCitizenCache(prev => ({
        ...prev,
        [item.citizenId]: {
          nationality: nationality,
          fullName: fullName,
          currentAccommodation: accommodationName,
        }
      }));

      return enrichedItem;
    } catch (err) {
      console.error('❌ Error enriching citizen data:', err);
      return {
        ...item,
        nationality: item.nationality || 'N/A',
        currentAccommodation: item.currentAccommodation || 'N/A',
      };
    }
  };

  const applyFilters = () => {
    let overstayed = [...(data.overstayed || [])];
    let expiring = [...(data.expiringSoon || [])];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      overstayed = overstayed.filter(item =>
        item.fullName?.toLowerCase().includes(query) ||
        item.passportNumber?.toLowerCase().includes(query) ||
        item.nationality?.toLowerCase().includes(query) ||
        item.currentAccommodation?.toLowerCase().includes(query)
      );
      expiring = expiring.filter(item =>
        item.fullName?.toLowerCase().includes(query) ||
        item.passportNumber?.toLowerCase().includes(query) ||
        item.nationality?.toLowerCase().includes(query) ||
        item.currentAccommodation?.toLowerCase().includes(query)
      );
    }

    if (statusFilter === 'overstayed') {
      expiring = [];
    } else if (statusFilter === 'expiring') {
      overstayed = [];
    }

    if (docTypeFilter !== 'all') {
      overstayed = overstayed.filter(item =>
        item.docType?.toLowerCase() === docTypeFilter.toLowerCase()
      );
      expiring = expiring.filter(item =>
        item.docType?.toLowerCase() === docTypeFilter.toLowerCase()
      );
    }

    if (accommodationFilter !== 'all') {
      overstayed = overstayed.filter(item =>
        item.currentAccommodation?.toLowerCase().includes(accommodationFilter.toLowerCase())
      );
      expiring = expiring.filter(item =>
        item.currentAccommodation?.toLowerCase().includes(accommodationFilter.toLowerCase())
      );
    }

    setFilteredOverstayed(overstayed);
    setFilteredExpiring(expiring);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDocTypeFilter('all');
    setAccommodationFilter('all');
  };

  const getDocTypeLabel = (type) => {
    switch (type?.toLowerCase()) {
      case 'visa': return 'Visa';
      case 'id': return 'ID';
      case 'stamp': return 'Stamp';
      case 'other': return 'Other';
      default: return type || 'N/A';
    }
  };

  const getUniqueAccommodations = () => {
    const allItems = [...(data.overstayed || []), ...(data.expiringSoon || [])];
    const accs = allItems
      .map(item => item.currentAccommodation)
      .filter(Boolean);
    return [...new Set(accs)];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasData = filteredOverstayed.length > 0 || filteredExpiring.length > 0;
  const totalIssues = filteredOverstayed.length + filteredExpiring.length;

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
              <Warning sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
                Overstay Monitoring
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
                Monitor citizens with expiring or expired documents
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchData}
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

      {/* Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {[
          { label: 'Overstayed', value: data.summary.overstayedCount || 0, color: '#ef5350', icon: <ErrorIcon /> },
          { label: 'Expiring Soon', value: data.summary.expiringSoonCount || 0, color: '#ffa726', icon: <Warning /> },
          { label: 'Total Checked', value: data.summary.totalCitizensChecked || 0, color: '#66bb6a', icon: <CheckCircle /> },
          { label: 'Active Issues', value: totalIssues, color: totalIssues > 0 ? '#ef5350' : '#66bb6a', icon: <Flag /> },
        ].map((item, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
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
                  <Avatar sx={{ bgcolor: `${item.color}15`, color: item.color, width: 40, height: 40 }}>
                    {item.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList sx={{ color: '#6b7280', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827' }}>
              Filters
            </Typography>
            <Chip
              label={`${totalIssues} results`}
              size="small"
              sx={{
                bgcolor: totalIssues > 0 ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                color: '#1976d2',
                fontWeight: 500,
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              onClick={() => setShowFilters(!showFilters)}
              endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
              sx={{ textTransform: 'none', color: '#6b7280' }}
            >
              {showFilters ? 'Hide' : 'Show'}
            </Button>
            {(searchQuery || statusFilter !== 'all' || docTypeFilter !== 'all' || accommodationFilter !== 'all') && (
              <Button
                size="small"
                variant="text"
                color="error"
                onClick={handleClearFilters}
                startIcon={<Clear />}
                sx={{ textTransform: 'none' }}
              >
                Clear All
              </Button>
            )}
          </Box>
        </Box>

        <Collapse in={showFilters}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by name, passport, nationality, or accommodation..."
                value={searchQuery}
                onChange={handleSearch}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#6b7280', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <Clear fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ bgcolor: 'white', borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={2.5}>
              <FormControl fullWidth size="small" sx={{ bgcolor: 'white', borderRadius: 1 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="overstayed">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Badge color="error" variant="dot" />
                      Overstayed
                    </Box>
                  </MenuItem>
                  <MenuItem value="expiring">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Badge color="warning" variant="dot" />
                      Expiring Soon
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={2.5}>
              <FormControl fullWidth size="small" sx={{ bgcolor: 'white', borderRadius: 1 }}>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={docTypeFilter}
                  onChange={(e) => setDocTypeFilter(e.target.value)}
                  label="Document Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="visa">Visa</MenuItem>
                  <MenuItem value="id">ID</MenuItem>
                  <MenuItem value="stamp">Stamp</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={2.5}>
              <FormControl fullWidth size="small" sx={{ bgcolor: 'white', borderRadius: 1 }}>
                <InputLabel>Accommodation</InputLabel>
                <Select
                  value={accommodationFilter}
                  onChange={(e) => setAccommodationFilter(e.target.value)}
                  label="Accommodation"
                >
                  <MenuItem value="all">All Accommodations</MenuItem>
                  {getUniqueAccommodations().map((acc, index) => (
                    <MenuItem key={index} value={acc}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Hotel sx={{ fontSize: 16, color: '#6b7280' }} />
                        {acc}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {/* Overstayed Table */}
      {filteredOverstayed.length > 0 && (
        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <ErrorIcon sx={{ color: '#ef5350', fontSize: 20 }} />
            <Typography variant="h6" sx={{ color: '#ef5350', fontWeight: 600 }}>
              Overstayed Citizens
            </Typography>
            <Chip
              label={filteredOverstayed.length}
              size="small"
              sx={{ bgcolor: 'rgba(239, 83, 80, 0.08)', color: '#ef5350', fontWeight: 500 }}
            />
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Passport</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Nationality</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Document</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Overstayed</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Accommodation</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }} align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOverstayed.map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(239, 83, 80, 0.12)', color: '#ef5350', fontSize: '0.7rem' }}>
                          {item.fullName?.charAt(0) || 'U'}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.fullName || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.passportNumber || 'N/A'} size="small" variant="outlined" sx={{ borderColor: '#e0e0e0' }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={item.nationality || 'N/A'} size="small" variant="outlined" sx={{ borderColor: '#e0e0e0' }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={getDocTypeLabel(item.docType)} size="small" variant="outlined" sx={{ borderColor: '#e0e0e0' }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${item.daysOverstayed} days`}
                        size="small"
                        sx={{ bgcolor: 'rgba(239, 83, 80, 0.08)', color: '#ef5350', fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Hotel sx={{ fontSize: 14, color: '#6b7280' }} />
                        <Typography variant="body2">{item.currentAccommodation || 'N/A'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label="Overstayed" size="small" sx={{ bgcolor: 'rgba(239, 83, 80, 0.08)', color: '#ef5350', fontWeight: 500 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Citizen Details">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/citizens/${item.citizenId}`)}
                          sx={{ color: '#6b7280', '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)', color: '#1976d2' } }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Expiring Soon Table */}
      {filteredExpiring.length > 0 && (
        <Paper sx={{ p: 2.5, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <Warning sx={{ color: '#ffa726', fontSize: 20 }} />
            <Typography variant="h6" sx={{ color: '#ffa726', fontWeight: 600 }}>
              Expiring Soon
            </Typography>
            <Chip
              label={filteredExpiring.length}
              size="small"
              sx={{ bgcolor: 'rgba(255, 167, 38, 0.08)', color: '#ffa726', fontWeight: 500 }}
            />
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Passport</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Nationality</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Document</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Days Remaining</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Accommodation</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }} align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpiring.map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255, 167, 38, 0.12)', color: '#ffa726', fontSize: '0.7rem' }}>
                          {item.fullName?.charAt(0) || 'U'}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.fullName || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.passportNumber || 'N/A'} size="small" variant="outlined" sx={{ borderColor: '#e0e0e0' }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={item.nationality || 'N/A'} size="small" variant="outlined" sx={{ borderColor: '#e0e0e0' }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={getDocTypeLabel(item.docType)} size="small" variant="outlined" sx={{ borderColor: '#e0e0e0' }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${item.daysRemaining} days`}
                        size="small"
                        sx={{
                          bgcolor: item.daysRemaining <= 2 ? 'rgba(239, 83, 80, 0.08)' : 'rgba(255, 167, 38, 0.08)',
                          color: item.daysRemaining <= 2 ? '#ef5350' : '#ffa726',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Hotel sx={{ fontSize: 14, color: '#6b7280' }} />
                        <Typography variant="body2">{item.currentAccommodation || 'N/A'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label="Expiring Soon" size="small" sx={{ bgcolor: 'rgba(255, 167, 38, 0.08)', color: '#ffa726', fontWeight: 500 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Citizen Details">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/citizens/${item.citizenId}`)}
                          sx={{ color: '#6b7280', '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)', color: '#1976d2' } }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {!hasData && (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2, bgcolor: '#f8f9fa' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{
              width: 80, height: 80, borderRadius: '50%',
              bgcolor: 'rgba(102, 187, 106, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2
            }}>
              <CheckCircle sx={{ fontSize: 48, color: '#66bb6a' }} />
            </Box>
            <Typography variant="h5" sx={{ color: '#111827', fontWeight: 700 }}>
              All Clear! ✅
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
              No overstayed or expiring documents found.
            </Typography>
            {(searchQuery || statusFilter !== 'all' || docTypeFilter !== 'all' || accommodationFilter !== 'all') && (
              <Button
                variant="contained"
                onClick={handleClearFilters}
                sx={{ mt: 3, textTransform: 'none', borderRadius: 2, bgcolor: '#1976d2' }}
              >
                Clear All Filters
              </Button>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default OverstayMonitoring;