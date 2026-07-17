# Design Document: To-Do List Life Dashboard

## Overview

The To-Do List Life Dashboard is a single-page, zero-dependency productivity application. It is delivered as
three plain files — `index.html`, `css/style.css`, and `js/app.js` — with no build step. All runtime state is
managed in memory and persisted to the browser's `localStorage`. The UI is divided into four widget cards
arranged in a responsive grid over a purple-to-indigo gradient background using a Glassmorphism aesthetic.

The JavaScript architecture follows a module pattern: each widget is encapsulated in its own IIFE (Immediately
Invoked Function Expression) object inside `app.js`, sharing a central `Storage` utility and a lightweight
`EventBus` for cross-widget notifications. No framework is needed because the widget surface area is small and
interactions are local.

---

## Architecture

```
index.html
  └── <header>   Greeting_Widget
  └── <main>
        └── <section>   Focus_Timer widget
        └── <section>   Todo_List widget
        └── <section>   Quick_Links widget

css/style.css
  └── :root CSS variables
  └── Reset & base
  └── Layout grid
  └── Glassmorphism card styles
  └── Per-widget component styles
  └── Interactive states / transitions
  └── Responsive breakpoints

js/app.js
  └── Storage module     (localStorage read/write helpers)
  └── GreetingWidget     (clock, date, greeting, username)
  └── FocusTimerWidget   (countdown, controls, custom duration)
  └── TodoListWidget     (tasks, duplicate check, persistence)
  └── QuickLinksWidget   (links, pill rendering, persistence)
  └── init()             (wires all widgets on DOMContentLoaded)
```

### Data Flow

```
User Interaction
      │
      ▼
Widget Handler (pure logic)
      │
      ├──► DOM Update  (re-render relevant section of the card)
      │
      └──► Storage.save(key, value)  ──► localStorage.setItem
```

On page load, each widget calls `Storage.load(key)` to restore its state, then renders the initial DOM.
No global mutable state is shared between widgets except through the `Storage` module.

---

## Components and Interfaces

### Storage Module

```js
const Storage = {
  save(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  load(key, fallback) {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  },
  remove(key) { localStorage.removeItem(key); }
};
```

Keys used:
| Key                  | Value type         | Widget            |
|----------------------|--------------------|-------------------|
| `dashboard_username` | `string`           | GreetingWidget    |
| `dashboard_todos`    | `Task[]`           | TodoListWidget    |
| `dashboard_links`    | `Link[]`           | QuickLinksWidget  |

### GreetingWidget

Responsibilities:
- Start a `setInterval` (1000 ms) that updates the time display.
- Render today's date once on load (date does not tick; a midnight-crossing edge case is out of scope).
- Compute and render the greeting prefix from `new Date().getHours()`.
- Bind `input` event on the username field to save to `localStorage` on every keystroke.
- Restore username from `localStorage` on init.

Public interface:
```js
GreetingWidget.init(containerEl)
```

### FocusTimerWidget

Responsibilities:
- Maintain internal state: `{ remaining: number, configured: number, running: boolean }`.
- Start/Stop controls toggle `setInterval` (1000 ms) that decrements `remaining`.
- When `remaining` reaches 0, clear the interval and update display to `00:00`.
- Reset restores `remaining` to `configured`.
- Custom duration input validates range [1, 99] before updating `configured`.

Public interface:
```js
FocusTimerWidget.init(containerEl)
```

Internal state is not persisted (timer resets on page reload by design).

### TodoListWidget

Responsibilities:
- Maintain `tasks: Task[]` in memory, synced to `localStorage`.
- Duplicate detection: `tasks.some(t => t.desc.toLowerCase().trim() === input.toLowerCase().trim())`.
- Empty/whitespace detection: `input.trim() === ""`.
- Re-render the full task list on every mutation (simple diffing is unnecessary at this scale).
- Show/hide a warning `<p>` element for the duplicate-detected case.

Public interface:
```js
TodoListWidget.init(containerEl)
```

### QuickLinksWidget

Responsibilities:
- Maintain `links: Link[]` in memory, synced to `localStorage`.
- Validate both name and URL are non-empty before adding.
- Render each link as a `<button>` pill with an embedded `<span>` delete trigger.
- Use `window.open(url, '_blank', 'noopener,noreferrer')` to open links.

Public interface:
```js
QuickLinksWidget.init(containerEl)
```

---

## Data Models

### Task

```js
/**
 * @typedef {Object} Task
 * @property {string} id       - Unique identifier, generated via `crypto.randomUUID()` or Date.now().toString()
 * @property {string} desc     - Task description text (trimmed, non-empty)
 * @property {boolean} completed - Whether the task is marked done
 */
```

Example:
```json
{
  "id": "1720123456789",
  "desc": "Buy groceries",
  "completed": false
}
```

### Link

