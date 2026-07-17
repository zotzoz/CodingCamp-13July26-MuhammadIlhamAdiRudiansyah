# Requirements Document

## Introduction

The To-Do List Life Dashboard is a single-page web application built with HTML, CSS, and Vanilla JavaScript.
It serves as a personal productivity hub that combines a real-time clock and greeting, a customizable focus timer,
a persistent to-do list, and a quick links manager — all presented in a vibrant Purple Glassmorphism visual theme.
All data is persisted entirely on the client side via the browser's Local Storage API with no server or external
framework dependencies.

---

## Glossary

- **Dashboard**: The single-page application composed of all widgets rendered in index.html.
- **App**: The Dashboard application as a whole.
- **LocalStorage**: The browser's `window.localStorage` API used for client-side data persistence.
- **Greeting_Widget**: The top `<header>` card displaying time, date, and a personalized greeting.
- **Focus_Timer**: The countdown timer widget rendered in a `<section>` element.
- **Todo_List**: The task management widget rendered in a `<section>` element.
- **Quick_Links**: The saved hyperlinks widget rendered in a `<section>` or `<article>` element.
- **Task**: A to-do item consisting of a description string and a completion status boolean.
- **Link**: A quick-access item consisting of a display name string and a URL string.
- **Pill_Button**: A styled rounded button used to render a saved Link.
- **Duplicate_Task**: A Task whose description, when lowercased and trimmed, matches an existing Task in the list.
- **Custom_Duration**: A user-specified focus timer duration in whole minutes, between 1 and 99 inclusive.
- **Username**: A string representing the user's display name, stored in LocalStorage.

---

## Requirements

### Requirement 1: Technical Stack and File Structure

**User Story:** As a developer, I want a strictly constrained technology stack and folder structure, so that the
project remains simple, portable, and maintainable without external dependencies.

#### Acceptance Criteria

1. THE App SHALL be implemented using only HTML, CSS, and Vanilla JavaScript with no external frameworks,
   libraries, or build tools.
2. THE App SHALL consist of exactly three files: `index.html`, `css/style.css`, and `js/app.js`.
3. THE App SHALL use the browser's Local Storage API as the sole mechanism for data persistence.
4. WHEN rendered in Chrome, Firefox, Edge, or Safari, THE App SHALL display and function correctly with a
   fully responsive layout.

---

### Requirement 2: Semantic HTML and Accessibility

**User Story:** As a developer, I want the markup to follow semantic HTML conventions and accessibility
guidelines, so that the application is screen-reader compatible and structurally meaningful.

#### Acceptance Criteria

1. THE App SHALL use semantic HTML elements — `<header>`, `<main>`, `<section>`, `<article>`, `<time>`,
   and appropriate form elements — instead of generic `<div>` wrappers for structural layout.
2. THE App SHALL associate every interactive input with either a `<label>` element or an `aria-label`
   attribute so that assistive technologies can identify each control.
3. THE App SHALL NOT use a `<div>` as the primary structural wrapper for any top-level widget card.

---

### Requirement 3: CSS Architecture and Visual Theme

**User Story:** As a developer, I want a well-organized CSS file and a consistent Purple Glassmorphism theme,
so that the application is visually appealing and easy to maintain.

#### Acceptance Criteria

1. THE App SHALL define all theme colors, spacing values, and typography sizes as CSS custom properties
   inside a `:root` block.
2. THE `css/style.css` file SHALL be organized with the following comment sections in order:
   `RESET & BASE STYLES`, `CSS VARIABLES`, `LAYOUT & CONTAINER`, `GLASSMORPHISM CARDS`,
   `COMPONENTS & WIDGETS`, `INTERACTIVE STATES`, `RESPONSIVE MEDIA QUERIES`.
3. THE App SHALL render a rich deep purple-to-indigo gradient as the full-viewport background.
4. THE App SHALL render each widget card with a translucent bright purple/lavender glass effect using
   `backdrop-filter: blur` of at least `12px`, a semi-transparent background of approximately
   `rgba(230, 200, 255, 0.15)`, a border of approximately `rgba(255, 255, 255, 0.25)`, and
   `border-radius` of at least `16px`.
5. THE App SHALL render all primary text in high-contrast white or light lavender against the dark
   gradient background.
6. THE App SHALL apply smooth CSS transitions to all interactive button hover states consistent with
   the purple glass theme.

---

### Requirement 4: Greeting and Live Clock Widget

**User Story:** As a user, I want to see the current time, date, and a personalized greeting, so that I have
an at-a-glance awareness of the time of day when I open the dashboard.

#### Acceptance Criteria

1. WHEN the App loads, THE Greeting_Widget SHALL display the current time in `HH:MM:SS` format and update
   the display every 1000 milliseconds.
