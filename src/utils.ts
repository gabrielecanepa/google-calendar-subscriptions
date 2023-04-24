export const BASE32HEX_REGEXP = /([a-v]|[0-9])/gi
export const DATE_REGEXP = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/i

export const toBase32Hex = (string: string): string => string.match(BASE32HEX_REGEXP)?.join('').toLowerCase() || ''

export const isDate = (string: string): boolean => DATE_REGEXP.test(string)

export type StringifyListOptions = {
  style: 'short' | 'long',
  type: 'conjunction' | 'disjunction'
}

const DEFAULT_STRINGIFY_LIST_OPTIONS: StringifyListOptions = {
  style: 'short',
  type: 'conjunction',
}

/**
 * Returns a string with the elements of the list formatted according to the options.
 */
export const stringifyList = (list: any[], options: StringifyListOptions = DEFAULT_STRINGIFY_LIST_OPTIONS): string => {
  const comma = options.style === 'short' ? '' : ','
  const connector = options.type === 'conjunction' ? 'and' : 'or'
  return list.join(', ').replace(/, ([^,]*)$/, `${comma} ${connector} $1`)
}