```js
/**
 * @typedef {Object} Link
 * @property {string} id   - Unique identifier
 * @property {string} name - Display label for the pill button
 * @property {string} url  - Full URL string (user-provided, no validation beyond non-empty)
 */
```

Example:
```json
{
  "id": "1720123456000",
  "name": "GitHub",
  "url": "https://github.com"
}
```

### LocalStorage Schema

The `localStorage` schema for the full application:

```json
{
  "dashboard_username": "Alice",
  "dashboard_todos": [
    { "id": "...", "desc": "Buy groceries", "completed": false },
    { "id": "...", "desc": "Read book",      "completed": true  }
  ],
  "dashboard_links": [
    { "id": "...", "name": "GitHub", "url": "https://github.com" }
  ]
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system —
essentially, a formal statement about what the system should do. Properties serve as the bridge between
human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Date formatting is structurally correct

*For any* `Date` object, `formatDate(date)` SHALL return a string whose structure matches the pattern
`<Weekday>, <Month> <Day>, <Year>` (e.g., "Wednesday, July 16, 2025"), where Weekday and Month are full
English words and Day and Year are numeric.

**Validates: Requirements 4.2**

---

### Property 2: Greeting prefix is determined by hour

*For any* integer hour `h` in the range [0, 23], `getGreetingPrefix(h)` SHALL return:
- `"Good Morning"` when `h` is in [5, 11]
- `"Good Afternoon"` when `h` is in [12, 16]
- `"Good Evening"` when `h` is in [0, 4] or [17, 23]

**Validates: Requirements 4.3, 4.4, 4.5**

---

### Property 3: Username round-trip (save and restore)

*For any* non-empty username string `u`, if `u` is written to `localStorage` under `dashboard_username`
before `GreetingWidget.init()` is called, the username input field SHALL display `u` after initialization.

**Validates: Requirements 4.7, 4.8**

---

### Property 4: Timer reset displays configured duration

*For any* Custom_Duration `d` in the range [1, 99] minutes, after setting `d` as the configured duration
and calling reset, the Focus_Timer display SHALL show the string `MM:SS` representation of `d` minutes and
`00` seconds.

**Validates: Requirements 5.4, 5.7**

---

### Property 5: Timer rejects out-of-range custom duration

*For any* integer `d` where `d < 1` or `d > 99`, the Focus_Timer SHALL reject the input and the configured
duration SHALL remain unchanged.

**Validates: Requirements 5.8**

---

### Property 6: Adding a valid task grows the list by one

*For any* task list state and any non-empty, non-duplicate task description `s`, calling `addTask(s)` SHALL
result in `tasks.length` increasing by exactly 1, and the new task SHALL have `completed === false`.

**Validates: Requirements 6.2**

---

### Property 7: Task list persistence round-trip

*For any* array of `Task` objects written to `localStorage` under `dashboard_todos` before
`TodoListWidget.init()` is called, the widget SHALL render exactly those tasks in the DOM after
initialization. Conversely, for any task added at runtime, `Storage.load('dashboard_todos')` SHALL
contain that task immediately after the add operation.

**Validates: Requirements 6.3, 6.4**

---

### Property 8: Task completion toggle is an involution

*For any* task `t`, calling `toggleComplete(t)` twice SHALL leave `t.completed` equal to its original
value. After a single call, `t.completed` SHALL be the boolean negation of its original value.

**Validates: Requirements 6.5, 6.6**

---

### Property 9: Deleting a task reduces list length by one and removes from storage

*For any* task `t` present in the task list, calling `deleteTask(t.id)` SHALL result in `tasks.length`
decreasing by exactly 1 and `Storage.load('dashboard_todos')` SHALL not contain any task with `id === t.id`.

**Validates: Requirements 6.7**

---

### Property 10: Duplicate task is rejected without mutating state

*For any* existing task with description `d` in the task list, attempting to add a task whose description,
when lowercased and trimmed, matches `d.toLowerCase().trim()`, SHALL leave `tasks.length` unchanged and
SHALL not modify `localStorage`.

**Validates: Requirements 6.8**

---

### Property 11: Whitespace-only task description is rejected

*For any* string `s` where `s.trim() === ""`, calling `addTask(s)` SHALL leave `tasks.length` unchanged.

**Validates: Requirements 6.9**

---

### Property 12: Adding a valid link grows the pill count by one

*For any* non-empty link name `n` and non-empty URL `u`, calling `addLink(n, u)` SHALL result in the
rendered pill count increasing by exactly 1, and `Storage.load('dashboard_links')` SHALL contain the
new link immediately.

**Validates: Requirements 7.2, 7.3**

---

### Property 13: Link list persistence round-trip

*For any* array of `Link` objects written to `localStorage` under `dashboard_links` before
`QuickLinksWidget.init()` is called, the widget SHALL render exactly that number of Pill_Buttons after
initialization.

**Validates: Requirements 7.4**

---

### Property 14: Deleting a link reduces pill count by one

*For any* link `l` present in the links list, calling `deleteLink(l.id)` SHALL result in the pill count
decreasing by exactly 1 and `Storage.load('dashboard_links')` SHALL not contain any link with `id === l.id`.

**Validates: Requirements 7.6**

---

### Property 15: Empty name or URL prevents link addition

*For any* pair `(name, url)` where `name.trim() === ""` OR `url.trim() === ""`, calling `addLink(name, url)`
SHALL leave the link list length unchanged.

**Validates: Requirements 7.7**

---

## Error Handling

| Scenario | Behavior |
|---|---|
| `localStorage` is full (`QuotaExceededError`) | Catch the error in `Storage.save()`, log to console, and show a brief toast/banner warning the user that the save failed. |
| `localStorage` contains corrupted JSON | `Storage.load()` wraps `JSON.parse` in a try/catch and returns the fallback value (empty array or empty string). |
| Custom timer duration is non-numeric | The `<input type="number">` combined with a `isNaN` guard prevents non-numeric values from being applied. |
| Link URL has no protocol | Accepted as-is (user responsibility); the link will open whatever string is provided. A future enhancement could prepend `https://`. |
| Task description is only whitespace | Caught before the duplicate check; `desc.trim() === ""` is checked first and the add operation is aborted. |

