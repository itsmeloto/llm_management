const root = document.getElementById('app');

const modelInfo = {
  name: 'Mistral 3.5 Instruct',
  file: '/models/mistral-3.5-instruct.Q4_0.gguf',
  context: '128k tokens',
  size: '7.2 GB',
  params: '12B',
  embeddings: '3,072',
  vocab: '131,072 tokens',
  vocabType: 'SentencePiece',
  parallel: '4 slots',
  build: 'b7263-ef75a89fd',
  template:
    'You are Nurik AI, a reliable assistant. Keep answers concise, note assumptions, and avoid hallucinations.'
};

const serverInfo = {
  name: 'SFO Edge GPU',
  endpoint: 'https://edge.nurik.ai',
  status: 'Healthy',
  latency: '82 ms',
  region: 'us-west',
  uptime: '99.97 %',
  capacity: '4x A100 (80GB)',
  scheduler: 'Priority + Fair Share',
  notes: 'Autoscaling enabled; optimized for low latency interactive chats.'
};

let state = {
  messages: [],
  showModelModal: false,
  showServerModal: false,
  showSettings: false,
  activeSettingsTab: 'model'
};

render();

function render() {
  root.innerHTML = `
    <div class="app-shell">
      ${renderSidebar()}
      ${renderMain()}
    </div>
    ${state.showModelModal ? renderModelModal() : ''}
    ${state.showServerModal ? renderServerModal() : ''}
    ${state.showSettings ? renderSettingsModal() : ''}
  `;
  requestAnimationFrame(() => document.querySelector('.app-shell')?.classList.add('ready'));
  bindEvents();
}

function renderSidebar() {
  return `
    <aside class="sidebar">
      <div class="brand">Nurik AI</div>
      <div class="nav-item" data-action="new-chat">📝 New chat</div>
      <div class="nav-item" data-action="search">🔍 Search conversations</div>
      <div class="nav-section-title">Conversations</div>
      <div class="empty-state">No conversations yet</div>
    </aside>
  `;
}

function renderMain() {
  return `
    <main class="main">
      <div class="topbar">
        <span></span>
        <button class="settings-trigger" data-action="open-settings">⚙️</button>
      </div>
      <div class="title-block">
        <h1>Nurik AI</h1>
        <p>Type a message to get started</p>
      </div>
      <div class="info-header">
        <div class="info-chip" data-action="open-model">
          <div>
            <div class="label">Model</div>
            <div class="value">${modelInfo.name}</div>
          </div>
        </div>
        <div class="info-chip" data-action="open-server">
          <div>
            <div class="label">Server</div>
            <div class="value">${serverInfo.name}</div>
          </div>
        </div>
      </div>
      <section class="messages">
        ${state.messages
          .map(
            (msg) => `
            <div class="message">
              <div class="role">${msg.role}</div>
              <div class="content">${escapeHtml(msg.content)}</div>
            </div>
          `
          )
          .join('')}
      </section>
      <div class="chat-card">
        <div class="chat-input">
          <textarea class="input-box" id="chat-input" placeholder="Ask anything...">${''}</textarea>
          <button class="send-btn" data-action="send">↑</button>
        </div>
        <div class="helper">Press Enter to send, Shift + Enter for new line</div>
      </div>
    </main>
  `;
}

