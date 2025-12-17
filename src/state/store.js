import { defaultModelInfo, defaultServerInfo, starterChats } from './defaults.js';

const STORAGE_KEY = 'nurik-ai-chat-state-v1';

const freshState = () => ({
  theme: 'dark',
  searchQuery: '',
  chats: starterChats,
  activeChatId: starterChats[0]?.id || null,
  modelInfo: defaultModelInfo,
  serverInfo: defaultServerInfo,
  settingsOpen: false,
  activeSettingsTab: 'model',
  showModelModal: false,
  showServerModal: false
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

export function createEmptyChat() {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: 'New conversation',
    createdAt: now,
    updatedAt: now,
    messages: []
  };
}

export function updateChatTimestamp(chat) {
  return { ...chat, updatedAt: new Date().toISOString() };
}
