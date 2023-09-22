import { calendar_v3 } from '@googleapis/calendar'
import client from './client'
import { isEqualEvent, parseIcs } from './utils'

export type CalendarDateTime = {
  date?: string
  dateTime?: string
  timeZone?: string
}

export type CalendarEvent = {
  id: string
  summary: string
  location: string | null
  description: string | null
  url: string | null
  start: CalendarDateTime
  end: CalendarDateTime
}

export type CalendarSubscription = {
  name: string
  calendarId: string
  subscriptionUrl: string
  fn?: (events: CalendarEvent[]) => calendar_v3.Schema$Event[]
}

/**
 * Sync a subscription.
 */
export const syncSubscription = async (subscription: CalendarSubscription, options: { clear?: boolean } = {}): Promise<void> => {
  const { name, calendarId, subscriptionUrl, fn = (events: CalendarEvent[]): CalendarEvent[] => events } = subscription

  const googleEvents = await (await client.events.list({ calendarId, maxResults: 2500 })).data.items || []
  const ics = await (await fetch(subscriptionUrl)).text()
  const events = parseIcs(ics)

  if (options.clear) {
    try {
      for (const googleEvent of googleEvents) {
        try {
          await client.events.delete({ calendarId, eventId: googleEvent.id })
        } catch (e) {
          console.error(`Failed to delete event ${googleEvent.id}. The following error occured.\n`, e)
          continue
        }
      }
    } catch (e) {
      console.error(`Failed to clear calendar ${name}. The following error occured.\n`, e)
    }
  }

  for (const event of fn(events)) {
    try {
      // Find the original event in the calendar.
      const googleEvent = googleEvents.find(googleEvent => googleEvent.id === event.id)
  
      // Create event if not existing.
      if (!googleEvent) {
        await client.events.insert({ calendarId, requestBody: event })
        continue
      }
      // Skip if equal.
      if (isEqualEvent(googleEvent, event)) continue
      // Update if not equal.
      await client.events.update({ calendarId, eventId: event.id, requestBody: event })
    } catch (e) {
      console.error(`Failed to sync event ${event.summary}. The following error occured.\n`, e)
      continue
    }
  }
}

/**
 * Sync multiple subscriptions.
 */
export const syncSubscriptions = async (subscriptions: CalendarSubscription[], options: { clear?: boolean } = {}): Promise<void> => {
  for (const subscription of subscriptions) {
    try {
      await syncSubscription(subscription, options)
    } catch (e) {
      console.error(`Failed to sync calendar ${subscription.name}. The following error occured.\n`, e)
      continue
    }
  }
}