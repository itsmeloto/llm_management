import { createEmptyChat, createStore, updateChatTimestamp } from './state/store.js';
import { defaultModelInfo, defaultServerInfo } from './state/defaults.js';

const store = createStore();
const root = document.getElementById('app');

const formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getActiveChat = (state) => state.chats.find((chat) => chat.id === state.activeChatId);

store.subscribe((state) => render(state));
render(store.getState());

function getFilteredChats(state) {
  const query = state.searchQuery?.trim().toLowerCase();
  if (!query) return state.chats;
  return state.chats.filter((chat) => chat.title.toLowerCase().includes(query));
}

function render(state) {
  const activeChat = getActiveChat(state);
  const chats = getFilteredChats(state);

  root.innerHTML = `
    <div class="app-shell" data-theme="${state.theme}">
      ${renderSidebar(state, chats)}
      <main class="main-area">
        <header class="top-bar">
          <div class="chip-row">
            <button class="chip" id="model-info" aria-label="Model info">${state.modelInfo.name}</button>
            <button class="chip" id="server-info" aria-label="Server info">${state.serverInfo.name}</button>
          </div>
          <button class="icon-btn ghost" id="open-settings" aria-label="Settings">⚙️</button>
        </header>
        ${renderChatCanvas(state, activeChat)}
      </main>
      ${renderInfoModal('model', state)}
      ${renderInfoModal('server', state)}
      ${renderSettings(state)}
    </div>
  `;

  bindSidebarEvents(state, chats);
  bindChatEvents(state, activeChat);
  bindModalEvents(state);
  bindSettingsEvents(state);
}

function renderSidebar(state, chats) {
  return `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="brand">Nurik AI</div>
        <div class="sidebar-mark">▢</div>
      </div>
      <button class="nav-btn" id="new-chat"><span class="icon">✏️</span> New chat</button>
      <div class="search-box">
        <span class="icon">🔍</span>
        <input id="search" placeholder="Search conversations" value="${state.searchQuery || ''}" />
      </div>
      <div class="section">
        <div class="section-title">Conversations</div>
        <div class="chat-list">
          ${
            chats.length
              ? chats
                  .map(
                    (chat) => `
                      <div class="chat-row ${chat.id === state.activeChatId ? 'active' : ''}" data-chat-id="${chat.id}">
                        <div class="chat-title">${chat.title}</div>
                        <div class="chat-sub">${formatTime(chat.updatedAt)}</div>
                      </div>
                    `
                  )
                  .join('')
              : '<div class="empty">No conversations yet</div>'
          }
        </div>
      </div>
    </aside>
  `;
}

function renderChatCanvas(state, chat) {
  const hasMessages = chat && chat.messages.length;
  return `
    <section class="chat-area">
      <div class="chat-body ${hasMessages ? 'has-messages' : ''}">
        ${hasMessages ? renderMessages(chat) : renderEmptyState()}
      </div>
      ${renderComposer(state, chat)}
    </section>
  `;
}

function renderEmptyState() {
  return `
    <div class="empty-state">
      <h1>Nurik AI</h1>
      <p>Type a message or upload files to get started</p>
    </div>
  `;
}

