import type { App, IUI } from 'leafer-ui'

export interface ISerializedNode {
  id?: string | number
  tag: string
  name?: string
  x: number
  y: number
  width?: number
  height?: number
  fill?: any
  stroke?: any
  text?: string
  url?: string
  childrenCount?: number
  zIndex?: number
}

export interface ICanvasSceneContext {
  viewport: {
    x: number
    y: number
    scale: number
    width: number
    height: number
  }
  selectedNodes: ISerializedNode[]
  totalNodesCount: number
  nodes: ISerializedNode[]
}

export class SceneSerializer {
  public static serializeNode(node: IUI): ISerializedNode {
    const raw: any = node
    return {
      id: raw.id || raw.innerId,
      tag: node.__tag || raw.tag || 'UI',
      name: raw.name,
      x: Math.round(node.x || 0),
      y: Math.round(node.y || 0),
      width: Math.round(node.width || 0),
      height: Math.round(node.height || 0),
      fill: typeof raw.fill === 'string' ? raw.fill : (raw.fill ? '[complex fill]' : undefined),
      stroke: typeof raw.stroke === 'string' ? raw.stroke : (raw.stroke ? '[stroke]' : undefined),
      text: raw.text,
      url: raw.url ? (raw.url.startsWith('data:') ? '[data-image]' : raw.url) : undefined,
      childrenCount: raw.children ? raw.children.length : 0,
      zIndex: raw.zIndex,
    }
  }

  public static serializeScene(app: App): ICanvasSceneContext {
    const tree = app.tree
    const editor = (app as any).editor

    const nodes: ISerializedNode[] = []
    let totalCount = 0

    if (tree && tree.children) {
      const walk = (item: any) => {
        if (!item || item === (app as any).overlayLayer) return
        totalCount++
        nodes.push(this.serializeNode(item))
        if (item.children && Array.isArray(item.children)) {
          item.children.forEach(walk)
        }
      }
      tree.children.forEach(walk)
    }

    const selectedNodes: ISerializedNode[] = []
    if (editor && editor.list && Array.isArray(editor.list)) {
      editor.list.forEach((item: any) => {
        selectedNodes.push(this.serializeNode(item))
      })
    } else if (editor && editor.element) {
      selectedNodes.push(this.serializeNode(editor.element))
    }

    const bounds = app.canvas ? app.canvas.bounds : { width: window.innerWidth, height: window.innerHeight }
    const zoom = app.tree ? (app.tree.scaleX || 1) : 1
    const x = app.tree ? (app.tree.x || 0) : 0
    const y = app.tree ? (app.tree.y || 0) : 0

    return {
      viewport: {
        x: Math.round(x),
        y: Math.round(y),
        scale: Number(zoom.toFixed(2)),
        width: bounds.width,
        height: bounds.height,
      },
      selectedNodes,
      totalNodesCount: totalCount,
      nodes: nodes.slice(0, 50), // Cap at 50 nodes for LLM context window efficiency
    }
  }

  public static toLLMPromptContext(scene: ICanvasSceneContext): string {
    const selText = scene.selectedNodes.length > 0
      ? `当前用户选中的元素(${scene.selectedNodes.length}个): ${JSON.stringify(scene.selectedNodes, null, 2)}`
      : '当前没有选中任何元素。'

    return `
【当前 Leafer 画布全景状态】
- 视口范围: 中心坐标 (${scene.viewport.x}, ${scene.viewport.y}), 缩放级别: ${scene.viewport.scale}x, 视口物理尺寸: ${scene.viewport.width}x${scene.viewport.height}
- 场景内元素总数: ${scene.totalNodesCount}
- ${selText}
- 画布中主要元素列表:
${JSON.stringify(scene.nodes, null, 2)}
`.trim()
  }
}
