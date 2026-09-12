import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Alert,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Badge,
} from '@mui/material';
import {
  People,
  Hotel,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  TrendingUp,
  Info,
  NotificationsActive,
  Business,
  Login,
  Logout,
  PersonAdd,
  Refresh,
  ArrowForward,
  Assessment,
  Schedule,
  CalendarToday,
  LocationOn,
  Search,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
} from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalCitizens: 0,
    activeCitizens: 0,
    checkedIn: 0,
    checkedOut: 0,
    overstayed: 0,
    highRisk: 0,
    pendingAlerts: 0,
    totalAccommodations: 0,
  });
  const [recentCitizens, setRecentCitizens] = useState([]);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [trends, setTrends] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [overstayData, setOverstayData] = useState({
    summary: { overstayedCount: 0, expiringSoonCount: 0 },
    overstayed: [],
    expiringSoon: []
  });

  const isOfficer = user?.role === 'officer' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const defaultTrends = [
    { month: 'Jan', entries: 0, checkins: 0 },
    { month: 'Feb', entries: 0, checkins: 0 },
    { month: 'Mar', entries: 0, checkins: 0 },
    { month: 'Apr', entries: 0, checkins: 0 },
    { month: 'May', entries: 0, checkins: 0 },
    { month: 'Jun', entries: 0, checkins: 0 },
  ];

  useEffect(() => {
    fetchDashboardData();
    if (isOfficer) {
      fetchOverstayData();
    }
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const statsRes = await api.get('/dashboard/stats');
      const statsData = statsRes.data.data || statsRes.data;
      
      setStats({
        totalCitizens: statsData.totalCitizens || 0,
        activeCitizens: statsData.activeCitizens || 0,
        checkedIn: statsData.checkedIn || 0,
        checkedOut: statsData.checkedOut || 0,
        overstayed: statsData.overstayed || 0,
        highRisk: statsData.highRisk || 0,
        pendingAlerts: statsData.pendingAlerts || 0,
        totalAccommodations: statsData.totalAccommodations || 0,
      });

      try {
        const citizensRes = await api.get('/citizens', { params: { limit: 5 } });
        const citizens = citizensRes.data.data || citizensRes.data.citizens || [];
        setRecentCitizens(citizens.slice(0, 5));
      } catch (err) {
        setRecentCitizens([]);
      }

      try {
        const trendsRes = await api.get('/dashboard/trends');
        const rawData = trendsRes.data.data || trendsRes.data || [];
        if (rawData.length > 0) {
          setTrends(rawData);
        } else {
          setTrends(defaultTrends);
        }
      } catch {
        setTrends(defaultTrends);
      }

      try {
        const distRes = await api.get('/dashboard/distribution');
        const distData = distRes.data.data || distRes.data || [];
        if (distData.length > 0) {
          setDistribution(distData);
        } else {
          setDistribution([
            { name: 'Active', value: 1, color: '#22c55e' }
          ]);
        }
      } catch {
        setDistribution([
          { name: 'Active', value: 1, color: '#22c55e' }
        ]);
      }

      if (isOfficer) {
        try {
          const checkInsRes = await api.get('/dashboard/recent-checkins', { params: { limit: 5 } });
          setRecentCheckIns(checkInsRes.data.data || []);
        } catch {
          setRecentCheckIns([]);
        }
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load some dashboard data');
      toast.error('Failed to load dashboard data');
      setTrends(defaultTrends);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverstayData = async () => {
    try {
      const response = await api.get('/dashboard/overstay-monitoring');
      setOverstayData(response.data.data || { 
        summary: { overstayedCount: 0, expiringSoonCount: 0 },
        overstayed: [],
        expiringSoon: []
      });
    } catch (error) {
      console.error('Error fetching overstay data:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  // ==================== STAT CARDS CONFIGURATION ====================
  // Subtle, softer colors for icons
  const statCards = [
    { 
      title: 'Total Citizens', 
      value: stats.totalCitizens, 
      color: '#4a90d9', 
      icon: <People sx={{ fontSize: 22, color: '#4a90d9' }} />,
      bg: 'rgba(74, 144, 217, 0.08)',
      trend: '+12%',
      trendColor: '#22c55e',
    },
    { 
      title: 'Active', 
      value: stats.activeCitizens, 
      color: '#34a853', 
      icon: <CheckCircle sx={{ fontSize: 22, color: '#34a853' }} />,
      bg: 'rgba(52, 168, 83, 0.08)',
      trend: '+5%',
      trendColor: '#22c55e',
    },
    { 
      title: 'Checked In', 
      value: stats.checkedIn, 
      color: '#f9a825', 
      icon: <Login sx={{ fontSize: 22, color: '#f9a825' }} />,
      bg: 'rgba(249, 168, 37, 0.08)',
      trend: '+8%',
      trendColor: '#22c55e',
    },
    { 
      title: 'Checked Out', 
      value: stats.checkedOut || 0, 
      color: '#78909c', 
      icon: <Logout sx={{ fontSize: 22, color: '#78909c' }} />,
      bg: 'rgba(120, 144, 156, 0.08)',
      trend: '+3%',
      trendColor: '#22c55e',
    },
    { 
      title: 'Overstayed', 
      value: stats.overstayed, 
      color: '#e53935', 
      icon: <ErrorIcon sx={{ fontSize: 22, color: '#e53935' }} />,
      bg: 'rgba(229, 57, 53, 0.08)',
      trend: '-2%',
      trendColor: '#ef4444',
    },
    { 
      title: 'High Risk', 
      value: stats.highRisk || 0, 
      color: '#e53935', 
      icon: <Warning sx={{ fontSize: 22, color: '#e53935' }} />,
      bg: 'rgba(229, 57, 53, 0.08)',
      trend: '+3%',
      trendColor: '#ef4444',
    },
    { 
      title: 'Pending Alerts', 
      value: stats.pendingAlerts || 0, 
      color: '#7c3aed', 
      icon: <NotificationsActive sx={{ fontSize: 22, color: '#7c3aed' }} />,
      bg: 'rgba(124, 58, 237, 0.08)',
      trend: stats.pendingAlerts > 0 ? '⚠️ Urgent' : '✓ All clear',
      trendColor: stats.pendingAlerts > 0 ? '#ef4444' : '#22c55e',
    },
    { 
      title: 'Accommodations', 
      value: stats.totalAccommodations || 0, 
      color: '#00897b', 
      icon: <Hotel sx={{ fontSize: 22, color: '#00897b' }} />,
      bg: 'rgba(0, 137, 123, 0.08)',
      trend: '+4%',
      trendColor: '#22c55e',
    },
  ];

  // ==================== COLORS FOR CHARTS ====================
  const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f472b6'];

  return (
    <Box sx={{ p: 3, maxWidth: '100%' }}>
      {/* ==================== HEADER - WITH COLORED BACKGROUND ==================== */}
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 3,
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(25, 118, 210, 0.25)',
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          gap: 2,
        }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
              Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              Welcome back, {user?.fullName || 'User'}! Here's what's happening today.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchDashboardData}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none',
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)',
                },
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* ==================== OVERSTAY MONITORING BANNER ==================== */}
      {(overstayData.overstayed.length > 0 || overstayData.expiringSoon.length > 0) && (
        <Paper sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 2,
          border: '1px solid #fef3c7',
          bgcolor: '#fffbeb',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Warning sx={{ color: '#f59e0b' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#92400e' }}>
                Overstay Monitoring
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  bgcolor: '#ef4444' 
                }} />
                <Typography variant="body2" sx={{ color: '#92400e' }}>
                  <strong>{overstayData.summary.overstayedCount || 0}</strong> Overstayed
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  bgcolor: '#f59e0b' 
                }} />
                <Typography variant="body2" sx={{ color: '#92400e' }}>
                  <strong>{overstayData.summary.expiringSoonCount || 0}</strong> Expiring Soon (≤7 days)
                </Typography>
              </Box>
            </Box>
            <Button size="small" onClick={() => navigate('/overstay')} sx={{ color: '#92400e' }}>
              View All →
            </Button>
          </Box>
        </Paper>
      )}

      {/* ==================== STATS CARDS ==================== */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {statCards.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              border: '1px solid #f3f4f6',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
              },
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" sx={{ 
                      color: '#6b7280', 
                      fontWeight: 500, 
                      fontSize: '0.65rem', 
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}>
                      {item.title}
                    </Typography>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 700, 
                      color: '#111827',
                      mt: 0.5,
                      fontSize: '1.75rem',
                    }}>
                      {item.value}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={item.trend}
                        size="small"
                        sx={{ 
                          height: 20, 
                          fontSize: '0.6rem',
                          fontWeight: 600,
                          bgcolor: item.trendColor === '#22c55e' ? '#dcfce7' : '#fee2e2',
                          color: item.trendColor,
                        }}
                      />
                      <Typography variant="caption" color="#6b7280">
                        vs last month
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ 
                    width: 42, 
                    height: 42, 
                    borderRadius: 2,
                    bgcolor: item.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {item.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ==================== CHARTS SECTION ==================== */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        {/* Activity Trends Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            border: '1px solid #f3f4f6',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                  Activity Trends
                </Typography>
                <Typography variant="caption" color="#6b7280">
                  Monthly overview of registrations and check-ins
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 3, bgcolor: '#1976d2', borderRadius: 2 }} />
                  <Typography variant="caption" color="#6b7280">Registrations</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 3, bgcolor: '#22c55e', borderRadius: 2 }} />
                  <Typography variant="caption" color="#6b7280">Check-Ins</Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ height: 280, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1976d2" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#1976d2" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCheckins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      borderRadius: 8, 
                      border: '1px solid #f3f4f6',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="entries" 
                    name="Registrations"
                    stroke="#1976d2" 
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorEntries)"
                    dot={{ r: 3, fill: '#1976d2' }}
                    activeDot={{ r: 6 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="checkins" 
                    name="Check-Ins"
                    stroke="#22c55e" 
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCheckins)"
                    dot={{ r: 3, fill: '#22c55e' }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Status Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            border: '1px solid #f3f4f6',
            height: '100%',
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 2 }}>
              Status Distribution
            </Typography>
            <Box sx={{ height: 260, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                    fontSize={10}
                    fontWeight={500}
                  >
                    {distribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      borderRadius: 8, 
                      border: '1px solid #f3f4f6',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', color: '#6b7280' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ==================== RECENT ACTIVITY ==================== */}
      <Grid container spacing={3}>
        {/* Recent Registrations */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            border: '1px solid #f3f4f6',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                  Recent Registrations
                </Typography>
                <Typography variant="caption" color="#6b7280">
                  Latest citizens added to the system
                </Typography>
              </Box>
              <Button 
                size="small" 
                endIcon={<ArrowForward />}
                onClick={() => navigate('/citizens')}
                sx={{ textTransform: 'none', fontWeight: 500 }}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Passport</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Nationality</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentCitizens.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#6b7280' }}>
                        No recent registrations
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentCitizens.map((citizen) => (
                      <TableRow 
                        key={citizen._id} 
                        hover 
                        onClick={() => navigate(`/citizens/${citizen._id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ 
                              width: 32, 
                              height: 32, 
                              bgcolor: '#1976d2', 
                              fontSize: '0.7rem',
                              fontWeight: 600,
                            }}>
                              {citizen.fullName?.charAt(0) || 'U'}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {citizen.fullName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{citizen.passportNumber}</TableCell>
                        <TableCell>{citizen.nationality}</TableCell>
                        <TableCell>
                          <Chip 
                            label={citizen.status || 'Active'} 
                            color={citizen.status === 'active' ? 'success' : 'warning'} 
                            size="small" 
                            sx={{ height: 22, fontSize: '0.6rem' }} 
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Check-Ins */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            border: '1px solid #f3f4f6',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                  Recent Check-Ins
                </Typography>
                <Typography variant="caption" color="#6b7280">
                  Latest accommodation check-ins
                </Typography>
              </Box>
              <Button 
                size="small" 
                endIcon={<ArrowForward />}
                onClick={() => navigate('/check-in')}
                sx={{ textTransform: 'none', fontWeight: 500 }}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Citizen</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Accommodation</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6b7280' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentCheckIns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#6b7280' }}>
                        No recent check-ins
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentCheckIns.map((checkIn) => (
                      <TableRow 
                        key={checkIn._id} 
                        hover
                        onClick={() => navigate(`/citizens/${checkIn.citizen?._id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ 
                              width: 32, 
                              height: 32, 
                              bgcolor: '#22c55e', 
                              fontSize: '0.7rem',
                              fontWeight: 600,
                            }}>
                              {checkIn.citizen?.fullName?.charAt(0) || '?'}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {checkIn.citizen?.fullName || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Hotel sx={{ fontSize: 14, color: '#6b7280' }} />
                            {checkIn.accommodation?.name || 'N/A'}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {checkIn.checkInDate ? format(new Date(checkIn.checkInDate), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={checkIn.status || 'Active'} 
                            color={checkIn.status === 'active' ? 'success' : 'default'} 
                            size="small" 
                            sx={{ height: 22, fontSize: '0.6rem' }} 
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;