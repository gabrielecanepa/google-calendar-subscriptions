import { auth, calendar_v3 } from '@googleapis/calendar'
import { getAPI, GoogleConfigurable, ServiceOptions } from 'googleapis-common'
import subscriptions from './subscriptions'

const VERSIONS = {
  v3: calendar_v3.Calendar,
}

/**
 * Returns a Google Calendar client with extended subscription functionality.
 * 
 * @example
 * ```ts
 * const {google} = require('googleapis');
 * const {calendar} = require('google-calendar-subscriptions');
 * 
 * async function main() {
 *   const auth = new google.auth.GoogleAuth({
 *     // Scopes can be specified either as an array or as a single, space-delimited string.
 *     scopes: ['https://www.googleapis.com/auth/calendar'],
 *   });
 *
 *   // Acquire an auth client, and bind it to all future calls.
 *   const authClient = await auth.getClient();
 *   google.options({auth: authClient});
 *   
 *   // Do the magic.
 *   const res = await calendar.subscriptions.insert({...});
 *   console.log(res.data);
 * }
 *
 * main().catch(e => {
 *   console.error(e);
 *   throw e;
 * });
 *
 * ```
 */
export function calendar(version: 'v3'): calendar_v3.Calendar
export function calendar(options: calendar_v3.Options): calendar_v3.Calendar
// eslint-disable-next-line func-style
export function calendar<T = calendar_v3.Calendar>(this: GoogleConfigurable, versionOrOptions: 'v3' | calendar_v3.Options): T {
  const api = getAPI<T>('calendar', versionOrOptions as string | ServiceOptions, VERSIONS, this)
  return {
    ...api,
    subscriptions: Object.keys(subscriptions).reduce((subscriptionsObj, fn) => ({
      ...subscriptionsObj,
      [fn]: (...args) => subscriptions[fn](api, ...args),
    }), {}),
  }
}

export { auth, calendar_v3 }
