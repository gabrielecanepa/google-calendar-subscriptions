import { calendar_v3 } from '@googleapis/calendar'
import { getEventsFromSubscriptionUrl, isSameEvent } from './utils'

export interface GoogleCalendarSubscription {
  name: string
  calendarId: string
  subscriptionUrl: string
  fn?: (events: calendar_v3.Schema$Event[]) => calendar_v3.Schema$Event[]
}
export interface GoogleCalendarSubscriptionAsync extends Omit<GoogleCalendarSubscription, 'fn'> {
  fn?: (events: calendar_v3.Schema$Event[]) => Promise<calendar_v3.Schema$Event[]>
}

/**
 * Sync a calendar subscription.
 */
export const syncGoogleCalendarSubscription = async (
  calendar: calendar_v3.Calendar,
  subscription: GoogleCalendarSubscription | GoogleCalendarSubscriptionAsync,
  options: { clear?: boolean } = {},
): Promise<void> => {
  const {
    name,
    calendarId,
    subscriptionUrl,
    fn = (events: calendar_v3.Schema$Event[]): calendar_v3.Schema$Event[] => events,
  } = subscription

  const googleEvents = await (await calendar.events.list({ calendarId, maxResults: 2500 })).data.items || []
  const events = await getEventsFromSubscriptionUrl(subscriptionUrl)

  if (options.clear) {
    try {
      for (const googleEvent of googleEvents) {
        try {
          await calendar.events.delete({ calendarId, eventId: googleEvent.id })
        } catch (e) {
          console.error(`Failed to delete event ${googleEvent.id}. The following error occured.\n`, e)
          continue
        }
      }
    } catch (e) {
      console.error(`Failed to clear calendar ${name}. The following error occured.\n`, e)
    }
  }

  for (const event of await fn(events)) {
    try {
      // Find the original event in the calendar.
      const googleEvent = googleEvents.find(googleEvent => googleEvent.id === event.id)
  
      // Create event if not existing.
      if (!googleEvent) {
        await calendar.events.insert({ calendarId, requestBody: event })
        continue
      }
      // Skip if equal.
      if (isSameEvent(googleEvent, event)) continue
      // Update if not equal.
      await calendar.events.update({ calendarId, eventId: event.id, requestBody: event })
    } catch (e) {
      console.error(`Failed to sync event ${event.summary}. The following error occured.\n`, e)
      continue
    }
  }
}
