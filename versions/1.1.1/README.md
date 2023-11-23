<!-- BEGIN VARIABLES -->
[banner]: https://github.com/gabrielecanepa/google-calendar-subscriptions/blob/main/.github/assets/banner.png?raw=true
[manage-keys]: https://github.com/gabrielecanepa/google-calendar-subscriptions/blob/main/.github/assets/manage-keys.png?raw=true
[npm-badge]: https://img.shields.io/npm/v/google-calendar-subscriptions?logo=npm&color=cb3837
[github-badge]: https://img.shields.io/github/v/release/gabrielecanepa/google-calendar-subscriptions?logo=github&color=f5f5f5
[ci-badge]: https://img.shields.io/github/actions/workflow/status/gabrielecanepa/google-calendar-subscriptions/validate-commits.yml?color=56aa56
<!-- END VARIABLES -->

![][banner]

# Google Calendar Subscriptions

[![][npm-badge]](https://npmjs.com/package/google-calendar-subscriptions)
[![][github-badge]](https://github.com/gabrielecanepa/google-calendar-subscriptions/pkgs/npm/google-calendar-subscriptions)
[![][ci-badge]](https://github.com/gabrielecanepa/google-calendar-subscriptions)

Google Calendar Subscriptions is an npm module that extends the [Google Calendar client](https://github.com/googleapis/google-api-nodejs-client/tree/main/src/apis/calendar) with types and methods to define, manipulate and synchronize calendar subscriptions.

### Why? 🤔

Calendar subscriptions are a great tool, but:
- The information they provide is sometimes limited and not formatted as we wish
- They are static and cannot be modified or enriched with additional data
- The user does not own subscription calendars, which cannot be managed or shared
- Synchronizations can't be controlled manually and happen at predefined intervals (usually 24 hours)
  
In combination with CI tools like [GitHub Actions](#ci-and-github-actions), this module aims to solve these problems by providing a simple way to define, create and sync calendar subscriptions.

## Installation

```sh
yarn add google-calendar-subscriptions
```

or

```sh
npm i google-calendar-subscriptions
```

## Usage

### Quickstart

Authenticate to the client using a service account, as described in the [Authentication section](#authentication).

```js
import { auth, calendar } from 'google-calendar-subscriptions'

const client = calendar({
  version: 'v3',
  auth: new auth.GoogleAuth({
    credentials: {
      client_email: '<service-account-email>',
      private_key: '<service-account-key>'
    },
    scopes: ['https://www.googleapis.com/auth/calendar']
  })
})
```

Define a subscription following its [schema](#schemasubscription):

```js
const newSubscription = {
  // Optional name that will be used to create the related calendar.
  summary: 'My Subscription',
  // Optional ID.
  id: 'my-subscription',
  // Email of the calendar owner.
  // Without an owner, the calendar will be available only to the service account.
  owner: 'john.doe@gmail.com'
  // URL of the calendar feed.
  subscriptionUrl: 'https://example.com/events.ics',
  // Function to customize the events.
  fn: events => events.map(event => ({
    ...event,
    summary: event.summary.toUpperCase(),
  }))
}
```

Create a calendar linked to the subscription using the [`insert` method](#calendarsubscriptionsinsertparams-paramsresourcesubscriptionsinsert-options-methodoptions--promiseschemasubscription):
  
```js
// Create a calendar and sync the specified subscription.
const subscription = await client.subscriptions.insert({ 
  requestBody: newSubscription 
})

// The subscription will contain the ID of the newly created calendar.
console.log(subscription)
// Output:
// {
//   calendarId: "*************@group.calendar.google.com",
//   fn: "<stringified-function>",
//   id: "my-subscription",
//   owner: "john.doe@gmail.com",
//   summary: "My Subscription",
//   url: "https://example.com/events.ics"
// }

// Retrieve the calendar events with the `events.list` method.
const { data: { items } } = await calendar.events.list({ 
  calendarId: subscription.calendarId 
})

// And check if the function was correctly applied.
console.log(items.every(item => item.summary === item.summary.toUpperCase())) // => true
```

You can now start syncing the subscription using the [`sync` method](#calendarsubscriptionssyncparams-paramsresourcesubscriptionssync-options-methodoptions--promisevoid):

```js
await client.subscriptions.sync({ 
  requestBody: subscription 
})
```

Subscription functions can be either synchronous or asynchronous:

```js
const newAsyncSubscription = {
  subscriptionUrl: 'https://example.com/events.ics',
  fn: async events => {
    const { data } = await fetch(`https://example.com/resource`)
    return events.map(event => {
      // use the fetched data to modify your events...
    })
  },
}

const asyncSubscription = await client.subscriptions.create({ 
  requestBody: newAsyncSubscription 
})
```

Multiple subscriptions can also be synced at once, and calendars can be cleared before syncing:

```js
await client.subscriptions.sync({ 
  requestBody: [
    subscription, 
    asyncSubscription
  ],
  options: { 
    clear: true 
  }
})
```

### Authentication

Head over to your Google Cloud console, create a [new project](https://console.cloud.google.com/projectcreate) and [enable the Google Calendar API](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com).

Create a [new service account](https://console.cloud.google.com/iam-admin/serviceaccounts/create) and grant it owner permissions. Finally, select `Manage keys` and create a new JSON key:

![][manage-keys]

A file will be downloaded to your computer. Use the `client_email` and `private_key` values to [authenticate to the client](#quickstart).

### CI and GitHub Actions

A GitHub Action to automatically sync subscriptions is currently under development and will be released soon!

## API

The following API extends and overrides values defined by the Google Calendar client. The original definitions can be found [here](https://github.com/googleapis/google-api-nodejs-client/blob/main/src/apis/calendar/v3.ts).

### Client

#### `auth: AuthPlus`

[AuthPlus](https://cloud.google.com/nodejs/docs/reference/googleapis-common/latest/googleapis-common/authplus) object exported from the original client.

#### `calendar(options: Options): Calendar`

Function returning a Google Calendar client with subscription functionalities.

#### `Calendar.subscriptions.insert(params?: Params$Resource$Subscriptions$Insert, options?: MethodOptions) => Promise<Schema$Subscription>`

Method to create a calendar and sync the specified subscription.

#### `Calendar.subscriptions.sync(params?: Params$Resource$Subscriptions$Sync, options?: MethodOptions) => Promise<void>`

Method to synchronize the specified subscriptions.

### Types

#### `calendar_v3`

Namespace of the Google Calendar client with additional subscription definitions (omitted in this API documentation).

#### `Calendar`

Google Calendar client including an additional [subscriptions resource](#calendar_v3resourcesubscriptions).

#### `Schema$Subscription`

Definition of a calendar subscription.

```ts
{
  /**
   * ID of the calendar hosting the subscription.
   */
  calendarId?: string
  /**
   * Description of the subscription.
   */
  description?: string
  /**
   * Function to transform events before syncing the subscription.
   */
  fn?: (events: calendar_v3.Schema$Event[]) => calendar_v3.Schema$Event[] | Promise<calendar_v3.Schema$Event[]>
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
   */
  summary?: string
  /**
   * URL of the calendar subscription.
   */
  url: string
}
```

#### `Resource$Subscriptions`

Subscriptions resource extending the original client.

```ts
{
  /**
   * Creates a calendar and syncs the specified subscriptions.
   */
  insert: (params?: Params$Resource$Subscriptions$Insert, options?: MethodOptions) => Promise<Schema$Subscription>
  /**
   * Syncs the specified subscription.
   */
  sync: (params?: Params$Resource$Subscriptions$Sync, options?: MethodOptions) => Promise<void>
}
```

#### `Params$Resource$Subscriptions$Insert`

Parameters of the [`insert`](#calendarsubscriptionsinsertparams-paramsresourcesubscriptionsinsert-options-methodoptions--promiseschemasubscription) method.

```ts
{
  /**
   * Request body metadata.
   */
  requestBody?: Schema$Subscription
}
```

#### `Params$Resource$Subscriptions$Sync`

Parameters of the [`sync`](#calendarsubscriptionssyncparams-paramsresourcesubscriptionssync-options-methodoptions--promisevoid) method.


```ts
{
  /**
   * Request body metadata.
   */
  requestBody?: Schema$Subscription | Schema$Subscription[]
  options?: {
    /**
     * Whether to clear the calendar before syncing the subscription.
     */
    clear?: boolean
  }
}
```

## Development

Clone the repository using Git or the GitHub CLI:

```sh
git clone git@github.com:gabrielecanepa/google-calendar-subscriptions.git
# or
gh repo clone gabrielecanepa/google-calendar-subscriptions
```

Install the dependencies with your preferred package manager and activate the Husky hooks:

```sh
npm i
# or
yarn
```

To run the tests, rename `.env.example` to `.env` and fill it with your credentials. Some sample calendars to be used as `TEST_SUBSCRIPTIONS_URLS` are available [here](https://gist.github.com/gabrielecanepa/5235760f3e2ab3fb7e8a68257d98ae6a).

## Releases

See [`CHANGELOG.md`](CHANGELOG.md) and the [releases page](https://github.com/gabrielecanepa/google-calendar-subscriptions/releases).

## License

[MIT](LICENSE)
