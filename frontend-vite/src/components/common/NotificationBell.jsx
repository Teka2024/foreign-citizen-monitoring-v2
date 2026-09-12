import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  NotificationsOff,  // ✅ ADDED
  CheckCircle,
  Warning,
  Info,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/alerts', {
        params: { status: 'new,acknowledged', limit: 10 }
      });
      const data = response.data.data || [];
      setAlerts(data);
      setUnreadCount(data.filter(a => a.status === 'new').length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchAlerts();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAlertClick = (alert) => {
    handleClose();
    navigate('/alerts');
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      await api.put(`/alerts/${alertId}`, { status: 'acknowledged' });
      fetchAlerts();
      toast.success('Alert acknowledged');
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <ErrorIcon fontSize="small" color="error" />;
      case 'high': return <Warning fontSize="small" color="warning" />;
      case 'medium': return <Info fontSize="small" color="info" />;
      default: return <CheckCircle fontSize="small" color="success" />;
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60));
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error" max={99}>
          {unreadCount > 0 ? <NotificationsActive /> : <Notifications />}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 380, maxHeight: 480 },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Chip label={`${unreadCount} new`} color="error" size="small" />
          )}
        </Box>
        <Divider />

        {loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress size={30} />
          </Box>
        ) : alerts.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsOff sx={{ fontSize: 40, color: 'grey.400' }} />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              No notifications
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {alerts.map((alert) => (
              <ListItem
                key={alert._id}
                sx={{
                  bgcolor: alert.status === 'new' ? 'error.light' : 'transparent',
                  '&:hover': { bgcolor: 'grey.100' },
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                }}
                onClick={() => handleAlertClick(alert)}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getSeverityIcon(alert.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" noWrap>
                      {alert.message}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={alert.type}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '10px' }}
                      />
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(alert.createdAt)}
                      </Typography>
                    </Box>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
                {alert.status === 'new' && (
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(alert._id);
                    }}
                    sx={{ ml: 1 }}
                  >
                    Mark Read
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        )}

        <Divider />
        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            size="small"
            onClick={() => { handleClose(); navigate('/alerts'); }}
          >
            View All Alerts
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationBell;