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
    subscriptionUrl: 'https://ics.fixtur.es/v2/ac-milan.ics',
    fn: (events): CalendarEvent[] => {
      const COMPETITION_REGEX = /^.+\s\[(?<c>\w+)\]\s?.*$/

      const getCompetiton = (c: string): string => {
        switch (c) {
          case '':
            return 'Serie A'
          case 'CL':
            return 'UEFA Champions League'
          case 'EL':
            return 'UEFA Europa League'
          case 'COP':
            return 'Coppa Italia'
          default:
            return c
        }
      }
      
      return events.map(e => {
        const id = toBase32Hex(e.summary + e.start.dateTime?.split('T')[0] || e.start.date)
        const competiton = e.summary.match(COMPETITION_REGEX)?.groups?.c || 'Serie A'
        const summary = e.summary.replace(`[${competiton}]`, '').trim()
        const description = getCompetiton(competiton)
        return { ...e, id, summary, description }
      })
    },
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
