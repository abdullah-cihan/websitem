// form-validator.js

/**
 * Validate an email address.
 * @param {string} email - The email address to validate.
 * @returns {boolean} - Returns true if valid, otherwise false.
 */
function validateEmail(email) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
}

/**
 * Validate a phone number.
 * @param {string} phone - The phone number to validate.
 * @returns {boolean} - Returns true if valid, otherwise false.
 */
function validatePhoneNumber(phone) {
    const phonePattern = /^(\+\d{1,3}[- ]?)?\d{10}$/;
    return phonePattern.test(phone);
}

/**
 * Validate a required field.
 * @param {string} value - The value to check.
 * @returns {boolean} - Returns true if valid, otherwise false.
 */
function validateRequired(value) {
    return value && value.trim() !== '';
}

/**
 * Validate a password strength.
 * @param {string} password - The password to check.
 * @returns {boolean} - Returns true if strong, otherwise false.
 */
function validatePassword(password) {
    const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return strongPasswordPattern.test(password);
}

/**
 * Combine multiple validation functions.
 * @param {object} data - Object containing form data.
 * @returns {object} - Returns an object with validation results.
 */
function validateForm(data) {
    return {
        email: validateEmail(data.email),
        phone: validatePhoneNumber(data.phone),
        required: validateRequired(data.requiredField),
        password: validatePassword(data.password)
    };
}

module.exports = {
    validateEmail,
    validatePhoneNumber,
    validateRequired,
    validatePassword,
    validateForm
};