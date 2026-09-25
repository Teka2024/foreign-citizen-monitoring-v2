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
  Chip,
  Button,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  People,
  Hotel,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  TrendingUp,
  NotificationsActive,
  Login,
  Logout,
  Refresh,
  ArrowForward,
  Assessment,
  TrendingDown,
  Today,
  CalendarMonth,
  CalendarToday,
} from '@mui/icons-material';
import {
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
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// ==================== MODERN COLOR PALETTE ====================
const palette = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  success: '#10b981',
  successLight: '#34d399',
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  danger: '#ef4444',
  dangerLight: '#f87171',
  info: '#06b6d4',
  infoLight: '#22d3ee',
  purple: '#8b5cf6',
  purpleLight: '#a78bfa',
  pink: '#ec4899',
  teal: '#14b8a6',
  slate: '#64748b',
  dark: '#0f172a',
  gray: '#94a3b8',
  lightGray: '#f1f5f9',
};

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
  const [trends, setTrends] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [overstayData, setOverstayData] = useState({
    summary: { overstayedCount: 0, expiringSoonCount: 0 },
    overstayed: [],
    expiringSoon: []
  });

  // Activity Overview state
  const [activityPeriod, setActivityPeriod] = useState('monthly');
  const [activityData, setActivityData] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const isOfficer = user?.role === 'officer' || user?.role === 'admin';

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
    fetchActivityData(activityPeriod);
    if (isOfficer) {
      fetchOverstayData();
    }
  }, []);

  useEffect(() => {
    fetchActivityData(activityPeriod);
  }, [activityPeriod]);

  const fetchActivityData = async (period) => {
    setActivityLoading(true);
    try {
      const res = await api.get(`/dashboard/activity-trends?period=${period}`);
      setActivityData(res.data.data || []);
    } catch (err) {
      console.error('Error fetching activity data:', err);
      setActivityData([]);
    } finally {
      setActivityLoading(false);
    }
  };

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
        const trendsRes = await api.get('/dashboard/trends');
        const rawData = trendsRes.data.data || trendsRes.data || [];
        setTrends(rawData.length > 0 ? rawData : defaultTrends);
      } catch {
        setTrends(defaultTrends);
      }

      try {
        const distRes = await api.get('/dashboard/distribution');
        const distData = distRes.data.data || distRes.data || [];
        setDistribution(distData.length > 0 ? distData : [{ name: 'Active', value: 1, color: palette.success }]);
      } catch {
        setDistribution([{ name: 'Active', value: 1, color: palette.success }]);
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
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <LinearProgress sx={{
            height: 6, borderRadius: 3,
            bgcolor: palette.lightGray,
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              background: `linear-gradient(90deg, ${palette.primary}, ${palette.purple})`,
            }
          }} />
          <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: palette.slate, fontWeight: 500 }}>
            Loading dashboard data...
          </Typography>
        </Box>
      </Box>
    );
  }

  const statCards = [
    { title: 'Total Citizens', value: stats.totalCitizens, icon: <People sx={{ fontSize: 24 }} />,
      gradient: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryLight} 100%)`,
      iconColor: palette.primary, trend: '+12%', trendUp: true },
    { title: 'Active', value: stats.activeCitizens, icon: <CheckCircle sx={{ fontSize: 24 }} />,
      gradient: `linear-gradient(135deg, ${palette.success} 0%, ${palette.successLight} 100%)`,
      iconColor: palette.success, trend: '+5%', trendUp: true },
    { title: 'Checked In', value: stats.checkedIn, icon: <Login sx={{ fontSize: 24 }} />,
      gradient: `linear-gradient(135deg, ${palette.warning} 0%, ${palette.warningLight} 100%)`,
      iconColor: palette.warning, trend: '+8%', trendUp: true },
    { title: 'Checked Out', value: stats.checkedOut || 0, icon: <Logout sx={{ fontSize: 24 }} />,
      gradient: `linear-gradient(135deg, ${palette.slate} 0%, ${palette.gray} 100%)`,
      iconColor: palette.slate, trend: '+3%', trendUp: true },
    { title: 'Overstayed', value: stats.overstayed, icon: <ErrorIcon sx={{ fontSize: 24 }} />,
      gradient: `linear-gradient(135deg, ${palette.danger} 0%, ${palette.dangerLight} 100%)`,
      iconColor: palette.danger, trend: '-2%', trendUp: false },
    { title: 'High Risk', value: stats.highRisk || 0, icon: <Warning sx={{ fontSize: 24 }} />,
      gradient: `linear-gradient(135deg, ${palette.danger} 0%, ${palette.pink} 100%)`,
      iconColor: palette.danger, trend: '+3%', trendUp: false },
    { title: 'New Alerts', value: stats.pendingAlerts || 0, icon: <NotificationsActive sx={{ fontSize: 24 }} />,
      gradient: `linear-gradient(135deg, ${palette.purple} 0%, ${palette.purpleLight} 100%)`,
      iconColor: palette.purple,
      trend: stats.pendingAlerts > 0 ? '⚠️ Urgent' : '✓ All clear',
      trendUp: stats.pendingAlerts === 0 },
    { title: 'Accommodations', value: stats.totalAccommodations || 0, icon: <Hotel sx={{ fontSize: 24 }} />,
      gradient: `linear-gradient(135deg, ${palette.teal} 0%, ${palette.infoLight} 100%)`,
      iconColor: palette.teal, trend: '+4%', trendUp: true },
  ];

  const COLORS = [palette.success, palette.warning, palette.danger, palette.purple, palette.info, palette.pink];

  const activityTotals = activityData.reduce(
    (acc, row) => ({
      registrations: acc.registrations + (row.registrations || 0),
      checkins: acc.checkins + (row.checkins || 0),
      checkouts: acc.checkouts + (row.checkouts || 0),
    }),
    { registrations: 0, checkins: 0, checkouts: 0 }
  );

  return (
    <Box sx={{ p: 3, maxWidth: '100%', bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* ==================== HEADER ==================== */}
      <Paper sx={{
        p: 3.5, mb: 3.5, borderRadius: 4,
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
        color: 'white',
        boxShadow: '0 8px 32px rgba(25, 118, 210, 0.30)',
        position: 'relative', overflow: 'hidden',
        '&::before': {
          content: '""', position: 'absolute',
          top: -60, right: -60, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
        },
        '&::after': {
          content: '""', position: 'absolute',
          bottom: -80, right: 120, width: 160, height: 160,
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
        },
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(10px)', flexShrink: 0,
            }}>
              <Assessment sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
                Dashboard
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
                Welcome back, {user?.fullName || 'User'}! Here's what's happening today.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchDashboardData}
            sx={{
              borderRadius: 3, textTransform: 'none', fontWeight: 700, px: 3, py: 1,
              bgcolor: 'rgba(255,255,255,0.15)', color: 'white',
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
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* ==================== OVERSTAY MONITORING BANNER ==================== */}
      {(overstayData.overstayed.length > 0 || overstayData.expiringSoon.length > 0) && (
        <Paper sx={{
          p: 2.5, mb: 3.5, borderRadius: 3,
          border: `1px solid ${palette.warning}30`,
          bgcolor: `${palette.warning}08`,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2,
                bgcolor: `${palette.warning}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Warning sx={{ color: palette.warning, fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#92400e' }}>Overstay Monitoring</Typography>
                <Typography variant="caption" sx={{ color: '#b45309' }}>Requires attention</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, borderRadius: 2, bgcolor: `${palette.danger}10` }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: palette.danger }} />
                <Typography variant="body2" sx={{ color: '#92400e', fontWeight: 500 }}>
                  <strong>{overstayData.summary.overstayedCount || 0}</strong> Overstayed
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, borderRadius: 2, bgcolor: `${palette.warning}10` }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: palette.warning }} />
                <Typography variant="body2" sx={{ color: '#92400e', fontWeight: 500 }}>
                  <strong>{overstayData.summary.expiringSoonCount || 0}</strong> Expiring Soon (≤7 days)
                </Typography>
              </Box>
              <Button size="small" onClick={() => navigate('/overstay')} endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                sx={{ color: '#92400e', fontWeight: 600, textTransform: 'none' }}>
                View All
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* ==================== STATS CARDS ==================== */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {statCards.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card sx={{
              borderRadius: 3, overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: `0 16px 40px ${item.iconColor}15`,
                borderColor: `${item.iconColor}30`,
              },
            }}>
              <CardContent sx={{ p: 2.5, position: 'relative' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{
                      color: palette.slate, fontWeight: 600, fontSize: '0.7rem',
                      letterSpacing: '0.8px', textTransform: 'uppercase',
                    }}>
                      {item.title}
                    </Typography>
                    <Typography variant="h4" sx={{
                      fontWeight: 800, color: palette.dark,
                      mt: 0.8, fontSize: '2rem', letterSpacing: '-1px',
                    }}>
                      {item.value}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Chip
                        label={item.trend}
                        size="small"
                        icon={item.trendUp ? <TrendingUp sx={{ fontSize: 14 }} /> : <TrendingDown sx={{ fontSize: 14 }} />}
                        sx={{
                          height: 24, fontSize: '0.65rem', fontWeight: 700,
                          bgcolor: item.trendUp ? `${palette.success}15` : `${palette.danger}15`,
                          color: item.trendUp ? palette.success : palette.danger,
                          '& .MuiChip-icon': { color: item.trendUp ? palette.success : palette.danger },
                          borderRadius: 2,
                        }}
                      />
                      <Typography variant="caption" sx={{ color: palette.gray, fontWeight: 500 }}>
                        vs last month
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{
                    width: 48, height: 48, borderRadius: 3,
                    background: item.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${item.iconColor}30`,
                    color: 'white',
                  }}>
                    {item.icon}
                  </Box>
                </Box>
                <Box sx={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: 3, background: item.gradient, opacity: 0.6,
                }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ==================== CHARTS ROW ==================== */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: palette.dark, letterSpacing: '-0.3px' }}>
                  Activity Trends
                </Typography>
                <Typography variant="caption" sx={{ color: palette.gray, fontWeight: 500 }}>
                  Monthly overview of registrations and check-ins
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{ width: 12, height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${palette.primary}, ${palette.primaryLight})` }} />
                  <Typography variant="caption" sx={{ color: palette.slate, fontWeight: 500 }}>Registrations</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{ width: 12, height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${palette.success}, ${palette.successLight})` }} />
                  <Typography variant="caption" sx={{ color: palette.slate, fontWeight: 500 }}>Check-Ins</Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ height: 300, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={palette.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCheckins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette.success} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={palette.success} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: palette.gray, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: palette.gray, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                  <Area type="monotone" dataKey="entries" name="Registrations" stroke={palette.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorEntries)" dot={{ r: 4, fill: palette.primary, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                  <Area type="monotone" dataKey="checkins" name="Check-Ins" stroke={palette.success} strokeWidth={3} fillOpacity={1} fill="url(#colorCheckins)" dot={{ r: 4, fill: palette.success, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: palette.dark, mb: 0.5, letterSpacing: '-0.3px' }}>
              Status Distribution
            </Typography>
            <Typography variant="caption" sx={{ color: palette.gray, fontWeight: 500 }}>
              Current citizen status breakdown
            </Typography>
            <Box sx={{ height: 280, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#e2e8f0' }} fontSize={11} fontWeight={600}>
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px', color: palette.slate }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ==================== ACTIVITY OVERVIEW (POLISHED) ==================== */}
      <Paper sx={{
        p: 3,
        borderRadius: 4,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        border: '1px solid #e2e8f0',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${palette.primary}, ${palette.success}, ${palette.slate})`,
          opacity: 0.7,
        },
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: palette.dark, letterSpacing: '-0.3px' }}>
              Activity Overview
            </Typography>
            <Typography variant="caption" sx={{ color: palette.gray, fontWeight: 500 }}>
              Track registrations, check-ins, and check-outs over time
            </Typography>
          </Box>

          <ToggleButtonGroup
            value={activityPeriod}
            exclusive
            onChange={(e, v) => { if (v) setActivityPeriod(v); }}
            size="small"
            sx={{
              bgcolor: '#f8fafc',
              borderRadius: 2,
              p: 0.5,
              border: '1px solid #e2e8f0',
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                px: 2, py: 0.8,
                color: palette.slate,
                gap: 0.8,
                '&.Mui-selected': {
                  bgcolor: 'white',
                  color: palette.primary,
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)',
                  '&:hover': { bgcolor: 'white' },
                },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' },
              },
            }}
          >
            <ToggleButton value="daily">
              <Today sx={{ fontSize: 16 }} />
              Daily
            </ToggleButton>
            <ToggleButton value="monthly">
              <CalendarMonth sx={{ fontSize: 16 }} />
              Monthly
            </ToggleButton>
            <ToggleButton value="yearly">
              <CalendarToday sx={{ fontSize: 16 }} />
              Yearly
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            { label: 'Registrations', value: activityTotals.registrations, color: palette.primary },
            { label: 'Check-Ins', value: activityTotals.checkins, color: palette.success },
            { label: 'Check-Outs', value: activityTotals.checkouts, color: palette.slate },
          ].map((item, i) => (
            <Grid item xs={12} sm={4} key={i}>
              <Box sx={{
                borderRadius: 3,
                border: `1px solid ${item.color}20`,
                bgcolor: `${item.color}05`,
                p: 1.75,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: `${item.color}40`,
                  bgcolor: `${item.color}10`,
                },
              }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                    <Typography variant="caption" sx={{ color: palette.slate, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
                      {item.label}
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: item.color, fontSize: '1.5rem', lineHeight: 1 }}>
                    {item.value}
                  </Typography>
                </Box>
                <Box sx={{
                  width: 36, height: 36, borderRadius: 2,
                  bgcolor: `${item.color}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TrendingUp sx={{ fontSize: 18, color: item.color }} />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ height: 300, width: '100%', position: 'relative' }}>
          {activityLoading && (
            <Box sx={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.7)', zIndex: 10, borderRadius: 2,
            }}>
              <LinearProgress sx={{ width: 200, borderRadius: 2 }} />
            </Box>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activityData}
              margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
              barCategoryGap="25%"
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: palette.gray, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: palette.gray, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ fontSize: '12px', color: palette.slate, fontWeight: 500 }}
              />
              <Bar dataKey="registrations" name="Registrations" fill={palette.primary} radius={[6, 6, 0, 0]} maxBarSize={32} />
              <Bar dataKey="checkins" name="Check-Ins" fill={palette.success} radius={[6, 6, 0, 0]} maxBarSize={32} />
              <Bar dataKey="checkouts" name="Check-Outs" fill={palette.slate} radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;