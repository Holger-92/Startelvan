import { getUserTeams, getTeamWithPlayers, deleteTeam, getTeamByShareCode } from '../lib/teams.js';

export function createTeamsModal(onTeamSelect) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';

  async function renderTeamsList() {
    const { data: teams, error } = await getUserTeams();

    if (error) {
      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-header">
            <h2>Mina lag</h2>
            <button class="modal-close" id="closeModal">&times;</button>
          </div>
          <div class="modal-body">
            <p class="error-message">Kunde inte ladda lag: ${error.message}</p>
          </div>
        </div>
      `;
      return;
    }

    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h2>Mina lag</h2>
          <button class="modal-close" id="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="teams-grid">
            ${teams && teams.length > 0 ? teams.map(team => `
              <div class="team-card" data-team-id="${team.id}">
                <div class="team-card-header">
                  <h3>${team.name}</h3>
                  <span class="team-formation">${team.formation}</span>
                </div>
                <div class="team-card-footer">
                  <button class="btn btn-small btn-primary" data-action="load">Öppna</button>
                  <button class="btn btn-small btn-danger" data-action="delete">Ta bort</button>
                </div>
                <div class="team-card-meta">
                  ${new Date(team.updated_at).toLocaleDateString('sv-SE')}
                </div>
              </div>
            `).join('') : '<p class="empty-state">Inga lag sparade än. Skapa ditt första lag!</p>'}
          </div>

          <div class="modal-section">
            <h3>Ladda delat lag</h3>
            <form id="loadSharedForm" class="shared-form">
              <input type="text" id="shareCode" placeholder="Ange delningskod" maxlength="8" pattern="[A-Z0-9]{8}">
              <button type="submit" class="btn btn-secondary">Ladda lag</button>
            </form>
          </div>
        </div>
      </div>
    `;

    modal.querySelector('#closeModal').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    const loadSharedForm = modal.querySelector('#loadSharedForm');
    loadSharedForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const shareCode = modal.querySelector('#shareCode').value.trim().toUpperCase();

      if (shareCode.length !== 8) {
        alert('Delningskoden måste vara 8 tecken');
        return;
      }

      const { data: sharedTeam, error } = await getTeamByShareCode(shareCode);
      if (error || !sharedTeam) {
        alert('Kunde inte hitta lag med den koden');
        return;
      }

      modal.remove();
      onTeamSelect(sharedTeam, true);
    });

    modal.querySelectorAll('[data-action="load"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const teamId = btn.closest('.team-card').dataset.teamId;
        const { data: team, error } = await getTeamWithPlayers(teamId);

        if (error || !team) {
          alert('Kunde inte ladda laget');
          return;
        }

        modal.remove();
        onTeamSelect(team, false);
      });
    });

    modal.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Är du säker på att du vill ta bort detta lag?')) {
          return;
        }

        const teamId = btn.closest('.team-card').dataset.teamId;
        const { error } = await deleteTeam(teamId);

        if (error) {
          alert('Kunde inte ta bort laget');
          return;
        }

        renderTeamsList();
      });
    });
  }

  renderTeamsList();
  return modal;
}

export function createShareModal(shareCode) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';

  const shareUrl = `${window.location.origin}/?share=${shareCode}`;

  modal.innerHTML = `
    <div class="modal-dialog modal-small">
      <div class="modal-header">
        <h2>Dela ditt lag</h2>
        <button class="modal-close" id="closeModal">&times;</button>
      </div>
      <div class="modal-body">
        <p>Dela denna kod med andra för att låta dem se ditt lag:</p>
        <div class="share-code-display">
          <span class="share-code">${shareCode}</span>
          <button class="btn btn-secondary" id="copyCode">Kopiera</button>
        </div>
        <p class="share-help">Eller dela länken:</p>
        <div class="share-url-display">
          <input type="text" readonly value="${shareUrl}" id="shareUrl">
          <button class="btn btn-secondary" id="copyUrl">Kopiera länk</button>
        </div>
      </div>
    </div>
  `;

  modal.querySelector('#closeModal').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector('#copyCode').addEventListener('click', () => {
    navigator.clipboard.writeText(shareCode);
    const btn = modal.querySelector('#copyCode');
    btn.textContent = 'Kopierad!';
    setTimeout(() => btn.textContent = 'Kopiera', 2000);
  });

  modal.querySelector('#copyUrl').addEventListener('click', () => {
    navigator.clipboard.writeText(shareUrl);
    const btn = modal.querySelector('#copyUrl');
    btn.textContent = 'Kopierad!';
    setTimeout(() => btn.textContent = 'Kopiera länk', 2000);
  });

  return modal;
}

export function createSaveModal(currentTeam, onSave, options = {}) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';

  const defaultFormation = options.defaultFormation || currentTeam?.formation || '4-3-3';

  modal.innerHTML = `
    <div class="modal-dialog modal-small">
      <div class="modal-header">
        <h2>${currentTeam ? 'Uppdatera lag' : 'Spara nytt lag'}</h2>
        <button class="modal-close" id="closeModal">&times;</button>
      </div>
      <div class="modal-body">
        <form id="saveTeamForm">
          <div class="form-group">
            <label for="teamName">Lagnamn</label>
            <input type="text" id="teamName" value="${currentTeam?.name || 'Mitt Lag'}" required>
          </div>
          <div class="form-group">
            <label for="formation">Formation</label>
            <input type="text" id="formation" value="${defaultFormation}" placeholder="4-3-3">
          </div>
          <div class="error-message" id="saveError"></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="cancelSave">Avbryt</button>
            <button type="submit" class="btn btn-primary">${currentTeam ? 'Uppdatera' : 'Spara'}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const form = modal.querySelector('#saveTeamForm');
  const errorDiv = modal.querySelector('#saveError');

  modal.querySelector('#closeModal').addEventListener('click', () => modal.remove());
  modal.querySelector('#cancelSave').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.textContent = '';

    const name = form.teamName.value.trim();
    const formation = form.formation.value.trim();

    const result = await onSave(name, formation);

    if (result.success) {
      modal.remove();
    } else {
      errorDiv.textContent = result.error || 'Kunde inte spara laget';
    }
  });

  return modal;
}
