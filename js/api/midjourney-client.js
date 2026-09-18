/**
 * Midjourney Proxy API Client (Go-Proxy-Midjourney compatible)
 */

export class MidjourneyClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || '';
    this.baseUrl = (config.baseUrl || 'https://api.midjourney-proxy.com/mj').replace(/\/+$/, '');
    this.useProxy = config.useProxy ?? true;
  }

  getEndpoint(url) {
    if (this.useProxy) {
      return `/api/proxy?target=${encodeURIComponent(url)}`;
    }
    return url;
  }

  async testConnection() {
    if (!this.apiKey) throw new Error('请先填写 Midjourney API Key');
    return true;
  }

  async generate(options) {
    if (!this.apiKey) throw new Error('请配置 Midjourney API Key');

    const { prompt, aspectRatio, refImages = [] } = options;

    let fullPrompt = prompt;
    if (refImages && refImages.length > 0) {
      const urls = refImages.filter(r => typeof r === 'string' && r.startsWith('http')).join(' ');
      if (urls) fullPrompt = `${urls} ${fullPrompt}`;
    }
    if (aspectRatio && aspectRatio !== '1:1') {
      fullPrompt = `${fullPrompt} --ar ${aspectRatio}`;
    }

    const endpoint = this.getEndpoint(`${this.baseUrl}/submit/imagine`);
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mj-api-secret': this.apiKey,
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ prompt: fullPrompt })
    });

    const data = await resp.json();
    if (!resp.ok || data.code !== 1) {
      throw new Error(data.description || 'Midjourney 提交任务失败');
    }

    const taskId = data.result;
    return await this._pollTask(taskId);
  }

  async _pollTask(taskId) {
    const checkEndpoint = this.getEndpoint(`${this.baseUrl}/task/${taskId}/fetch`);
    const maxRetries = 60; // 2 minutes approx
    for (let i = 0; i < maxRetries; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const resp = await fetch(checkEndpoint, {
        headers: {
          'mj-api-secret': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      if (data.status === 'SUCCESS' && data.imageUrl) {
        return { url: data.imageUrl, format: 'png' };
      }
      if (data.status === 'FAILED') {
        throw new Error(`Midjourney 生成失败: ${data.failReason || '任务超时或异常'}`);
      }
    }
    throw new Error('Midjourney 生成超时，请稍后在历史记录中查看');
  }
}
