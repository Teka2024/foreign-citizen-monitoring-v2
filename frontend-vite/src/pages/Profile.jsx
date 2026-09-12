import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Divider,
  Alert,
  Chip,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Badge,
  Save,
  Edit,
  Cancel,
  Hotel,
  AdminPanelSettings,
  VerifiedUser,
  Visibility,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    username: '',
    role: '',
    department: '',
    accommodationId: null,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        username: user.username || '',
        role: user.role || '',
        department: user.department || '',
        accommodationId: user.accommodationId || null,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/auth/profile', {
        fullName: profileData.fullName,
        phoneNumber: profileData.phoneNumber,
        email: profileData.email,
      });

      if (response.data.success) {
        setSuccess('Profile updated successfully!');
        updateUser(response.data.user);
        setEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <AdminPanelSettings sx={{ color: '#f44336' }} />;
      case 'officer': return <VerifiedUser sx={{ color: '#ff9800' }} />;
      default: return <Person sx={{ color: '#2196f3' }} />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'officer': return 'warning';
      default: return 'info';
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Profile
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Manage your personal information
            </Typography>
          </Box>
          <Chip
            icon={getRoleIcon(user.role)}
            label={user.role?.toUpperCase() || 'User'}
            color={getRoleColor(user.role)}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center', p: 3 }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: 48,
              }}
            >
              {user.fullName?.charAt(0) || 'U'}
            </Avatar>
            <Typography variant="h5">{user.fullName}</Typography>
            <Typography variant="body2" color="textSecondary">
              @{user.username}
            </Typography>
            <Chip
              icon={getRoleIcon(user.role)}
              label={user.role?.toUpperCase() || 'User'}
              color={getRoleColor(user.role)}
              sx={{ mt: 1 }}
            />
            {user.role === 'officer' && user.accommodationId?.name && (
              <Chip
                icon={<Hotel />}
                label={user.accommodationId.name}
                variant="outlined"
                sx={{ mt: 1, ml: 1 }}
              />
            )}
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Personal Information</Typography>
                {!editing ? (
                  <Button
                    startIcon={<Edit />}
                    onClick={() => setEditing(true)}
                    variant="outlined"
                    size="small"
                  >
                    Edit
                  </Button>
                ) : (
                  <Box>
                    <Button
                      startIcon={<Cancel />}
                      onClick={() => {
                        setEditing(false);
                        setProfileData({
                          fullName: user.fullName || '',
                          email: user.email || '',
                          phoneNumber: user.phoneNumber || '',
                          username: user.username || '',
                          role: user.role || '',
                          department: user.department || '',
                          accommodationId: user.accommodationId || null,
                        });
                        setError('');
                        setSuccess('');
                      }}
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      startIcon={<Save />}
                      onClick={handleSave}
                      variant="contained"
                      size="small"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Person color="action" />
                    <Box flex={1}>
                      <Typography variant="caption" color="textSecondary">
                        Full Name
                      </Typography>
                      {editing ? (
                        <TextField
                          fullWidth
                          name="fullName"
                          value={profileData.fullName}
                          onChange={handleChange}
                          size="small"
                        />
                      ) : (
                        <Typography variant="body1">{user.fullName}</Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Email color="action" />
                    <Box flex={1}>
                      <Typography variant="caption" color="textSecondary">
                        Email
                      </Typography>
                      {editing ? (
                        <TextField
                          fullWidth
                          name="email"
                          value={profileData.email}
                          onChange={handleChange}
                          size="small"
                          type="email"
                        />
                      ) : (
                        <Typography variant="body1">{user.email}</Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Phone color="action" />
                    <Box flex={1}>
                      <Typography variant="caption" color="textSecondary">
                        Phone Number
                      </Typography>
                      {editing ? (
                        <TextField
                          fullWidth
                          name="phoneNumber"
                          value={profileData.phoneNumber || ''}
                          onChange={handleChange}
                          size="small"
                          placeholder="Enter phone number"
                        />
                      ) : (
                        <Typography variant="body1">
                          {user.phoneNumber || 'Not provided'}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Badge color="action" />
                    <Box flex={1}>
                      <Typography variant="caption" color="textSecondary">
                        Username
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        @{user.username}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {getRoleIcon(user.role)}
                    <Box flex={1}>
                      <Typography variant="caption" color="textSecondary">
                        Role
                      </Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {user.role}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {user.role === 'officer' && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Hotel color="action" />
                      <Box flex={1}>
                        <Typography variant="caption" color="textSecondary">
                          Assigned Accommodation
                        </Typography>
                        <Typography variant="body1">
                          {user.accommodationId?.name || 'Not assigned'}
                        </Typography>
                        {user.accommodationId?.address && (
                          <Typography variant="caption" color="textSecondary">
                            {user.accommodationId.address.city}, {user.accommodationId.address.country}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;