/**
 * Formats a number with K (thousands) or M (millions) suffix
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with K/M suffix
 */
export function formatCompactNumber(value: number, decimals: number = 1): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(decimals)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(decimals)}K`
  } else {
    return value.toFixed(0)
  }
}

/**
 * Formats currency with compact notation (K/M)
 * @param value - The number to format
 * @param currency - Currency code (default: 'USD')
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted currency string with K/M suffix
 */
export function formatCompactCurrency(
  value: number,
  currency: string = 'USD',
  decimals: number = 1
): string {
  const symbol = currency === 'USD' ? '$' : currency + ' '
  return symbol + formatCompactNumber(value, decimals)
}
