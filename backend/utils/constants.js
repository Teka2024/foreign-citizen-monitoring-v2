/**
 * System constants
 */
module.exports = {
  // User roles
  USER_ROLES: {
    ADMIN: 'admin',
    OFFICER: 'officer',
    VIEWER: 'viewer'
  },

  // User departments
  DEPARTMENTS: {
    IMMIGRATION: 'immigration',
    SECURITY: 'security',
    ADMINISTRATION: 'administration',
    INTELLIGENCE: 'intelligence'
  },

  // Citizen statuses
  CITIZEN_STATUS: {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    OVERSTAYED: 'overstayed',
    DEPORTED: 'deported',
    EXITED: 'exited',
    PENDING: 'pending',
    SUSPENDED: 'suspended'
  },

  // Visa types
  VISA_TYPES: {
    TOURIST: 'tourist',
    BUSINESS: 'business',
    STUDENT: 'student',
    WORK: 'work',
    DIPLOMATIC: 'diplomatic',
    TRANSIT: 'transit',
    RESIDENT: 'resident'
  },

  // Accommodation types
  ACCOMMODATION_TYPES: {
    HOTEL: 'hotel',
    APARTMENT: 'apartment',
    HOUSE: 'house',
    HOSTEL: 'hostel',
    GUEST_HOUSE: 'guest_house',
    PRIVATE_RESIDENCE: 'private_residence',
    OTHER: 'other'
  },

  // Alert types
  ALERT_TYPES: {
    OVERSTAY: 'overstay',
    RISK: 'risk',
    VISA_EXPIRING: 'visa_expiring',
    BEHAVIORAL: 'behavioral',
    SECURITY: 'security',
    ACCOMMODATION: 'accommodation'
  },

  // Alert severities
  ALERT_SEVERITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },

  // Alert statuses
  ALERT_STATUS: {
    NEW: 'new',
    ACKNOWLEDGED: 'acknowledged',
    INVESTIGATING: 'investigating',
    RESOLVED: 'resolved'
  },

  // Risk levels
  RISK_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },

  // High risk countries (example)
  HIGH_RISK_COUNTRIES: [
    'afghanistan',
    'syria',
    'iraq',
    'yemen',
    'somalia',
    'north korea'
  ],

  // Visa expiry warning days
  VISA_WARNING_DAYS: 30,

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  }
};