function renderModelModal() {
  return `
    <div class="modal-overlay" data-action="close-model">
      <div class="modal" data-stop>
        <div class="modal-header">
          <div class="modal-title">Model Information</div>
          <button class="close-btn" data-action="close-model">✕</button>
        </div>
        <div class="modal-body">
          <div class="info-grid">
            ${infoRow('Model', modelInfo.name)}
            ${infoRow('File Path', modelInfo.file)}
            ${infoRow('Context Size', modelInfo.context)}
            ${infoRow('Model Size', modelInfo.size)}
            ${infoRow('Parameters', modelInfo.params)}
            ${infoRow('Embedding Size', modelInfo.embeddings)}
            ${infoRow('Vocabulary Size', modelInfo.vocab)}
            ${infoRow('Vocabulary Type', modelInfo.vocabType)}
            ${infoRow('Parallel Slots', modelInfo.parallel)}
            ${infoRow('Build Info', modelInfo.build)}
          </div>
          <div class="field">
            <label>Chat Template</label>
            <textarea readonly>${modelInfo.template}</textarea>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderServerModal() {
  return `
    <div class="modal-overlay" data-action="close-server">
      <div class="modal" data-stop>
        <div class="modal-header">
          <div class="modal-title">Server Information</div>
          <button class="close-btn" data-action="close-server">✕</button>
        </div>
        <div class="modal-body">
          <div class="info-grid">
            ${infoRow('Server', serverInfo.name)}
            ${infoRow('Endpoint', serverInfo.endpoint)}
            ${infoRow('Status', serverInfo.status)}
            ${infoRow('Latency', serverInfo.latency)}
            ${infoRow('Region', serverInfo.region)}
            ${infoRow('Uptime', serverInfo.uptime)}
            ${infoRow('Capacity', serverInfo.capacity)}
            ${infoRow('Scheduler', serverInfo.scheduler)}
          </div>
          <div class="field">
            <label>Notes</label>
            <textarea readonly>${serverInfo.notes}</textarea>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSettingsModal() {
  const tab = state.activeSettingsTab;
  return `
    <div class="modal-overlay" data-action="close-settings">
      <div class="modal" data-stop>
        <div class="modal-header">
          <div class="modal-title">Settings</div>
          <button class="close-btn" data-action="close-settings">✕</button>
        </div>
        <div class="tabs">
          ${['model', 'server', 'system']
            .map(
              (key) => `
              <button class="tab ${tab === key ? 'active' : ''}" data-tab="${key}">
                ${formatTab(key)}
              </button>
            `
            )
            .join('')}
        </div>
        <div class="settings-panel">
          ${renderSettingsContent(tab)}
        </div>
      </div>
    </div>
  `;
}

function renderSettingsContent(tab) {
  if (tab === 'model') {
    return `
      <div class="field">
        <label>Default Model</label>
        <input value="${modelInfo.name}" readonly />
      </div>
      <div class="field">
        <label>Context Window</label>
        <input value="${modelInfo.context}" readonly />
      </div>
      <div class="field">
        <label>Template</label>
        <textarea readonly>${modelInfo.template}</textarea>
      </div>
    `;
  }
  if (tab === 'server') {
    return `
      <div class="field">
        <label>Active Server</label>
        <input value="${serverInfo.name}" readonly />
      </div>
      <div class="field">
        <label>Endpoint</label>
        <input value="${serverInfo.endpoint}" readonly />
      </div>
      <div class="field">
        <label>Notes</label>
        <textarea readonly>${serverInfo.notes}</textarea>
      </div>
    `;
  }
  return `
    <div class="field">
      <label>System Message</label>
      <textarea readonly>${modelInfo.template}</textarea>
    </div>
    <div class="field">
      <label>Theme</label>
      <input value="Dark" readonly />
    </div>
  `;
}

function infoRow(label, value) {
  return `
    <div class="info-label">${label}</div>
    <div class="info-value">${escapeHtml(value)}</div>
  `;
}

function bindEvents() {
  document.querySelector('[data-action="new-chat"]')?.addEventListener('click', () => {
    state.messages = [];
    render();
  });

  document.querySelector('[data-action="open-model"]')?.addEventListener('click', () => {
    state.showModelModal = true;
    render();
  });

  document.querySelector('[data-action="open-server"]')?.addEventListener('click', () => {
    state.showServerModal = true;
    render();
  });

  document.querySelector('[data-action="open-settings"]')?.addEventListener('click', () => {
    state.showSettings = true;
    render();
  });

  document.querySelectorAll('[data-action="close-model"]').forEach((el) =>
    el.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'close-model') {
        state.showModelModal = false;
        render();
      }
    })
  );

  document.querySelectorAll('[data-action="close-server"]').forEach((el) =>
    el.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'close-server') {
        state.showServerModal = false;
        render();
      }
    })
  );

  document.querySelectorAll('[data-action="close-settings"]').forEach((el) =>
    el.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'close-settings') {
        state.showSettings = false;
        render();
      }
    })
  );

  document.querySelectorAll('[data-tab]').forEach((el) =>
    el.addEventListener('click', () => {
      state.activeSettingsTab = el.dataset.tab;
      render();
    })
  );

  const modalBlocks = document.querySelectorAll('[data-stop]');
  modalBlocks.forEach((el) =>
    el.addEventListener('click', (e) => {
      e.stopPropagation();
    })
  );

  const sendBtn = document.querySelector('[data-action="send"]');
  const input = document.getElementById('chat-input');
  sendBtn?.addEventListener('click', () => handleSend(input));
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  });
}

function handleSend(input) {
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  state.messages = [...state.messages, { role: 'You', content: text }];
  input.value = '';
  render();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTab(key) {
  if (key === 'model') return 'Model Configuration';
  if (key === 'server') return 'Server Configuration';
  return 'System Configuration';
}
