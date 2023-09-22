import { calendar_v3 } from '@googleapis/calendar'
import { Component as ICalComponent, Event as ICalEvent, Timezone as ICalTimezone, parse } from 'ical.js'
import { CalendarDateTime, CalendarEvent } from './calendar'

export const BASE32HEX_REGEXP = /([a-v]|[0-9])/gi
export const DATE_REGEXP = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/i

/**
 * Converts a string to base32hex format.
 */
export const toBase32Hex = (string: string): string => string.match(BASE32HEX_REGEXP)?.join('').toLowerCase() || ''

/**
 * Checks if a string is a date in the format YYYY-MM-DD.
 */
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

/**
 * Extracts dates from an iCal component and format them according to the Google Calendar API.
 *
 * @url https://developers.google.com/calendar/api/v3/reference/events#resource
 */
// eslint-disable-next-line
export const getDatesFromICalComponent = (component: ICalComponent, timeZone: string): { start: CalendarDateTime, end: CalendarDateTime } => {
  return ['start', 'end'].reduce((acc, key) => {
    const [, { tzid },, dateTime] = component.getFirstProperty(`dt${key}`).toJSON()
    if (isDate(dateTime)) return { ...acc, [key]: { date: dateTime } }
    return { ...acc, [key]: { dateTime, timeZone: tzid || timeZone } }
  }, { start: { date: null }, end: { date: null } })
}

/**
 * Format an iCal component as a Google Calendar resource.
 *
 * @url https://developers.google.com/calendar/api/v3/reference/events#resource
 */
export const parseIcs = (ics: string): CalendarEvent[] => {
  const iCal = new ICalComponent(parse(ics))
  const { tzid } = new ICalTimezone(iCal.getFirstSubcomponent('vtimezone'))

  return iCal.getAllSubcomponents('vevent').map(event => {
    const { uid, summary, location, description } = new ICalEvent(event)
    const url = event.getFirstPropertyValue('url') || null
    return { id: toBase32Hex(uid), summary, location, description, url, ...getDatesFromICalComponent(event, tzid) }
  })
}

/**
 * Check if a calendar event from an iCal or Google is equal to another.
 */
export const isEqualEvent = (a: CalendarEvent | calendar_v3.Schema$Event, b: CalendarEvent | calendar_v3.Schema$Event): boolean => (
  a.summary === b.summary &&
  a.location === b.location &&
  a.description === b.description &&
  JSON.stringify(a.start) === JSON.stringify(b.start) &&
  JSON.stringify(a.end) === JSON.stringify(b.end)
)
