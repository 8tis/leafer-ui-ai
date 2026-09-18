import { registerUI, Group, Rect, Text } from 'leafer-ui'

export interface IAIGenerationFrameConfig {
  x?: number
  y?: number
  width?: number
  height?: number
  prompt?: string
  negativePrompt?: string
  model?: string
  aspectRatio?: string
  status?: 'idle' | 'generating' | 'success' | 'error'
  previewUrl?: string
}

export const RATIO_RESOLUTIONS: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
  '4:3': { width: 1024, height: 768 },
  '3:4': { width: 768, height: 1024 },
  '3:2': { width: 1200, height: 800 },
  '2:3': { width: 800, height: 1200 },
  '21:9': { width: 1344, height: 576 },
}

@registerUI()
export class AIGenerationFrame extends Group {
  public get __tag() { return 'AIGenerationFrame' }

  public prompt: string = ''
  public negativePrompt: string = ''
  public model: string = 'gemini-2.5-flash-image'
  public aspectRatio: string = '1:1'
  public status: 'idle' | 'generating' | 'success' | 'error' = 'idle'
  public previewUrl?: string

  public frameRect: Rect
  public badge: Group
  public badgeText: Text

  constructor(config: IAIGenerationFrameConfig = {}) {
    super()
    this.prompt = config.prompt || ''
    this.negativePrompt = config.negativePrompt || ''
    this.model = config.model || 'gemini-2.5-flash-image'
    this.aspectRatio = config.aspectRatio || '1:1'
    this.status = config.status || 'idle'
    this.previewUrl = config.previewUrl

    const defaultRes = RATIO_RESOLUTIONS[this.aspectRatio] || { width: 1024, height: 1024 }
    const w = config.width || defaultRes.width
    const h = config.height || defaultRes.height
    this.x = config.x || 0
    this.y = config.y || 0
    this.width = w
    this.height = h

    this.initVisuals()
  }

  private initVisuals() {
    this.frameRect = new Rect({
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
      stroke: '#6366f1',
      strokeWidth: 2,
      dashPattern: [8, 6],
      fill: 'rgba(99, 102, 241, 0.05)',
      cornerRadius: 6,
      cursor: 'move',
    })

    const badgeBg = new Rect({
      x: 0,
      y: 0,
      width: 130,
      height: 28,
      fill: '#6366f1',
      cornerRadius: [4, 4, 0, 4],
    })

    this.badgeText = new Text({
      x: 8,
      y: 6,
      text: `✨ AI FRAME (${this.width}×${this.height})`,
      fontSize: 11,
      fontWeight: 'bold',
      fill: '#ffffff',
    })

    this.badge = new Group({
      x: 0,
      y: -32,
      children: [badgeBg, this.badgeText],
    })

    this.add(this.frameRect)
    this.add(this.badge)
  }

  public setResolution(w: number, h: number, ratio?: string) {
    this.width = w
    this.height = h
    if (ratio) this.aspectRatio = ratio
    if (this.frameRect) {
      this.frameRect.width = w
      this.frameRect.height = h
    }
    if (this.badgeText) {
      this.badgeText.text = `✨ AI FRAME (${w}×${h})`
    }
  }

  public setStatus(status: 'idle' | 'generating' | 'success' | 'error') {
    this.status = status
    if (status === 'generating') {
      this.frameRect.stroke = '#ec4899'
      this.frameRect.fill = 'rgba(236, 72, 153, 0.1)'
      this.badgeText.text = `⏳ 生成中 (${this.width}×${this.height})...`
    } else if (status === 'error') {
      this.frameRect.stroke = '#ef4444'
      this.frameRect.fill = 'rgba(239, 68, 68, 0.1)'
      this.badgeText.text = `⚠️ 生成失败`
    } else {
      this.frameRect.stroke = '#6366f1'
      this.frameRect.fill = 'rgba(99, 102, 241, 0.05)'
      this.badgeText.text = `✨ AI FRAME (${this.width}×${this.height})`
    }
  }

  public toJSON() {
    return {
      tag: 'AIGenerationFrame',
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      prompt: this.prompt,
      negativePrompt: this.negativePrompt,
      model: this.model,
      aspectRatio: this.aspectRatio,
      status: this.status,
    }
  }
}
