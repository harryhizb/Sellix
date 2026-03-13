"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDeliveryDetails = parseDeliveryDetails;
exports.parseBookingDetails = parseBookingDetails;
/**
 * Parse delivery details from comma-separated input
 * Expected format: "Name, Address, City, Phone"
 */
function parseDeliveryDetails(input) {
    const parts = input.split(',').map(p => p.trim());
    return {
        common: {
            name: parts[0] || 'Customer',
            phone: parts[3] || ''
        },
        delivery: {
            address: parts[1] || '',
            city: parts[2] || '',
            specialInstructions: ''
        }
    };
}
/**
 * Parse booking details from comma-separated input
 * Expected format: "Name, Preferred Date, Preferred Time, Phone"
 */
function parseBookingDetails(input) {
    const parts = input.split(',').map(p => p.trim());
    return {
        common: {
            name: parts[0] || 'Guest',
            phone: parts[3] || ''
        },
        booking: {
            preferredDate: parts[1] || '',
            preferredTime: parts[2] || '',
            serviceType: ''
        }
    };
}
