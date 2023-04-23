import { config as configEnv } from 'dotenv'
configEnv()

import fetch from 'node-fetch'
import { auth as googleAuth, calendar as googleCalendar } from '@googleapis/calendar'
import { Component as ICalComponent, Event as ICalEvent, Timezone as ICalTimezone, parse as parseIcs } from 'ical.js'

import calendars, { Calendar } from './calendars'
import type { CalendarDateTime, CalendarEvent } from './calendars'

// Constants
const BASE32HEX_REGEXP = /([a-v]|[0-9])/gi

// Google
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/calendar']

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
// eslint-disable-next-line arrow-body-style
const getDatesFromICalComponent = (component: ICalComponent, timeZone: string): { start: CalendarDateTime, end: CalendarDateTime } => {
  return ['start', 'end'].reduce((acc, key) => {
    const [ , { tzid }, , dateTime ] = component.getFirstProperty(`dt${key}`).toJSON()
    const isDate = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/i.test(dateTime)
    if (isDate) return { ...acc, [key]: { date: dateTime } }
    return { ...acc, [key]: { dateTime, timeZone: tzid || timeZone } }
  }, { start: null, end: null })
}

/**
 * Format an iCal component to a Google Calendar resource.
 *
 * @url https://developers.google.com/calendar/api/v3/reference/events#resource
 */
const parseICalEvents = (iCal: ICalComponent): CalendarEvent[] => {
  const { tzid } = new ICalTimezone(iCal.getFirstSubcomponent('vtimezone'))

  return iCal.getAllSubcomponents('vevent').map(event => {
    const { uid, summary, location, description } = new ICalEvent(event)
    const id = uid.match(BASE32HEX_REGEXP).join('').toLowerCase()
    return { id, summary, location, description, ...getDatesFromICalComponent(event, tzid) }
  })
}

/**
 * Check if a calendar event is equal to another.
 */
const isEqual = (a: CalendarEvent, b: CalendarEvent): boolean => (
  a.summary === b.summary &&
  a.location === b.location &&
  a.description === b.description &&
  +new Date(a.start.dateTime) === +new Date(b.start.dateTime) &&
  a.start.timeZone === b.start.timeZone
  && a.start.date === b.start.date &&
  +new Date(a.end.dateTime) === +new Date(b.end.dateTime) &&
  a.end.timeZone === b.end.timeZone &&
  a.end.date === b.end.date
)

/**
 * Sync a calendar.
 */
export const syncCalendar = async (calendar: Calendar): Promise<void> => {
  const { calendarId, subscriptionUrl, fn = (events: CalendarEvent[]): CalendarEvent[] => events } = calendar

  try {
    const googleEvents: CalendarEvent[] = await (await client.events.list({ calendarId })).data.items

    const ics = await (await fetch(subscriptionUrl)).text()
    const iCal = new ICalComponent(parseIcs(ics))
    const events = parseICalEvents(iCal)

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
      await client.events.update({ calendarId, eventId: googleEvent.id, requestBody: { ...googleEvent, ...event } })
    }
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

for (const calendar of calendars) {
  syncCalendar(calendar)
}
