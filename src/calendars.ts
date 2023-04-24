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
    calendarId: 'YOUR_CALENDAR_ID',
    subscriptionUrl: 'https://officeholidays.com/ics-all/italy',
    fn: (events: CalendarEvent[]): CalendarEvent[] =>
      events.map(event => {
        const summary = event.summary?.replace('(Not a Public Holiday)', '').trim()
        const baseDescription = event.description?.split('\n')[ 0 ].trim()
        const description = baseDescription?.endsWith('.') ? baseDescription : `${baseDescription}.`
        return { ...event, summary, description }
      }),
  },
  {
    name: 'bulls',
    calendarId: 'YOUR_CALENDAR_ID',
    subscriptionUrl: 'https://stanza.co/api/schedules/nba-bulls/nba-bulls.ics',
    fn: events => events.map(event => {
      // Prevent event id from changing (stanza.co behavior).
      const startDate = event.start?.dateTime?.split('T')[0] || ''
      const id = toBase32Hex(`${event.summary}${startDate}`)
      const summary = event.summary?.replace('vs.', 'v')
      return { ...event, id, summary, description: null }
    }),
  },
]

export default calendars
