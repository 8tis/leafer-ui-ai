export interface IModelInfo {
  id: string
  name: string
  owned_by?: string
  description?: string
  category?: 'image' | 'llm' | 'multimodal'
}

export interface IGenerationOptions {
  prompt: string
  negativePrompt?: string
  model?: string
  width?: number
  height?: number
  aspectRatio?: string
  n?: number
  referenceImages?: string[]
  maskImage?: string
}

export class AIClient {
  public baseUrl: string
  public apiKey: string
  public models: IModelInfo[] = []

  constructor(baseUrl: string = '/api/proxy', apiKey: string = '') {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  public async fetchModels(): Promise<IModelInfo[]> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])
      this.models = list.map((m: any) => ({
        id: m.id || m.name,
        name: m.id || m.name,
        owned_by: m.owned_by || 'rolldek',
        category: (m.id && (m.id.includes('image') || m.id.includes('dall') || m.id.includes('midjourney'))) ? 'image' : 'multimodal'
      }))
      return this.models
    } catch (e) {
      console.warn('[AIClient] Failed to fetch models:', e)
      return []
    }
  }

  public async generateImage(options: IGenerationOptions): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        prompt: options.prompt,
        model: options.model || 'gemini-2.5-flash-image',
        n: options.n || 1,
        size: `${options.width || 1024}x${options.height || 1024}`,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Generation failed: ${errText}`)
    }

    const data = await res.json()
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((item: any) => item.url || (item.b64_json ? `data:image/png;base64,${item.b64_json}` : ''))
    }
    return []
  }
}
