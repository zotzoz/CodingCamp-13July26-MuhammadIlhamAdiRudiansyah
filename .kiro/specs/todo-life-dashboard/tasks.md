# Implementation Plan: To-Do List Life Dashboard

## Overview

Implement the single-page productivity dashboard in three plain files (`index.html`, `css/style.css`,
`js/app.js`) using only HTML, CSS, and Vanilla JavaScript. Each task builds incrementally on the previous,
starting from the base file structure and working through each widget until everything is wired together and
fully functional.

---

## Tasks

- [x] 1. Scaffold project structure and base HTML skeleton
  - Create `index.html` with `<!DOCTYPE html>`, `<html lang>`, `<head>` (charset, viewport, title, CSS link),
    and `<body>` containing `<header>`, `<main>`, and a `<script src="js/app.js" defer>` tag.
  - Inside `<main>` add three `<section>` elements with descriptive `id` attributes:
    `id="focus-timer"`, `id="todo-list"`, `id="quick-links"`.
  - Add `aria-label` attributes to each section so assistive technologies can identify them.
  - Create `css/style.css` as an empty file and `js/app.js` as an empty file.
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 2. Implement CSS architecture and Purple Glassmorphism theme
  - [x] 2.1 Add CSS reset, base styles, and `:root` CSS variables block
    - Define variables for: `--bg-gradient-start`, `--bg-gradient-end`, `--card-bg`, `--card-border`,
      `--card-blur`, `--card-radius`, `--text-primary`, `--text-muted`, `--accent-purple`,
      `--accent-lavender`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--font-size-sm`,
      `--font-size-base`, `--font-size-lg`, `--font-size-xl`.
    - Add universal box-sizing reset and body margin/padding reset.
    - _Requirements: 3.1, 3.2_
  - [x] 2.2 Add layout grid, glassmorphism card styles, and typography
    - Set `body` background to a `linear-gradient` using the two purple gradient variables filling full
      viewport height (`min-height: 100vh`).
    - Style `.card` (applied to `<header>` and each `<section>`) with `backdrop-filter: blur(12px)`,
      semi-transparent background (~`rgba(230, 200, 255, 0.15)`), border (`rgba(255,255,255,0.25)`),
      `border-radius: 16px`, and a soft purple box-shadow.
    - Set primary text color to white/light-lavender using the CSS variable.
    - _Requirements: 3.3, 3.4, 3.5_
  - [x] 2.3 Add interactive states and responsive media queries sections
    - Add smooth `transition` rules (e.g., `transition: all 0.2s ease`) on buttons for hover effects.
    - Add a `@media (max-width: 768px)` block that collapses the grid to a single column.
    - _Requirements: 3.6, 1.4_

- [x] 3. Implement the Storage module in `app.js`
  - Write the `Storage` IIFE object with three methods: `save(key, value)`, `load(key, fallback)`,
    and `remove(key)`.
  - `save` wraps `localStorage.setItem` with `JSON.stringify`; catches `QuotaExceededError` and logs
    a console warning.
  - `load` wraps `localStorage.getItem` and `JSON.parse` in a try/catch, returning `fallback` on any
    error or when the key is absent.
  - _Requirements: 1.3, Error handling_

  - [ ]* 3.1 Write property test for Storage round-trip
    - **Property 7 (partial): Task list persistence round-trip**
    - For any serialisable value written via `Storage.save(key, v)`, `Storage.load(key, null)` should
      return a deep-equal copy of `v`.
    - **Validates: Requirements 6.3, 6.4, 7.3, 7.4**

- [x] 4. Implement GreetingWidget (clock, date, greeting, username)
  - [x] 4.1 Implement `formatTime(date)` and `formatDate(date)` pure functions
    - `formatTime` returns `HH:MM:SS` using `padStart(2, '0')` on hours, minutes, seconds.
    - `formatDate` returns a string in `Day, Month DD, YYYY` format using `toLocaleDateString('en-US', {...})`.
    - _Requirements: 4.1, 4.2_
  - [ ]* 4.2 Write property test for date formatting (Property 1)
    - **Property 1: Date formatting is structurally correct**
    - For any `Date` object, `formatDate(date)` should return a string matching the pattern
      `/^[A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}$/`.
    - **Validates: Requirements 4.2**
  - [x] 4.3 Implement `getGreetingPrefix(hour)` pure function
    - Returns `"Good Morning"` for hours 5–11, `"Good Afternoon"` for 12–16, `"Good Evening"` otherwise.
    - _Requirements: 4.3, 4.4, 4.5_
  - [ ]* 4.4 Write property test for greeting prefix (Property 2)
    - **Property 2: Greeting prefix is determined by hour**
    - For any integer hour in [0, 23], `getGreetingPrefix(h)` should return the correct string per the
      three ranges defined in requirements 4.3–4.5.
    - **Validates: Requirements 4.3, 4.4, 4.5**
  - [x] 4.5 Implement `GreetingWidget.init(containerEl)` and DOM wiring
    - Start `setInterval` (1000 ms) calling `formatTime` and updating the `<time>` element.
    - Render date once using `formatDate`.
    - Compute greeting prefix and render alongside the username input field.
    - On `input` event on the name field, call `Storage.save('dashboard_username', value)`.
    - On init, call `Storage.load('dashboard_username', '')` and set the input field value.
    - _Requirements: 4.1, 4.6, 4.7, 4.8_
  - [ ]* 4.6 Write property test for username round-trip (Property 3)
    - **Property 3: Username round-trip (save and restore)**
    - For any non-empty string `u`, pre-seeding `dashboard_username` then calling `GreetingWidget.init()`
      should result in the name input displaying `u`.
    - **Validates: Requirements 4.7, 4.8**

- [x] 5. Checkpoint — verify Greeting Widget
  - Ensure all greeting tests pass, ask the user if questions arise.

- [x] 6. Implement FocusTimerWidget
  - [x] 6.1 Implement timer state and core countdown logic
    - Maintain `state = { remaining: 1500, configured: 1500, running: false, intervalId: null }`.
    - `start()`: set `running = true`, begin `setInterval` decrementing `remaining` every 1000 ms;
      when `remaining` reaches 0, clear interval and set `running = false`.
    - `stop()`: clear interval, set `running = false`.
    - `reset()`: call `stop()`, set `remaining = state.configured`, update display.
    - `formatCountdown(seconds)`: returns `MM:SS` string.
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 6.2 Implement custom duration input and validation
    - Parse the custom duration input value as an integer.
    - If `d < 1` or `d > 99` or `isNaN(d)`, do not update `state.configured`.
    - Otherwise set `state.configured = d * 60` and call `reset()`.
    - _Requirements: 5.6, 5.7, 5.8_
  - [ ]* 6.3 Write property test for timer reset round-trip (Property 4)
    - **Property 4: Timer reset displays configured duration**
    - For any integer `d` in [1, 99], setting `configured = d * 60` then calling `reset()` should result
      in `formatCountdown(state.remaining)` returning the string `${String(d).padStart(2,'0')}:00`.
    - **Validates: Requirements 5.4, 5.7**
  - [ ]* 6.4 Write property test for out-of-range rejection (Property 5)
    - **Property 5: Timer rejects out-of-range custom duration**
    - For any integer `d` where `d < 1` or `d > 99`, calling `setCustomDuration(d)` should leave
      `state.configured` unchanged.
    - **Validates: Requirements 5.8**
  - [x] 6.5 Wire FocusTimerWidget DOM (buttons, display, input)
    - Bind click events for Start, Stop, Reset buttons to the corresponding functions.
    - Bind the custom duration `<input type="number">` with `min="1"` and `max="99"`.
    - On init, call `reset()` to render the default display.
    - _Requirements: 5.1–5.8_

- [x] 7. Implement TodoListWidget
  - [x] 7.1 Implement `addTask(desc)`, `deleteTask(id)`, `toggleTask(id)` pure logic functions
    - `addTask`: trim `desc`, reject if empty (`desc.trim() === ""`), reject if duplicate
      (`tasks.some(t => t.desc.toLowerCase().trim() === desc.toLowerCase().trim())`),
      otherwise push `{ id: Date.now().toString(), desc: desc.trim(), completed: false }`.
    - `deleteTask`: filter out the task with matching `id`.
    - `toggleTask`: map tasks, flipping `completed` on the matching `id`.
    - After each mutating operation, call `Storage.save('dashboard_todos', tasks)`.
    - _Requirements: 6.2, 6.3, 6.5, 6.6, 6.7, 6.8, 6.9_
  - [ ]* 7.2 Write property test: adding valid task grows list by 1 (Property 6)
    - **Property 6: Adding a valid task grows the list by one**
    - For any task list state and any non-empty, non-duplicate description `s`, after `addTask(s)`,
      `tasks.length` should be previous length + 1 and the new task should have `completed === false`.
    - **Validates: Requirements 6.2**
  - [ ]* 7.3 Write property test: task persistence round-trip (Property 7)
    - **Property 7: Task list persistence round-trip**
    - For any array of valid Task objects pre-seeded into `localStorage`, `TodoListWidget.init()` should
      produce a tasks array equal to the seeded array.
    - **Validates: Requirements 6.3, 6.4**
  - [ ]* 7.4 Write property test: toggle is an involution (Property 8)
    - **Property 8: Task completion toggle is an involution**
    - For any task `t`, `toggleTask` applied twice should return `t.completed` to its original value.
    - **Validates: Requirements 6.5, 6.6**
  - [ ]* 7.5 Write property test: delete removes task (Property 9)
    - **Property 9: Deleting a task reduces list length by one and removes from storage**
    - For any task in the list, `deleteTask(t.id)` should reduce `tasks.length` by 1 and remove the
      task from `localStorage`.
    - **Validates: Requirements 6.7**
  - [ ]* 7.6 Write property test: duplicate rejection (Property 10)
    - **Property 10: Duplicate task is rejected without mutating state**
    - For any existing task description `d`, attempting to add a description that matches `d` after
      lowercase+trim should leave `tasks.length` unchanged.
    - **Validates: Requirements 6.8**
  - [ ]* 7.7 Write property test: whitespace rejection (Property 11)
    - **Property 11: Whitespace-only task description is rejected**
    - For any string `s` where `s.trim() === ""`, `addTask(s)` should leave `tasks.length` unchanged.
    - **Validates: Requirements 6.9**
  - [x] 7.8 Implement TodoListWidget DOM rendering and event wiring
    - `renderTasks()`: clear the task list `<ul>`, re-render all tasks as `<li>` elements each containing
      a `<input type="checkbox">`, a `<span>` with the description, and a delete `<button>`.
    - Apply `text-decoration: line-through` inline style when `completed === true`.
    - Show/hide a warning `<p aria-live="polite">` for the duplicate case.
    - On init, call `Storage.load('dashboard_todos', [])` to restore state, then `renderTasks()`.
    - Bind Add button and Enter key press on the input field.
    - _Requirements: 6.1, 6.4, 6.5, 6.8_

- [x] 8. Checkpoint — verify TodoList Widget
  - Ensure all todo list tests pass, ask the user if questions arise.

- [x] 9. Implement QuickLinksWidget
  - [x] 9.1 Implement `addLink(name, url)` and `deleteLink(id)` pure logic functions
    - `addLink`: reject if `name.trim() === ""` or `url.trim() === ""`, otherwise push
      `{ id: Date.now().toString(), name: name.trim(), url: url.trim() }` to `links`.
    - `deleteLink`: filter out the link with matching `id`.
    - After each mutation, call `Storage.save('dashboard_links', links)`.
    - _Requirements: 7.2, 7.3, 7.6, 7.7_
  - [ ]* 9.2 Write property test: adding valid link grows pill count (Property 12)
    - **Property 12: Adding a valid link grows the pill count by one**
    - For any non-empty `name` and non-empty `url`, `addLink(name, url)` should increase `links.length`
      by 1 and `Storage.load('dashboard_links')` should contain the new link.
    - **Validates: Requirements 7.2, 7.3**
  - [ ]* 9.3 Write property test: link persistence round-trip (Property 13)
    - **Property 13: Link list persistence round-trip**
    - For any array of Link objects pre-seeded into `localStorage`, `QuickLinksWidget.init()` should
      render that exact number of Pill_Buttons.
    - **Validates: Requirements 7.4**
  - [ ]* 9.4 Write property test: delete link reduces count (Property 14)
    - **Property 14: Deleting a link reduces pill count by one**
    - For any link in the list, `deleteLink(l.id)` should reduce `links.length` by 1 and remove the
      link from `localStorage`.
    - **Validates: Requirements 7.6**
  - [ ]* 9.5 Write property test: empty input prevents addition (Property 15)
    - **Property 15: Empty name or URL prevents link addition**
    - For any `(name, url)` pair where either is empty after trimming, `addLink` should leave
      `links.length` unchanged.
    - **Validates: Requirements 7.7**
  - [x] 9.6 Implement QuickLinksWidget DOM rendering and event wiring
    - `renderLinks()`: clear the links container, re-render all links as `<button class="pill">` elements
      each containing the link name and an `<span aria-label="Delete link">×</span>` delete trigger.
    - Bind the "Add Link" button click to `addLink` using the two input field values, then call
      `renderLinks()`.
    - Bind pill click (not on the `×` span) to `window.open(link.url, '_blank', 'noopener,noreferrer')`.
    - Bind delete span click to `deleteLink(id)` then `renderLinks()`.
    - On init, call `Storage.load('dashboard_links', [])` and `renderLinks()`.
    - _Requirements: 7.1, 7.4, 7.5, 7.6_

- [x] 10. Wire all widgets and finalize `app.js` and `index.html`
  - [x] 10.1 Add `init()` function and `DOMContentLoaded` listener in `app.js`
    - Call `GreetingWidget.init(document.querySelector('header'))`.
    - Call `FocusTimerWidget.init(document.querySelector('#focus-timer'))`.
    - Call `TodoListWidget.init(document.querySelector('#todo-list'))`.
    - Call `QuickLinksWidget.init(document.querySelector('#quick-links'))`.
    - _Requirements: All_
  - [x] 10.2 Complete `index.html` with all semantic child elements for each widget
    - Inside `<header>`: add `<time>` for clock, `<p>` for date, `<p>` for greeting, `<input>` with
      `aria-label="Your name"` for username.
    - Inside `#focus-timer`: add `<p>` for countdown display, Start/Stop/Reset `<button>` elements with
      `aria-label` attributes, `<input type="number" aria-label="Custom duration in minutes">`.
    - Inside `#todo-list`: add `<form>` with `<input aria-label="New task">` and Add `<button>`,
      a warning `<p aria-live="polite">`, and a `<ul>` for task items.
    - Inside `#quick-links`: add `<form>` with two `<input>` fields (aria-labeled), an Add `<button>`,
      and a `<div>` container for pill buttons.
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 10.3 Apply `.card` class and layout grid to `<header>` and all `<section>` elements
    - Add `class="card"` to `<header>` and each `<section>`.
    - Ensure the `<main>` element uses CSS Grid with `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`.
    - Verify each widget card has the correct glassmorphism appearance.
    - _Requirements: 3.3, 3.4, 1.4_

- [x] 11. Final Checkpoint — full integration
  - Ensure all tests pass, ask the user if questions arise.
  - Manually verify in a browser: clock ticks, greeting updates with name, timer counts down and resets,
    tasks persist across page reload, quick links open in new tabs.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build.
- Property tests use **fast-check** and **Vitest** with JSDOM; run with `npx vitest --run`.
- Each property test file corresponds to one widget module.
- All logic functions (`formatDate`, `getGreetingPrefix`, `addTask`, `deleteTask`, etc.) must be exported
  from `app.js` (or extracted to a separate module) to be unit-testable.
- Checkpoints ensure the build is verified at logical milestones before moving forward.
