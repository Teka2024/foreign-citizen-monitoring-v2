import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Download,
  Refresh,
  Description,
  Assessment,
  People,
  Hotel,
  Warning,
  NotificationsActive,
  Print,
  Login,
  Logout,
  Error as ErrorIcon,
  CheckCircle,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Reports = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isOfficer = user?.role === 'officer';
  const isViewer = user?.role === 'viewer';
  
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'citizens'
  });

  const reportTypes = [
    { value: 'citizens', label: 'Citizens', icon: <People />, color: '#1976d2' },
    { value: 'accommodations', label: 'Accommodations', icon: <Hotel />, color: '#2e7d32' },
    { value: 'checkins', label: 'Check-Ins', icon: <Login />, color: '#ed6c02' },
    { value: 'checkouts', label: 'Check-Outs', icon: <Logout />, color: '#6c757d' },
    { value: 'overstays', label: 'Overstays', icon: <Warning />, color: '#d32f2f' },
    { value: 'alerts', label: 'Alerts', icon: <NotificationsActive />, color: '#9c27b0' },
  ];

  const generateReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast.warning('Please select both start and end dates');
      return;
    }

    if (new Date(filters.startDate) > new Date(filters.endDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    setLoading(true);
    setError('');
    setReportData([]);

    try {
      let endpoint = '/reports';
      let params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        type: filters.type
      };

      if (filters.type === 'checkouts') {
        endpoint = '/accommodations/history/all';
        params = {
          startDate: filters.startDate,
          endDate: filters.endDate,
          status: 'checked_out'
        };
      } else if (filters.type === 'overstays') {
        endpoint = '/dashboard/overstay-monitoring';
        params = {
          startDate: filters.startDate,
          endDate: filters.endDate
        };
      } else if (filters.type === 'checkins') {
        endpoint = '/accommodations/history/all';
        params = {
          startDate: filters.startDate,
          endDate: filters.endDate
        };
      }

      const response = await api.get(endpoint, { params });
      
      let data = [];
      let count = 0;

      if (filters.type === 'overstays') {
        const overstayData = response.data.data || response.data;
        const rawOverstays = overstayData.overstayed || [];
        
        const enrichedOverstays = [];
        for (const item of rawOverstays) {
          try {
            const citizenRes = await api.get(`/citizens/${item.citizenId}`);
            const citizen = citizenRes.data.citizen || citizenRes.data;
            
            let accommodationName = item.currentAccommodation || 'N/A';
            let roomNumber = 'N/A';
            let checkInDate = 'N/A';
            let expectedCheckOutDate = 'N/A';
            let purpose = 'N/A';
            let docType = item.docType || citizen.visaType || 'N/A';
            
            try {
              const historyRes = await api.get(`/accommodations/history/${item.citizenId}`);
              const histories = historyRes.data.data || [];
              const activeHistory = histories.find(h => h.status === 'active') || histories[0];
              if (activeHistory) {
                if (activeHistory.accommodation?.name) {
                  accommodationName = activeHistory.accommodation.name;
                } else if (activeHistory.accommodationId?.name) {
                  accommodationName = activeHistory.accommodationId.name;
                }
                roomNumber = activeHistory.roomNumber || 'N/A';
                checkInDate = activeHistory.checkInDate || 'N/A';
                expectedCheckOutDate = activeHistory.expectedCheckOutDate || 'N/A';
                purpose = activeHistory.purpose || 'N/A';
              }
            } catch (historyErr) {
              if (citizen.currentAccommodation) {
                accommodationName = citizen.currentAccommodation.accommodationId?.name || accommodationName;
                roomNumber = citizen.currentAccommodation.roomNumber || roomNumber;
                checkInDate = citizen.currentAccommodation.checkInDate || checkInDate;
                expectedCheckOutDate = citizen.currentAccommodation.expectedCheckOutDate || expectedCheckOutDate;
              }
            }

            if (docType === 'N/A' || docType === '') {
              if (citizen.visaType) docType = citizen.visaType;
              else if (citizen.idType) docType = citizen.idType;
              else if (citizen.entryDocType) docType = citizen.entryDocType;
            }

            enrichedOverstays.push({
              ...item,
              citizenFullName: citizen.fullName || citizen.name || item.fullName || 'N/A',
              citizenPassport: citizen.passportNumber || item.passportNumber || 'N/A',
              documentType: docType,
              accommodation: accommodationName,
              roomNumber: roomNumber,
              checkInDate: checkInDate,
              expectedCheckOutDate: expectedCheckOutDate,
              purpose: purpose,
              status: 'overstayed',
              riskLevel: item.riskLevel || citizen.riskLevel || 'low',
            });
          } catch (citizenErr) {
            enrichedOverstays.push({
              ...item,
              citizenFullName: item.fullName || 'N/A',
              citizenPassport: item.passportNumber || 'N/A',
              documentType: item.docType || 'N/A',
              accommodation: item.currentAccommodation || 'N/A',
              roomNumber: 'N/A',
              checkInDate: 'N/A',
              expectedCheckOutDate: 'N/A',
              purpose: 'N/A',
              status: 'overstayed',
              riskLevel: item.riskLevel || 'low',
            });
          }
        }

        data = enrichedOverstays;
        count = data.length;
      } else if (filters.type === 'checkouts' || filters.type === 'checkins') {
        const historyData = response.data.data || response.data;
        let rawData = [];
        if (Array.isArray(historyData)) {
          rawData = historyData;
        } else if (historyData && Array.isArray(historyData.data)) {
          rawData = historyData.data;
        } else {
          rawData = [];
        }

        if (filters.type === 'checkouts') {
          rawData = rawData.filter(item => 
            item.status === 'checked_out'
          );
        }

        // Get all passport numbers from the data
        const passportNumbers = rawData
          .map(item => item.citizen?.passportNumber)
          .filter(p => p);

        // Create a cache for citizen names
        const citizenNameCache = {};
        if (passportNumbers.length > 0) {
          try {
            const citizensRes = await api.get('/citizens', { params: { limit: 1000 } });
            const citizens = citizensRes.data.data || citizensRes.data.citizens || [];
            citizens.forEach(citizen => {
              if (citizen.passportNumber) {
                citizenNameCache[citizen.passportNumber] = citizen.fullName || citizen.name || 'N/A';
              }
            });
          } catch (err) {
            console.error('Error fetching citizens:', err);
          }
        }

        data = rawData.map(item => {
          const passport = item.citizen?.passportNumber;
          const citizenName = passport && citizenNameCache[passport] ? citizenNameCache[passport] : 'N/A';
          
          let accommodationName = 'N/A';
          if (item.accommodation?.name) {
            accommodationName = item.accommodation.name;
          } else if (item.accommodationId?.name) {
            accommodationName = item.accommodationId.name;
          }
          
          return {
            ...item,
            citizenName: citizenName,
            citizenPassport: item.citizen?.passportNumber || 'N/A',
            accommodation: accommodationName,
            checkInDate: item.checkInDate || 'N/A',
            expectedCheckOutDate: item.expectedCheckOutDate || 'N/A',
            purpose: item.purpose || 'N/A',
            roomNumber: item.roomNumber || 'N/A',
          };
        });
        count = data.length;
      } else {
        if (response.data.success) {
          data = response.data.data || [];
          count = response.data.count || data.length;
        } else {
          data = response.data.data || [];
          count = data.length;
        }
      }

      setReportData(data);
      
      if (data.length === 0) {
        toast.info(`No ${filters.type} records found for the selected period`);
      } else {
        toast.success(`Report generated: ${count} records found`);
      }
    } catch (err) {
      console.error('Report error:', err);
      setError(err.response?.data?.message || 'Failed to generate report');
      toast.error('Failed to generate report');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'overstayed': return 'error';
      case 'exited': return 'info';
      case 'expired': return 'warning';
      case 'pending': return 'warning';
      case 'resolved': return 'success';
      case 'checked_out': return 'default';
      case 'transferred': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'Active';
      case 'checked_out': return 'Checked Out';
      case 'overstayed': return 'Overstayed';
      case 'transferred': return 'Transferred';
      case 'expired': return 'Expired';
      case 'exited': return 'Exited';
      default: return status || 'N/A';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'success';
    }
  };

  const formatDate = (date) => {
    if (!date || date === 'N/A') return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportCSV = async () => {
    if (reportData.length === 0) {
      toast.warning('No data to export');
      return;
    }

    try {
      const response = await api.get('/reports/export', {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          type: filters.type
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${filters.type}-${filters.startDate}-${filters.endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export CSV');
    }
  };

  const getCurrentTypeInfo = () => {
    return reportTypes.find(t => t.value === filters.type) || reportTypes[0];
  };

  const getCitizenName = (item) => {
    if (!item) return 'N/A';
    if (item.citizenFullName) return item.citizenFullName;
    if (item.citizenName) return item.citizenName;
    if (item.fullName) return item.fullName;
    if (item.citizen?.fullName) return item.citizen.fullName;
    if (item.citizen?.name) return item.citizen.name;
    return 'N/A';
  };

  const getCitizenPassport = (item) => {
    if (!item) return 'N/A';
    if (item.citizenPassport) return item.citizenPassport;
    if (item.passportNumber) return item.passportNumber;
    if (item.citizen?.passportNumber) return item.citizen.passportNumber;
    return 'N/A';
  };

  const getAccommodationName = (item) => {
    if (!item) return 'N/A';
    if (item.accommodation) return item.accommodation;
    if (item.currentAccommodation) return item.currentAccommodation;
    if (item.accommodationName) return item.accommodationName;
    if (item.accommodation?.name) return item.accommodation.name;
    if (item.accommodationId?.name) return item.accommodationId.name;
    return 'N/A';
  };

  const getDocTypeLabel = (docType) => {
    if (!docType || docType === 'N/A') return 'N/A';
    const typeMap = {
      'visa': 'Visa',
      'id': 'ID',
      'stamp': 'Stamp',
      'other': 'Other',
      'tourist': 'Tourist Visa',
      'business': 'Business Visa',
      'student': 'Student Visa',
      'work': 'Work Visa',
      'diplomatic': 'Diplomatic Visa',
      'transit': 'Transit Visa',
      'resident': 'Resident Visa'
    };
    return typeMap[docType.toLowerCase()] || docType;
  };

  const getPurposeLabel = (purpose) => {
    if (!purpose || purpose === 'N/A') return 'N/A';
    const purposeMap = {
      'tourism': 'Tourism',
      'business': 'Business',
      'education': 'Education',
      'medical': 'Medical',
      'family_visit': 'Family Visit',
      'other': 'Other'
    };
    return purposeMap[purpose.toLowerCase()] || purpose;
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    if (typeof address === 'string') return address;
    if (typeof address === 'object') {
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.country) parts.push(address.country);
      return parts.length > 0 ? parts.join(', ') : 'N/A';
    }
    return 'N/A';
  };

  const renderValue = (key, value, item) => {
    if (key === '_id' || key === '__v' || key === 'displayName' || key === 'id' || 
        key === 'citizenId' || key === 'accommodationId' || key === 'checkedInBy' || 
        key === 'checkedOutBy' || key === 'citizenData' || key === 'docType') {
      return null;
    }
    
    if (key === 'citizenName' || key === 'citizen' || key === 'fullName' || key === 'citizenFullName') {
      return getCitizenName(item);
    }
    
    if (key === 'passportNumber' || key === 'citizenPassport') {
      return getCitizenPassport(item);
    }
    
    if (key === 'accommodation' || key === 'accommodationName' || key === 'currentAccommodation') {
      return getAccommodationName(item);
    }
    
    if (key === 'roomNumber') {
      return item.roomNumber || 'N/A';
    }
    
    if (key === 'documentType') {
      return getDocTypeLabel(value);
    }
    
    if (key === 'status') {
      return <Chip label={getStatusLabel(value)} color={getStatusColor(value)} size="small" />;
    }
    
    if (key === 'riskLevel') {
      return <Chip label={value || 'N/A'} color={getRiskColor(value)} size="small" />;
    }
    
    if (key === 'purpose') {
      return getPurposeLabel(value);
    }
    
    if (key === 'daysOverstayed') {
      return `${value} days`;
    }
    
    if (key === 'daysRemaining') {
      return `${value} days`;
    }

    if (key === 'address') {
      return formatAddress(value);
    }
    
    if (key === 'entryDate' || key === 'checkInDate' || key === 'createdAt' || 
        key === 'expectedCheckOutDate' || key === 'actualCheckOutDate' || 
        key === 'dateOfBirth' || key === 'visaIssueDate' || key === 'visaExpiryDate' ||
        key === 'checkOutDate' || key === 'expectedExitDate' || key === 'expiryDate') {
      return formatDate(value);
    }
    
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      if (value.street || value.city || value.state || value.country) {
        return formatAddress(value);
      }
      if (value.name && value.address) {
        return value.name;
      }
      return JSON.stringify(value);
    }
    
    return value || 'N/A';
  };

  const getTableHeaders = () => {
    if (filters.type === 'overstays') {
      const columns = [
        'status',
        'citizenFullName',
        'citizenPassport',
        'accommodation',
        'roomNumber',
        'documentType',
        'checkInDate',
        'expectedCheckOutDate',
        'daysOverstayed',
        'purpose',
        'riskLevel'
      ];
      
      const friendlyNames = {
        'status': 'Status',
        'citizenFullName': 'Citizen',
        'citizenPassport': 'Passport',
        'accommodation': 'Accommodation',
        'roomNumber': 'Room Number',
        'documentType': 'Document',
        'checkInDate': 'Check-In Date',
        'expectedCheckOutDate': 'Expected Check-Out',
        'daysOverstayed': 'Days Overstayed',
        'purpose': 'Purpose',
        'riskLevel': 'Risk Level'
      };
      
      return columns.map(key => ({
        key: key,
        label: friendlyNames[key] || key.replace(/([A-Z])/g, ' $1').trim()
      }));
    }
    
    if (filters.type === 'checkins' || filters.type === 'checkouts') {
      const columns = [
        'status',
        'checkInDate',
        'accommodation',
        'citizenName',
        'expectedCheckOutDate',
        'purpose',
        'roomNumber'
      ];
      
      const friendlyNames = {
        'status': 'Status',
        'checkInDate': 'Check-In Date',
        'accommodation': 'Accommodation',
        'citizenName': 'Citizen',
        'expectedCheckOutDate': 'Expected Check-Out',
        'purpose': 'Purpose',
        'roomNumber': 'Room Number'
      };
      
      return columns.map(key => ({
        key: key,
        label: friendlyNames[key] || key.replace(/([A-Z])/g, ' $1').trim()
      }));
    }
    
    if (reportData.length === 0) return [];
    
    const allKeys = Object.keys(reportData[0]);
    const excludeFields = ['_id', '__v', 'createdAt', 'updatedAt', 'displayName', 'id'];
    const filteredKeys = allKeys.filter(key => !excludeFields.includes(key));
    
    return filteredKeys.map(key => ({
      key: key,
      label: key.replace(/([A-Z])/g, ' $1').trim()
    }));
  };

  const headers = getTableHeaders();

  const getSummaryStats = () => {
    if (reportData.length === 0) return null;
    
    const total = reportData.length;
    let active = 0, inactive = 0, highRisk = 0;
    
    reportData.forEach(item => {
      const status = item.status?.toLowerCase() || '';
      if (status === 'active') active++;
      else if (status === 'inactive' || status === 'checked_out' || status === 'transferred') inactive++;
      if (item.riskLevel?.toLowerCase() === 'high' || item.riskLevel?.toLowerCase() === 'critical') highRisk++;
    });

    return { total, active, inactive, highRisk };
  };

  const stats = getSummaryStats();

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)',
        color: '#1a237e',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        borderRadius: 2 
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
              <Assessment sx={{ mr: 1, verticalAlign: 'middle', color: '#1a237e' }} />
              Reports Dashboard
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Generate and export comprehensive reports for your data
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton 
                sx={{ 
                  bgcolor: 'rgba(26, 35, 126, 0.08)',
                  color: '#1a237e',
                  '&:hover': { bgcolor: 'rgba(26, 35, 126, 0.15)' }
                }}
                onClick={() => generateReport()}
                disabled={loading}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print">
              <IconButton 
                sx={{ 
                  bgcolor: 'rgba(26, 35, 126, 0.08)',
                  color: '#1a237e',
                  '&:hover': { bgcolor: 'rgba(26, 35, 126, 0.15)' }
                }}
                onClick={() => window.print()}
              >
                <Print />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Chip 
            label={isAdmin ? 'Admin' : isOfficer ? 'Officer' : 'Viewer'} 
            color={isAdmin ? 'error' : isOfficer ? 'warning' : 'info'}
            size="small"
            sx={{ 
              bgcolor: 'rgba(26, 35, 126, 0.08)',
              color: '#1a237e',
              fontWeight: 500,
            }}
          />
          <Chip 
            label="Full Access" 
            size="small"
            sx={{ 
              bgcolor: 'rgba(26, 35, 126, 0.08)',
              color: '#1a237e',
              fontWeight: 500,
            }}
          />
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={3} alignItems="flex-end">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              size="medium"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              size="medium"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Report Type"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              size="medium"
              SelectProps={{
                renderValue: (selected) => {
                  const selectedType = reportTypes.find(t => t.value === selected);
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {selectedType?.icon}
                      {selectedType?.label}
                    </Box>
                  );
                },
              }}
            >
              {reportTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {type.icon}
                    {type.label}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={generateReport}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Assessment />}
              sx={{ 
                height: 56,
                background: 'linear-gradient(135deg, #1a237e 0%, #0d1445 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0d1445 0%, #070a2a 100%)',
                },
                textTransform: 'none',
              }}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" variant="outlined" sx={{ fontSize: '0.875rem' }}>
            <strong>Report Access:</strong> All users can generate and export reports. 
            {isOfficer && ' You can only see data for your assigned accommodation.'}
            {isViewer && ' You have full view access to all data.'}
          </Alert>
        </Box>
      </Paper>

      {reportData.length > 0 && stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: '3px solid #1a237e', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <CardContent>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500, textTransform: 'uppercase' }}>
                  Total Records
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a237e' }}>
                    {stats.total}
                  </Typography>
                  <Avatar sx={{ bgcolor: 'rgba(26, 35, 126, 0.08)', color: '#1a237e' }}>
                    <Assessment />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: '3px solid #66bb6a', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <CardContent>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500, textTransform: 'uppercase' }}>
                  Active
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#66bb6a' }}>
                    {stats.active}
                  </Typography>
                  <Avatar sx={{ bgcolor: 'rgba(102, 187, 106, 0.08)', color: '#66bb6a' }}>
                    <CheckCircle />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: '3px solid #ffa726', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <CardContent>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500, textTransform: 'uppercase' }}>
                  Inactive
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffa726' }}>
                    {stats.inactive}
                  </Typography>
                  <Avatar sx={{ bgcolor: 'rgba(255, 167, 38, 0.08)', color: '#ffa726' }}>
                    <Warning />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: '3px solid #ef5350', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <CardContent>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500, textTransform: 'uppercase' }}>
                  High Risk
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#ef5350' }}>
                    {stats.highRisk}
                  </Typography>
                  <Avatar sx={{ bgcolor: 'rgba(239, 83, 80, 0.08)', color: '#ef5350' }}>
                    <ErrorIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Report Results
              </Typography>
              {reportData.length > 0 && (
                <Chip label={`${reportData.length} records`} size="small" color="primary" variant="outlined" />
              )}
            </Box>
            {reportData.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Export CSV">
                  <Button variant="outlined" startIcon={<Download />} onClick={exportCSV} size="small" sx={{ textTransform: 'none' }}>
                    Export CSV
                  </Button>
                </Tooltip>
              </Box>
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : reportData.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Description sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 600 }}>
                No data found for the selected filters
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Try adjusting your date range or report type
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    {headers.map((header) => (
                      <TableCell key={header.key} sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>
                        {header.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.map((row, index) => (
                    <TableRow key={index} hover>
                      {headers.map((header) => {
                        const value = row[header.key];
                        return (
                          <TableCell key={header.key} sx={{ fontSize: '0.8rem' }}>
                            {renderValue(header.key, value, row)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Reports;