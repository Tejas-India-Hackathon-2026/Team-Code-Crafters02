/**
 * Formats a numerical amount into Indian Rupee currency notation.
 */
export function formatCurrency(amount: number): string {
    if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Calculates statutory Section 194-O TDS deductions (1%) for artisan marketplace settlements.
 */
export function formatTdsBreakdown(grossAmount: number): {
    gross: number;
    tdsAmount: number;
    netPayout: number;
    tdsRate: string;
} {
    const gross = Math.max(0, grossAmount || 0);
    const tdsAmount = Math.round(gross * 0.01);
    const netPayout = gross - tdsAmount;

    return {
        gross,
        tdsAmount,
        netPayout,
        tdsRate: '1% (Section 194-O)',
    };
}

/**
 * Formats sequential batch watermark numbering (e.g. #04/50).
 */
export function formatBatchWatermark(index: number, total: number = 50): string {
    const padded = String(Math.max(1, index)).padStart(2, '0');
    return `#${padded}/${total}`;
}
