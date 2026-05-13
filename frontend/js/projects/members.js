// ─────────────────────────────────────────────────────────────
// Team members modal — view, add, remove
// ─────────────────────────────────────────────────────────────

function openManageMembersModal(projectId, members) {
  const renderList = () => members.map(m => `
    <tr>
      <td>
        ${esc(m.name)}
        <div style="color:var(--text-muted);font-size:12px">${esc(m.email)}</div>
      </td>
      <td>${roleBadge(m.role)}</td>
      <td>
        ${m.user_id !== state.user.id
          ? `<button class="btn btn-sm" style="background:#fee2e2;color:var(--danger)" onclick="removeMember(${projectId}, ${m.user_id})">Remove</button>`
          : '<span style="color:var(--text-muted);font-size:12px">You</span>'}
      </td>
    </tr>
  `).join('');

  openModal(`
    <h2>Team Members</h2>
    <div id="modal-err" class="error-msg hidden"></div>
    <table style="margin-bottom:16px">
      <thead><tr><th>Member</th><th>Role</th><th></th></tr></thead>
      <tbody id="members-list">${renderList()}</tbody>
    </table>
    <hr style="margin-bottom:16px;border:none;border-top:1px solid var(--border)"/>
    <h2 style="font-size:15px;margin-bottom:12px">Add Member</h2>
    <div class="form-group">
      <label>Email Address</label>
      <input id="m-email" type="email" placeholder="user@example.com"/>
    </div>
    <div class="form-group">
      <label>Role</label>
      <select id="m-role">
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost"   onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="addMember(${projectId})">Add Member</button>
    </div>
  `);
}

async function addMember(projectId) {
  const email = document.getElementById('m-email').value.trim();
  const role  = document.getElementById('m-role').value;
  const errEl = document.getElementById('modal-err');

  if (!email) {
    errEl.textContent = 'Email is required.';
    errEl.classList.remove('hidden');
    return;
  }

  try {
    const data = await apiAddMember(projectId, email, role);
    toast(`${data.member.name} added!`);
    closeModal();
    renderProject(projectId);
  } catch (err) {
    errEl.textContent = err.error || 'Failed to add member.';
    errEl.classList.remove('hidden');
  }
}

async function removeMember(projectId, userId) {
  if (!confirm('Remove this member?')) return;
  try {
    await apiRemoveMember(projectId, userId);
    toast('Member removed.');
    closeModal();
    renderProject(projectId);
  } catch (err) {
    toast(err.error || 'Failed to remove member.');
  }
}
