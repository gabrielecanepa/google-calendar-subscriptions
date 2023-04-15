import { calendar_v3 as GoogleCalendar } from '@googleapis/calendar'

export type CalendarEvent = GoogleCalendar.Schema$Event
export type CalendarDateTime = GoogleCalendar.Schema$EventDateTime

export type Calendar = {
  name?: string
  calendarId: string
  subscriptionUrl: string
  fn?: (events: CalendarEvent[]) => CalendarEvent[]
}

const calendars: Calendar[] = [
  {
    name: 'A.C. Milan',
    calendarId: 'YOUR_CALENDAR_ID',
    subscriptionUrl: 'https://skysports.com/calendars/football/fixtures/teams/ac-milan?live=false',
    fn: (events: CalendarEvent[]): CalendarEvent[] => events.map(event => {
      // Use only league in the description.
      const description = event.description?.split('\n').pop().trim() || null
      // Add stadium to the location to make map apps recognize it.
      const location = event.location ? `${event.location} Stadium` : null
      return { ...event, description, location }
    }),
  },
]

export default calendars
