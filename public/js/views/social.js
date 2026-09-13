// Friends & Study Groups View
const SocialView = {
  activeFriendId: null,
  activeGroupId: null,
  chatMode: 'friends', // 'friends' or 'groups'

  async render() {
    const container = document.getElementById('view-content');
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 800;">👥 Friends & Collaborative Study Groups</h2>
          <p style="color: var(--text-secondary); font-size: 13px;">
            Connect with campus peers, share study notes, solve doubts together, and enter synchronous group study rooms.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" onclick="SocialView.searchUsersModal()">
            🔍 Search Student by Username
          </button>
        </div>
      </div>

      <!-- Main Social Layout: Contact Drawer & Chat Window -->
      <div class="chat-layout">
        <!-- Social Drawer -->
        <div class="conversations-sidebar">
          <div style="padding: 12px; border-bottom: 1px solid var(--border-subtle); display: flex; gap: 6px;">
            <button class="btn ${this.chatMode === 'friends' ? 'btn-primary' : 'btn-secondary'} btn-sm" style="flex: 1;" onclick="SocialView.switchMode('friends')">
              Friends List
            </button>
            <button class="btn ${this.chatMode === 'groups' ? 'btn-primary' : 'btn-secondary'} btn-sm" style="flex: 1;" onclick="SocialView.switchMode('groups')">
              Study Rooms
            </button>
          </div>

          <div id="social-sidebar-list" style="flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="text-align: center; padding: 20px; color: var(--text-muted);">Loading contacts...</div>
          </div>
        </div>

        <!-- Chat Workspace -->
        <div class="chat-main" id="social-chat-main">
          <div style="text-align: center; padding: 80px 20px; color: var(--text-muted);">
            <div style="font-size: 44px; margin-bottom: 12px;">💬</div>
            <p>Select a student study partner or collaborative study group room.</p>
          </div>
        </div>
      </div>
    `;

    this.loadSidebar();
  },

  switchMode(mode) {
    this.chatMode = mode;
    this.render();
  },

  async loadSidebar() {
    const listEl = document.getElementById('social-sidebar-list');

    try {
      if (this.chatMode === 'friends') {
        const res = await api.get('/social/friends');
        if (res.friends.length === 0) {
          listEl.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">No friends added yet. Click "Search Student" above!</div>`;
          return;
        }

        listEl.innerHTML = res.friends.map(f => `
          <div class="nav-item ${this.activeFriendId === f.id ? 'active' : ''}" onclick="SocialView.openDirectChat(${f.id}, '${f.full_name.replace(/'/g, "\\'")}', '${f.username}')">
            <div class="user-avatar" style="width: 32px; height: 32px; font-size: 12px; background: #6366f1;">
              ${f.full_name.charAt(0)}
            </div>
            <div style="flex: 1; overflow: hidden;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600; font-size: 13px; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${f.full_name}</span>
                <span style="font-size: 10px; color: #10b981;">● Online</span>
              </div>
              <div style="font-size: 11px; color: var(--text-muted);">${f.college || 'Stanford'}</div>
            </div>
          </div>
        `).join('');

        if (!this.activeFriendId && res.friends.length > 0) {
          this.openDirectChat(res.friends[0].id, res.friends[0].full_name, res.friends[0].username);
        }
      } else {
        const res = await api.get('/social/groups');
        listEl.innerHTML = res.groups.map(g => `
          <div class="nav-item ${this.activeGroupId === g.id ? 'active' : ''}" onclick="SocialView.openGroupChat(${g.id}, '${g.name.replace(/'/g, "\\'")}')">
            <div style="font-size: 20px;">🏛️</div>
            <div style="flex: 1; overflow: hidden;">
              <div style="font-weight: 600; font-size: 13px; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${g.name}</div>
              <div style="font-size: 11px; color: var(--accent-cyan);">${g.members_count} Members • Active Study</div>
            </div>
          </div>
        `).join('');

        if (!this.activeGroupId && res.groups.length > 0) {
          this.openGroupChat(res.groups[0].id, res.groups[0].name);
        }
      }
    } catch (e) {
      listEl.innerHTML = `<div style="color: var(--accent-rose); padding: 10px;">Failed to load social list</div>`;
    }
  },

  async openDirectChat(friendId, friendName, friendUsername) {
    this.activeFriendId = friendId;
    const chatMain = document.getElementById('social-chat-main');
    chatMain.innerHTML = `<div style="text-align: center; padding: 40px;"><div class="pulse-indicator"></div></div>`;

    try {
      const res = await api.get(`/social/messages/${friendId}`);

      chatMain.innerHTML = `
        <div class="chat-header">
          <div>
            <h3 style="font-size: 16px; font-weight: 700;">${friendName}</h3>
            <span style="font-size: 12px; color: #10b981;">● Online • @${friendUsername}</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="SocialView.reportUser(${friendId})">
              ⚠️ Report / Mute
            </button>
          </div>
        </div>

        <div class="chat-messages" id="social-messages-stream">
          ${res.messages.map(m => `
            <div class="chat-bubble ${m.sender_id === friendId ? 'assistant' : 'user'}">
              <div style="font-size: 11px; font-weight: 700; margin-bottom: 2px; color: ${m.sender_id === friendId ? 'var(--accent-cyan)' : '#93c5fd'};">
                ${m.sender_id === friendId ? friendName : 'You'}
              </div>
              <p>${m.content}</p>
              <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px; text-align: right;">
                ${new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="chat-input-area">
          <input type="text" id="social-input" class="input" placeholder="Message ${friendName}..." onkeydown="if (event.key === 'Enter') SocialView.sendDirectMessage(${friendId})" />
          <button class="btn btn-primary" onclick="SocialView.sendDirectMessage(${friendId})">Send</button>
        </div>
      `;

      const stream = document.getElementById('social-messages-stream');
      stream.scrollTop = stream.scrollHeight;
    } catch (e) {
      chatMain.innerHTML = `<div style="color: var(--accent-rose); padding: 20px;">Could not load chat</div>`;
    }
  },

  async sendDirectMessage(friendId) {
    const input = document.getElementById('social-input');
    const content = input.value.trim();
    if (!content) return;

    input.value = '';
    try {
      await api.post('/social/messages', { receiver_id: friendId, content });
      playAudioChime('chime');
      const friend = document.querySelector('.chat-header h3').innerText;
      this.openDirectChat(friendId, friend, '');
    } catch (e) {}
  },

  async openGroupChat(groupId, groupName) {
    this.activeGroupId = groupId;
    const chatMain = document.getElementById('social-chat-main');
    chatMain.innerHTML = `<div style="text-align: center; padding: 40px;"><div class="pulse-indicator"></div></div>`;

    try {
      const res = await api.get(`/social/groups/${groupId}/messages`);

      chatMain.innerHTML = `
        <div class="chat-header">
          <div>
            <h3 style="font-size: 16px; font-weight: 700;">🏛️ ${groupName}</h3>
            <span style="font-size: 12px; color: var(--accent-cyan);">Shared Study Timer Active (45m Sprint) • CS301 Squad</span>
          </div>
          <div>
            <span class="badge badge-low">3 Active Study Buddies</span>
          </div>
        </div>

        <div class="chat-messages" id="group-messages-stream">
          ${res.messages.map(m => `
            <div class="chat-bubble assistant">
              <div style="font-size: 11px; font-weight: 700; margin-bottom: 2px; color: var(--accent-purple);">
                ${m.sender_name || m.sender_username}
              </div>
              <p>${m.content}</p>
            </div>
          `).join('')}
        </div>

        <div class="chat-input-area">
          <input type="text" id="group-input" class="input" placeholder="Message group study room..." onkeydown="if (event.key === 'Enter') SocialView.sendGroupMessage(${groupId})" />
          <button class="btn btn-primary" onclick="SocialView.sendGroupMessage(${groupId})">Send</button>
        </div>
      `;

      const stream = document.getElementById('group-messages-stream');
      stream.scrollTop = stream.scrollHeight;
    } catch (e) {
      chatMain.innerHTML = `<div style="color: var(--accent-rose); padding: 20px;">Could not load group room</div>`;
    }
  },

  async sendGroupMessage(groupId) {
    const input = document.getElementById('group-input');
    const content = input.value.trim();
    if (!content) return;

    input.value = '';
    try {
      await api.post(`/social/groups/${groupId}/messages`, { content });
      playAudioChime('chime');
      const gName = document.querySelector('.chat-header h3').innerText.replace('🏛️ ', '');
      this.openGroupChat(groupId, gName);
    } catch (e) {}
  },

  searchUsersModal() {
    const uname = prompt('Enter username to search (e.g. priya.patel, marcus.vance):', 'priya.patel');
    if (!uname) return;

    api.get(`/social/search?query=${encodeURIComponent(uname)}`).then(res => {
      if (res.users.length === 0) {
        showToast(`No student found with username "${uname}"`, 'warning');
        return;
      }
      const u = res.users[0];
      if (confirm(`Found student:\n\n${u.full_name} (@${u.username})\n${u.college}\n\nSend friend request?`)) {
        api.post('/social/request', { target_username: u.username }).then(r => {
          showToast(r.message, 'success');
        });
      }
    });
  },

  reportUser(userId) {
    const reason = prompt('Reason for reporting / muting student:');
    if (!reason) return;

    api.post('/social/moderation/report', { target_user_id: userId, reason }).then(res => {
      showToast(res.message, 'info');
    });
  }
};
