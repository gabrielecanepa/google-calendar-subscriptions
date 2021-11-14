import { calendar_v3 } from '@googleapis/calendar'

const GOOGLE_TIMEOUT = 2_000

/**
 * Wait for the Google Calendar API to sync.
 */
export const waitForGoogleSync = async (): Promise<void> =>
  await new Promise(resolve => setTimeout(resolve, GOOGLE_TIMEOUT))

export const createTestSubscription = async (
  client: calendar_v3.Calendar,
  url: calendar_v3.Schema$Subscription['url'],
  event: calendar_v3.Schema$Event = {},
): Promise<calendar_v3.Schema$Subscription> => {
  const params: calendar_v3.Params$Resource$Subscriptions$Insert = { requestBody: { url } }
  const subscription = await client.subscriptions.insert(params)
  subscription.fn = (events): calendar_v3.Schema$Event[] => events.map(e => ({ ...e, ...event }))
  
  await client.subscriptions.sync({ requestBody: subscription })
  return subscription
}
