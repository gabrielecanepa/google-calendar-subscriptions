import { syncSubscriptions } from '..'
import subscriptions from '../subscriptions'

const SUBSCRIPTIONS = process.env.SUBSCRIPTIONS?.split(',') || []
const CLEAR_CALENDARS = process.env.CLEAR_CALENDARS === 'true'

const opts = {
  clear: CLEAR_CALENDARS,
}

const activeCalendars = subscriptions.filter(subscription => SUBSCRIPTIONS.includes(subscription.name))
syncSubscriptions(activeCalendars, opts)
