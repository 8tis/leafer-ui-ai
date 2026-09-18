/**
 * Unified API Manager & Orchestrator
 */

import { PROVIDER_TYPES, ALL_MODELS } from './providers.js';
import { RolldekClient } from './rolldek-client.js';
import { OpenAIClient } from './openai-client.js';
import { MidjourneyClient } from './midjourney-client.js';

export class APIManager {
  constructor(configStore) {
    this.configStore = configStore;
    this.clients = {};
    this.initClients();
  }

  initClients() {
    const configs = this.configStore.getProviderConfigs();

    this.clients[PROVIDER_TYPES.ROLLDEK] = new RolldekClient({
      apiKey: configs.rolldek?.apiKey || '',
      baseUrl: configs.rolldek?.baseUrl || 'https://rolldek.com/v1',
      geminiBaseUrl: configs.rolldek?.geminiBaseUrl || 'https://rolldek.com/v1beta',
      useProxy: true
    });

    this.clients[PROVIDER_TYPES.OPENAI] = new OpenAIClient({
      apiKey: configs.openai?.apiKey || '',
      baseUrl: configs.openai?.baseUrl || 'https://api.openai.com/v1',
      useProxy: true
    });

    this.clients[PROVIDER_TYPES.MIDJOURNEY] = new MidjourneyClient({
      apiKey: configs.midjourney?.apiKey || '',
      baseUrl: configs.midjourney?.baseUrl || 'https://api.midjourney-proxy.com/mj',
      useProxy: true
    });

    this.clients[PROVIDER_TYPES.CUSTOM] = new OpenAIClient({
      apiKey: configs.custom?.apiKey || '',
      baseUrl: configs.custom?.baseUrl || 'https://api.example.com/v1',
      useProxy: true
    });
  }

  reloadConfigs() {
    this.initClients();
  }

  getAllAvailableModels() {
    const list = [...ALL_MODELS];
    const providers = ['rolldek', 'openai', 'midjourney', 'custom'];
    
    // Add dynamically fetched models from providers
    providers.forEach(pId => {
      const fetched = this.configStore.getFetchedModels(pId);
      fetched.forEach(fm => {
        if (!list.some(m => m.id === fm.id)) {
          list.push({
            ...fm,
            provider: pId,
            resolutions: ['1024x1024', '1280x720', '720x1280'],
            supportsInpaint: true
          });
        }
      });
    });

    // Add user custom added models
    const custom = this.configStore.getCustomModels();
    custom.forEach(cm => {
      if (!list.some(m => m.id === cm.id)) {
        list.push({
          ...cm,
          provider: cm.provider || 'custom',
          badge: '自定义',
          resolutions: ['1024x1024', '1280x720', '720x1280'],
          supportsInpaint: true
        });
      }
    });

    return list;
  }

  getModel(modelId) {
    const all = this.getAllAvailableModels();
    const found = all.find(m => m.id === modelId);
    if (found) return found;

    // Fallback dynamic model for any unrecognized model string
    return {
      id: modelId,
      name: modelId,
      provider: this.configStore.get('activeProvider') || 'openai',
      badge: '动态模型',
      description: '动态指定的第三方模型',
      resolutions: ['1024x1024', '1280x720', '720x1280'],
      supportsInpaint: true
    };
  }

  async fetchModels(providerId) {
    const client = this.clients[providerId];
    if (!client) throw new Error(`未知的服务商: ${providerId}`);
    if (!client.fetchModels) {
      throw new Error(`该服务商暂不支持自动获取模型列表接口`);
    }
    const models = await client.fetchModels();
    this.configStore.setFetchedModels(providerId, models);
    return models;
  }

  async testConnection(providerId) {
    const client = this.clients[providerId];
    if (!client) throw new Error(`未知的服务商: ${providerId}`);
    return await client.testConnection();
  }