function renderMessages(chat) {
  return `
    <div class="message-list" id="message-list">
      ${chat.messages
        .map(
          (msg) => `
            <div class="message ${msg.role}">
              <div class="meta">${msg.role === 'user' ? 'You' : 'Nurik AI'}<br>${formatTime(msg.createdAt)}</div>
              <div class="bubble">${msg.content}</div>
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

function renderComposer(state, chat) {
  return `
    <div class="composer">
      <button class="icon-btn" id="attach" aria-label="Add attachment">📎</button>
      <textarea id="message-input" placeholder="Ask anything..." ${state.settingsOpen ? 'disabled' : ''}></textarea>
      <div class="composer-actions">
        <button class="chip" id="inline-model">${state.modelInfo.name}</button>
        <button class="send-btn" id="send-message" aria-label="Send message">⬆</button>
      </div>
    </div>
    <div class="composer-hint">Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line</div>
  `;
}

function renderInfoModal(type, state) {
  const isModel = type === 'model';
  const open = isModel ? state.showModelModal : state.showServerModal;
  const info = isModel ? state.modelInfo : state.serverInfo;
  if (!open) return '';

  const rows = isModel ? renderModelRows(info) : renderServerRows(info);
  const title = isModel ? 'Model Information' : 'Server Information';
  const subtitle = isModel ? 'Current model details and capabilities' : 'Current server details and status';

  return `
    <div class="modal-overlay" data-modal="${type}">
      <div class="modal-card">
        <header class="modal-header">
          <div>
            <h3>${title}</h3>
            <p>${subtitle}</p>
          </div>
          <button class="icon-btn ghost" aria-label="Close" data-close-modal="${type}">✕</button>
        </header>
        <div class="info-grid">${rows}</div>
        ${
          isModel
            ? `<div class="template-block"><div class="label">Chat Template</div><pre>${info.chatTemplate}</pre></div>`
            : ''
        }
      </div>
    </div>
  `;
}

function renderModelRows(info) {
  const entries = [
    ['Model', info.name],
    ['File Path', info.filePath],
    ['Context Size', info.contextSize],
    ['Training Context', info.trainingContext],
    ['Model Size', info.modelSize],
    ['Parameters', info.parameters],
    ['Embedding Size', info.embeddingSize],
    ['Vocabulary Size', info.vocabularySize],
    ['Vocabulary Type', info.vocabularyType],
    ['Parallel Slots', info.parallelSlots],
    ['Build Info', info.buildInfo]
  ];
  return entries
    .map(
      ([label, value]) => `
        <div class="info-row">
          <div class="label">${label}</div>
          <div class="value">${value}</div>
        </div>
      `
    )
    .join('');
}

function renderServerRows(info) {
  const entries = [
    ['Server', info.name],
    ['Address', info.address],
    ['Type', info.type],
    ['Version', info.version],
    ['Status', info.status],
    ['Uptime', info.uptime],
    ['Hardware', info.hardware],
    ['Tokenizer', info.tokenizer],
    ['Parallel Slots', info.parallelSlots],
    ['Notes', info.notes]
  ];
  return entries
    .map(
      ([label, value]) => `
        <div class="info-row">
          <div class="label">${label}</div>
          <div class="value">${value}</div>
        </div>
      `
    )
    .join('');
}

function renderSettings(state) {
  if (!state.settingsOpen) return '';
  return `
    <div class="modal-overlay" data-settings>
      <div class="modal-card settings-card">
        <header class="modal-header">
          <div>
            <h3>Settings</h3>
            <p>Configure Nurik AI</p>
          </div>
          <button class="icon-btn ghost" aria-label="Close settings" id="close-settings">✕</button>
        </header>
        <div class="settings-grid">
          <nav class="settings-nav">
            ${renderSettingsTab('model', state)}
            ${renderSettingsTab('server', state)}
            ${renderSettingsTab('system', state)}
          </nav>
          <div class="settings-content">
            ${renderSettingsContent(state)}
          </div>
        </div>
        <div class="settings-footer">
          <button class="ghost" id="reset-settings">Reset to default</button>
          <button class="primary" id="save-settings">Save settings</button>
        </div>
      </div>
    </div>
  `;
}

function renderSettingsTab(key, state) {
  const labels = {
    model: 'Model Configuration',
    server: 'Server Configuration',
    system: 'System Configuration'
  };
  const active = state.activeSettingsTab === key ? 'active' : '';
  return `<button class="settings-tab ${active}" data-tab="${key}">${labels[key]}</button>`;
}

function renderSettingsContent(state) {
  const tab = state.activeSettingsTab;
  if (tab === 'model') {
    return `
      <div class="form-field">
        <label>Default model</label>
        <input type="text" id="model-name" value="${state.modelInfo.name}" />
      </div>
      <div class="form-field">
        <label>Context size</label>
        <input type="text" id="model-context" value="${state.modelInfo.contextSize}" />
      </div>
      <div class="form-field">
        <label>Model path</label>
        <input type="text" id="model-path" value="${state.modelInfo.filePath}" />
      </div>
    `;
  }
  if (tab === 'server') {
    return `
      <div class="form-field">
        <label>Server address</label>
        <input type="text" id="server-address" value="${state.serverInfo.address}" />
      </div>
      <div class="form-field">
        <label>Server type</label>
        <input type="text" id="server-type" value="${state.serverInfo.type}" />
      </div>
      <div class="form-field">
        <label>Status</label>
        <input type="text" id="server-status" value="${state.serverInfo.status}" />
      </div>
    `;
  }
  return `
    <div class="form-field">
      <label>Theme</label>
      <input type="text" id="system-theme" value="Dark" disabled />
    </div>
    <div class="form-field">
      <label>Keyboard shortcuts</label>
      <input type="text" value="Enter to send, Shift+Enter for new line" disabled />
    </div>
  `;
}

function bindSidebarEvents(state, chats) {
  const newChat = document.getElementById('new-chat');
  newChat?.addEventListener('click', () => {
    const chat = createEmptyChat();
    store.setState((prev) => ({ chats: [chat, ...prev.chats], activeChatId: chat.id }));
  });

  const search = document.getElementById('search');
  search?.addEventListener('input', (e) => store.setState({ searchQuery: e.target.value }));

  chats.forEach((chat) => {
    const el = document.querySelector(`[data-chat-id="${chat.id}"]`);
    el?.addEventListener('click', () => {
      store.setState({ activeChatId: chat.id });
    });
  });
}

function bindChatEvents(state, chat) {
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-message');
  const modelBtn = document.getElementById('model-info');
  const serverBtn = document.getElementById('server-info');
  const inlineModel = document.getElementById('inline-model');
  const settingsBtn = document.getElementById('open-settings');

  const sendHandler = () => {
    if (!messageInput) return;
    const content = messageInput.value.trim();
    if (!content) return;
    let active = chat;
    if (!active) {
      const nextChat = createEmptyChat();
      store.setState((prev) => ({ chats: [nextChat, ...prev.chats], activeChatId: nextChat.id }));
      active = nextChat;
    }

    const now = new Date().toISOString();
    const userMessage = { id: crypto.randomUUID(), role: 'user', content, createdAt: now };
    const assistantMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Understood. I will craft a response for you.',
      createdAt: new Date().toISOString()
    };

    const nextChatState = updateChatTimestamp({
      ...active,
      messages: [...(active.messages || []), userMessage, assistantMessage]
    });

    store.setState((prev) => ({
      chats: prev.chats.map((c) => (c.id === nextChatState.id ? nextChatState : c)),
      activeChatId: nextChatState.id
    }));

    messageInput.value = '';
  };

  sendBtn?.addEventListener('click', sendHandler);
  messageInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendHandler();
    }
  });

  modelBtn?.addEventListener('click', () => store.setState({ showModelModal: true }));
  serverBtn?.addEventListener('click', () => store.setState({ showServerModal: true }));
  inlineModel?.addEventListener('click', () => store.setState({ showModelModal: true }));
  settingsBtn?.addEventListener('click', () => store.setState({ settingsOpen: true }));
}