2. WHEN the App loads, THE Greeting_Widget SHALL display the current date in `Day, Month DD, YYYY` format
   (e.g., "Wednesday, July 16, 2025").
3. WHEN the local hour is between 5 and 11 inclusive, THE Greeting_Widget SHALL display the greeting prefix
   "Good Morning".
4. WHEN the local hour is between 12 and 16 inclusive, THE Greeting_Widget SHALL display the greeting prefix
   "Good Afternoon".
5. WHEN the local hour is between 17 and 23 inclusive, OR the local hour is between 0 and 4 inclusive,
   THE Greeting_Widget SHALL display the greeting prefix "Good Evening".
6. THE Greeting_Widget SHALL display an editable name field that the user can type into to set the Username.
7. WHEN the user modifies the name field, THE Greeting_Widget SHALL save the updated Username to LocalStorage
   immediately.
8. WHEN the App loads and a Username exists in LocalStorage, THE Greeting_Widget SHALL populate the name
   field with the saved Username.

---

### Requirement 5: Focus Timer Widget

**User Story:** As a user, I want a countdown focus timer with Start, Stop, and Reset controls, so that I
can manage focused work sessions directly from the dashboard.

#### Acceptance Criteria

1. WHEN the App loads, THE Focus_Timer SHALL display a default countdown duration of 25 minutes and 00 seconds.
2. WHEN the user activates the Start control, THE Focus_Timer SHALL begin counting down one second per second.
3. WHEN the user activates the Stop control WHILE the timer is running, THE Focus_Timer SHALL pause the
   countdown at the current remaining time.
4. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop any active countdown and restore
   the display to the currently configured duration.
5. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically.
6. THE Focus_Timer SHALL provide a UI control that allows the user to input a Custom_Duration in whole minutes.
7. WHEN the user sets a Custom_Duration and activates the Reset control, THE Focus_Timer SHALL display and
   use the Custom_Duration as the new starting value.
8. IF the user inputs a Custom_Duration outside the range of 1 to 99 minutes, THEN THE Focus_Timer SHALL
   reject the value and retain the previously configured duration.

---

### Requirement 6: To-Do List Widget

**User Story:** As a user, I want to add, complete, and delete tasks in a persistent to-do list, so that I
can track my daily responsibilities from the dashboard.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a text input and an Add button for creating new Tasks.
2. WHEN the user submits a new task description via the Add button or the Enter key, THE Todo_List SHALL
   append a new Task to the list with completion status set to false.
3. WHEN a Task is added, THE Todo_List SHALL persist all Tasks to LocalStorage immediately.
4. WHEN the App loads, THE Todo_List SHALL retrieve and render all Tasks previously stored in LocalStorage.
5. WHEN the user activates the checkbox for a Task, THE Todo_List SHALL toggle the completion status of
   that Task and apply a line-through style to the task description text.
6. WHEN a Task's completion status is toggled, THE Todo_List SHALL persist the updated Tasks to LocalStorage.
7. WHEN the user activates the Delete button for a Task, THE Todo_List SHALL remove that Task from the list
   and persist the updated Tasks to LocalStorage.
8. WHEN the user attempts to add a Duplicate_Task, THE Todo_List SHALL prevent the addition, maintain the
   current task list state, and display a non-intrusive warning message.
9. WHEN the user attempts to add a task with an empty or whitespace-only description, THE Todo_List SHALL
   prevent the addition and maintain the current task list state.

---

### Requirement 7: Quick Links Widget

**User Story:** As a user, I want to save, display, and remove quick-access hyperlinks, so that I can reach
my most-used websites directly from the dashboard.

#### Acceptance Criteria

1. THE Quick_Links widget SHALL provide a "Link Name" text input and a "URL" text input along with an
   "Add Link" button.
2. WHEN the user activates the "Add Link" button with a non-empty Link Name and a non-empty URL, THE
   Quick_Links widget SHALL create a new Link and render it as a Pill_Button.
3. WHEN a Link is created, THE Quick_Links widget SHALL persist all Links to LocalStorage immediately.
4. WHEN the App loads, THE Quick_Links widget SHALL retrieve and render all Links previously stored in
   LocalStorage as Pill_Buttons.
5. WHEN the user activates a Pill_Button, THE Quick_Links widget SHALL open the associated URL in a new
   browser tab.
6. WHEN the user activates the delete control on a Pill_Button, THE Quick_Links widget SHALL remove the
   associated Link from the list and persist the updated Links to LocalStorage.
7. IF the user activates the "Add Link" button with an empty Link Name or an empty URL, THEN THE Quick_Links
   widget SHALL prevent the addition and maintain the current link list state.
