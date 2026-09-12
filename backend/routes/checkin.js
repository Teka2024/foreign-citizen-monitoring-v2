import React, { useState, useEffect } from 'react';
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
  InputAdornment,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  PersonSearch,
  LocationOn,
  CheckCircle,
  Business,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const CheckIn = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearchCitizen = async () => {
    if (!searchQuery.trim()) {
      toast.warning('Please enter a search term');
      return;
    }

    setSearching(true);
    setError('');
    setSearchResults([]);

    try {
      console.log('🔍 Searching for:', searchQuery);
      
      const response = await api.get('/citizens/search', {
        params: { query: searchQuery }
      });
      
      console.log('📦 Response data:', response.data);

      // Extract results
      let results = [];
      if (response.data && response.data.data) {
        results = response.data.data;
      } else if (Array.isArray(response.data)) {
        results = response.data;
      } else if (response.data && response.data.citizens) {
        results = response.data.citizens;
      }
      
      console.log('📊 Results count:', results.length);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast.info('No citizens found');
      } else {
        toast.success(`Found ${results.length} citizen(s)`);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      setError(error.response?.data?.message || 'Search failed');
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCitizen = (citizen) => {
    console.log('👤 Selected:', citizen.fullName);
    setSelectedCitizen(citizen);
    setError('');
    // Navigate to check-in step 2 (we'll keep it simple)
    toast.success(`Selected ${citizen.fullName}`);
  };

  // Test function to check if data is loading
  const testSearch = async () => {
    try {
      const response = await api.get('/citizens/search', {
        params: { query: 'belay' }
      });
      console.log('🔵 TEST SEARCH RESULT:', response.data);
      alert('Check console for search results!');
    } catch (err) {
      console.error('Test error:', err);
      alert('Error: ' + err.message);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h4" gutterBottom>
          Check-In Citizen
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Search and select a citizen to check in
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Find Citizen
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
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
          <Grid item xs={12} sm={4}>
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

        {/* 🔴 TEST BUTTON */}
        <Button
          variant="outlined"
          color="warning"
          onClick={testSearch}
          sx={{ mt: 2 }}
        >
          🔴 Test Search (Check Console)
        </Button>

        <Divider sx={{ my: 3 }} />

        {/* Display Results */}
        {searchResults.length > 0 ? (
          <Box>
            <Typography variant="subtitle2" gutterBottom color="textSecondary">
              {searchResults.length} citizen(s) found
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
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
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
                          label={citizen.status || 'Active'}
                          color={citizen.status === 'active' ? 'success' : 'warning'}
                          size="small"
                        />
                        <Chip
                          label={`Risk: ${citizen.riskLevel || 'Low'}`}
                          color={citizen.riskLevel === 'low' ? 'success' : 'error'}
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
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              No citizens found. Try a different search term.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Enter a search term and click Search to find citizens.
            </Typography>
          </Box>
        )}

        {selectedCitizen && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            <Typography variant="h6" color="success.dark">
              ✅ Selected: {selectedCitizen.fullName}
            </Typography>
            <Typography variant="body2">
              Passport: {selectedCitizen.passportNumber}
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => {
                toast.info('Check-in feature coming soon!');
              }}
            >
              Proceed to Check-In
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CheckIn;