import { config as configEnv } from 'dotenv'
configEnv()

import { auth as googleAuth, calendar as googleCalendar, calendar_v3 } from '@googleapis/calendar'
import { Component as ICalComponent, Event as ICalEvent, Timezone as ICalTimezone, parse } from 'ical.js'
import calendars, { CalendarDateTime, CalendarEvent, CalendarSubscription } from './calendars'
import { isDate, toBase32Hex } from './utils'

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/calendar']
const SUBSCRIPTIONS = process.env.SUBSCRIPTIONS?.split(',') || []

if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
  throw new Error('Wrong environment variables. Rename the .env.example file to .env and update the values.')
}

const auth = new googleAuth.GoogleAuth({
  scopes: GOOGLE_SCOPES,
  credentials: {
    client_email: GOOGLE_CLIENT_EMAIL,
    private_key: GOOGLE_PRIVATE_KEY,
  },
})

const client = googleCalendar({ version: 'v3', auth })

/**
 * Extracts dates from an iCal component and format them according to the Google Calendar API.
 *
 * @url https://developers.google.com/calendar/api/v3/reference/events#resource
 */
// eslint-disable-next-line
const getDatesFromICalComponent = (component: ICalComponent, timeZone: string): { start: CalendarDateTime, end: CalendarDateTime } => {
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
const parseIcs = (ics: string): CalendarEvent[] => {
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
const isEqual = (a: CalendarEvent | calendar_v3.Schema$Event, b: CalendarEvent | calendar_v3.Schema$Event): boolean => (
  a.summary === b.summary &&
  a.location === b.location &&
  a.description === b.description &&
  JSON.stringify(a.start) === JSON.stringify(b.start) &&
  JSON.stringify(a.end) === JSON.stringify(b.end)
)

/**
 * Sync a calendar.
 */
export const syncSubscription = async (subscription: CalendarSubscription): Promise<void> => {
  const { calendarId, subscriptionUrl, fn = (events: CalendarEvent[]): CalendarEvent[] => events } = subscription

  try {
    const googleEvents = await (await client.events.list({ calendarId })).data.items || []
    const ics = await (await fetch(subscriptionUrl)).text()
    const events = parseIcs(ics)

    for (const event of fn(events)) {
      // Find the original event in the calendar.
      const googleEvent = googleEvents.find(googleEvent => googleEvent.id === event.id)

      // Create event if not existing.
      if (!googleEvent) {
        await client.events.insert({ calendarId, requestBody: event })
        continue
      }
      // Skip if equal.
      if (isEqual(googleEvent, event)) continue
      // Update if not equal.
      await client.events.update({ calendarId, eventId: event.id, requestBody: { ...googleEvent, ...event } })
    }
  } catch (e) {
    console.error(e)
  }
}

/**
 * Sync multiple subscriptions.
 */
export const syncSubscriptions = async (subscriptions: CalendarSubscription[]): Promise<void> => {
  for (const subscription of subscriptions) {
    await syncSubscription(subscription)
  }
}

// Export all utils.
export {
  CalendarDateTime,
  CalendarEvent,
  CalendarSubscription,
  toBase32Hex,
}

// Sync all calendars specified in env.
const activeCalendars = calendars.filter(calendar => SUBSCRIPTIONS.includes(calendar.name))
syncSubscriptions(activeCalendars)
