/**
 * Formats a numeric amount into a currency string (e.g., PKR 1,200.00)
 */
export function formatMoney(amount: number, currency: string = 'PKR'): string {
    const formattedAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);

    return `${currency} ${formattedAmount}`;
}
