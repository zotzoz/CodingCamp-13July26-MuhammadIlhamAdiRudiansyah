// =============================================================================
// STORAGE MODULE
// Wraps localStorage with JSON serialization and error handling.
// =============================================================================

const Storage = {
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Data may not be saved.');
      }
    }
  },
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};


// =============================================================================
// DATE / TIME HELPERS
// Pure functions — no side effects, no DOM access.
// =============================================================================

function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}


// =============================================================================
// GREETING HELPERS
// Pure functions — no side effects, no DOM access.
// =============================================================================

function getGreetingPrefix(hour) {
  if (hour >= 5 && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 16) return 'Good Afternoon';
  return 'Good Evening';
}


// =============================================================================
// GREETING WIDGET
// Handles: live clock, date display, time-based greeting, username persistence
// =============================================================================
const GreetingWidget = {
  init(containerEl) {
    const timeEl = containerEl.querySelector('[data-time]');
    const dateEl = containerEl.querySelector('[data-date]');
    const greetingEl = containerEl.querySelector('[data-greeting]');
    const nameInput = containerEl.querySelector('[data-name-input]');

    // 1. Ambil nama yang tersimpan
    const savedName = Storage.load('dashboard_username', '');
    nameInput.value = savedName;

    // 2. Render Awal
    this._tick(timeEl, greetingEl);
    dateEl.textContent = formatDate(new Date());

    // 3. Sembunyikan input box secara default jika nama sudah ada
    if (savedName.trim()) {
      nameInput.hidden = true;
    } else {
      greetingEl.hidden = true; // Sembunyikan teks sapaan jika nama masih kosong
    }

    // 4. Jalankan jam setiap detik
    setInterval(() => this._tick(timeEl, greetingEl), 1000);

    // 5. KETIKA TEKS SAPAAN DIKLIK: Munculkan input box untuk edit
    greetingEl.style.cursor = 'pointer';
    greetingEl.setAttribute('title', 'Click to change your name');
    greetingEl.addEventListener('click', () => {
      greetingEl.hidden = true;
      nameInput.hidden = false;
      nameInput.focus();
      nameInput.select(); // Otomatis memblok teks lama biar gampang dihapus
    });

    // 6. KETIKA INPUT SELESAI (Klik di luar kotak / Blur): Simpan dan sembunyikan kembali
    nameInput.addEventListener('blur', () => {
      const nameValue = nameInput.value.trim();
      Storage.save('dashboard_username', nameValue);
      this._updateGreeting(greetingEl, nameValue);
      
      // Sembunyikan input kembali, munculkan teks sapaan baru
      nameInput.hidden = true;
      greetingEl.hidden = false;
    });

    // 7. KETIKA MENEKAN ENTER: Picu fungsi blur di atas untuk menyimpan
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        nameInput.blur();
      }
    });
  },

  _tick(timeEl, greetingEl) {
    const now = new Date();
    timeEl.textContent = formatTime(now);
    
    // Hanya update teks jika sedang tidak dalam mode edit (tidak hidden)
    if (!greetingEl.hidden) {
      const nameInput = document.querySelector('[data-name-input]');
      this._updateGreeting(greetingEl, nameInput ? nameInput.value : '');
    }
  },

  _updateGreeting(greetingEl, name) {
    const prefix = getGreetingPrefix(new Date().getHours());
    // Jika nama dikosongkan oleh user, beri teks petunjuk agar bisa diklik lagi nanti
    greetingEl.textContent = name.trim()
      ? `${prefix}, ${name.trim()}!`
      : `${prefix}! (Click here to set name)`;
  }
};


