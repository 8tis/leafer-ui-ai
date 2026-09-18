import type { App } from 'leafer-ui'
import type { ILeaf } from '@leafer-ui/interface'
import { EditToolbarPlugin } from './EditToolbarPlugin'

export interface IAIEditToolbarCallbacks {
  onInpaint?: (node: ILeaf) => void
  onUseAsRef?: (node: ILeaf) => void
  onVariation?: (node: ILeaf) => void
  onOutpaint?: (node: ILeaf) => void
  onBringToFront?: (node: ILeaf) => void
  onSendToBack?: (node: ILeaf) => void
  onDelete?: (node: ILeaf) => void
  onDownload?: (node: ILeaf) => void
}

export class AIEditToolbar {
  private plugin: EditToolbarPlugin

  constructor(app: App, callbacks: IAIEditToolbarCallbacks = {}) {
    this.plugin = new EditToolbarPlugin(app, {
      className: 'leafer-ai-floating-toolbar',
      followScale: false,
      shouldShow: (node) => {
        // Do not show toolbar on root/canvas layer
        if (node === app.tree || (node as any).isLeafer) return false
        return true
      },
      onRender: (node, container) => {
        const isImage = (node as any).__tag === 'Image' || (node as any).url || (node as any).fill?.type === 'image'
        const isAIFrame = (node as any).__tag === 'AIGenerationFrame'

        container.innerHTML = `
          <div class="ai-toolbar-inner">
            ${isImage ? `
              <button class="ai-tb-btn" data-action="inpaint" title="局部重绘">
                <span class="icon">🖌️</span> 局部重绘
              </button>
              <button class="ai-tb-btn" data-action="ref" title="设为参考图/垫图">
                <span class="icon">🔗</span> 设为参考
              </button>
              <button class="ai-tb-btn" data-action="variation" title="以此图生成变体">
                <span class="icon">🪄</span> 变体
              </button>
            ` : ''}
            ${!isAIFrame ? `
              <button class="ai-tb-btn" data-action="create-frame" title="在此位置新建AI生成框">
                <span class="icon">✨</span> 转为生成框
              </button>
            ` : `
              <button class="ai-tb-btn ai-tb-btn-primary" data-action="generate-now" title="立即生成">
                <span class="icon">⚡</span> 立即生成
              </button>
            `}
            <div class="ai-tb-divider"></div>
            <button class="ai-tb-btn ai-tb-btn-icon" data-action="front" title="置于顶层">🔝</button>
            <button class="ai-tb-btn ai-tb-btn-icon" data-action="back" title="置于底层">🔽</button>
            <button class="ai-tb-btn ai-tb-btn-icon" data-action="download" title="下载/导出">💾</button>
            <button class="ai-tb-btn ai-tb-btn-icon ai-tb-btn-danger" data-action="delete" title="删除">🗑️</button>
          </div>
        `

        // Bind clicks
        container.querySelectorAll('button[data-action]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation()
            const action = btn.getAttribute('data-action')
            switch (action) {
              case 'inpaint':
                callbacks.onInpaint?.(node)
                break
              case 'ref':
                callbacks.onUseAsRef?.(node)
                break
              case 'variation':
                callbacks.onVariation?.(node)
                break
              case 'outpaint':
                callbacks.onOutpaint?.(node)
                break
              case 'front':
                callbacks.onBringToFront?.(node)
                break
              case 'back':
                callbacks.onSendToBack?.(node)
                break
              case 'delete':
                callbacks.onDelete?.(node)
                break
              case 'download':
                callbacks.onDownload?.(node)
                break
            }
          })
        })
      }
    })
  }

  public destroy() {
    this.plugin.destroy()
  }
}
