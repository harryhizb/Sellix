"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMoney = formatMoney;
/**
 * Formats a numeric amount into a currency string (e.g., PKR 1,200.00)
 */
function formatMoney(amount, currency = 'PKR') {
    const formattedAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
    return `${currency} ${formattedAmount}`;
}
