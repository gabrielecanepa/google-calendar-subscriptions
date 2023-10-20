import { calendar_v3, auth as googleApiAuth, calendar as googleCalendar } from '@googleapis/calendar'
import { GoogleCalendarSubscription, GoogleCalendarSubscriptionAsync, syncGoogleCalendarSubscription } from './subscription'

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/calendar']

export interface GoogleCalendarAuth {
  email: string
  key: string
}

export interface GoogleCalendarExtended extends calendar_v3.Calendar {
  subscriptions: {
    sync: (
      subscription: GoogleCalendarSubscription | GoogleCalendarSubscriptionAsync,
      options?: { clear?: boolean }
    ) => Promise<void>
  }
}

const calendar = (auth?: GoogleCalendarAuth): GoogleCalendarExtended => {
  const client_email = auth?.email || GOOGLE_CLIENT_EMAIL
  const private_key = auth?.key || GOOGLE_PRIVATE_KEY

  if (!client_email || !private_key) throw new Error('Wrong or missing auth variables.')

  const googleAuth = new googleApiAuth.GoogleAuth({
    scopes: GOOGLE_SCOPES,
    credentials: { client_email, private_key },
  })

  const calendar = googleCalendar({ version: 'v3', auth: googleAuth })

  const sync = async (
    subscription: GoogleCalendarSubscription | GoogleCalendarSubscriptionAsync,
    options: { clear?: boolean } = {},
  ): Promise<void> => syncGoogleCalendarSubscription(calendar, subscription, options)

  return {
    ...calendar,
    subscriptions: {
      sync,
    },
  }
}

export default calendar
