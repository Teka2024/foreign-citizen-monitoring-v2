export const ROLES = {
  ADMIN: 'admin',
  OFFICER: 'officer',
  VIEWER: 'viewer',
};

export const DEPARTMENTS = {
  IMMIGRATION: 'immigration',
  SECURITY: 'security',
  ADMINISTRATION: 'administration',
  INTELLIGENCE: 'intelligence',
};

export const CITIZEN_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  OVERSTAYED: 'overstayed',
  DEPORTED: 'deported',
  EXITED: 'exited',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
};

export const VISA_TYPES = {
  TOURIST: 'tourist',
  BUSINESS: 'business',
  STUDENT: 'student',
  WORK: 'work',
  DIPLOMATIC: 'diplomatic',
  TRANSIT: 'transit',
  RESIDENT: 'resident',
};

export const ACCOMMODATION_TYPES = {
  HOTEL: 'hotel',
  APARTMENT: 'apartment',
  HOUSE: 'house',
  HOSTEL: 'hostel',
  GUEST_HOUSE: 'guest_house',
  PRIVATE_RESIDENCE: 'private_residence',
  OTHER: 'other',
};

export const ALERT_TYPES = {
  OVERSTAY: 'overstay',
  RISK: 'risk',
  VISA_EXPIRING: 'visa_expiring',
  BEHAVIORAL: 'behavioral',
  SECURITY: 'security',
  ACCOMMODATION: 'accommodation',
};

export const ALERT_SEVERITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const ALERT_STATUS = {
  NEW: 'new',
  ACKNOWLEDGED: 'acknowledged',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
};

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
};

export const ACCOMMODATION_PURPOSE = {
  TOURISM: 'tourism',
  BUSINESS: 'business',
  EDUCATION: 'education',
  MEDICAL: 'medical',
  FAMILY_VISIT: 'family_visit',
  OTHER: 'other',
};

// Status options for select dropdowns
export const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'overstayed', label: 'Overstayed' },
  { value: 'deported', label: 'Deported' },
  { value: 'exited', label: 'Exited' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
];

export const visaTypeOptions = [
  { value: 'tourist', label: 'Tourist' },
  { value: 'business', label: 'Business' },
  { value: 'student', label: 'Student' },
  { value: 'work', label: 'Work' },
  { value: 'diplomatic', label: 'Diplomatic' },
  { value: 'transit', label: 'Transit' },
  { value: 'resident', label: 'Resident' },
];

export const accommodationTypeOptions = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'guest_house', label: 'Guest House' },
  { value: 'private_residence', label: 'Private Residence' },
  { value: 'other', label: 'Other' },
];

export const alertSeverityOptions = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'info' },
  { value: 'high', label: 'High', color: 'warning' },
  { value: 'critical', label: 'Critical', color: 'error' },
];

export const alertStatusOptions = [
  { value: 'new', label: 'New' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
];

export const riskLevelOptions = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'info' },
  { value: 'high', label: 'High', color: 'warning' },
  { value: 'critical', label: 'Critical', color: 'error' },
];

export const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const purposeOptions = [
  { value: 'tourism', label: 'Tourism' },
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' },
  { value: 'medical', label: 'Medical' },
  { value: 'family_visit', label: 'Family Visit' },
  { value: 'other', label: 'Other' },
];

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  CITIZENS: {
    BASE: '/citizens',
    STATS: '/citizens/dashboard-stats',
    SEARCH: '/citizens/search',
    NOTES: '/citizens/:id/notes',
    ACCOMMODATION_HISTORY: '/citizens/:id/accommodation-history',
  },
  ACCOMMODATIONS: {
    BASE: '/accommodations',
    CHECK_IN: '/accommodations/check-in',
    CHECK_OUT: '/accommodations/check-out',
    HISTORY: '/accommodations/history/:citizenId',
  },
  ALERTS: {
    BASE: '/alerts',
    STATS: '/alerts/stats',
    CITIZEN: '/alerts/citizen/:citizenId',
  },
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  TIME: 'HH:mm',
  DAY_MONTH: 'MMM dd',
};