<!-- BEGIN VARIABLES -->
[banner]: https://github.com/gabrielecanepa/google-calendar-subscriptions/blob/main/.github/assets/banner.png?raw=true
[manage-keys]: https://github.com/gabrielecanepa/google-calendar-subscriptions/blob/main/.github/assets/manage-keys.png?raw=true
[npm-badge]: https://img.shields.io/npm/v/google-calendar-subscriptions?logo=npm&color=cb3837
[github-badge]: https://img.shields.io/github/v/release/gabrielecanepa/google-calendar-subscriptions?logo=github&color=f5f5f5
[ci-badge]: https://img.shields.io/github/actions/workflow/status/gabrielecanepa/google-calendar-subscriptions/validate-commits.yml?color=56aa56
[types]: https://github.com/gabrielecanepa/google-calendar-subscriptions/blob/main/src/@types/@googleapis/calendar.d.ts
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
  
In combination with CI tools like [GitHub Actions](#github-actions-octocat), this module aims to solve these problems by providing a simple way to define, create and sync calendar subscriptions.

## Installation

```sh
yarn add google-calendar-subscriptions
```

or

```sh
npm i google-calendar-subscriptions
```

## Usage

Authenticate to the client using a [service account](#authentication).

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

Define a subscription following its [schema](#types):

```js
const newSubscription = {
  summary: 'My Subscription',
  id: 'my-subscription',
  owner: 'john.doe@gmail.com'
  subscriptionUrl: 'https://example.com/events.ics',
  fn: events => events.map(event => ({
    ...event,
    summary: event.summary.toUpperCase(),
  }))
}
```

Create a calendar linked to the subscription using [`insert`](#calendarsubscriptionsinsertparams-options):
  
```js
const subscription = await client.subscriptions.insert({ requestBody: newSubscription })

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
```

You can now start syncing the subscription using [`sync`](#calendarsubscriptionssyncparams-options):

```js
await client.subscriptions.sync({ requestBody: subscription })
```

Subscription functions can be either synchronous or asynchronous:

```js
const newAsyncSubscription = {
  subscriptionUrl: 'https://example.com/events.ics',
  fn: async events => {
    const { data } = await fetch(`https://example.com/resource`)
    
    return events.map(event => {
      // use fetched data to modify events...
    })
  },
}

const asyncSubscription = await client.subscriptions.create({ requestBody: newAsyncSubscription })
```

Multiple subscriptions can also be synced at once, and calendars can be cleared before syncing:

```js
await client.subscriptions.sync({ 
  requestBody: [subscription, asyncSubscription],
  options: { 
    clear: true,
  }
})
```

### Authentication

Head over to your Google Cloud console, create a [new project](https://console.cloud.google.com/projectcreate) and [enable the Google Calendar API](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com).

Create a [new service account](https://console.cloud.google.com/iam-admin/serviceaccounts/create) and grant it owner permissions. Finally, select `Manage keys` and create a new JSON key:

![][manage-keys]

A file will be downloaded to your computer. Use the `client_email` and `private_key` values to [authenticate to the client](#usage).

### CI 

#### GitHub Actions :octocat:

A GitHub Action to sync subscriptions programmatically is under development and will be released soon!

## API

The following API extends and overrides the [original definitions](https://github.com/googleapis/google-api-nodejs-client/blob/main/src/apis/calendar/v3.ts) of the Google Calendar client.

#### `calendar_v3`

Namespace of the Google Calendar client with additional subscription definitions.

#### `auth`

[AuthPlus](https://cloud.google.com/nodejs/docs/reference/googleapis-common/latest/googleapis-common/authplus) instance exported from the original client.

#### `calendar(options)`

Function returning a Calendar instance with subscription functionalities.

#### `Calendar.subscriptions.insert(params, options)`

Function creating and syncing a new subscription.

#### `Calendar.subscriptions.sync(params, options)`

Function synchronizing the specified subscriptions.

### Types

See [`calendar.d.ts`][types].

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

See [changelog](CHANGELOG.md) and [releases](https://github.com/gabrielecanepa/google-calendar-subscriptions/releases).

## License

[MIT](LICENSE)
