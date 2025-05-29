// Validation rules
export const validationRules = {
  name: {
    minLength: 20,
    maxLength: 60,
    validate: (value) => {
      if (value.length < 20 || value.length > 60) {
        return 'Name must be between 20 and 60 characters';
      }
      return '';
    }
  },
  address: {
    maxLength: 400,
    validate: (value) => {
      if (value.length > 400) {
        return 'Address must not exceed 400 characters';
      }
      return '';
    }
  },
  password: {
    minLength: 8,
    maxLength: 16,
    validate: (value) => {
      if (value.length < 8 || value.length > 16) {
        return 'Password must be between 8 and 16 characters';
      }
      if (!/[A-Z]/.test(value)) {
        return 'Password must include at least one uppercase letter';
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        return 'Password must include at least one special character';
      }
      return '';
    }
  },
  email: {
    validate: (value) => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
      return '';
    }
  }
};

// Helper function to validate a field
export const validateField = (fieldName, value) => {
  const rule = validationRules[fieldName];
  if (!rule) return '';
  return rule.validate(value);
};

// Helper function to validate all fields in a form
export const validateForm = (formData) => {
  const errors = {};
  Object.keys(formData).forEach(field => {
    const error = validateField(field, formData[field]);
    if (error) {
      errors[field] = error;
    }
  });
  return errors;
}; 