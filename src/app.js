import { createEmptyChat, createStore, updateChatTimestamp } from './state/store.js';
import { defaultPresets } from './state/defaults.js';

const store = createStore();
const root = document.getElementById('app');
const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatRelative = (ts) => {
  const diff = Date.now() - new Date(ts).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

const getActiveChat = (state) => state.chats.find((chat) => chat.id === state.activeChatId);

store.subscribe((state) => {
  render(state);
});

render(store.getState());

function render(state) {
  document.documentElement.setAttribute('data-theme', state.theme);
  const activeChat = getActiveChat(state);
  root.classList.add('ready');
  const filteredChats = getFilteredChats(state);
  root.innerHTML = `
    <div class="app-shell" data-theme="${state.theme}">
      ${renderSidebar(state, filteredChats)}
      <div class="layout">
        ${renderMain(state, activeChat)}
        ${renderSettingsPanel(state, activeChat)}
      </div>
    </div>
  `;
  bindSidebarEvents(state, filteredChats);
  bindMainEvents(state, activeChat);
  bindSettingsEvents(state, activeChat);
}

function getFilteredChats(state) {
  const q = state.searchQuery?.toLowerCase().trim();
  const sorted = [...state.chats].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  if (!q) return sorted;
  return sorted.filter((chat) => {
    const matchTitle = chat.title.toLowerCase().includes(q);
    const matchMessages = chat.messages.some((m) => m.content.toLowerCase().includes(q));
    return matchTitle || matchMessages;
  });
}

function renderSidebar(state, chats) {
  return `
    <aside class="sidebar card">
      <div class="brand">
        <div class="logo">LLM</div>
        <div>
          <div style="font-weight: 800; letter-spacing: -0.02em;">Control Center</div>
          <div style="color: var(--muted); font-size: 12px;">Operate, route, observe</div>
        </div>
      </div>
      <button class="btn primary" id="new-chat">➕ New chat</button>
      <div class="search-input">
        <span>🔍</span>
        <input id="chat-search" placeholder="Search chats & messages" value="${state.searchQuery || ''}" />
      </div>
      <div class="section-title">Active sessions</div>
      <div class="chat-list">
        ${
          chats
            .map((chat) => {
              const server = state.servers.find((s) => s.id === chat.serverId);
              const latency = state.serverLatencyMap?.[chat.serverId] ?? server?.latencyMs ?? 0;
              return `
                <div class="chat-item ${chat.id === state.activeChatId ? 'active' : ''}" data-chat-id="${chat.id}">
                  <div class="chat-meta">
                    <div class="title">${chat.title}</div>
                    <div class="subtitle">${formatRelative(chat.updatedAt)} • ${
                state.models.find((m) => m.id === chat.modelId)?.name || 'No model'
              }</div>
                  </div>
                  <div class="inline-actions" data-chat-actions="${chat.id}">
                    <span class="badge ${server?.status === 'healthy' ? 'success' : server?.status === 'degraded' ? 'warning' : ''}">
                      ${server?.region || 'n/a'} · ${latency} ms
                    </span>
                    <button class="btn icon ghost" data-rename="${chat.id}">✏️</button>
                    <button class="btn icon ghost" data-delete="${chat.id}">🗑</button>
                  </div>
                </div>
              `;
            })
            .join('') || '<div class="pill">No chats yet</div>'
        }
      </div>
    </aside>
  `;
}

function renderMain(state, chat) {
  const model = state.models.find((m) => m.id === chat?.modelId);
  const server = state.servers.find((s) => s.id === chat?.serverId);
  const latency = state.serverLatencyMap?.[chat?.serverId] ?? server?.latencyMs ?? '--';
  const tokenEstimate = chat
    ? Math.round(
        chat.messages.reduce((sum, msg) => sum + Math.max(4, msg.content.split(/\s+/).length * 1.3), 0)
      )
    : 0;

  return `
    <section class="main card">
      <div class="toolbar">
        <div>
          <div class="pill">Active chat</div>
          <h2 style="margin: 6px 0 0;">${chat?.title || 'No chat selected'}</h2>
          <div style="color: var(--muted); font-size: 13px;">${chat?.systemPrompt || ''}</div>
        </div>
        <div class="controls">
          <select class="select" id="model-select" ${!chat ? 'disabled' : ''}>
            ${state.models
              .map((m) => `<option value="${m.id}" ${chat?.modelId === m.id ? 'selected' : ''}>${m.name}</option>`)
              .join('')}
          </select>
          <select class="select" id="server-select" ${!chat ? 'disabled' : ''}>
            ${state.servers
              .map(
                (s) =>
                  `<option value="${s.id}" ${chat?.serverId === s.id ? 'selected' : ''}>${s.name} (${s.region})</option>`
              )
              .join('')}
          </select>
          <button class="btn ghost" id="toggle-settings">${state.settingsOpen ? 'Close panel' : 'Settings'}</button>
          <button class="btn ghost" id="theme-toggle">${state.theme === 'dark' ? '🌙' : '☀️'}</button>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat">
          <div class="label">Model</div>
          <div class="value">${model?.name || 'Unassigned'}</div>
          <div class="kpi">Size: ${model?.size || '—'} · Quant: ${model?.quantization || '—'}</div>
          <div class="kpi">Context: ${model?.contextWindow || '—'} · Throughput: ${model?.throughput || '—'}</div>
        </div>
        <div class="stat">
          <div class="label">Server</div>
          <div class="value">${server?.name || 'None'}</div>
          <div class="kpi">Region: ${server?.region || '—'} · Latency: ${latency} ms</div>
          <div class="kpi">Status: ${server?.status || 'unknown'}</div>
        </div>
        <div class="stat">
          <div class="label">Chat health</div>
          <div class="value">${tokenEstimate} tokens est.</div>
          <div class="kpi">Messages: ${chat?.messages.length || 0} · Stream: ${chat?.config?.stream ? 'on' : 'off'}</div>
        </div>
      </div>

      <div class="chat-panel">
        <div class="message-list" id="message-list">
          ${renderMessages(chat)}
        </div>
        <div class="composer">
          <div class="inline-actions">
            <span class="badge">Ctrl/Cmd + Enter to send</span>
            <span class="badge">System prompt & per-chat overrides below</span>
          </div>
          <textarea class="textarea" id="message-input" placeholder="Ask or instruct your assistant" ${!chat ? 'disabled' : ''}></textarea>
          <div class="flex-between">
            <div class="inline-actions">
              <label class="pill">Temperature <strong>${chat?.config?.temperature ?? state.globalConfig.temperature}</strong></label>
              <label class="pill">Top-p <strong>${chat?.config?.topP ?? state.globalConfig.topP}</strong></label>
              <label class="pill">Max tokens <strong>${chat?.config?.maxTokens ?? state.globalConfig.maxTokens}</strong></label>
            </div>
            <div class="inline-actions">
              <button class="btn ghost" id="simulate-latency">Ping servers</button>
              <button class="btn primary" id="send-message" ${!chat ? 'disabled' : ''}>Send</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderMessages(chat) {
  if (!chat) return '<div class="pill">Select or create a chat to start.</div>';
  if (!chat.messages.length) return '<div class="pill">No messages yet. Ask a question to begin.</div>';
  return chat.messages
    .map(
      (msg) => `
        <div class="message ${msg.role}">
          <div class="meta">${msg.role === 'user' ? 'You' : 'Assistant'}<br>${formatTime(msg.createdAt)}</div>
          <div class="body">${msg.content}</div>
        </div>
      `
    )
    .join('');
}

function renderSettingsPanel(state, chat) {
  const config = chat?.config || state.globalConfig;
  return `
    <aside class="panel card drawer" style="${state.settingsOpen ? '' : 'display:none;'}">
      <div class="drawer-body config-panel">
        <div class="flex-between">
          <div>
            <div class="pill">Configuration</div>
            <h3 style="margin: 6px 0 0;">Per-chat overrides</h3>
          </div>
          <span class="badge">Presets & persistence</span>
        </div>
        <div class="form-grid">
          <label>
            <div class="label">System prompt</div>
            <textarea class="textarea" id="system-prompt" rows="4">${chat?.systemPrompt || ''}</textarea>
          </label>
          <label>
            <div class="label">Temperature (${config.temperature})</div>
            <input class="input" type="range" id="temperature" min="0" max="1" step="0.05" value="${config.temperature}" />
          </label>
          <label>
            <div class="label">Top-p (${config.topP})</div>
            <input class="input" type="range" id="top-p" min="0" max="1" step="0.05" value="${config.topP}" />
          </label>
          <label>
            <div class="label">Max tokens</div>
            <input class="input" type="number" id="max-tokens" value="${config.maxTokens}" min="128" max="8192" />
          </label>
          <label class="inline-actions" style="align-items:center;">
            <input type="checkbox" id="streaming" ${config.stream ? 'checked' : ''} />
            <span>Stream responses</span>
          </label>
          <label>
            <div class="label">Stop sequences</div>
            <input class="input" type="text" id="stop-sequences" value="${config.stopSequences || ''}" placeholder="Separate with commas" />
          </label>
        </div>
        <div class="divider"></div>
        <div class="flex-between">
          <div>
            <h4 style="margin: 0 0 4px;">Presets</h4>
            <div style="color: var(--muted); font-size: 13px;">Apply or capture configurations quickly.</div>
          </div>
          <button class="btn ghost" id="save-preset">💾 Save preset</button>
        </div>
        <div class="presets">
          ${state.presets
            .map(
              (preset) => `
                <div class="preset-chip" data-preset="${preset.id}">
                  <div style="font-weight: 700;">${preset.name}</div>
                  <div style="color: var(--muted); font-size: 12px;">${preset.description}</div>
                </div>
              `
            )
            .join('')}
        </div>
        <div class="divider"></div>
        <div class="flex-between">
          <div>
            <div class="pill">Global defaults</div>
            <h4 style="margin: 6px 0 0;">Apply to new chats</h4>
          </div>
          <span class="badge">Does not overwrite existing chats</span>
        </div>
        <div class="form-grid">
          <label>
            <div class="label">Default temperature (${state.globalConfig.temperature})</div>
            <input class="input" type="range" id="global-temperature" min="0" max="1" step="0.05" value="${state.globalConfig.temperature}" />
          </label>
          <label>
            <div class="label">Default top-p (${state.globalConfig.topP})</div>
            <input class="input" type="range" id="global-top-p" min="0" max="1" step="0.05" value="${state.globalConfig.topP}" />
          </label>
          <label>
            <div class="label">Default max tokens</div>
            <input class="input" type="number" id="global-max-tokens" value="${state.globalConfig.maxTokens}" min="128" max="8192" />
          </label>
          <label class="inline-actions" style="align-items:center;">
            <input type="checkbox" id="global-streaming" ${state.globalConfig.stream ? 'checked' : ''} />
            <span>Stream responses</span>
          </label>
        </div>
      </div>
    </aside>
  `;
}

function bindSidebarEvents(state, chats) {
  const newChatBtn = document.getElementById('new-chat');
  newChatBtn?.addEventListener('click', () => {
    const baseModel = state.models[0];
    const baseServer = state.servers[0];
    const chat = createEmptyChat({ modelId: baseModel?.id, serverId: baseServer?.id });
    store.setState((prev) => ({
      chats: [chat, ...prev.chats],
      activeChatId: chat.id
    }));
  });

  const searchInput = document.getElementById('chat-search');
  searchInput?.addEventListener('input', (e) => {
    store.setState({ searchQuery: e.target.value });
  });

  chats.forEach((chat) => {
    const chatEl = document.querySelector(`[data-chat-id="${chat.id}"]`);
    chatEl?.addEventListener('click', (event) => {
      if (event.target.closest('[data-rename]') || event.target.closest('[data-delete]')) return;
      store.setState({ activeChatId: chat.id });
    });

    const renameBtn = chatEl?.querySelector(`[data-rename="${chat.id}"]`);
    renameBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const nextTitle = prompt('Rename chat', chat.title);
      if (!nextTitle) return;
      store.setState((prev) => ({
        chats: prev.chats.map((c) => (c.id === chat.id ? { ...c, title: nextTitle, updatedAt: new Date().toISOString() } : c))
      }));
    });

    const deleteBtn = chatEl?.querySelector(`[data-delete="${chat.id}"]`);
    deleteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.chats.length === 1) {
        alert('At least one chat must remain.');
        return;
      }
      store.setState((prev) => {
        const filtered = prev.chats.filter((c) => c.id !== chat.id);
        return {
          chats: filtered,
          activeChatId: prev.activeChatId === chat.id ? filtered[0]?.id : prev.activeChatId
        };
      });
    });
  });
}

function bindMainEvents(state, chat) {
  const modelSelect = document.getElementById('model-select');
  modelSelect?.addEventListener('change', (e) => {
    const nextModel = e.target.value;
    store.setState((prev) => ({
      chats: prev.chats.map((c) => (c.id === prev.activeChatId ? updateChatTimestamp({ ...c, modelId: nextModel }) : c))
    }));
  });

  const serverSelect = document.getElementById('server-select');
  serverSelect?.addEventListener('change', (e) => {
    const nextServer = e.target.value;
    store.setState((prev) => ({
      chats: prev.chats.map((c) => (c.id === prev.activeChatId ? updateChatTimestamp({ ...c, serverId: nextServer }) : c))
    }));
  });

  const themeToggle = document.getElementById('theme-toggle');
  themeToggle?.addEventListener('click', () => {
    store.setState((prev) => ({ theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  });

  const settingsToggle = document.getElementById('toggle-settings');
  settingsToggle?.addEventListener('click', () => {
    store.setState((prev) => ({ settingsOpen: !prev.settingsOpen }));
  });

  const sendBtn = document.getElementById('send-message');
  const input = document.getElementById('message-input');
  const sendHandler = () => {
    if (!chat || !input) return;
    const content = input.value.trim();
    if (!content) return;
    const now = new Date().toISOString();
    const userMessage = { id: crypto.randomUUID(), role: 'user', content, createdAt: now };
    const assistantMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: generateAssistantReply(content, chat.config, chat.systemPrompt),
      createdAt: new Date().toISOString()
    };
    store.setState((prev) => ({
      chats: prev.chats.map((c) =>
        c.id === chat.id
          ? updateChatTimestamp({ ...c, messages: [...c.messages, userMessage, assistantMessage] })
          : c
      )
    }));
    input.value = '';
    input.focus();
  };
  sendBtn?.addEventListener('click', sendHandler);
  input?.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      sendHandler();
    }
  });

  const pingBtn = document.getElementById('simulate-latency');
  pingBtn?.addEventListener('click', () => {
    store.setState((prev) => {
      const latencyMap = { ...prev.serverLatencyMap };
      prev.servers.forEach((server) => {
        latencyMap[server.id] = Math.max(40, Math.round(server.latencyMs * (0.8 + Math.random() * 0.6)));
      });
      return { serverLatencyMap: latencyMap };
    });
  });
}

function bindSettingsEvents(state, chat) {
  if (!state.settingsOpen) return;
  const systemPrompt = document.getElementById('system-prompt');
  systemPrompt?.addEventListener('input', (e) => {
    if (!chat) return;
    const next = e.target.value;
    store.setState((prev) => ({
      chats: prev.chats.map((c) => (c.id === prev.activeChatId ? { ...c, systemPrompt: next } : c))
    }));
  });

  const tempInput = document.getElementById('temperature');
  tempInput?.addEventListener('input', (e) => chat && updateChatConfig('temperature', Number(e.target.value)));
  const topPInput = document.getElementById('top-p');
  topPInput?.addEventListener('input', (e) => chat && updateChatConfig('topP', Number(e.target.value)));
  const maxTokens = document.getElementById('max-tokens');
  maxTokens?.addEventListener('input', (e) => chat && updateChatConfig('maxTokens', Number(e.target.value)));
  const streaming = document.getElementById('streaming');
  streaming?.addEventListener('change', (e) => chat && updateChatConfig('stream', e.target.checked));
  const stopSequences = document.getElementById('stop-sequences');
  stopSequences?.addEventListener('input', (e) => chat && updateChatConfig('stopSequences', e.target.value));

  const savePreset = document.getElementById('save-preset');
  savePreset?.addEventListener('click', () => {
    if (!chat) return;
    const name = prompt('Preset name');
    if (!name) return;
    const desc = prompt('Short description');
    const newPreset = { id: crypto.randomUUID(), name, description: desc || 'Custom preset', config: { ...chat.config } };
    store.setState((prev) => ({ presets: [newPreset, ...prev.presets] }));
  });

  document.querySelectorAll('[data-preset]').forEach((el) => {
    el.addEventListener('click', () => {
      if (!chat) return;
      const preset = state.presets.find((p) => p.id === el.dataset.preset);
      if (!preset) return;
      store.setState((prev) => ({
        chats: prev.chats.map((c) => (c.id === prev.activeChatId ? { ...c, config: { ...preset.config } } : c))
      }));
    });
  });

  const globalTemp = document.getElementById('global-temperature');
  globalTemp?.addEventListener('input', (e) => updateGlobalConfig('temperature', Number(e.target.value)));
  const globalTopP = document.getElementById('global-top-p');
  globalTopP?.addEventListener('input', (e) => updateGlobalConfig('topP', Number(e.target.value)));
  const globalMaxTokens = document.getElementById('global-max-tokens');
  globalMaxTokens?.addEventListener('input', (e) => updateGlobalConfig('maxTokens', Number(e.target.value)));
  const globalStreaming = document.getElementById('global-streaming');
  globalStreaming?.addEventListener('change', (e) => updateGlobalConfig('stream', e.target.checked));
}

function updateChatConfig(key, value) {
  store.setState((prev) => ({
    chats: prev.chats.map((c) =>
      c.id === prev.activeChatId ? { ...c, config: { ...c.config, [key]: value } } : c
    )
  }));
}

function updateGlobalConfig(key, value) {
  store.setState((prev) => ({ globalConfig: { ...prev.globalConfig, [key]: value } }));
}

function generateAssistantReply(content, config, systemPrompt) {
  const hints = [
    '✅ Grounded in sources',
    '📊 Summarized for clarity',
    '⚡ Latency-aware routing',
    '🧠 Model hint: ' + (config.temperature > 0.7 ? 'divergent thinking' : 'deterministic mode')
  ];
  return [
    `System: ${systemPrompt?.slice(0, 80) || 'Default guardrails'}`,
    `Noted your request: ${content.slice(0, 120)}`,
    `Response mode: temp ${config.temperature}, top-p ${config.topP}, max ${config.maxTokens}`,
    hints[Math.floor(Math.random() * hints.length)]
  ].join('\n');
}

// Seed defaults if presets lost
if (!store.getState().presets?.length) {
  store.setState({ presets: defaultPresets });
}

// Ready animation
requestAnimationFrame(() => root.classList.remove('loading'));
