import { format, parseISO, differenceInDays, differenceInHours, formatDistanceToNow } from 'date-fns';

/**
 * Format date to string
 */
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return 'N/A';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, formatStr);
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Format date with time
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

/**
 * Get time ago string
 */
export const timeAgo = (date) => {
  if (!date) return 'N/A';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (date1, date2) => {
  if (!date1 || !date2) return 0;
  try {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    return differenceInDays(d2, d1);
  } catch (error) {
    return 0;
  }
};

/**
 * Check if date is in the past
 */
export const isPastDate = (date) => {
  if (!date) return false;
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return parsedDate < new Date();
  } catch (error) {
    return false;
  }
};

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return 'N/A';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{1,3})(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  return phone;
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitalize first letter
 */
export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Title case
 */
export const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Generate random color
 */
export const randomColor = () => {
  const colors = [
    '#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0',
    '#0288d1', '#388e3c', '#f57c00', '#c62828', '#6a1b9a',
    '#00695c', '#4527a0', '#bf360c', '#4a148c', '#1a237e',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Get status color for MUI components
 */
export const getStatusColor = (status) => {
  const colors = {
    active: 'success',
    inactive: 'error',
    pending: 'warning',
    completed: 'info',
    cancelled: 'error',
    overstayed: 'warning',
    exited: 'info',
    expired: 'error',
    deported: 'error',
    suspended: 'warning',
    'checked_in': 'success',
    'checked_out': 'info',
    'under_maintenance': 'warning',
  };
  return colors[status] || 'default';
};

/**
 * Get risk level color
 */
export const getRiskColor = (level) => {
  const colors = {
    low: 'success',
    medium: 'info',
    high: 'warning',
    critical: 'error',
  };
  return colors[level] || 'default';
};

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return regex.test(email);
};

/**
 * Validate phone
 */
export const isValidPhone = (phone) => {
  const regex = /^\+?[\d\s-]{8,20}$/;
  return regex.test(phone);
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Debounce function
 */
export const debounce = (func, delay = 500) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Export to CSV
 */
export const exportToCSV = (data, headers, filename = 'export.csv') => {
  const rows = data.map(item => headers.map(header => item[header.key] || ''));
  const csvContent = [headers.map(h => h.label).join(','), ...rows.map(row => row.join(','))].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download file from URL
 */
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj) => {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === 'string') return obj.trim() === '';
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};