---

## Testing Strategy

### Approach

Because this application is written in Vanilla JavaScript without a module bundler, tests are written as
plain JavaScript using [**Vitest**](https://vitest.dev/) with JSDOM, which supports ES modules without a
build step and provides a real DOM environment. Pure logic functions (formatDate, getGreetingPrefix,
addTask, deleteTask, toggleComplete, addLink, deleteLink, Storage) are extracted so they can be unit- and
property-tested in isolation.

For property-based testing the library of choice is [**fast-check**](https://fast-check.io/) (works in
Node.js with zero framework dependencies). Each property test is configured to run a minimum of 100 iterations.

### Test Files

```
tests/
  greeting.test.js      — date format, greeting prefix, username round-trip
  focustimer.test.js    — reset round-trip, out-of-range rejection
  todolist.test.js      — add/delete/toggle/duplicate/whitespace properties
  quicklinks.test.js    — add/delete/empty-input properties
```

### Unit Tests (Example-Based)

- Verify timer display is "25:00" on init.
- Verify Start decrements display after mocked 1-second interval.
- Verify Stop freezes the display.
- Verify countdown auto-stops at "00:00".
- Verify `window.open` is called with correct arguments when a pill is clicked.
- Verify DOM contains expected semantic elements (`<header>`, `<main>`, `<section>`).

### Property-Based Tests

Each property in the Correctness Properties section above maps to one property-based test. Each test:
- Uses `fc.property(...)` from fast-check.
- Runs at least 100 iterations (`numRuns: 100`).
- Is tagged with a comment: `// Feature: todo-life-dashboard, Property N: <property text>`.

Property mapping:

| Test | Property | fast-check Arbitraries |
|---|---|---|
| `greeting.test.js` | Property 1 | `fc.date()` |
| `greeting.test.js` | Property 2 | `fc.integer({ min: 0, max: 23 })` |
| `greeting.test.js` | Property 3 | `fc.string({ minLength: 1 })` |
| `focustimer.test.js` | Property 4 | `fc.integer({ min: 1, max: 99 })` |
| `focustimer.test.js` | Property 5 | `fc.oneof(fc.integer({ max: 0 }), fc.integer({ min: 100 }))` |
| `todolist.test.js` | Property 6 | `fc.string({ minLength: 1 })` |
| `todolist.test.js` | Property 7 | `fc.array(fc.record({ id: fc.string(), desc: fc.string({minLength:1}), completed: fc.boolean() }))` |
| `todolist.test.js` | Property 8 | `fc.record({ id: fc.string(), desc: fc.string(), completed: fc.boolean() })` |
| `todolist.test.js` | Property 9 | `fc.array(...)` with at least 1 element |
| `todolist.test.js` | Property 10 | Existing desc + case variation arbitraries |
| `todolist.test.js` | Property 11 | `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` |
| `quicklinks.test.js` | Property 12 | `fc.string({minLength:1})` × 2 |
| `quicklinks.test.js` | Property 13 | `fc.array(fc.record({ id: fc.string(), name: fc.string({minLength:1}), url: fc.string({minLength:1}) }))` |
| `quicklinks.test.js` | Property 14 | Array with ≥1 link element |
| `quicklinks.test.js` | Property 15 | `fc.oneof(fc.constant(""), fc.string())` for one empty field |

### Balance Guidance

Unit tests cover: specific examples (25:00 default, Good Morning at 8 AM, link opens in new tab).
Property tests cover: all generalizable universal behaviors listed in Correctness Properties.
Together they provide comprehensive coverage without redundancy.
