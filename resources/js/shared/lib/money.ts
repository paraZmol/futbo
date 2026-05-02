/** Format a decimal string as Peruvian soles: "S/ 80.00" */
export function formatMoney(amount: string, currency = 'PEN'): string {
    const num = parseFloat(amount);
    if (currency === 'PEN') {
        return `S/ ${num.toFixed(2)}`;
    }
    return `${currency} ${num.toFixed(2)}`;
}
