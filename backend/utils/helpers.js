/**
 * Helper functions
 */

/**
 * Generate a random string
 */
exports.generateRandomString = (length = 10) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Format date to string
 */
exports.formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * Calculate days between two dates
 */
exports.daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if date is in the past
 */
exports.isPastDate = (date) => {
  return new Date(date) < new Date();
};

/**
 * Sanitize object (remove empty/null/undefined values)
 */
exports.sanitizeObject = (obj) => {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        result[key] = exports.sanitizeObject(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
};

/**
 * Paginate results
 */
exports.paginate = (data, page, limit) => {
  const start = (page - 1) * limit;
  const end = page * limit;
  const paginatedData = data.slice(start, end);
  
  return {
    data: paginatedData,
    page,
    limit,
    total: data.length,
    totalPages: Math.ceil(data.length / limit)
  };
};

/**
 * Extract error messages from validation errors
 */
exports.extractValidationErrors = (errors) => {
  return errors.array().map(err => ({
    field: err.param,
    message: err.msg
  }));
};

/**
 * Mask sensitive data
 */
exports.maskSensitiveData = (data, fields = ['password', 'token', 'secret']) => {
  if (typeof data !== 'object' || data === null) return data;
  
  const masked = { ...data };
  for (const field of fields) {
    if (masked[field]) {
      masked[field] = '********';
    }
  }
  return masked;
};

/**
 * Check if string is valid email
 */
exports.isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Check if string is valid phone number
 */
exports.isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{8,20}$/;
  return phoneRegex.test(phone);
};