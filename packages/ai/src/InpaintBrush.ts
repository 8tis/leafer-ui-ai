import { Group, Path } from 'leafer-ui'

export interface IInpaintBrushConfig {
  brushSize?: number
  brushColor?: string
}

export class InpaintBrushLayer extends Group {
  public get __tag() { return 'InpaintBrushLayer' }

  public brushSize: number = 40
  public brushColor: string = 'rgba(236, 72, 153, 0.45)'
  public isDrawing: boolean = false
  private currentPath?: Path
  private points: { x: number; y: number }[] = []

  constructor(config: IInpaintBrushConfig = {}) {
    super()
    if (config.brushSize) this.brushSize = config.brushSize
    if (config.brushColor) this.brushColor = config.brushColor
  }

  public startStroke(x: number, y: number) {
    this.isDrawing = true
    this.points = [{ x, y }]
    this.currentPath = new Path({
      path: `M ${x} ${y}`,
      stroke: this.brushColor,
      strokeWidth: this.brushSize,
      strokeCap: 'round',
      strokeJoin: 'round',
    })
    this.add(this.currentPath)
  }

  public moveStroke(x: number, y: number) {
    if (!this.isDrawing || !this.currentPath) return
    this.points.push({ x, y })
    const pathStr = this.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    this.currentPath.path = pathStr
  }

  public endStroke() {
    this.isDrawing = false
    this.currentPath = undefined
    this.points = []
  }

  public clearMask() {
    this.clear()
  }

  public exportMaskCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#ffffff'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    return canvas
  }
}
