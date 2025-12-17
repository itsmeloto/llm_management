import { defaultGlobalConfig, defaultModels, defaultPresets, defaultServers, starterChats } from './defaults.js';

const STORAGE_KEY = 'llm-control-center-state-v1';

const freshState = () => ({
  theme: 'dark',
  searchQuery: '',
  user: { id: 'solo', name: 'You' },
  globalConfig: { ...defaultGlobalConfig },
  models: defaultModels,
  servers: defaultServers,
  presets: defaultPresets,
  chats: starterChats,
  activeChatId: starterChats[0]?.id || null,
  settingsOpen: false,
  editingSystemPrompt: false,
  serverLatencyMap: Object.fromEntries(defaultServers.map((s) => [s.id, s.latencyMs]))
});

function loadState() {
  if (typeof localStorage === 'undefined') return freshState();
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return freshState();
    const parsed = JSON.parse(cached);
    return { ...freshState(), ...parsed };
  } catch (err) {
    console.error('Failed to load state', err);
    return freshState();
  }
}

function persistState(state) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function createStore() {
  let state = loadState();
  const listeners = new Set();

  const getState = () => state;

  const setState = (updater) => {
    const next = typeof updater === 'function' ? updater(state) : updater;
    state = { ...state, ...next };
    persistState(state);
    listeners.forEach((cb) => cb(state));
  };

  const subscribe = (cb) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };

  return { getState, setState, subscribe };
}

export function createEmptyChat({ modelId, serverId }) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: 'Untitled chat',
    createdAt: now,
    updatedAt: now,
    modelId,
    serverId,
    systemPrompt:
      'You are a concise assistant. Respond with structured, helpful answers and call out assumptions explicitly.',
    config: { ...defaultGlobalConfig },
    messages: []
  };
}

export function updateChatTimestamp(chat) {
  return { ...chat, updatedAt: new Date().toISOString() };
}
