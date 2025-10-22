import './style.css';
import './modern-ui.css';
import { AuthManager, createAuthUI } from './components/auth.js';
import { createTeamsModal, createShareModal, createSaveModal } from './components/teams-modal.js';
import { createTeam, updateTeam, getUserTeams, savePlayers, enableTeamSharing, getTeamWithPlayers } from './lib/teams.js';
import './app.js';

window.modernApp = {
  authManager: null,
  currentTeam: null,
  currentTeamData: null,

  async init() {
    this.authManager = new AuthManager();

    this.authManager.onAuthChange((user) => {
      this.updateUI(user);
    });

    this.setupEventListeners();
    this.checkShareCodeInURL();

    await this.authManager.init();
  },

  checkShareCodeInURL() {
    const params = new URLSearchParams(window.location.search);
    const shareCode = params.get('share');

    if (shareCode && shareCode.length === 8) {
      setTimeout(() => {
        if (this.authManager.isAuthenticated()) {
          const modal = createTeamsModal((team, isShared) => {
            this.loadTeamData(team, isShared);
          });
          document.getElementById('modalContainer').appendChild(modal);

          const shareInput = modal.querySelector('#shareCode');
          if (shareInput) {
            shareInput.value = shareCode.toUpperCase();
            modal.querySelector('#loadSharedForm').dispatchEvent(new Event('submit'));
          }
        }
      }, 500);
    }
  },

  updateUI(user) {
    const authButton = document.getElementById('authButton');
    const userSection = document.getElementById('userSection');

    if (user) {
      userSection.innerHTML = `
        <span class="user-email">${user.email}</span>
        <button class="btn btn-text" id="signOutButton">Logga ut</button>
      `;

      document.getElementById('signOutButton').addEventListener('click', async () => {
        await this.authManager.signOut();
      });

      document.getElementById('teamsButton').disabled = false;
      document.getElementById('newTeamButton').disabled = false;
      document.getElementById('saveButton').disabled = false;
      document.getElementById('shareButton').disabled = false;

      this.loadLastTeam();
    } else {
      userSection.innerHTML = `
        <button class="btn btn-text" id="authButton">Logga in</button>
      `;

      document.getElementById('authButton').addEventListener('click', () => {
        this.showAuthModal();
      });

      document.getElementById('teamsButton').disabled = true;
      document.getElementById('newTeamButton').disabled = true;
      document.getElementById('saveButton').disabled = true;
      document.getElementById('shareButton').disabled = true;
    }
  },

  showAuthModal() {
    const authUI = createAuthUI(this.authManager);
    document.getElementById('modalContainer').appendChild(authUI);
  },

  setupEventListeners() {
    document.getElementById('authButton')?.addEventListener('click', () => {
      this.showAuthModal();
    });

    document.getElementById('teamsButton').addEventListener('click', () => {
      if (!this.authManager.isAuthenticated()) {
        this.showAuthModal();
        return;
      }

      const modal = createTeamsModal((team, isShared) => {
        this.loadTeamData(team, isShared);
      });
      document.getElementById('modalContainer').appendChild(modal);
    });

    document.getElementById('newTeamButton').addEventListener('click', () => {
      if (!this.authManager.isAuthenticated()) {
        this.showAuthModal();
        return;
      }

      this.createNewTeam();
    });

    document.getElementById('saveButton').addEventListener('click', () => {
      if (!this.authManager.isAuthenticated()) {
        this.showAuthModal();
        return;
      }

      this.saveCurrentTeam();
    });

    document.getElementById('shareButton').addEventListener('click', () => {
      if (!this.authManager.isAuthenticated()) {
        this.showAuthModal();
        return;
      }

      this.shareCurrentTeam();
    });

    document.getElementById('flipButton').addEventListener('click', () => {
      const switchBtn = document.querySelector('.js-switch');
      if (switchBtn) {
        switchBtn.click();
      }
    });
  },

  async loadLastTeam() {
    const { data: teams } = await getUserTeams();
    if (teams && teams.length > 0) {
      const lastTeam = teams[0];
      const { data: fullTeam } = await getTeamWithPlayers(lastTeam.id);
      if (fullTeam) {
        this.currentTeam = fullTeam;
        this.updateTeamName(fullTeam.name);
        this.loadPlayersToField(fullTeam.players);
      }
    }
  },

  async createNewTeam() {
    const { data: team, error } = await createTeam();

    if (error || !team) {
      alert('Kunde inte skapa nytt lag');
      return;
    }

    this.currentTeam = team;
    this.updateTeamName(team.name);

    if (window.__fe && window.__fe.dom && window.__fe.dom.clearField) {
      window.__fe.dom.clearField();
    }
  },

  loadTeamData(team, isShared) {
    this.currentTeam = isShared ? null : team;
    this.currentTeamData = team;
    this.updateTeamName(team.name);

    if (team.players) {
      this.loadPlayersToField(team.players);
    }
  },

  loadPlayersToField(players) {
    if (!window.__fe || !window.__fe.data) return;

    setTimeout(() => {
      const app = window.__fe;

      players.forEach(player => {
        const playerData = {
          id: player.id,
          name: player.name,
          pos: player.position,
          shirt: player.shirt_number,
          x: player.x_position,
          y: player.y_position,
          asset: player.image_url,
          dob: player.date_of_birth,
          height: player.height,
          origin: player.origin,
          games: player.games,
          goals: player.goals
        };

        if (app.dom && app.dom.addPlayerFromData) {
          app.dom.addPlayerFromData(playerData, 'home');
        }
      });
    }, 500);
  },

  updateTeamName(name) {
    document.getElementById('currentTeamName').textContent = name || 'Mitt Lag';
  },

  async saveCurrentTeam() {
    const players = this.getCurrentPlayers();

    if (!players || players.length === 0) {
      alert('Lägg till spelare på planen först');
      return;
    }

    if (this.currentTeam) {
      const { error } = await savePlayers(this.currentTeam.id, players);

      if (error) {
        alert('Kunde inte spara laget');
        return;
      }

      alert('Laget har uppdaterats!');
    } else {
      const modal = createSaveModal(null, async (name, formation) => {
        const { data: team, error: teamError } = await createTeam(name, formation);

        if (teamError || !team) {
          return { success: false, error: 'Kunde inte skapa lag' };
        }

        const { error: playersError } = await savePlayers(team.id, players);

        if (playersError) {
          return { success: false, error: 'Kunde inte spara spelare' };
        }

        this.currentTeam = team;
        this.updateTeamName(team.name);
        alert('Laget har sparats!');

        return { success: true };
      });

      document.getElementById('modalContainer').appendChild(modal);
    }
  },

  async shareCurrentTeam() {
    if (!this.currentTeam) {
      alert('Spara laget först innan du delar det');
      return;
    }

    const players = this.getCurrentPlayers();
    if (!players || players.length === 0) {
      alert('Lägg till spelare på planen först');
      return;
    }

    await savePlayers(this.currentTeam.id, players);

    const { data: team, error } = await enableTeamSharing(this.currentTeam.id);

    if (error || !team) {
      alert('Kunde inte aktivera delning');
      return;
    }

    this.currentTeam = team;

    const modal = createShareModal(team.share_code);
    document.getElementById('modalContainer').appendChild(modal);
  },

  getCurrentPlayers() {
    if (!window.__fe || !window.__fe.data) return [];

    const players = window.__fe.data.players?.home || [];

    return players.filter(p => p && p.name);
  }
};

window.modernApp.init();
