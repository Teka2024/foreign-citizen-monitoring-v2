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
  Button,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
  Avatar,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  PersonAdd,
  Block,
  CheckCircle,
  People,
  AdminPanelSettings,
  VerifiedUser,
  Person,
  Hotel,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [accommodations, setAccommodations] = useState([]);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'viewer',
    department: '',
    phoneNumber: '',
    accommodationId: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchAccommodations();
  }, [page, rowsPerPage]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || []);
      setTotal(response.data.count || 0);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccommodations = async () => {
    try {
      const response = await api.get('/accommodations');
      setAccommodations(response.data.data || []);
    } catch (err) {
      console.error('Error fetching accommodations:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchUsers();
      return;
    }
    try {
      const response = await api.get('/users/search', {
        params: { query: searchQuery }
      });
      setUsers(response.data.data || []);
    } catch (err) {
      setError('Search failed');
      toast.error('Search failed');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // ✅ Validate: If role is officer, accommodationId is required
    if (formData.role === 'officer' && !formData.accommodationId) {
      setError('Accommodation is required for Officer role');
      toast.error('Accommodation is required for Officer role');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phoneNumber: formData.phoneNumber,
        accommodationId: formData.role === 'officer' ? formData.accommodationId : null,
        department: formData.role === 'officer' ? 'accommodation' : formData.department,
      };

      await api.post('/users', payload);
      setSuccess('User created successfully!');
      toast.success('User created successfully');
      setShowCreateModal(false);
      setFormData({
        fullName: '',
        username: '',
        email: '',
        password: '',
        role: 'viewer',
        department: '',
        phoneNumber: '',
        accommodationId: '',
      });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await api.patch(`/users/${userId}/toggle-status`);
      toast.success('User status updated');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status');
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleChangeRole = async (userId, role) => {
    try {
      await api.patch(`/users/${userId}/role`, { role });
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change user role');
      toast.error(err.response?.data?.message || 'Failed to change user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'officer': return 'warning';
      default: return 'info';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <AdminPanelSettings fontSize="small" />;
      case 'officer': return <VerifiedUser fontSize="small" />;
      default: return <Person fontSize="small" />;
    }
  };

  const filteredUsers = users;

  if (loading && users.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              User Management
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Manage system users and their permissions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Refresh">
              <IconButton
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                onClick={fetchUsers}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
              onClick={() => setShowCreateModal(true)}
            >
              Create User
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Typography variant="caption">Total Users</Typography>
              <Typography variant="h4">{total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Typography variant="caption">Active Users</Typography>
              <Typography variant="h4">{users.filter(u => u.isActive).length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
            <CardContent>
              <Typography variant="caption">Admins</Typography>
              <Typography variant="h4">{users.filter(u => u.role === 'admin').length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
            <CardContent>
              <Typography variant="caption">Officers</Typography>
              <Typography variant="h4">{users.filter(u => u.role === 'officer').length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search users by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ flex: 1 }}
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
          <Button variant="outlined" onClick={() => { setSearchQuery(''); fetchUsers(); }}>
            Clear
          </Button>
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

      {/* Users Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell><strong>User</strong></TableCell>
              <TableCell><strong>Username</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Accommodation</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No users found. Click "Create User" to add one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: getRoleColor(user.role), width: 36, height: 36 }}>
                        {user.fullName?.charAt(0) || 'U'}
                      </Avatar>
                      <Typography variant="body2">{user.fullName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getRoleIcon(user.role)}
                      label={user.role}
                      color={getRoleColor(user.role)}
                      size="small"
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    {user.role === 'officer' ? (
                      <Chip
                        icon={<Hotel />}
                        label={user.accommodationId?.name || 'N/A'}
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        {user.department || 'N/A'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleStatus(user._id)}
                        disabled={user._id === currentUser?._id}
                        sx={{ color: user.isActive ? 'warning.main' : 'success.main' }}
                      >
                        {user.isActive ? <Block /> : <CheckCircle />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Change Role">
                      <IconButton
                        size="small"
                        disabled={user._id === currentUser?._id}
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteUser(user._id)}
                        disabled={user._id === currentUser?._id}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Create New User</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              sx={{ mb: 2 }}
              required
              helperText="Minimum 6 characters"
            />
            
            <TextField
              fullWidth
              select
              label="Role"
              value={formData.role}
              onChange={(e) => {
                const role = e.target.value;
                setFormData({ 
                  ...formData, 
                  role,
                  // If role is officer, set department to accommodation
                  department: role === 'officer' ? 'accommodation' : formData.department,
                  // Reset accommodationId if role is not officer
                  accommodationId: role === 'officer' ? formData.accommodationId : '',
                });
              }}
              sx={{ mb: 2 }}
            >
              <MenuItem value="viewer">Viewer</MenuItem>
              <MenuItem value="officer">Officer (Hotel Manager)</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>

            {/* ✅ Show accommodation selection only for Officer role */}
            {formData.role === 'officer' && (
              <TextField
                fullWidth
                select
                label="Assign Accommodation *"
                value={formData.accommodationId}
                onChange={(e) => setFormData({ ...formData, accommodationId: e.target.value })}
                sx={{ mb: 2 }}
                required
                SelectProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Hotel />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="">
                  <em>Select an accommodation</em>
                </MenuItem>
                {accommodations.map((acc) => (
                  <MenuItem key={acc._id} value={acc._id}>
                    {acc.name} - {acc.address?.city || 'N/A'}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              fullWidth
              label="Department"
              value={formData.role === 'officer' ? 'Accommodation' : formData.department}
              disabled={formData.role === 'officer'}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateUser} 
            disabled={loading || (formData.role === 'officer' && !formData.accommodationId)}
          >
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              User: <strong>{selectedUser?.fullName}</strong>
            </Typography>
            <TextField
              fullWidth
              select
              label="New Role"
              value={selectedUser?.role || ''}
              onChange={(e) => {
                if (selectedUser) {
                  handleChangeRole(selectedUser._id, e.target.value);
                  setShowEditModal(false);
                }
              }}
            >
              <MenuItem value="viewer">Viewer</MenuItem>
              <MenuItem value="officer">Officer</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditModal(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;