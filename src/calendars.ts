import { calendar_v3 as GoogleCalendar } from '@googleapis/calendar'
import { toBase32Hex } from './utils'

export type CalendarEvent = GoogleCalendar.Schema$Event
export type CalendarDateTime = GoogleCalendar.Schema$EventDateTime

export type Calendar = GoogleCalendar.Schema$Calendar & {
  name: string
  calendarId: string
  subscriptionUrl: string
  fn?: (events: CalendarEvent[]) => CalendarEvent[]
}

const calendars: Calendar[] = [
  {
    name: 'holidays',
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
    name: 'milan',
    calendarId: '39984c3252baa9ee1a164c8a2e6a7931072ca5f5722c1aab334ee240d2d1bb93@group.calendar.google.com',
    subscriptionUrl: 'https://skysports.com/calendars/football/fixtures/teams/ac-milan?live=false',
    fn: (events: CalendarEvent[]): CalendarEvent[] => events.map(event => {
      const description = event.description?.split('\n').pop().trim() || null
      const location = event.location ? `${event.location} Stadium` : null
      return { ...event, description, location }
    }),
  },
  {
    name: 'nba',
    calendarId: '3f2731b24b12b68211adfefb3ada0f5fc4d4843225652d704a067e8d50200443@group.calendar.google.com',
    subscriptionUrl: 'https://stanza.co/api/schedules/nba-bulls/nba-bulls.ics',
    fn: events => events.map(e => {
      // Prevent event id from changing (stanza.co behavior).
      const event = { ...e, id: toBase32Hex(e.summary + e.start.dateTime.split('T')[0]), description: null }
      if (event.summary.match(/\svs\.\s/)) {
        const [home, away] = event.summary.split(/\svs\.\s/)
        return { ...event, summary: `${away} @ ${home}` }
      }
      return { ...event, summary: e.summary.replace('at', '@') }
    }),
  },
]

export default calendars
