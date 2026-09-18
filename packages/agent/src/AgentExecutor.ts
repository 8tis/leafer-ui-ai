import { Rect, Ellipse, Star, Box, Text, Line, Group } from 'leafer-ui'
import type { App } from 'leafer-ui'
import { AIGenerationFrame, RATIO_RESOLUTIONS } from '@leafer-ui/ai'

export class AgentExecutor {
  private app: App

  constructor(app: App) {
    this.app = app
  }

  public async executeTool(name: string, args: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      switch (name) {
        case 'create_shape': {
          const { tag, x, y, width = 120, height = 120, fill = '#3b82f6', stroke, strokeWidth, cornerRadius, text, fontSize = 16 } = args
          let element: any

          if (tag === 'Rect') {
            element = new Rect({ x, y, width, height, fill, stroke, strokeWidth, cornerRadius: cornerRadius || 8 })
          } else if (tag === 'Ellipse') {
            element = new Ellipse({ x, y, width, height, fill, stroke, strokeWidth })
          } else if (tag === 'Star') {
            element = new Star({ x, y, width, height, fill, stroke, strokeWidth })
          } else if (tag === 'Text') {
            element = new Text({ x, y, text: text || '示例文本', fontSize, fill: fill || '#ffffff' })
          } else {
            element = new Box({ x, y, width, height, fill, stroke, strokeWidth, cornerRadius })
          }

          this.app.tree.add(element)
          if ((this.app as any).editor) {
            (this.app as any).editor.target = element
          }
          return { success: true, message: `成功创建 ${tag} 元素于 (${x}, ${y})`, data: { id: element.innerId } }
        }

        case 'create_ai_frame': {
          const { x, y, aspectRatio = '1:1', prompt, model, autoGenerate } = args
          const res = RATIO_RESOLUTIONS[aspectRatio] || { width: 1024, height: 1024 }
          const frame = new AIGenerationFrame({
            x,
            y,
            width: res.width,
            height: res.height,
            aspectRatio,
            prompt,
            model,
          })

          const overlay = (this.app as any).overlayLayer || this.app.tree
          overlay.add(frame)
          if ((this.app as any).editor) {
            (this.app as any).editor.target = frame
          }

          return {
            success: true,
            message: `成功部署 AI 生成框 [${aspectRatio}] "${prompt}"`,
            data: { id: frame.innerId, width: res.width, height: res.height, autoGenerate }
          }
        }

        case 'auto_layout': {
          const { direction = 'horizontal', gap = 24 } = args
          const editor = (this.app as any).editor
          const list = (editor && editor.list && editor.list.length > 0) ? editor.list : (this.app.tree.children || [])
          if (list.length <= 1) {
            return { success: false, message: '画布中可排列的元素少于2个' }
          }

          let curX = list[0].x || 0
          let curY = list[0].y || 0

          list.forEach((item: any, idx: number) => {
            if (idx === 0) return
            if (direction === 'horizontal') {
              const prev = list[idx - 1]
              curX += (prev.width || 100) + gap
              item.x = curX
              item.y = curY
            } else if (direction === 'vertical') {
              const prev = list[idx - 1]
              curY += (prev.height || 100) + gap
              item.x = curX
              item.y = curY
            }
          })
          return { success: true, message: `已将 ${list.length} 个元素按 ${direction} 方式自动排列，间距 ${gap}px` }
        }

        case 'connect_elements': {
          const { fromId, toId, label, color = '#6366f1' } = args
          const findNode = (id: any) => this.app.tree.find((n: any) => n.innerId === id || n.id === id)[0]
          const nodeA = findNode(fromId)
          const nodeB = findNode(toId)

          if (!nodeA || !nodeB) {
            return { success: false, message: `未能找到要连接的节点` }
          }

          const startX = (nodeA.x || 0) + (nodeA.width || 0)
          const startY = (nodeA.y || 0) + (nodeA.height || 0) / 2
          const endX = nodeB.x || 0
          const endY = (nodeB.y || 0) + (nodeB.height || 0) / 2

          const line = new Line({
            points: [startX, startY, endX, endY],
            stroke: color,
            strokeWidth: 2,
            dashPattern: [6, 4],
          })
          this.app.tree.add(line)
          return { success: true, message: `成功在元素之间建立连线` }
        }

        case 'delete_elements': {
          const { ids } = args
          let count = 0
          ids.forEach((id: string) => {
            const found = this.app.tree.find((n: any) => n.innerId === id || n.id === id)
            found.forEach((node: any) => {
              node.remove()
              count++
            })
          })
          return { success: true, message: `成功删除 ${count} 个元素` }
        }

        default:
          return { success: false, message: `未知的工具指令: ${name}` }
      }
    } catch (err: any) {
      return { success: false, message: `执行错误: ${err.message}` }
    }
  }
}
