import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  useTheme,
  useMediaQuery,
  Collapse,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Hotel,
  CheckCircle,
  Cancel,
  NotificationsActive,
  Assessment,
  Person,
  ExitToApp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Warning,
  PersonAdd,
  History,
  ExpandLess,
  ExpandMore,
  AdminPanelSettings,
  Logout,
  Login,
  SwapHoriz,       // ✅ ADDED
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

const Layout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [expandedMenus, setExpandedMenus] = useState({
    citizens: true,
  });

  const isAdmin = user?.role === 'admin';
  const isOfficer = user?.role === 'officer';
  const isOfficerOrAdmin = isAdmin || isOfficer;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const toggleMenu = (menu) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const isExactActive = (path) => {
    return location.pathname === path;
  };

  const isChildActive = (paths) => {
    return paths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));
  };

  // Build menu items
  const menuItems = [];

  // Dashboard
  menuItems.push({
    type: 'item',
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
  });

  // Citizens Submenu
  const citizenSubItems = [];
  citizenSubItems.push({
    text: 'All Citizens',
    icon: <People />,
    path: '/citizens',
  });
  if (isOfficerOrAdmin) {
    citizenSubItems.push({
      text: 'Add Citizen',
      icon: <PersonAdd />,
      path: '/citizens/add',
    });
  }
  if (isOfficerOrAdmin) {
    citizenSubItems.push({
      text: 'Check-In',
      icon: <Login />,
      path: '/check-in',
    });
  }
  if (isOfficerOrAdmin) {
    citizenSubItems.push({
      text: 'Check-Out',
      icon: <Logout />,
      path: '/check-out',
    });
  }
  
  if (isOfficerOrAdmin) {
    citizenSubItems.push({
      text: 'History',
      icon: <History />,
      path: '/checkin-history',
    });
  }

  menuItems.push({
    type: 'submenu',
    text: 'Citizens',
    icon: <People />,
    key: 'citizens',
    subItems: citizenSubItems,
  });

  // Accommodations
  menuItems.push({
    type: 'item',
    text: 'Accommodations',
    icon: <Hotel />,
    path: '/accommodations',
  });

  // ✅ Transfer Requests (Incoming/Outgoing) - Admin/Officer only
  if (isOfficerOrAdmin) {
    menuItems.push({
      type: 'item',
      text: 'Transfer Requests',  // ✅ ADDED
      icon: <SwapHoriz />,
      path: '/transfers',
    });
  }

  // Overstay (Admin/Officer only)
  if (isOfficerOrAdmin) {
    menuItems.push({
      type: 'item',
      text: 'Overstay',
      icon: <Warning />,
      path: '/overstay',
    });
  }

  // Alerts
  menuItems.push({
    type: 'item',
    text: 'Alerts',
    icon: <NotificationsActive />,
    path: '/alerts',
  });

  // Reports
  menuItems.push({
    type: 'item',
    text: 'Reports',
    icon: <Assessment />,
    path: '/reports',
  });

  // ✅ Users - Only for Admin
  if (isAdmin) {
    menuItems.push({
      type: 'item',
      text: 'Users',
      icon: <AdminPanelSettings />,
      path: '/users',
    });
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: 'primary.main' }}>
              ICS-FCMS
            </Typography>
            <Chip
              label={user?.role || 'Viewer'}
              size="small"
              color={isAdmin ? 'error' : isOfficer ? 'warning' : 'info'}
              sx={{ height: 20, fontSize: '0.55rem' }}
            />
          </Box>
        )}
        <IconButton onClick={() => setCollapsed(!collapsed)} size="small">
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Toolbar>
      <Divider />

      {/* Menu Items */}
      <List sx={{ flex: 1, px: 1, overflowY: 'auto', py: 1 }}>
        {menuItems.map((item) => {
          if (item.type === 'submenu') {
            const isSubmenuActive = isChildActive(item.subItems.map(sub => sub.path));
            const isExpanded = expandedMenus[item.key] !== undefined ? expandedMenus[item.key] : true;

            return (
              <React.Fragment key={item.key}>
                <ListItem
                  button
                  onClick={() => toggleMenu(item.key)}
                  selected={isSubmenuActive}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    minHeight: 44,
                    px: 1.5,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': { backgroundColor: 'primary.dark' },
                      '& .MuiListItemIcon-root': { color: 'white' },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 2,
                      justifyContent: 'center',
                      color: isSubmenuActive ? 'inherit' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: isSubmenuActive ? 600 : 400,
                        }}
                      />
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </>
                  )}
                </ListItem>
                {!collapsed && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 2 }}>
                      {item.subItems.map((subItem) => (
                        <ListItem
                          button
                          key={subItem.text}
                          onClick={() => handleNavigate(subItem.path)}
                          selected={isExactActive(subItem.path)}
                          sx={{
                            borderRadius: 1,
                            mb: 0.25,
                            minHeight: 36,
                            pl: 2,
                            '&.Mui-selected': {
                              backgroundColor: 'primary.light',
                              color: 'primary.main',
                              '& .MuiListItemIcon-root': { color: 'primary.main' },
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 0,
                              mr: 1.5,
                              justifyContent: 'center',
                              color: isExactActive(subItem.path) ? 'primary.main' : 'inherit',
                            }}
                          >
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={subItem.text}
                            primaryTypographyProps={{
                              fontSize: '0.8125rem',
                              fontWeight: isExactActive(subItem.path) ? 600 : 400,
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            );
          }

          // Regular menu item
          return (
            <ListItem
              button
              key={item.text}
              onClick={() => handleNavigate(item.path)}
              selected={isExactActive(item.path)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                minHeight: 44,
                px: 1.5,
                justifyContent: collapsed ? 'center' : 'initial',
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': { backgroundColor: 'primary.dark' },
                  '& .MuiListItemIcon-root': { color: 'white' },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: collapsed ? 0 : 2,
                  justifyContent: 'center',
                  color: isExactActive(item.path) ? 'inherit' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isExactActive(item.path) ? 600 : 400,
                  }}
                />
              )}
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* Bottom: Only Logout */}
      <List sx={{ px: 1, pb: 1 }}>
        <ListItem
          button
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            minHeight: 44,
            px: 1.5,
            justifyContent: collapsed ? 'center' : 'initial',
            color: 'error.main',
            '&:hover': { backgroundColor: 'error.light' },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: collapsed ? 0 : 2,
              justifyContent: 'center',
              color: 'error.main',
            }}
          >
            <ExitToApp />
          </ListItemIcon>
          {!collapsed && <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.875rem' }} />}
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: '#ffffff',
          color: '#333333',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          width: { sm: `calc(100% - ${collapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          ml: { sm: `${collapsed ? collapsedDrawerWidth : drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {menuItems.find(item => {
              if (item.type === 'submenu') {
                return isChildActive(item.subItems.map(sub => sub.path));
              }
              return isExactActive(item.path);
            })?.text || 'Dashboard'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationBell />

            <Tooltip title="Profile">
              <IconButton onClick={handleMenuOpen} size="small">
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                  {user?.fullName?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem disabled>
                <Box>
                  <Typography variant="subtitle2">{user?.fullName}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {user?.role} • {user?.department || 'No department'}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon><ExitToApp fontSize="small" color="error" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{
          width: { sm: collapsed ? collapsedDrawerWidth : drawerWidth },
          flexShrink: { sm: 0 },
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: collapsed ? collapsedDrawerWidth : drawerWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
              borderRight: '1px solid #e0e0e0',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          minHeight: '100vh',
          backgroundColor: '#f5f7fa',
          width: { sm: `calc(100% - ${collapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar sx={{ minHeight: 64 }} />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;