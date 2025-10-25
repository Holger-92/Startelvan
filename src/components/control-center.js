import { getFormation, getFormationKeys } from '../lib/formations.js';

function waitForEngine(callback, attempts = 0) {
  if (window.__fe?.dom) {
    callback(window.__fe);
    return;
  }

  if (attempts > 50) {
    return;
  }

  requestAnimationFrame(() => waitForEngine(callback, attempts + 1));
}

function applyFormation(key, { animate = true } = {}) {
  const formation = getFormation(key);
  waitForEngine((engine) => {
    if (typeof engine.dom.applyFormation === 'function') {
      engine.dom.applyFormation(formation, { animate });
    }
  });
}

function persistPreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    /* ignore storage errors */
  }
}

function readPreference(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value || fallback;
  } catch (err) {
    return fallback;
  }
}

function applyTheme(theme, buttons) {
  document.body.classList.remove('theme-day', 'theme-night', 'theme-neon');
  document.body.classList.add(`theme-${theme}`);
  if (buttons) {
    buttons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }
  persistPreference('fe:theme', theme);
}

export function initializeControlCenter({ onFormationSelect } = {}) {
  const mountNode = document.getElementById('controlCenter');
  if (!mountNode) {
    return {
      setFormation() {},
      setTheme() {}
    };
  }

  mountNode.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'control-panel';
  container.innerHTML = `
    <header class="control-panel__header">
      <h2>Matchkontroll</h2>
      <p>Finjustera formation, ljus och stämning för din spelplan.</p>
    </header>
    <section class="control-panel__section">
      <label for="formationSelect">Formation</label>
      <div class="control-select">
        <select id="formationSelect" aria-describedby="formationDescription"></select>
        <div class="control-select__description" id="formationDescription"></div>
      </div>
    </section>
    <section class="control-panel__section">
      <span class="control-panel__label">Planljus</span>
      <div class="control-panel__segmented" role="group" aria-label="Välj planljus">
        <button type="button" class="segmented-btn" data-theme="day">Dag</button>
        <button type="button" class="segmented-btn" data-theme="night">Kväll</button>
        <button type="button" class="segmented-btn" data-theme="neon">Neon</button>
      </div>
    </section>
  `;

  mountNode.appendChild(container);

  const formationSelect = container.querySelector('#formationSelect');
  const descriptionEl = container.querySelector('#formationDescription');
  const themeButtons = Array.from(container.querySelectorAll('[data-theme]'));

  getFormationKeys().forEach((key) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = key;
    formationSelect.appendChild(option);
  });

  const initialFormation = readPreference('fe:formation', '4-3-3');
  formationSelect.value = initialFormation;
  const initialDetails = getFormation(initialFormation);
  descriptionEl.textContent = initialDetails.description;

  const initialTheme = readPreference('fe:theme', 'night');
  applyTheme(initialTheme, themeButtons);

  formationSelect.addEventListener('change', (event) => {
    const key = event.target.value;
    const selected = getFormation(key);
    descriptionEl.textContent = selected.description;
    persistPreference('fe:formation', key);
    applyFormation(key);
    onFormationSelect?.(key);
  });

  themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      applyTheme(theme, themeButtons);
    });
  });

  applyFormation(initialFormation, { animate: false });
  onFormationSelect?.(initialFormation);

  return {
    setFormation(key, { suppressApply = false } = {}) {
      if (!key) {
        return;
      }
      const formation = getFormation(key);
      formationSelect.value = formation.name;
      descriptionEl.textContent = formation.description;
      persistPreference('fe:formation', formation.name);
      if (!suppressApply) {
        applyFormation(formation.name);
      }
    },
    setTheme(theme) {
      if (!theme) {
        return;
      }
      applyTheme(theme, themeButtons);
    }
  };
}
