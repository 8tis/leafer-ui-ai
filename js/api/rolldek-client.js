/**
 * RollDek Official API Client
 * Compatible with RollDek OpenAI image endpoints & Gemini banana endpoints
 */

export class RolldekClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || '';
    this.baseUrl = (config.baseUrl || 'https://rolldek.com/v1').replace(/\/+$/, '');
    this.geminiBaseUrl = (config.geminiBaseUrl || 'https://rolldek.com/v1beta').replace(/\/+$/, '');
    this.useProxy = config.useProxy ?? true; // Route through local server proxy if needed
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
    return new Error(`RollDek 接口错误: ${msg}`);
  }

  async testConnection() {
    if (!this.apiKey) throw new Error('请先填写 RollDek API Key');
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
   * Fetch all models dynamically from RollDek /v1/models
   */
  async fetchModels() {
    if (!this.apiKey) throw new Error('请先填写 RollDek API Key');
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
        provider: 'rolldek',
        badge: '动态获取',
        description: '从 RollDek API /v1/models 接口自动拉取'
      };
    });
  }

  /**
   * Main generation entry point
   */
  async generate(options) {
    if (!this.apiKey) {
      throw new Error('请先在顶部设置中配置 RollDek API Key');
    }

    const { model, prompt, size, quality, aspectRatio, imageSize, refImages = [], maskBlob, background, outputFormat = 'png' } = options;

    if (model.includes('gemini-3')) {
      return await this._generateGemini({ model, prompt, aspectRatio, imageSize, refImages });
    }

    if ((refImages && refImages.length > 0) || maskBlob) {
      return await this._editOpenAI({ model, prompt, size, quality, refImages, maskBlob, background, outputFormat });
    }

    return await this._generateOpenAI({ model, prompt, size, quality, background, outputFormat });
  }

  /**
   * Standard Text-to-Image via /v1/images/generations
   */
  async _generateOpenAI({ model, prompt, size, quality, background, outputFormat }) {
    const endpoint = this.getEndpoint(`${this.baseUrl}/images/generations`);
    const payload = {
      model,
      prompt,
      size: size || '1024x1024',
      response_format: 'url'
    };

    if (quality && quality !== 'auto') {
      payload.quality = quality;
    }
    if (background && background !== 'auto') {
      payload.background = background;
    }
    if (outputFormat) {
      payload.output_format = outputFormat;
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
    if (!data.data || !data.data[0]) {
      throw new Error('API 返回的数据为空');
    }

    const item = data.data[0];
    if (item.url) return { url: item.url, format: outputFormat };
    if (item.b64_json) return { url: `data:image/${outputFormat};base64,${item.b64_json}`, format: outputFormat };
    throw new Error('未能获取到有效的图片数据');
  }

  /**
   * Image-to-Image / Inpainting via /v1/images/edits
   */
  async _editOpenAI({ model, prompt, size, quality, refImages, maskBlob, background, outputFormat }) {
    const endpoint = this.getEndpoint(`${this.baseUrl}/images/edits`);
    const formData = new FormData();

    formData.append('model', model);
    formData.append('prompt', prompt);

    if (size && size !== 'auto') formData.append('size', size);
    if (quality && quality !== 'auto') formData.append('quality', quality);
    if (background && background !== 'auto') formData.append('background', background);
    if (outputFormat) formData.append('output_format', outputFormat);

    // Multi-reference images (image[] or image)
    if (refImages && refImages.length > 0) {
      for (let i = 0; i < Math.min(refImages.length, 16); i++) {
        const item = refImages[i];
        const blob = item instanceof Blob ? item : await (await fetch(item.url || item)).blob();
        formData.append('image[]', blob, `ref_${i}.png`);
      }
    }

    // Inpainting Mask
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
    if (!data.data || !data.data[0]) {
      throw new Error('编辑接口返回的数据为空');
    }

    const item = data.data[0];
    if (item.url) return { url: item.url, format: outputFormat };
    if (item.b64_json) return { url: `data:image/${outputFormat};base64,${item.b64_json}`, format: outputFormat };
    throw new Error('未能获取到有效的图片编辑数据');
  }

  /**
   * Gemini Banana format: /v1beta/models/{model}:generateContent
   */
  async _generateGemini({ model, prompt, aspectRatio = '1:1', imageSize = '1K', refImages = [] }) {
    const endpoint = this.getEndpoint(`${this.geminiBaseUrl}/models/${model}:generateContent`);

    const parts = [];

    // Reference images as inlineData
    if (refImages && refImages.length > 0) {
      for (const ref of refImages) {
        let base64Data = '';
        let mimeType = 'image/png';
        if (typeof ref === 'string' && ref.startsWith('data:')) {
          const match = ref.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            base64Data = match[2];
          }
        } else if (ref instanceof Blob) {
          mimeType = ref.type || 'image/png';
          base64Data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(ref);
          });
        }
        if (base64Data) {
          parts.push({
            inlineData: {
              mimeType,
              data: base64Data
            }
          });
        }
      }
    }

    parts.push({ text: prompt });

    const payload = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        responseFormat: {
          image: {
            aspectRatio: aspectRatio,
            imageSize: imageSize || '1K'
          }
        }
      }
    };

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'x-goog-api-key': this.apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) throw await this.parseError(resp);

    const data = await resp.json();
    const candidate = data.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find(p => p.inlineData);

    if (imagePart?.inlineData) {
      const mime = imagePart.inlineData.mimeType || 'image/png';
      return {
        url: `data:${mime};base64,${imagePart.inlineData.data}`,
        format: mime.split('/')[1] || 'png'
      };
    }

    throw new Error('香蕉 (Gemini) 模型未能输出有效图片内容');
  }
}
