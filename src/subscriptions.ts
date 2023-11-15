import { calendar_v3 } from '.'
import { fetchCalendarDetails, fetchCalendarEvents, isSameEvent } from './utils'

const MAX_CALENDAR_RESULTS = 2_500

/**
 * Synchronizes a calendar subscription. 
 */
const syncSubscription = async (
  calendar: calendar_v3.Calendar,
  ...args: Parameters<calendar_v3.Calendar['subscriptions']['sync']>
): Promise<void> => {
  const [params, ...opts] = args
  const { requestBody: subscription, options } = params
  const { calendarId, fn, summary, url } = subscription as calendar_v3.Schema$Subscription

  const res = await calendar.events.list({ calendarId, maxResults: MAX_CALENDAR_RESULTS }, ...opts as any)
  const { items = [] } = res.data

  const events = await fetchCalendarEvents(url)

  if (options?.clear) {
    try {
      for (const item of items) {
        try {
          await calendar.events.delete({ calendarId, eventId: item.id })
        } catch (e) {
          console.error(`Failed to delete event ${item.id}. The following error occured.\n`, e)
          continue
        }
      }
    } catch (e) {
      console.error(`Failed to clear calendar ${summary}. The following error occured.\n`, e)
    }
  }

  const calendarEvents = fn ? await fn(events) : events

  for (const event of calendarEvents) {
    try {
      // Find the original event in the calendar.
      const googleEvent = items.find(item => item.id === event.id)
 
      // Create event if not existing.
      if (!googleEvent) {
        await calendar.events.insert({ calendarId, requestBody: event }, ...opts as any)
        continue
      }
      // Skip if equal.
      if (isSameEvent(googleEvent, event)) continue
      // Update if not equal.
      await calendar.events.update({ calendarId, eventId: event.id, requestBody: event }, ...opts as any)
    } catch (e) {
      console.error(`Failed to sync event ${event.summary}. The following error occured.\n`, e)
      continue
    }
  }
}

/**
 * Synchonizes multiple calendar subscriptions using common options.
 */
const syncSubscriptions = async (
  calendar: calendar_v3.Calendar,
  ...args: Parameters<calendar_v3.Calendar['subscriptions']['sync']>
): Promise<void> => {
  const [params, ...opts] = args
  const { requestBody, options } = params
  const subscriptions = requestBody as calendar_v3.Schema$Subscription[]

  for (const subscription of subscriptions) {
    const syncSubscriptionParams = { requestBody: subscription, options }
    await syncSubscription(calendar, syncSubscriptionParams, ...opts as any)
  }
}

export const insert = async (
  calendar: calendar_v3.Calendar,
  ...args: Parameters<calendar_v3.Calendar['subscriptions']['insert']>
): ReturnType<calendar_v3.Calendar['subscriptions']['insert']> => {
  const [params, ...opts] = args
  const {
    description = null,
    id = null,
    fn = null,
    owner = null,
    url,
    ...calendarParams
  } = params.requestBody

  const calendarDetails = await fetchCalendarDetails(url)

  const calendarRequestBody = {
    ...calendarParams,
    summary: calendarParams.summary || calendarDetails.summary,
    description: description || calendarDetails.description,
  }

  const { data: newCalendar } = await calendar.calendars.insert(
    { requestBody: calendarRequestBody },
    ...opts as any,
  )

  if (owner) {
    await calendar.acl.insert({
      calendarId: newCalendar.id,
      requestBody: {
        role: 'owner',
        scope: { type: 'user', value: owner },
      },
    })
  }

  const subscriptionRequestBody = {
    calendarId: newCalendar.id,
    description: calendarRequestBody.description,
    fn,
    id,
    owner,
    summary: calendarRequestBody.summary,
    url,
  }

  await syncSubscription(calendar, { requestBody: subscriptionRequestBody }, ...opts)

  return subscriptionRequestBody
}

export const sync = async (
  calendar: calendar_v3.Calendar,
  ...args: Parameters<calendar_v3.Calendar['subscriptions']['sync']>
): ReturnType<calendar_v3.Calendar['subscriptions']['sync']> => {
  const [params, ...opts] = args
  const { requestBody: subscription } = params

  Array.isArray(subscription)
    ? syncSubscriptions(calendar, params, ...opts as any)
    : syncSubscription(calendar, params, ...opts as any)
}

export default {
  insert,
  sync,
}
