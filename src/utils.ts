export const BASE32HEX_REGEXP = /([a-v]|[0-9])/gi
export const DATE_REGEXP = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/i

export const toBase32Hex = (s: string): string => s.match(BASE32HEX_REGEXP)?.join('').toLowerCase() || ''

export const isDate = (s: string): boolean => DATE_REGEXP.test(s)
