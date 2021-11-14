import { calendar_v3 } from '@googleapis/calendar'
import { Component as ICalComponent, Event as ICalEvent, Timezone as ICalTimezone, parse } from 'ical.js'

const BASE32HEX_REGEXP = /([a-v]|[0-9])/gi
const DATE_REGEXP = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/i

/**
 * General utilities
 */

/**
 * Converts a string to base32hex format.
 */
export const toBase32Hex = (string: string): string => string.match(BASE32HEX_REGEXP)?.join('').toLowerCase() || ''

/**
 * Checks if a string is a date in the format YYYY-MM-DD.
 */
export const isDate = (string: string): boolean => DATE_REGEXP.test(string)

/**
 * Check if a value is null or undefined.
 */
export const isNullish = (value: any): boolean => value === null || value === undefined

/**
 * Check if two values are equal or both nullish.
 */
export const isEqualOrNullish = (a: any, b: any): boolean => a === b || isNullish(a) && isNullish(b)

/**
 * Calendar utilities
 */

/**
 * Check if two calendar datetimes are equal.
 */
export const isSameEventDateTime = (a: calendar_v3.Schema$EventDateTime, b: calendar_v3.Schema$EventDateTime): boolean => {
  if (a.date && b.date) return a.date === b.date
  if (a.dateTime && b.dateTime) return new Date(a.dateTime).toString() === new Date(b.dateTime).toString()
  return false
}

/**
 * Check if a calendar event from an iCal or Google is equal to another.
 */
export const isSameEvent = (a: calendar_v3.Schema$Event, b: calendar_v3.Schema$Event): boolean => {
  const { start: startA, end: endA, ...restA } = a
  const { start: startB, end: endB, ...restB } = b

  return (
    isSameEventDateTime(startA, startB) &&
    isSameEventDateTime(endA, endB) &&
    Object.keys(restA).every(key => isEqualOrNullish(restA[key], restB[key]))
  )
}

/**
 * Extracts dates from an iCal component and format them according to the Google Calendar API.
 *
 * @url https://developers.google.com/calendar/api/v3/reference/events#resource
 */
export const getDatesFromICalComponent = (component: ICalComponent, timeZone: string): {
  start: calendar_v3.Schema$EventDateTime,
  end: calendar_v3.Schema$EventDateTime
} => ['start', 'end'].reduce((acc, key) => {
    const [, { tzid },, dateTime] = component.getFirstProperty(`dt${key}`).toJSON()
    if (isDate(dateTime)) return { ...acc, [key]: { date: dateTime } }
    return { ...acc, [key]: { dateTime, timeZone: tzid || timeZone } }
  }, { start: { date: null }, end: { date: null } })

/**
 * Formats an iCal component as a Google Calendar resource.
 *
 * @url https://developers.google.com/calendar/api/v3/reference/events#resource
 */
export const parseIcs = (ics: string): {
  details: calendar_v3.Schema$Calendar
  events: calendar_v3.Schema$Event[]
} => {
  const iCal = new ICalComponent(parse(ics))
  const { tzid } = new ICalTimezone(iCal.getFirstSubcomponent('vtimezone'))

  const details: calendar_v3.Schema$Calendar = {
    summary: iCal.getFirstProperty('x-wr-calname')?.getValues()[0] || null,
    description: iCal.getFirstProperty('x-wr-caldesc')?.getValues()[0] || null,
  }
  const events: calendar_v3.Schema$Event[] = iCal.getAllSubcomponents('vevent').map(event => {
    const { uid, summary, location, description } = new ICalEvent(event)
    const htmlLink = event.getFirstPropertyValue('url') || null
    return { id: toBase32Hex(uid), summary, location, description, htmlLink, ...getDatesFromICalComponent(event, tzid) }
  })

  return { details, events }
}

/**
 * Calendar data
 */

/**
 * Fetches an iCal from a url.
 */
export const fetchIcs = async (url: string): Promise<string> => await (await fetch(url)).text()

/**
 * Fetches and parses calendar events from a subscription url.
 */
export const fetchCalendarEvents = async (subscriptionUrl: string): Promise<calendar_v3.Schema$Event[]> => {
  const ics = await fetchIcs(subscriptionUrl)
  return parseIcs(ics).events
}

/**
 * Fetches and parses calendar details from a calendar id.
 */
export const fetchCalendarDetails = async (subscriptionUrl: string): Promise<calendar_v3.Schema$Calendar> => {
  const ics = await fetchIcs(subscriptionUrl)
  return parseIcs(ics).details
}