// =============================================================================
// FOCUS TIMER WIDGET
// Handles: countdown timer, start/stop/reset, custom duration
// =============================================================================
const FocusTimerWidget = {
  state: {
    remaining: 25 * 60,
    configured: 25 * 60,
    running: false,
    intervalId: null
  },

  init(containerEl) {
    this._container = containerEl;
    this._displayEl = containerEl.querySelector('[data-timer-display]');
    this._startBtn = containerEl.querySelector('[data-timer-start]');
    this._stopBtn = containerEl.querySelector('[data-timer-stop]');
    this._resetBtn = containerEl.querySelector('[data-timer-reset]');
    this._durationInput = containerEl.querySelector('[data-timer-duration]');

    this._render();

    this._startBtn.addEventListener('click', () => this.start());
    this._stopBtn.addEventListener('click', () => this.stop());
    this._resetBtn.addEventListener('click', () => this.reset());
    this._durationInput.addEventListener('change', () => this._setCustomDuration());
  },

  start() {
    if (this.state.running) return;
    this.state.running = true;
    this.state.intervalId = setInterval(() => {
      this.state.remaining--;
      this._render();
      if (this.state.remaining <= 0) {
        this.stop();
        this.state.remaining = 0;
        this._render();
      }
    }, 1000);
  },

  stop() {
    clearInterval(this.state.intervalId);
    this.state.running = false;
    this.state.intervalId = null;
  },

  reset() {
    this.stop();
    this.state.remaining = this.state.configured;
    this._render();
  },

  _setCustomDuration() {
    const d = parseInt(this._durationInput.value, 10);
    if (isNaN(d) || d < 1 || d > 99) {
      this._durationInput.value = '';
      return;
    }
    this.state.configured = d * 60;
    this.reset();
  },

  _render() {
    this._displayEl.textContent = this._formatCountdown(this.state.remaining);
  },

  _formatCountdown(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }
};


// =============================================================================
// TODO LIST WIDGET
// Handles: add/edit/toggle/delete tasks, duplicate & whitespace validation, persistence
// =============================================================================
const TodoListWidget = {
  tasks: [],

  init(containerEl) {
    this._container = containerEl;
    this._input = containerEl.querySelector('[data-todo-input]');
    this._addBtn = containerEl.querySelector('[data-todo-add]');
    this._listEl = containerEl.querySelector('[data-todo-list]');
    this._warningEl = containerEl.querySelector('[data-todo-warning]');

    this.tasks = Storage.load('dashboard_todos', []);
    this._render();

    this._addBtn.addEventListener('click', () => this._handleAdd());
    this._input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._handleAdd();
    });
  },

  _handleAdd() {
    const desc = this._input.value;
    const result = this._addTask(desc);
    if (result === 'ok') {
      this._input.value = '';
      this._hideWarning();
    } else if (result === 'duplicate') {
      this._showWarning('A task with this name already exists.');
    }
  },

  _addTask(desc) {
    const trimmed = desc.trim();
    if (!trimmed) return 'empty';
    const isDuplicate = this.tasks.some(
      t => t.desc.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) return 'duplicate';
    this.tasks.push({ id: Date.now().toString(), desc: trimmed, completed: false });
    Storage.save('dashboard_todos', this.tasks);
    this._render();
    return 'ok';
  },

  _deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    Storage.save('dashboard_todos', this.tasks);
    this._render();
  },

  _toggleTask(id) {
    this.tasks = this.tasks.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    Storage.save('dashboard_todos', this.tasks);
    this._render();
  },

  _editTask(id, newDesc) {
    const trimmed = newDesc.trim();
    if (!trimmed) return; // Abaikan jika dikosongkan

    this.tasks = this.tasks.map(t =>
      t.id === id ? { ...t, desc: trimmed } : t
    );
    Storage.save('dashboard_todos', this.tasks);
  },

  _render() {
    this._listEl.innerHTML = '';
    this.tasks.forEach(task => {
      const li = document.createElement('li');

      // Checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.setAttribute('aria-label', `Mark "${task.desc}" as complete`);
      checkbox.addEventListener('change', () => this._toggleTask(task.id));

      // 1. ELEMEN TEKS UTAMA (Tampilan normal)
      const span = document.createElement('span');
      span.className = 'task-desc' + (task.completed ? ' completed' : '');
      span.textContent = task.desc;
      span.style.cursor = task.completed ? 'default' : 'pointer';

      // 2. ELEMEN INPUT EDIT (Tersembunyi secara default)
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.value = task.desc;
      editInput.style.display = 'none'; // Sembunyi dulu
      editInput.style.flex = '1';       // Mengambil ruang span yang digantikan
      editInput.style.background = 'rgba(255, 255, 255, 0.1)';
      editInput.style.border = '1px solid var(--accent-purple)';
      editInput.style.padding = '4px 8px';
      editInput.style.color = 'var(--text-primary)';
      editInput.style.borderRadius = '6px';
      editInput.style.outline = 'none';

      // KETIKA TEKS DIKLIK: Tukar tampilan ke Input Box (Hanya jika task belum selesai)
      if (!task.completed) {
        span.setAttribute('title', 'Click to edit task');
        span.addEventListener('click', () => {
          span.style.display = 'none';
          editInput.style.display = 'block';
          editInput.focus();
          editInput.select(); // Otomatis block teks lama
        });
      }

      // KETIKA SELESAI EDIT (Klik di luar / Blur)
      editInput.addEventListener('blur', () => {
        this._editTask(task.id, editInput.value);
        this._render(); // Render ulang biar posisi teks mengunci kembali
      });

      // KETIKA MENEKAN ENTER SAAT EDIT
      editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          editInput.blur(); // Memicu event 'blur' di atas
        }
      });

      // Tombol Hapus
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '✕';
      deleteBtn.setAttribute('aria-label', `Delete task "${task.desc}"`);
      deleteBtn.style.color = '#f87171';
      deleteBtn.addEventListener('click', () => this._deleteTask(task.id));

      // Susun elemen masuk ke dalam tag <li>
      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(editInput); // Diselipkan di tengah-tengah
      li.appendChild(deleteBtn);
      this._listEl.appendChild(li);
    });
  },

  _showWarning(msg) {
    this._warningEl.textContent = msg;
    this._warningEl.hidden = false;
  },

  _hideWarning() {
    this._warningEl.textContent = '';
    this._warningEl.hidden = true;
  }
};

