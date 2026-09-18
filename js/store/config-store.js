/**
 * Configuration Store for API Keys, Endpoints and Canvas Settings
 */

const STORAGE_KEY = 'rolldek_ai_canvas_config_v1';

const DEFAULT_CONFIG = {
  activeProvider: 'rolldek',
  activeModel: 'gpt-image-2',
  aspectRatio: '1:1',
  quality: 'auto',
  background: 'auto',
  outputFormat: 'png',
  providers: {
    rolldek: {
      apiKey: '',
      baseUrl: 'https://rolldek.com/v1',
      geminiBaseUrl: 'https://rolldek.com/v1beta'
    },
    openai: {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1'
    },
    midjourney: {
      apiKey: '',
      baseUrl: 'https://api.midjourney-proxy.com/mj'
    },
    custom: {
      apiKey: '',
      baseUrl: 'https://api.example.com/v1'
    }
  },
  canvas: {
    showGrid: true,
    snapToGrid: false,
    theme: 'dark'
  }
};

export class ConfigStore {
  constructor() {
    this.config = this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          providers: {
            ...DEFAULT_CONFIG.providers,
            ...(parsed.providers || {})
          },
          canvas: {
            ...DEFAULT_CONFIG.canvas,
            ...(parsed.canvas || {})
          }
        };
      }
    } catch (e) {
      console.warn('Failed to load config from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  }

  get(key) {
    return this.config[key];
  }

  set(key, val) {
    this.config[key] = val;
    this.save();
  }

  getProviderConfigs() {
    return this.config.providers;
  }

  getProviderConfig(providerId) {
    return this.config.providers[providerId] || {};
  }

  updateProviderConfig(providerId, newFields) {
    if (!this.config.providers[providerId]) {
      this.config.providers[providerId] = {};
    }
    this.config.providers[providerId] = {
      ...this.config.providers[providerId],
      ...newFields
    };
    this.save();
  }

  getActiveKey() {
    const provider = this.config.activeProvider || 'rolldek';
    return this.config.providers[provider]?.apiKey || '';
  }

  getFetchedModels(providerId) {
    if (!this.config.fetchedModels) this.config.fetchedModels = {};
    return this.config.fetchedModels[providerId] || [];
  }

  setFetchedModels(providerId, models) {
    if (!this.config.fetchedModels) this.config.fetchedModels = {};
    this.config.fetchedModels[providerId] = models;
    this.save();
  }

  getCustomModels() {
    return this.config.customModels || [];
  }

  addCustomModel(model) {
    if (!this.config.customModels) this.config.customModels = [];
    if (!this.config.customModels.some(m => m.id === model.id)) {
      this.config.customModels.push(model);
      this.save();
    }
  }
}