  /**
   * Primary entry point for AI Canvas generation
   */
  async generateImage(params, onProgress = () => {}) {
    const {
      model: modelId,
      prompt,
      aspectRatio = '1:1',
      size,
      quality = 'auto',
      background = 'auto',
      outputFormat = 'png',
      refImages = [],
      maskBlob = null
    } = params;

    if (!prompt || !prompt.trim()) {
      throw new Error('请输入提示词 (Prompt)');
    }

    const modelMeta = this.getModel(modelId);
    const providerId = modelMeta.provider;
    const client = this.clients[providerId];

    // Check if key is configured
    const currentKey = client?.apiKey;
    const isMockDemo = !currentKey || currentKey === 'DEMO_MOCK';

    if (isMockDemo) {
      onProgress({ status: 'generating', message: '演示模式生成中 (未检测到 API Key，演示出图中)...' });
      await new Promise(r => setTimeout(r, 1600));
      return this._generateMockResult(params, modelMeta);
    }

    onProgress({ status: 'sending', message: `正在请求 ${modelMeta.name}...` });

    try {
      const result = await client.generate({
        model: modelId,
        prompt: prompt.trim(),
        aspectRatio,
        size,
        quality,
        background,
        outputFormat,
        refImages,
        maskBlob
      });

      return {
        id: 'gen_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        url: result.url,
        format: result.format || outputFormat,
        model: modelId,
        modelName: modelMeta.name,
        provider: providerId,
        prompt: prompt.trim(),
        aspectRatio,
        timestamp: Date.now()
      };
    } catch (err) {
      console.error('Generation error:', err);
      throw err;
    }
  }

  /**
   * Procedural artwork generator for instant offline testing
   */
  _generateMockResult(params, modelMeta) {
    const { prompt, aspectRatio = '1:1', size = '1024x1024' } = params;
    let [w, h] = [1024, 1024];
    if (size && size.includes('x')) {
      const parts = size.split('x');
      w = parseInt(parts[0]) || 1024;
      h = parseInt(parts[1]) || 1024;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.min(w, 1280);
    canvas.height = Math.min(h, 1280);
    const ctx = canvas.getContext('2d');

    // Create rich vibrant artistic backdrop
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    const hues = [220, 260, 320, 180, 40];
    const randHue = hues[Math.floor(Math.random() * hues.length)];
    grad.addColorStop(0, `hsl(${randHue}, 70%, 15%)`);
    grad.addColorStop(0.5, `hsl(${(randHue + 40) % 360}, 65%, 28%)`);
    grad.addColorStop(1, `hsl(${(randHue + 90) % 360}, 80%, 45%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Modern glowing abstract curves & particles
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 28; i++) {
      ctx.beginPath();
      const cx = Math.random() * canvas.width;
      const cy = Math.random() * canvas.height;
      const rad = 40 + Math.random() * 200;
      const rGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, rad);
      rGrad.addColorStop(0, `hsla(${(randHue + i * 15) % 360}, 85%, 65%, 0.45)`);
      rGrad.addColorStop(1, `hsla(${(randHue + i * 15) % 360}, 85%, 65%, 0)`);
      ctx.fillStyle = rGrad;
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // Badge and text overlay
    ctx.fillStyle = 'rgba(15, 17, 23, 0.75)';
    ctx.roundRect ? ctx.roundRect(30, canvas.height - 130, canvas.width - 60, 90, 16) : ctx.fillRect(30, canvas.height - 130, canvas.width - 60, 90);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(`✨ ${modelMeta.name} · Canvas Output`, 50, canvas.height - 90);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px system-ui, sans-serif';
    const displayPrompt = prompt.length > 55 ? prompt.substring(0, 52) + '...' : prompt;
    ctx.fillText(`"${displayPrompt}"`, 50, canvas.height - 60);

    return {
      id: 'mock_' + Date.now(),
      url: canvas.toDataURL('image/png'),
      format: 'png',
      model: modelMeta.id,
      modelName: modelMeta.name,
      provider: modelMeta.provider,
      prompt,
      aspectRatio,
      timestamp: Date.now(),
      isDemo: true
    };
  }
}