// =============================================================================
// QUICK LINKS WIDGET
// Handles: add/delete links, pill rendering, open in new tab, persistence
// =============================================================================
const QuickLinksWidget = {
  links: [],

  init(containerEl) {
    this._container = containerEl;
    this._nameInput = containerEl.querySelector('[data-link-name]');
    this._urlInput = containerEl.querySelector('[data-link-url]');
    this._addBtn = containerEl.querySelector('[data-link-add]');
    this._linksContainer = containerEl.querySelector('[data-links-container]');

    this.links = Storage.load('dashboard_links', []);
    this._render();

    this._addBtn.addEventListener('click', () => this._handleAdd());
  },

  _handleAdd() {
    const name = this._nameInput.value.trim();
    const url = this._urlInput.value.trim();
    if (!name || !url) return;
    this.links.push({ id: Date.now().toString(), name, url });
    Storage.save('dashboard_links', this.links);
    this._nameInput.value = '';
    this._urlInput.value = '';
    this._render();
  },

  _deleteLink(id) {
    this.links = this.links.filter(l => l.id !== id);
    Storage.save('dashboard_links', this.links);
    this._render();
  },

  _render() {
    this._linksContainer.innerHTML = '';
    this.links.forEach(link => {
      const btn = document.createElement('button');
      btn.className = 'pill';
      btn.setAttribute('aria-label', `Open ${link.name}`);

      const nameSpan = document.createElement('span');
      nameSpan.textContent = link.name;

      const deleteSpan = document.createElement('span');
      deleteSpan.className = 'pill-delete';
      deleteSpan.textContent = '×';
      deleteSpan.setAttribute('aria-label', `Delete link "${link.name}"`);
      deleteSpan.setAttribute('role', 'button');
      deleteSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        this._deleteLink(link.id);
      });

      btn.appendChild(nameSpan);
      btn.appendChild(deleteSpan);
      btn.addEventListener('click', () => {
        window.open(link.url, '_blank', 'noopener,noreferrer');
      });

      this._linksContainer.appendChild(btn);
    });
  }
};


// =============================================================================
// APP INIT
// Wire all widgets on DOMContentLoaded
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  GreetingWidget.init(document.querySelector('header'));
  FocusTimerWidget.init(document.querySelector('#focus-timer'));
  TodoListWidget.init(document.querySelector('#todo-list'));
  QuickLinksWidget.init(document.querySelector('#quick-links'));
});