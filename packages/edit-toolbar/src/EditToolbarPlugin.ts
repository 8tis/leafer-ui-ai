import { App, MoveEvent, ZoomEvent } from 'leafer-ui'
import type { ILeaf } from '@leafer-ui/interface'
import {
  EditorEvent,
  EditorMoveEvent,
  EditorRotateEvent,
  EditorScaleEvent,
} from '@leafer-in/editor'

export const PLUGIN_NAME = 'leafer-x-edit-toolbar'

export type IConfig = {
  className?: string
  container?: HTMLDivElement
  followScale?: boolean
  disableDefaultStyle?: boolean
  shouldShow?: (node: ILeaf) => boolean
  onRender: (node: ILeaf, container: HTMLDivElement) => void
}

export class EditToolbarPlugin {
  private readonly app: App
  private container: HTMLDivElement
  private readonly config: IConfig

  constructor(app: App, config: IConfig) {
    this.app = app
    this.config = config
    this.toolbarHandler = this.toolbarHandler.bind(this)
    this.initEvent()
  }

  private initEvent() {
    this.app.on([MoveEvent.MOVE, ZoomEvent.ZOOM], this.toolbarHandler)
    if ((this.app as any).editor) {
      ;(this.app as any).editor.on(
        [
          EditorEvent.SELECT,
          EditorMoveEvent.MOVE,
          EditorScaleEvent.SCALE,
          EditorRotateEvent.ROTATE,
        ],
        this.toolbarHandler
      )
    }
  }

  private async toolbarHandler() {
    await Promise.resolve()
    const editor = (this.app as any).editor
    if (!editor) return
    const node = editor.element
    if (!node) {
      this.hideToolbar()
      return
    }
    const isShouldShow = this.config.shouldShow
      ? this.config.shouldShow(node)
      : true
    if (!isShouldShow) {
      this.hideToolbar()
      return
    }
    this.showToolbar(node)
  }

  private showToolbar(node: ILeaf) {
    const { className, container, onRender, followScale = false, disableDefaultStyle = false } = this.config
    if (!this.container) {
      if (container) {
        this.container = container
      } else {
        this.container = document.createElement('div')
        document.body.appendChild(this.container)
      }
      this.container.classList.add(PLUGIN_NAME)
      if (className) {
        this.container.classList.add(className)
      }
      if (!disableDefaultStyle) {
        addStyle(this.container, {
          pointerEvents: 'auto',
          position: 'absolute',
          whiteSpace: 'nowrap',
          zIndex: '999',
        })
      }
    }

    onRender(node, this.container)

    if (!disableDefaultStyle) {
      const box = (node as any).worldBoxBounds || { x: node.x, y: node.y, width: node.width, height: 0 }
      const style: Partial<CSSStyleDeclaration> = {
        display: 'block',
        left: `${box.x}px`,
        top: `${box.y}px`,
      }
      if (followScale) {
        const scaleX = (node as any).worldTransform ? Math.abs((node as any).worldTransform.scaleX) : 1
        const scaleY = (node as any).worldTransform ? Math.abs((node as any).worldTransform.scaleY) : 1
        style.transformOrigin = 'left top'
        style.transform = `scale(${scaleX}, ${scaleY}) translate(0, -100%)`
      } else {
        style.transform = 'translate(0, -100%)'
      }
      addStyle(this.container, style)
    }
  }

  private hideToolbar() {
    const { container, disableDefaultStyle = false } = this.config
    if (this.container && !disableDefaultStyle) {
      addStyle(this.container, {
        display: 'none',
      })
    }
  }

  public destroy() {
    this.app.off([MoveEvent.MOVE, ZoomEvent.ZOOM], this.toolbarHandler)
    if ((this.app as any).editor) {
      ;(this.app as any).editor.off(
        [
          EditorEvent.SELECT,
          EditorMoveEvent.MOVE,
          EditorScaleEvent.SCALE,
          EditorRotateEvent.ROTATE,
        ],
        this.toolbarHandler
      )
    }
    if (this.container && this.container.parentNode && !this.config.container) {
      this.container.parentNode.removeChild(this.container)
    }
  }
}

function addStyle(element: HTMLElement, cssStyles: Partial<CSSStyleDeclaration>) {
  requestAnimationFrame(() => {
    Object.entries(cssStyles).forEach(([property, value]) => {
      ;(element.style as any)[property] = value
    })
  })
}
