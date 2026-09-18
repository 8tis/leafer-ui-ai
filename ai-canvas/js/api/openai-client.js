/**
 * OpenAI & Compatible Platform Client (DALL-E 3 / DALL-E 2 / SiliconFlow / OneAPI / OpenRouter)
 */

export class OpenAIClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || '';
    this.baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    this.useProxy = config.useProxy ?? true;
  }

  getEndpoint(url) {
    if (this.useProxy) {
      return `/api/proxy?target=${encodeURIComponent(url)}`;
    }
    return url;
  }

  async parseError(response) {
    let msg = `HTTP ${response.status} (${response.statusText})`;
    try {
      const data = await response.json();
      if (data.error && data.error.message) msg = data.error.message;
      else if (data.message) msg = data.message;
    } catch (_) {
      try {
        const text = await response.text();
        if (text) msg = text;
      } catch (__) {}
    }
    return new Error(`OpenAI 兼容接口错误: ${msg}`);
  }

  async testConnection() {
    if (!this.apiKey) throw new Error('请先填写 API Key');
    const endpoint = this.getEndpoint(`${this.baseUrl}/models`);
    const resp = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    if (!resp.ok) throw await this.parseError(resp);
    return true;
  }

  /**
   * Fetch models dynamically from /models endpoint
   */
  async fetchModels() {
    if (!this.apiKey) throw new Error('请先填写 API Key');
    const endpoint = this.getEndpoint(`${this.baseUrl}/models`);
    const resp = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    if (!resp.ok) throw await this.parseError(resp);
    const data = await resp.json();
    let rawList = Array.isArray(data) ? data : (data.data || []);
    return rawList.map(m => {
      const id = typeof m === 'string' ? m : (m.id || m.name);
      return {
        id,
        name: id,
        provider: 'openai',
        badge: '动态获取',
        description: '从三方接口 /v1/models 自动拉取'
      };
    });
  }

  async generate(options) {
    if (!this.apiKey) {
      throw new Error('请先在顶部设置中配置 OpenAI API Key');
    }

    const { model = 'dall-e-3', prompt, size = '1024x1024', quality = 'standard', maskBlob, refImages = [] } = options;

    // If mask or edit with DALL-E 2
    if ((maskBlob || refImages.length > 0) && model === 'dall-e-2') {
      return await this._editImage({ prompt, size, maskBlob, refImages });
    }

    const endpoint = this.getEndpoint(`${this.baseUrl}/images/generations`);
    const payload = {
      model,
      prompt,
      size: size || '1024x1024',
      n: 1,
      response_format: 'url'
    };

    if (model === 'dall-e-3' && quality) {
      payload.quality = quality === 'hd' ? 'hd' : 'standard';
    }

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) throw await this.parseError(resp);

    const data = await resp.json();
    if (!data.data || !data.data[0]) throw new Error('返回图片数据为空');

    const item = data.data[0];
    if (item.url) return { url: item.url, format: 'png' };
    if (item.b64_json) return { url: `data:image/png;base64,${item.b64_json}`, format: 'png' };
    throw new Error('未能获取有效图片结果');
  }

  async _editImage({ prompt, size, maskBlob, refImages }) {
    const endpoint = this.getEndpoint(`${this.baseUrl}/images/edits`);
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('size', size || '1024x1024');

    if (refImages.length > 0) {
      const img = refImages[0];
      const blob = img instanceof Blob ? img : await (await fetch(img.url || img)).blob();
      formData.append('image', blob, 'image.png');
    }
    if (maskBlob) {
      formData.append('mask', maskBlob, 'mask.png');
    }

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });

    if (!resp.ok) throw await this.parseError(resp);
    const data = await resp.json();
    if (!data.data || !data.data[0]) throw new Error('编辑返回数据为空');
    return { url: data.data[0].url || `data:image/png;base64,${data.data[0].b64_json}`, format: 'png' };
  }
}
