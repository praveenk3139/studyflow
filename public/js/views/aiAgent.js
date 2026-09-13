// AI Study Agent & AI Model Hub View
const AiAgentView = {
  activeConversationId: null,
  activeProvider: 'gemini',
  activeModel: 'gemini-1.5-flash',

  async render() {
    const container = document.getElementById('view-content');
    container.innerHTML = `
      <div class="chat-layout">
        <!-- Conversations Sidebar -->
        <div class="conversations-sidebar">
          <div style="padding: 16px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <span>💬</span> Study Sessions
            </h3>
            <button class="btn btn-primary btn-sm" onclick="AiAgentView.newChat()">+ New</button>
          </div>

          <div id="ai-conversations-list" style="flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="text-align: center; padding: 20px; color: var(--text-muted);">Loading sessions...</div>
          </div>

          <!-- Model Hub Selector Footer -->
          <div style="padding: 16px; border-top: 1px solid var(--border-subtle); background: var(--bg-surface-elevated);">
            <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 6px;">
              AI Model Hub
            </label>
            <select class="select" id="ai-model-select" onchange="AiAgentView.onModelChange(this.value)" style="margin-bottom: 8px; font-size: 12.5px;">
              <optgroup label="Google Gemini (Cloud)">
                <option value="gemini:gemini-1.5-flash" selected>Gemini 1.5 Flash (Fast)</option>
                <option value="gemini:gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
                <option value="gemini:gemini-2.0-flash">Gemini 2.0 Flash</option>
              </optgroup>
              <optgroup label="Ollama (Local Offline)">
                <option value="ollama:qwen3">Ollama Qwen 3 (Local Offline)</option>
                <option value="ollama:llama3:8b">Ollama Llama 3 (8B)</option>
                <option value="ollama:deepseek-coder:6.7b">DeepSeek Coder (Local)</option>
              </optgroup>
              <optgroup label="OpenAI">
                <option value="openai:gpt-4o-mini">GPT-4o Mini (Academic)</option>
                <option value="openai:gpt-4o">GPT-4o Omnimodal</option>
              </optgroup>
              <optgroup label="xAI Grok">
                <option value="grok:grok-beta">xAI Grok-2</option>
              </optgroup>
              <optgroup label="Perplexity AI">
                <option value="perplexity:sonar-pro">Perplexity Sonar Pro</option>
              </optgroup>
            </select>
            <button class="btn btn-secondary btn-sm" style="width: 100%;" onclick="AiAgentView.openCompareModal()">
              ⚖️ Compare Model Answers
            </button>
          </div>
        </div>

        <!-- Chat Workspace -->
        <div class="chat-main">
          <!-- Chat Header -->
          <div class="chat-header">
            <div>
              <h3 id="chat-title" style="font-size: 16px; font-weight: 700; color: var(--text-primary);">
                AI Study Agent
              </h3>
              <p id="chat-status" style="font-size: 12px; color: var(--accent-cyan);">
                Connected: Google Gemini 1.5 Flash • Context: CS & Engineering
              </p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" onclick="AiAgentView.exportChat()">
                📥 Export Notes
              </button>
              <button class="btn btn-secondary btn-sm" onclick="AiAgentView.renameChat()">
                ✏️ Rename
              </button>
            </div>
          </div>

          <!-- Messages Stream -->
          <div class="chat-messages" id="chat-messages">
            <!-- Initial Welcome Assistant Message -->
            <div class="chat-bubble assistant">
              <div style="font-weight: 700; margin-bottom: 6px; color: var(--accent-cyan); display: flex; align-items: center; gap: 6px;">
                <span>🤖</span> StudyFlow AI Agent
              </div>
              <p>Hello Alex! I am your personal AI Study Agent. I can help you understand tough topics, generate 16-mark structured answers, break down proofs like a beginner, or quiz you unit-by-unit.</p>
              <p style="margin-top: 8px; font-size: 13px; color: var(--text-secondary);">
                💡 Click any quick study prompt below or type any question from your syllabus!
              </p>
            </div>
          </div>

          <!-- Quick Study Prompts Bar -->
          <div class="quick-prompts-bar">
            <button class="prompt-chip" onclick="AiAgentView.sendQuickPrompt('Give me a 16-mark answer for AVL Trees with rotations and complexity')">
              📝 16-Mark Answer
            </button>
            <button class="prompt-chip" onclick="AiAgentView.sendQuickPrompt('Teach me Dijkstra algorithm like a complete beginner with an analogy')">
              💡 Explain Like Beginner
            </button>
            <button class="prompt-chip" onclick="AiAgentView.sendQuickPrompt('Compare BFS vs DFS in a side-by-side table with time and space complexity')">
              ⚖️ Compare Concepts
            </button>
            <button class="prompt-chip" onclick="AiAgentView.sendQuickPrompt('Quiz me with 3 challenging multiple-choice questions on Process Scheduling')">
              🧠 Quiz Me
            </button>
            <button class="prompt-chip" onclick="AiAgentView.sendQuickPrompt('Find my weak topics based on my recent study plan performance')">
              🎯 Find Weak Topics
            </button>
            <button class="prompt-chip" onclick="AiAgentView.sendQuickPrompt('Create short revision notes with bullet points for Unit 1')">
              📋 Create Short Notes
            </button>
            <button class="prompt-chip" onclick="AiAgentView.sendQuickPrompt('Give me a random fun question for a 2-minute study break! 😂')">
              🎲 AI Random Question
            </button>
          </div>

          <!-- Chat Input -->
          <div class="chat-input-area">
            <input type="text" id="chat-input" class="input" placeholder="Ask anything about your syllabus, theorems, or exam questions..." onkeydown="if (event.key === 'Enter') AiAgentView.sendMessage()" />
            <button class="btn btn-primary" onclick="AiAgentView.sendMessage()">
              <span>Send</span> ✈️
            </button>
          </div>
        </div>
      </div>
    `;

    this.loadConversations();
  },

  async loadConversations() {
    const listEl = document.getElementById('ai-conversations-list');
    try {
      const res = await api.get('/ai/conversations');
      if (res.conversations.length === 0) {
        listEl.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">No prior sessions. Start a new chat!</div>`;
        return;
      }

      listEl.innerHTML = res.conversations.map(c => `
        <div class="nav-item ${this.activeConversationId === c.id ? 'active' : ''}" style="justify-content: space-between;" onclick="AiAgentView.selectConversation(${c.id}, '${c.title.replace(/'/g, "\\'")}')">
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px;">
            📚 ${c.title}
          </span>
          <button style="background: none; border: none; color: var(--text-muted); cursor: pointer;" onclick="event.stopPropagation(); AiAgentView.deleteConversation(${c.id})">×</button>
        </div>
      `).join('');

      if (!this.activeConversationId && res.conversations.length > 0) {
        this.selectConversation(res.conversations[0].id, res.conversations[0].title);
      }
    } catch (e) {
      listEl.innerHTML = `<div style="color: var(--accent-rose); font-size: 12px; padding: 10px;">Failed to load sessions</div>`;
    }
  },

  async selectConversation(convId, title) {
    this.activeConversationId = convId;
    document.getElementById('chat-title').innerText = title;

    // Refresh active classes in conversation list
    const items = document.querySelectorAll('#ai-conversations-list .nav-item');
    items.forEach(el => el.classList.remove('active'));

    const messagesEl = document.getElementById('chat-messages');
    messagesEl.innerHTML = `<div style="text-align: center; padding: 20px;"><div class="pulse-indicator"></div></div>`;

    try {
      const res = await api.get(`/ai/conversations/${convId}/messages`);
      if (res.messages.length === 0) {
        messagesEl.innerHTML = `
          <div class="chat-bubble assistant">
            <p>Session ready. Ask any doubt or select a quick study prompt to begin!</p>
          </div>
        `;
        return;
      }

      messagesEl.innerHTML = res.messages.map(m => `
        <div class="chat-bubble ${m.role}">
          <div style="font-weight: 700; font-size: 12px; margin-bottom: 4px; color: ${m.role === 'assistant' ? 'var(--accent-cyan)' : '#93c5fd'};">
            ${m.role === 'assistant' ? '🤖 AI Study Agent (' + (m.model_used || 'Gemini') + ')' : '👤 You'}
          </div>
          <div>${this.formatMarkdown(m.content)}</div>
          ${m.role === 'assistant' ? `
            <div style="margin-top: 10px; display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" onclick="AiAgentView.copyText(this)">📋 Copy</button>
              <button class="btn btn-secondary btn-sm" onclick="AiAgentView.sendQuickPrompt('Regenerate with additional practice problems')">🔄 Regenerate</button>
            </div>
          ` : ''}
        </div>
      `).join('');

      messagesEl.scrollTop = messagesEl.scrollHeight;
    } catch (e) {
      messagesEl.innerHTML = `<div style="color: var(--accent-rose); padding: 20px;">Could not load messages</div>`;
    }
  },

  async newChat() {
    const title = prompt('Enter a name for this study session (e.g. Unit 2 Tree Rotations):');
    if (!title) return;

    try {
      const res = await api.post('/ai/conversations', {
        title,
        provider: this.activeProvider,
        model: this.activeModel
      });
      showToast('New study session initialized', 'success');
      this.activeConversationId = res.conversation.id;
      this.loadConversations();
      this.selectConversation(res.conversation.id, res.conversation.title);
    } catch (e) {}
  },

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    this.appendMessage('user', text);

    // Show typing state
    const messagesEl = document.getElementById('chat-messages');
    const typingId = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = typingId;
    typingDiv.className = 'chat-bubble assistant';
    typingDiv.innerHTML = `<div style="display: flex; gap: 6px; align-items: center;"><span class="pulse-indicator"></div> Thinking & analyzing curriculum...`;
    messagesEl.appendChild(typingDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const res = await api.post('/ai/chat', {
        conversation_id: this.activeConversationId,
        message: text,
        provider: this.activeProvider,
        model: this.activeModel
      });

      typingDiv.remove();
      this.appendMessage('assistant', res.content, res.model_used);
      playAudioChime('chime');
    } catch (e) {
      typingDiv.remove();
      this.appendMessage('assistant', '⚠️ Sorry, there was an issue querying the study agent. Please try again.');
    }
  },

  sendQuickPrompt(promptText) {
    document.getElementById('chat-input').value = promptText;
    this.sendMessage();
  },

  appendMessage(role, content, model = 'Gemini') {
    const messagesEl = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `chat-bubble ${role}`;
    div.innerHTML = `
      <div style="font-weight: 700; font-size: 12px; margin-bottom: 4px; color: ${role === 'assistant' ? 'var(--accent-cyan)' : '#93c5fd'};">
        ${role === 'assistant' ? '🤖 AI Study Agent (' + model + ')' : '👤 You'}
      </div>
      <div>${this.formatMarkdown(content)}</div>
      ${role === 'assistant' ? `
        <div style="margin-top: 10px; display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" onclick="AiAgentView.copyText(this)">📋 Copy</button>
        </div>
      ` : ''}
    `;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  },

  formatMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/### (.*?)\n/g, '<h4 style="font-size: 15px; font-weight: 700; color: var(--accent-cyan); margin: 10px 0 4px;">$1</h4>')
      .replace(/#### (.*?)\n/g, '<h5 style="font-size: 13.5px; font-weight: 700; color: #a5b4fc; margin: 8px 0 2px;">$1</h5>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
    return html;
  },

  copyText(btn) {
    const text = btn.closest('.chat-bubble').innerText;
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  },

  onModelChange(val) {
    const [provider, model] = val.split(':');
    this.activeProvider = provider;
    this.activeModel = model;
    document.getElementById('chat-status').innerText = `Connected: ${provider.toUpperCase()} (${model}) • Context: Academic Standards`;
    showToast(`Switched active AI model to ${model}`, 'info');
  },

  async openCompareModal() {
    const query = prompt('Enter topic or question to compare across Gemini, OpenAI GPT-4o, and Grok:', 'Explain AVL Tree rotations vs Red-Black Tree recoloring');
    if (!query) return;

    showToast('Querying multi-provider model matrix...', 'info');

    try {
      const res = await api.post('/ai/compare', { query });
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 18px; font-weight: 800;">⚖️ Multi-Model Response Comparison</h3>
            <button class="btn btn-secondary btn-sm" onclick="this.closest('.modal-overlay').remove()">Close</button>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
            Query: "<strong>${query}</strong>"
          </p>
          <div class="grid-3" style="max-height: 60vh; overflow-y: auto;">
            ${res.comparisons.map(c => `
              <div style="background: var(--bg-base); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <strong style="color: var(--accent-cyan); font-size: 13px;">${c.provider}</strong>
                  <span style="font-size: 11px; color: var(--text-muted);">${c.latencyMs}ms</span>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); overflow-y: auto; max-height: 320px; white-space: pre-wrap; font-family: inherit;">
                  ${c.response}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } catch (e) {}
  },

  exportChat() {
    const messages = document.querySelectorAll('.chat-bubble');
    if (messages.length === 0) return;

    let output = `# StudyFlow AI - Study Session Export\nGenerated: ${new Date().toLocaleString()}\n\n`;
    messages.forEach(m => {
      output += `${m.innerText}\n\n---\n\n`;
    });

    const blob = new Blob([output], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyFlow_Notes_${Date.now()}.md`;
    a.click();
    showToast('Exported study notes to Markdown', 'success');
  },

  async renameChat() {
    if (!this.activeConversationId) return;
    const newTitle = prompt('Enter new session title:');
    if (!newTitle) return;

    await api.put(`/ai/conversations/${this.activeConversationId}`, { title: newTitle });
    this.loadConversations();
    document.getElementById('chat-title').innerText = newTitle;
    showToast('Session title updated', 'success');
  },

  async deleteConversation(id) {
    if (!confirm('Are you sure you want to delete this study session?')) return;
    await api.delete(`/ai/conversations/${id}`);
    showToast('Session deleted', 'info');
    this.loadConversations();
  }
};
