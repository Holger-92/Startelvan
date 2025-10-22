import { supabase, signIn, signUp, signOut, getCurrentUser } from '../lib/supabase.js';

export class AuthManager {
  constructor() {
    this.user = null;
    this.onAuthChangeCallbacks = [];
    this.init();
  }

  async init() {
    this.user = await getCurrentUser();
    this.setupAuthListener();
    this.notifyAuthChange();
  }

  setupAuthListener() {
    supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        this.user = session?.user || null;
        this.notifyAuthChange();
      })();
    });
  }

  onAuthChange(callback) {
    this.onAuthChangeCallbacks.push(callback);
  }

  notifyAuthChange() {
    this.onAuthChangeCallbacks.forEach(callback => callback(this.user));
  }

  async signIn(email, password) {
    const { data, error } = await signIn(email, password);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, user: data.user };
  }

  async signUp(email, password) {
    const { data, error } = await signUp(email, password);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, user: data.user };
  }

  async signOut() {
    const { error } = await signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  isAuthenticated() {
    return !!this.user;
  }

  getUser() {
    return this.user;
  }
}

export function createAuthUI(authManager) {
  const container = document.createElement('div');
  container.className = 'auth-container';

  function renderSignIn() {
    container.innerHTML = `
      <div class="auth-modal">
        <div class="auth-dialog">
          <h2>Välkommen till Fotbollselvan</h2>
          <p class="auth-description">Logga in för att spara och dela dina lag</p>

          <form class="auth-form" id="signInForm">
            <div class="form-group">
              <label for="email">E-post</label>
              <input type="email" id="email" name="email" required autocomplete="email">
            </div>

            <div class="form-group">
              <label for="password">Lösenord</label>
              <input type="password" id="password" name="password" required autocomplete="current-password">
            </div>

            <div class="error-message" id="errorMessage"></div>

            <button type="submit" class="btn btn-primary">Logga in</button>
          </form>

          <div class="auth-footer">
            <p>Har du inget konto? <a href="#" id="showSignUp">Registrera dig</a></p>
          </div>
        </div>
      </div>
    `;

    const form = container.querySelector('#signInForm');
    const errorMessage = container.querySelector('#errorMessage');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMessage.textContent = '';

      const email = form.email.value;
      const password = form.password.value;

      const result = await authManager.signIn(email, password);
      if (!result.success) {
        errorMessage.textContent = result.error;
      } else {
        container.remove();
      }
    });

    container.querySelector('#showSignUp').addEventListener('click', (e) => {
      e.preventDefault();
      renderSignUp();
    });
  }

  function renderSignUp() {
    container.innerHTML = `
      <div class="auth-modal">
        <div class="auth-dialog">
          <h2>Skapa konto</h2>
          <p class="auth-description">Registrera dig för att spara och dela dina lag</p>

          <form class="auth-form" id="signUpForm">
            <div class="form-group">
              <label for="email">E-post</label>
              <input type="email" id="email" name="email" required autocomplete="email">
            </div>

            <div class="form-group">
              <label for="password">Lösenord</label>
              <input type="password" id="password" name="password" required minlength="6" autocomplete="new-password">
              <small>Minst 6 tecken</small>
            </div>

            <div class="error-message" id="errorMessage"></div>

            <button type="submit" class="btn btn-primary">Skapa konto</button>
          </form>

          <div class="auth-footer">
            <p>Har du redan ett konto? <a href="#" id="showSignIn">Logga in</a></p>
          </div>
        </div>
      </div>
    `;

    const form = container.querySelector('#signUpForm');
    const errorMessage = container.querySelector('#errorMessage');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMessage.textContent = '';

      const email = form.email.value;
      const password = form.password.value;

      const result = await authManager.signUp(email, password);
      if (!result.success) {
        errorMessage.textContent = result.error;
      } else {
        container.remove();
      }
    });

    container.querySelector('#showSignIn').addEventListener('click', (e) => {
      e.preventDefault();
      renderSignIn();
    });
  }

  renderSignIn();
  return container;
}