function bindModalEvents(state) {
  if (state.showModelModal || state.showServerModal) {
    document.querySelectorAll('[data-close-modal]')?.forEach((btn) => {
      btn.addEventListener('click', () => store.setState({ showModelModal: false, showServerModal: false }));
    });

    document.querySelectorAll('.modal-overlay[data-modal]')?.forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          store.setState({ showModelModal: false, showServerModal: false });
        }
      });
    });
  }
}

function bindSettingsEvents(state) {
  if (!state.settingsOpen) return;
  const close = document.getElementById('close-settings');
  close?.addEventListener('click', () => store.setState({ settingsOpen: false }));

  document.querySelectorAll('[data-tab]')?.forEach((tab) => {
    tab.addEventListener('click', () => store.setState({ activeSettingsTab: tab.dataset.tab }));
  });

  const save = document.getElementById('save-settings');
  save?.addEventListener('click', () => {
    const nextModel = document.getElementById('model-name')?.value || state.modelInfo.name;
    const nextContext = document.getElementById('model-context')?.value || state.modelInfo.contextSize;
    const nextPath = document.getElementById('model-path')?.value || state.modelInfo.filePath;
    const nextAddress = document.getElementById('server-address')?.value || state.serverInfo.address;
    const nextType = document.getElementById('server-type')?.value || state.serverInfo.type;
    const nextStatus = document.getElementById('server-status')?.value || state.serverInfo.status;

    store.setState({
      modelInfo: { ...state.modelInfo, name: nextModel, contextSize: nextContext, filePath: nextPath },
      serverInfo: { ...state.serverInfo, address: nextAddress, type: nextType, status: nextStatus },
      settingsOpen: false
    });
  });

  const reset = document.getElementById('reset-settings');
  reset?.addEventListener('click', () => {
    store.setState({ modelInfo: defaultModelInfo, serverInfo: defaultServerInfo, activeSettingsTab: 'model' });
  });

  const overlay = document.querySelector('.modal-overlay[data-settings]');
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) store.setState({ settingsOpen: false });
  });
}
