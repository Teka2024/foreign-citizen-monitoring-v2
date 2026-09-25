import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import Layout from './components/common/Layout';
import PrivateRoute from './components/common/PrivateRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import CitizensList from './pages/CitizensList';
import AddCitizen from './pages/AddCitizen';
import CitizenDetails from './pages/CitizenDetails';
import EditCitizen from './pages/EditCitizen';
import AccommodationsList from './pages/AccommodationsList';
import AccommodationDetails from './pages/AccommodationDetails';
import AddAccommodation from './pages/AddAccommodation';
import CheckIn from './pages/CheckIn';
import CheckOut from './pages/CheckOut';
import CheckInHistory from './pages/CheckInHistory';
import OverstayMonitoring from './pages/OverstayMonitoring';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import TransferCitizen from './pages/TransferCitizen';  // ✅ ADDED
import Transfers from './pages/Transfers';              // ✅ ADDED

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 24px',
          fontWeight: 500,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* ✅ ONLY ONE Router - RIGHT HERE */}
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <Helmet>
            <title>Foreign Citizens Monitoring System</title>
          </Helmet>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />

          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* PROTECTED ROUTES */}
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Citizens */}
              <Route path="citizens" element={<CitizensList />} />
              <Route path="citizens/add" element={<AddCitizen />} />
              <Route path="citizens/:id" element={<CitizenDetails />} />
              <Route path="citizens/:id/edit" element={<EditCitizen />} />

              {/* Accommodations */}
              <Route path="accommodations" element={<AccommodationsList />} />
              <Route path="accommodations/:id" element={<AccommodationDetails />} />
              <Route path="accommodations/add" element={<AddAccommodation />} />

              {/* Check-In / Check-Out */}
              <Route path="check-in" element={<CheckIn />} />
              <Route path="check-out" element={<CheckOut />} />
              <Route path="checkin-history" element={<CheckInHistory />} />

              {/* Transfers */}
              <Route path="transfer" element={<TransferCitizen />} />  {/* ✅ ADDED */}
              <Route path="transfers" element={<Transfers />} />        {/* ✅ ADDED */}

              {/* Overstay */}
              <Route path="overstay" element={<OverstayMonitoring />} />

              {/* Alerts & Reports */}
              <Route path="alerts" element={<Alerts />} />
              <Route path="reports" element={<Reports />} />
              <Route path="profile" element={<Profile />} />

              {/* Users (Admin Only) */}
              <Route path="users" element={<UserManagement />} />
            </Route>

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;