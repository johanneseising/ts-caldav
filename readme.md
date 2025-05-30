# 📅 ts-caldav

> A lightweight, promise-based TypeScript CalDAV client for syncing calendar data in browser, Node.js, or React Native environments.

**ts-caldav** helps you interact with CalDAV servers — allowing you to fetch calendars, manage events, and synchronize changes with minimal effort. Great for building calendar apps or integrations.

---

## ✨ Features

- 🔐 Credential validation with CalDAV servers
- 🗂 Fetch calendar homes and individual calendars
- 📆 List, create, and delete events
- ♻️ Detect event changes using `getctag` and `etag`
- ⚡ Efficient sync with diff-based event updates
- 📦 Built for TypeScript, with full type safety

---

## 📦 Installation

```bash
npm install ts-caldav
# or
yarn add ts-caldav
```

---

## 🚀 Quick Start

```ts
import { CalDAVClient } from "ts-caldav";

const client = await CalDAVClient.create({
  baseUrl: "https://caldav.example.com",
  auth: {
    type: "basic",
    username: "myuser",
    password: "mypassword",
  }
});

// List calendars
const calendars = await client.getCalendars();

// Fetch events
const events = await client.getEvents(calendars[0].url);
```

---

## 🌍 Known Working CalDAV Servers

Here are some server endpoints that **ts-caldav** has been tested with:

| Provider      | Endpoint Example |
|:--------------|:------------------|
| **Google**    | `https://apidata.googleusercontent.com/` |
| **iCloud**    | `https://caldav.icloud.com/` |
| **Yahoo**     | `https://caldav.calendar.yahoo.com` |
| **GMX**       | `https://caldav.gmx.net` |

> 💡 **Note:** Some servers may require enabling CalDAV support or generating app-specific passwords (especially iCloud and Fastmail).

---

## 🛠 API Documentation

### `CalDAVClient.create(options)`

Creates and validates a new CalDAV client instance.

```ts
const client = await CalDAVClient.create({
  baseUrl: "https://caldav.example.com",
  auth: {
    type: "basic",
    username: "john",
    password: "secret",
  },
  logRequests: true,
});
```

---

### `getCalendars(): Promise<Calendar[]>`

Returns an array of available calendars for the authenticated user.

---

### `getEvents(calendarUrl: string): Promise<Event[]>`

Retrieves all events from a calendar.

---

### `createEvent(calendarUrl, eventData)`

Creates a new calendar event.

```ts
await client.createEvent(calendar.url, {
  summary: "Team Meeting",
  start: new Date(),
  end: new Date(Date.now() + 3600000), // +1h
});
```

---

### `deleteEvent(calendarUrl, eventUid)`

Deletes an event by UID.

```ts
await client.deleteEvent(calendar.url, "abc123");
```

---

### `syncChanges(calendarUrl, previousCtag, localEventRefs)`

Compares remote calendar state to local references using `getctag` and `etag`.

```ts
const result = await client.syncChanges(
  calendar.url,
  lastKnownCtag,
  [
    { href: "/calendar/event1.ics", etag: "123abc" },
    { href: "/calendar/event2.ics", etag: "456def" },
  ]
);

// result: { newEvents, updatedEvents, deletedEvents, changed, newCtag }
```

---

### `getEventsByHref(calendarUrl, hrefs: string[])`

Fetches full `.ics` data for the given event hrefs.

---

## 🔐 Auth Notes

- Uses **Basic Auth** (RFC 7617) and OAuth
- Works with most CalDAV servers: Google, iCloud, Fastmail, Nextcloud, Radicale

---

## 📚 Example Use Case: Sync Local Calendar

```ts
const result = await client.syncChanges(calendar.url, lastCtag, localEventRefs);

if (result.changed) {
  const newEvents = await client.getEventsByHref(calendar.url, [
    ...result.newEvents,
    ...result.updatedEvents,
  ]);

  updateLocalDatabase(newEvents, result.deletedEvents);
  saveNewCtag(result.newCtag);
}
```

---

## ⚠️ Limitations

- Does not support WebDAV `sync-token` (use `getctag` diffing instead)
- Currently limited to `VEVENT` components

---

## 🧪 Development

```bash
git clone https://github.com/yourname/ts-caldav.git
cd ts-caldav
npm install
npm run build
```

---

## 🤝 Contributing

Contributions are very welcome! Take a look at [CONTRIBUTING](./contributing.md) to get started.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](./license.txt) file for details.
