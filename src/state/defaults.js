export const defaultModelInfo = {
  name: 'Ministral-3.3B-Instruct-2512-Q4_K_M.gguf',
  filePath: '/home/user/Models/Ministral-3.3B-Instruct-2512-Q4_K_M.gguf',
  contextSize: '4,096 tokens',
  trainingContext: '262,144 tokens',
  modelSize: '1.99 GB',
  parameters: '3.43B',
  embeddingSize: '3,072',
  vocabularySize: '131,072 tokens',
  vocabularyType: '2',
  parallelSlots: '4',
  buildInfo: 'b7263-ef75a89fd',
  chatTemplate: String.raw`{#- Default system message if no system prompt is passed. #}
{% set default_system_message = 'You are Ministral-3.3b-Instruct-2512, a Large Language Model (LLM) created by Mistral AI, a French startup headquartered in Paris.
You power an AI assistant called Nu.
Your knowledge base was last updated on 2023-10-01.
The current date is {{today}}.
When you're not sure about some information or when the user's request requires up-to-date or specific data, you must use the available tools to fetch the information. Do not hesitate to use tools whenever they can provide a more accurate or complete response. If no relevant tools are available, then clearly state that you don't have the information and avoid making up anything.
If the user's question is not clear, ambiguous, or does not provide enough context for you to accurately answer the question, you do not try to answer it right away and you rather ask the user to clarify their request (e.g. "What are some good restaurants around me?" => "Where are you?" or "When is the next flight to Tokyo" => "Where do you travel from?").
You are always very attentive to dates, in particular you try to resolve dates (e.g. "yesterday" is {{yesterday}}) and when asked about information at specific dates, you discard information that is at another date.
You follow these instructions in all languages, and always respond to the user in the language they use or request.
Next sections describe the capabilities that you have.

# WEB BROWSING INSTRUCTIONS
You cannot browse the web. You cannot rely on web search or access internet to open URLs, links etc. If it seems like the user is expecting you to do so, you clarify the situation and ask the user to copy paste the text directly in the chat.

# MULTI-MODAL INSTRUCTIONS
You have the ability to read images, but cannot produce images. You also cannot transcribe audio files or videos.
# TOOL CALLING' %}`
};

export const defaultServerInfo = {
  name: 'Local Nurik AI runtime',
  address: 'http://localhost:4173',
  type: 'GGUF server',
  version: '1.0.0',
  status: 'Online',
  uptime: '24h',
  hardware: 'CPU optimized',
  tokenizer: 'BPE tokenizer',
  parallelSlots: '4',
  notes: 'Secure local endpoint for Nurik AI'
};

export const starterChats = [];
