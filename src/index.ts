import { config as configEnv } from 'dotenv'
configEnv()

import { auth as googleAuth, calendar as googleCalendar } from '@googleapis/calendar'
import calendars, { CalendarDateTime, CalendarEvent, CalendarSubscription } from './calendars'
import { isEqual, parseIcs, toBase32Hex } from './utils'

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
 * Sync a calendar.
 */
export const syncSubscription = async (subscription: CalendarSubscription, options: { clear?: boolean } = {}): Promise<void> => {
  const { calendarId, subscriptionUrl, fn = (events: CalendarEvent[]): CalendarEvent[] => events } = subscription

  try {
    const googleEvents = await (await client.events.list({ calendarId })).data.items || []
    const ics = await (await fetch(subscriptionUrl)).text()
    const events = parseIcs(ics)

    if (options.clear) {
      for (const event of googleEvents) {
        await client.events.delete({ calendarId, eventId: event.id })
      }
    }

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
    await syncSubscription(subscription, { clear: true })
  }
}

// Export all utils.
export {
  CalendarDateTime,
  CalendarEvent,
  CalendarSubscription,
  toBase32Hex,
}

// Sync all calendars specified in the env.
const activeCalendars = calendars.filter(calendar => SUBSCRIPTIONS.includes(calendar.name))
syncSubscriptions(activeCalendars)
