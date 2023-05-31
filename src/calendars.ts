import { calendar_v3 } from '@googleapis/calendar'
import { stringifyList, toBase32Hex } from './utils'

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

const subscriptions: CalendarSubscription[] = [
  {
    name: 'holidays',
    calendarId: '517fd34f8d0dfc12870c861676ba74af633ea5878cbcaa93c704f05d11277141@group.calendar.google.com',
    subscriptionUrl: 'https://officeholidays.com/ics-all/italy',
    fn: events =>
      events.reduce((acc, event) => {
        const regionalHoliday = event.location && event.location !== 'Italy'
          ? `(${stringifyList(event.location.split(', '))} only)`
          : event.location
        const summary = event.summary
          .replace('(Not a Public Holiday)', '')
          .replace('(Regional Holiday)', regionalHoliday)
          .trim()
        let description = event.description.split('\n')[0].trim()
        description = description.endsWith('.') ? description : `${description}.`
        if (event.url) description += `\n\n${event.url.replace('www.', '')}`
        return [...acc, { ...event, summary, description }]
      }, []),
  },
  {
    name: 'milan',
    calendarId: '39984c3252baa9ee1a164c8a2e6a7931072ca5f5722c1aab334ee240d2d1bb93@group.calendar.google.com',
    subscriptionUrl: 'https://skysports.com/calendars/football/fixtures/teams/ac-milan?live=false',
    fn: events => events.map(event => {
      const description = event.description?.split('\n').pop().trim() || null
      const location = event.location ? `${event.location} Stadium` : null
      return { ...event, description, location }
    }),
  },
  {
    name: 'nba',
    calendarId: 'cf69becb29a77f67a250d73e43e406915f9bfef0eb8a389da9d8f78864c8092f@group.calendar.google.com',
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

export default subscriptions
