import { auth, calendar, calendar_v3 } from '../src'
import { createTestSubscription, waitForGoogleSync } from './utils'

const CLIENT_EMAIL = process.env.TEST_CLIENT_EMAIL
const PRIVATE_KEY = process.env.TEST_PRIVATE_KEY
const SUBSCRIPTION_URL = process.env.TEST_SUBSCRIPTION_URL
const SUBSCRIPTION_URL_NEW = process.env.TEST_SUBSCRIPTION_URL_NEW

const TIMEOUT = 60_000
const SCOPES = ['https://www.googleapis.com/auth/calendar']

if (!CLIENT_EMAIL || !PRIVATE_KEY || !SUBSCRIPTION_URL || !SUBSCRIPTION_URL_NEW)
  throw new Error('missing required environment variables')

const client = calendar({
  version: 'v3',
  auth: new auth.GoogleAuth({
    credentials: {
      client_email: CLIENT_EMAIL,
      private_key: PRIVATE_KEY,
    },
    scopes: SCOPES,
  }),
})

// Prevent memory leaks given by the async operations.
process.setMaxListeners(0)

describe('Calendar', () => {
  it('should extend the default client with a new subscriptions key', () => {
    expect(client).toMatchObject<calendar_v3.Calendar>
    expect(client.subscriptions).toBeDefined()
  })

  describe('Subscriptions', () => {
    let subscription: calendar_v3.Schema$Subscription
    let events: calendar_v3.Schema$Event[]
    
    it('should create a subscription attached to a new calendar', async () => {
      subscription = await createTestSubscription(client, SUBSCRIPTION_URL)
      expect(subscription).toMatchObject<calendar_v3.Schema$Subscription>({ url: SUBSCRIPTION_URL })
    }, TIMEOUT)

    it('should send updates to the subscription', async () => {
      const summary = 'Test Summary'
      const fn = (events): calendar_v3.Schema$Event[] => events.map(e => ({ ...e, summary }))
      await client.subscriptions.sync({ requestBody: { ...subscription, fn } })
      await waitForGoogleSync()

      const { data } = await client.events.list({ calendarId: subscription.calendarId })
      events = data.items

      expect(events.every(event => event.summary === summary)).toBe(true)
    }, TIMEOUT)

    it('should add new events available in the subscription', async () => {
      await client.subscriptions.sync({ requestBody: { ...subscription, url: SUBSCRIPTION_URL_NEW } })
      await waitForGoogleSync()
      const { data: { items } } = await client.events.list({ calendarId: subscription.calendarId })
      expect(events.length < items.length).toBe(true)
    }, TIMEOUT)

    it('should remove the subscription', async () => {
      await client.calendars.delete({ calendarId: subscription.calendarId })
      await waitForGoogleSync()
      
      try {
        await client.calendars.get({ calendarId: subscription.calendarId })
      } catch (error) {
        expect(error).toBeDefined()
      }
    }, TIMEOUT)
  })
})
