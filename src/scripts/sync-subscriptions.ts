import { syncSubscription } from '..'
import subscriptions from '../subscriptions'

const SUBSCRIPTIONS = process.env.SUBSCRIPTIONS?.split(',') || []
const CLEAR_CALENDARS = process.env.CLEAR_CALENDARS === 'true'

const opts = {
  clear: CLEAR_CALENDARS,
}

const activeSubscriptions = subscriptions.filter(subscription => SUBSCRIPTIONS.includes(subscription.name))

;(async (): Promise<void> => {
  if (activeSubscriptions.length === 0) {
    console.error('No valid subscriptions were specified.')
    return
  }

  for (const subscription of activeSubscriptions) {
    try {
      console.info(`Syncing ${subscription.name} subscription...`)
      await syncSubscription(subscription, opts)
      console.info(`${subscription.name} successfully synced.`)
    } catch (e) {
      console.error(`Failed to sync ${subscription.name}. The following error occured.\n`, e)
      continue
    }
  }
})()
