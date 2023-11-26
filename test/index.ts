import { auth, calendar, calendar_v3 } from '../src'
import { isValidSubscription, toArray } from '../src/utils'

const CLIENT_EMAIL = process.env.TEST_CLIENT_EMAIL
const PRIVATE_KEY = process.env.TEST_PRIVATE_KEY
const SUBSCRIPTION_URLS = process.env.TEST_SUBSCRIPTION_URLS

const FETCH_TIMEOUT = 60_000
const SCOPES = ['https://www.googleapis.com/auth/calendar']

const subscriptionUrls: string[] = toArray(SUBSCRIPTION_URLS)

if (!CLIENT_EMAIL || !PRIVATE_KEY || subscriptionUrls.length < 2)
  throw new Error('Missing required environment variables.')

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
    it('should create and sync a calendar subscription', async () => {
      const url = subscriptionUrls[0]
      expect(await isValidSubscription(client, { url })).toBe(true)
    }, FETCH_TIMEOUT)
    
    it('should sync multiple calendar subscriptions', async () => {
      for (const url of subscriptionUrls) {
        expect(await isValidSubscription(client, { url })).toBe(true)
      }
    }, FETCH_TIMEOUT)
  })
})
