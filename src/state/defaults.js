export const defaultModels = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    size: '40B (context aware)',
    quantization: 'FP16',
    contextWindow: '128k',
    throughput: '200 tok/s'
  },
  {
    id: 'llama-3-70b',
    name: 'Llama 3 70B Instruct',
    provider: 'Local GPU',
    size: '70B',
    quantization: 'Q4_K_M',
    contextWindow: '32k',
    throughput: '110 tok/s'
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'Remote API',
    size: '22B',
    quantization: 'FP16',
    contextWindow: '32k',
    throughput: '150 tok/s'
  }
];

export const defaultServers = [
  {
    id: 'sfo-edge',
    name: 'SFO GPU Cluster',
    region: 'us-west',
    latencyMs: 82,
    status: 'healthy',
    endpoint: 'https://sfo.llm.local'
  },
  {
    id: 'nyc-hybrid',
    name: 'NYC Hybrid',
    region: 'us-east',
    latencyMs: 115,
    status: 'degraded',
    endpoint: 'https://nyc.llm.local'
  },
  {
    id: 'fra-edge',
    name: 'Frankfurt Edge',
    region: 'eu-central',
    latencyMs: 150,
    status: 'healthy',
    endpoint: 'https://fra.llm.local'
  }
];

export const defaultPresets = [
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'General purpose, grounded answers',
    config: { temperature: 0.6, topP: 0.9, maxTokens: 2048, stream: true, stopSequences: '' }
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'High-divergence brainstorming',
    config: { temperature: 0.9, topP: 0.95, maxTokens: 2048, stream: true, stopSequences: '' }
  },
  {
    id: 'precise',
    name: 'Precise',
    description: 'Low hallucination, deterministic',
    config: { temperature: 0.2, topP: 0.7, maxTokens: 1024, stream: false, stopSequences: '' }
  }
];

export const defaultGlobalConfig = {
  temperature: 0.7,
  topP: 0.92,
  maxTokens: 2048,
  stream: true,
  stopSequences: ''
};

export const starterChats = [
  {
    id: 'chat-onboarding',
    title: 'Product strategy alignment',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modelId: 'gpt-4-turbo',
    serverId: 'sfo-edge',
    systemPrompt:
      'You are a concise staff-level assistant. Prioritize clarity, avoid hallucinations, and cite assumptions explicitly.',
    config: { temperature: 0.65, topP: 0.9, maxTokens: 2048, stream: true, stopSequences: '' },
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Draft a product brief for a developer-centric LLM workspace with observability.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'm2',
        role: 'assistant',
        content:
          'Here is a concise outline: 1) Problem: fractured LLM ops. 2) Vision: unified control plane. 3) Users: platform teams, applied ML. 4) Pillars: chat ops, model routing, guardrails, analytics. 5) Metrics: latency P95 < 1.5s, cost per token, win-rate.',
        createdAt: new Date().toISOString()
      }
    ]
  }
];
