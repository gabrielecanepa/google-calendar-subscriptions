import { calendar_v3 as GoogleCalendar } from '@googleapis/calendar'

export type CalendarEvent = GoogleCalendar.Schema$Event
export type CalendarDateTime = GoogleCalendar.Schema$EventDateTime

export type Calendar = GoogleCalendar.Schema$Calendar & {
  name?: string
  calendarId: string
  subscriptionUrl: string
  fn?: (events: CalendarEvent[]) => CalendarEvent[]
}

const calendars: Calendar[] = [
  {
    name: 'Holidays in Italy',
    calendarId: 'de96d3739c7ccbb31c3c913d9ab09d4a8ea35a6db2d4461893173e3b759aba6b@group.calendar.google.com',
    subscriptionUrl: 'https://officeholidays.com/ics-all/italy',
    fn: (events: CalendarEvent[]): CalendarEvent[] =>
      events.map(event => {
        const summary = event.summary.replace('(Not a Public Holiday)', '').trim()
        const baseDescription = event.description.split('\n')[ 0 ].trim()
        const description = baseDescription.endsWith('.') ? baseDescription : `${baseDescription}.`
        return { ...event, summary, description }
      }),
  },
  {
    name: 'A.C. Milan',
    calendarId: '39984c3252baa9ee1a164c8a2e6a7931072ca5f5722c1aab334ee240d2d1bb93@group.calendar.google.com',
    subscriptionUrl: 'https://skysports.com/calendars/football/fixtures/teams/ac-milan?live=false',
    fn: (events: CalendarEvent[]): CalendarEvent[] => events.map(event => {
      const description = event.description?.split('\n').pop().trim() || null
      const location = event.location ? `${event.location} Stadium` : null
      return { ...event, description, location }
    }),
  },
  {
    name: 'Chicago Bulls',
    calendarId: '110479dfe01a319ab15b670535140865a4c168622c57a7236fc1137b2c532c8f@group.calendar.google.com',
    subscriptionUrl: 'https://stanza.co/api/schedules/nba-bulls/nba-bulls.ics',
    fn: events => events.map(event => ({ ...event, summary: event.summary.replace('vs.', 'v'), description: null })),
  },
]

export default calendars
