"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDeliveryDetails = validateDeliveryDetails;
exports.validateBookingDetails = validateBookingDetails;
/**
 * Validate date format
 * Accepts: "Feb 15", "15 Feb", "2024-02-15", "15/02/2024"
 */
function isValidDate(dateStr) {
    const formats = [
        /^[A-Za-z]{3}\s+\d{1,2}$/, // "Feb 15"
        /^\d{1,2}\s+[A-Za-z]{3}$/, // "15 Feb"
        /^\d{4}-\d{2}-\d{2}$/, // "2024-02-15"
        /^\d{1,2}\/\d{1,2}\/\d{4}$/ // "15/02/2024"
    ];
    return formats.some(regex => regex.test(dateStr.trim()));
}
/**
 * Validate time format
 * Accepts: "2:00 PM", "14:00", "2 PM"
 */
function isValidTime(timeStr) {
    const formats = [
        /^\d{1,2}:\d{2}\s*(AM|PM|am|pm)$/, // "2:00 PM"
        /^\d{1,2}:\d{2}$/, // "14:00"
        /^\d{1,2}\s*(AM|PM|am|pm)$/ // "2 PM"
    ];
    return formats.some(regex => regex.test(timeStr.trim()));
}
/**
 * Validate delivery details
 * Required: name, address, phone
 */
function validateDeliveryDetails(details) {
    var _a, _b, _c;
    const errors = [];
    if (!((_a = details.common) === null || _a === void 0 ? void 0 : _a.name) || details.common.name.trim() === '' || details.common.name === 'Customer') {
        errors.push('Name');
    }
    if (!((_b = details.delivery) === null || _b === void 0 ? void 0 : _b.address) || details.delivery.address.trim() === '') {
        errors.push('Address');
    }
    if (!((_c = details.common) === null || _c === void 0 ? void 0 : _c.phone) || details.common.phone.trim() === '') {
        errors.push('Phone');
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
/**
 * Validate booking details
 * Required: name, date (with format check), time (with format check), phone
 */
function validateBookingDetails(details) {
    var _a, _b, _c, _d;
    const errors = [];
    if (!((_a = details.common) === null || _a === void 0 ? void 0 : _a.name) || details.common.name.trim() === '' || details.common.name === 'Guest') {
        errors.push('Name');
    }
    if (!((_b = details.booking) === null || _b === void 0 ? void 0 : _b.preferredDate) || details.booking.preferredDate.trim() === '') {
        errors.push('Date');
    }
    else if (!isValidDate(details.booking.preferredDate)) {
        errors.push('Valid Date format (e.g., Feb 15, 15/02/2024)');
    }
    if (!((_c = details.booking) === null || _c === void 0 ? void 0 : _c.preferredTime) || details.booking.preferredTime.trim() === '') {
        errors.push('Time');
    }
    else if (!isValidTime(details.booking.preferredTime)) {
        errors.push('Valid Time format (e.g., 2:00 PM, 14:00)');
    }
    if (!((_d = details.common) === null || _d === void 0 ? void 0 : _d.phone) || details.common.phone.trim() === '') {
        errors.push('Phone');
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
