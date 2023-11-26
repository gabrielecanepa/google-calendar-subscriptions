/// <reference types="node" />
/* eslint-disable max-len, max-lines */

import {
  APIRequestContext,
  BaseExternalAccountClient,
  Compute,
  GoogleAuth,
  JWT,
  MethodOptions,
  OAuth2Client,
  UserRefreshClient,
} from 'googleapis-common'

declare module '@googleapis/calendar' {
  namespace calendar_v3 {
    interface StandardParameters {
      /**
       * Auth client or API Key for the request.
       */
      auth?: string | OAuth2Client | JWT | Compute | UserRefreshClient | BaseExternalAccountClient | GoogleAuth
      /**
       * Data format for the response.
       */
      alt?: string
      /**
       * Selector specifying which fields to include in a partial response.
       */
      fields?: string
      /**
       * API key. Your API key identifies your project and provides you with API access, quota, and reports. Required unless you provide an OAuth 2.0 token.
       */
      key?: string
      /**
       * OAuth 2.0 token for the current user.
       */
      oauth_token?: string
      /**
       * Returns response with indentations and line breaks.
       */
      prettyPrint?: boolean
      /**
       * An opaque string that represents a user for quota purposes. Must not exceed 40 characters.
       */
      quotaUser?: string
      /**
       * Deprecated. Please use quotaUser instead.
       */
      userIp?: string
    }

    /**
     * Definition of a calendar subscription.
     */
    export interface Schema$Subscription {
      /**
       * ID of the Google Calendar calendar hosting the subscription.
       * This field is omitted when using the `insert` method.
       * 
       * @example '*****************@group.calendar.google.com'
       */
      calendarId?: string
      /**
       * Description of the subscription.
       * When using `insert`, it will become the description of the calendar.
       */
      description?: string
      /**
       * Email of the service account creating the subscription.
       * 
       * @example 'user@service-account.iam.gserviceaccount.com'
       */
      email?: string
      /**
       * Function to transform events before syncing the subscription.
       * 
       * @example
       * 
       * ```js
       * function(events) {
       *   return events.map(event => ({ 
       *     ...event, 
       *     summary: 'An alternate summary'
       *   })
       * }
       * ```
       */
      fn?: (events: (calendar_v3.Schema$Event)[]) => calendar_v3.Schema$Event[] | Promise<calendar_v3.Schema$Event[]>
      /**
       * Identifier of the subscription.
       */
      id?: string
      /**
       * Email of the user subscribed to the calendar.
       */
      owner?: string
      /**
       * Title of the subscription.
       * When using `insert`, it will become the summary of the calendar.
       */
      summary?: string
      /**
       * URL of a calendar subscription.
       * 
       * @example 'https://example.com/calendar-subscription.ics'
       */
      url: string
    }

    export interface Params$Resource$Subscriptions$Insert extends StandardParameters {
      /**
       * Request body metadata.
       */
      requestBody?: Schema$Subscription
    }
    export interface Params$Resource$Subscriptions$Sync extends StandardParameters {
      /**
       * Request body metadata.
       */
      requestBody?: Schema$Subscription | Schema$Subscription[]
      /**
       * Options for syncing the subscription calendar.
       */
      options?: {
        /**
         * Whether to clear the calendar before syncing the subscription.
         */
        clear?: boolean
      }
    }

    export class Resource$Subscriptions {
      context: APIRequestContext
      constructor(context: APIRequestContext)
      /**
       * Creates a calendar and syncs the provided subscription.
       * If you're using this method to create a standard calendar, use `calendars.insert` instead.
       * 
       * @example
       * ```js
       * // Before running the sample:
       * // - Enable the API at:
       * //   https://console.developers.google.com/apis/api/calendar.googleapis.com
       * // - Install the npm module by running:
       * //   `$ npm install google-calendar-subscriptions`
       *
       * const {auth, calendar} = require('google-calendar-subscriptions');
       * 
       * async function main() {
       *   // Acquire a calendar client.
       *   const client = calendar({
       *     version: 'v3',
       *     auth: new auth.GoogleAuth({
       *       credentials: {
       *         client_email: 'client_email',
       *         private_key: 'private_key'
       *       },
       *       // Scopes can be specified either as an array or as a single, space-delimited string.
       *       scopes: ['https://www.googleapis.com/auth/calendar'],
       *     })
       *   });
       * 
       *   // Do the magic.
       *   const res = await client.subscriptions.insert({
       *     // Request body metadata.
       *     requestBody: {
       *       fn: events => {...},
       *       id: 'subscription_id',
       *       owner: 'subscription_owner',
       *       summary: 'subscription_summary',
       *       url: 'subscription_url'
       *     },
       *   });
       *   console.log(res.data);
       *
       *   // Example response
       *   // {
       *   //   calendar_id: 'calendar_id',
       *   //   fn: events => {...},
       *   //   id: 'subscription_id',
       *   //   owner: 'subscription_owner',
       *   //   summary: 'subscription_summary',
       *   //   url: 'subscription_url'
       *   // }
       * }
       *
       * main().catch(e => {
       *   console.error(e);
       *   throw e;
       * });
       *
       * ```
       *
       * @param params - Parameters for request.
       * @param options - Optionally override request options, such as `url`, `method`, and `encoding`.
       * @returns A promise that resolves to the updated subscription.
       */
      insert(params?: Params$Resource$Subscriptions$Insert, options?: MethodOptions): Promise<Schema$Subscription>
      /**
       * Syncs the provided subscription.
       * 
       * @example
       * ```js
       * // Before running the sample:
       * // - Enable the API at:
       * //   https://console.developers.google.com/apis/api/calendar.googleapis.com
       * // - Install the npm module by running:
       * //   `$ npm install google-calendar-subscriptions`
       *
       * import {auth, calendar} from 'google-calendar-subscriptions';
       * 
       * async function main() {
       *   // Acquire a calendar client.
       *   const client = calendar({
       *     version: 'v3',
       *     auth: new auth.GoogleAuth({
       *       credentials: {
       *         client_email: 'client_email',
       *         private_key: 'private_key'
       *       },
       *       // Scopes can be specified either as an array or as a single, space-delimited string.
       *       scopes: ['https://www.googleapis.com/auth/calendar'],
       *     })
       *   });
       * 
       *   // Do the magic.
       *   await client.subscriptions.sync({
       *     // Request body metadata.
       *     requestBody: {
       *       calendarId: 'calendar_id',
       *       fn: events => {...},
       *       owner: 'subscription_owner',
       *       url: 'subscription_url'
       *     },
       *   });
       * }
       *
       * main().catch(e => {
       *   console.error(e);
       *   throw e;
       * });
       *
       * ```
       *
       * @param params - Parameters for request.
       * @param options - Optionally override request options, such as `url`, `method`, and `encoding`.
       * @returns A promise that resolves to void.
       */
      sync(params?: Params$Resource$Subscriptions$Sync, options?: MethodOptions): Promise<void>
    }

    export interface Calendar {
      subscriptions: Resource$Subscriptions
    }
  }
}
