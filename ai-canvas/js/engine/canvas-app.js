/**
 * Core Canvas Controller based on LeaferJS Engine
 */

export class CanvasApp {
  constructor(containerId, options = {}) {
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.options = options;
    this.app = null;
    this.tree = null;
    this.editor = null;
    this.ground = null;

    this.activeTool = 'select'; // 'select' | 'hand' | 'frame' | 'rect' | 'circle' | 'text' | 'brush'
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.spacePressed = false;
    this.zoomLevel = 1;

    this.onSelectionChange = options.onSelectionChange || (() => {});
    this.onTreeChange = options.onTreeChange || (() => {});
    this.onZoomChange = options.onZoomChange || (() => {});

    this.init();
  }

  init() {
    if (!window.LeaferUI) {
      console.error('LeaferUI library is not loaded');
      return;
    }

    const { App, Rect, Group } = window.LeaferUI;

    // Create Leafer App with design tree and editor
    this.app = new App({
      view: this.container,
      tree: { type: 'design' },
      editor: {
        stroke: '#6366f1',
        strokeWidth: 2,
        point: {
          fill: '#ffffff',
          stroke: '#6366f1',
          strokeWidth: 2,
          radius: 5
        },
        buttonsFixed: true,
        middlePoint: true,
        rotatePoint: {
          fill: '#8b5cf6',
          stroke: '#ffffff',
          strokeWidth: 2,
          radius: 6,
          distance: 24
        }
      }
    });

    this.tree = this.app.tree;
    this.editor = this.app.editor;

    // Layers root group
    this.artLayer = new Group({ name: 'ArtLayer' });
    this.tree.add(this.artLayer);

    this.setupEvents();
    this.setupViewportNavigation();
  }
  setupEvents() {
    // Editor select event
    if (this.editor) {
      const onSelect = () => {
        const list = this.editor.list || [];
        this.onSelectionChange(list);
      };
      this.editor.on('editor.select', onSelect);
      this.editor.on('select', onSelect);
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space' && !this.spacePressed) {
        this.spacePressed = true;
        this.container.style.cursor = 'grab';
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        this.removeSelected();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        this.duplicateSelected();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        // Undo
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.spacePressed = false;
        if (!this.isPanning) {
          this.updateCursor();
        }
      }
    });
  }

  updateCursor() {
    switch (this.activeTool) {
      case 'hand':
        this.container.style.cursor = 'grab';
        break;
      case 'frame':
        this.container.style.cursor = 'crosshair';
        break;
      case 'rect':
      case 'circle':
      case 'text':
      case 'brush':
        this.container.style.cursor = 'crosshair';
        break;
      default:
        this.container.style.cursor = 'default';
    }
  }

  setTool(tool) {
    this.activeTool = tool;
    this.updateCursor();
    if (tool !== 'select' && this.editor) {
      this.editor.target = null;
    }
  }

  setupViewportNavigation() {
    // Mouse wheel zoom
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      this.zoomAt(mouseX, mouseY, zoomFactor);
    }, { passive: false });

    // Drag to pan (Space + Left Click or Middle Click or Hand Tool)
    this.container.addEventListener('mousedown', (e) => {
      const isMiddle = e.button === 1;
      const isSpaceLeft = e.button === 0 && (this.spacePressed || this.activeTool === 'hand');

      if (isMiddle || isSpaceLeft) {
        e.preventDefault();
        this.isPanning = true;
        this.panStart = { x: e.clientX, y: e.clientY };
        this.container.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPanning) return;
      const dx = e.clientX - this.panStart.x;
      const dy = e.clientY - this.panStart.y;
      this.panStart = { x: e.clientX, y: e.clientY };

      this.tree.x += dx;
      this.tree.y += dy;
      this.updateGridOffset();
    });

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.updateCursor();
      }
    });
  }

  zoomAt(viewX, viewY, factor) {
    const currentScale = this.tree.scaleX || 1;
    let newScale = currentScale * factor;
    // Bound scale between 10% and 500%
    newScale = Math.max(0.1, Math.min(5.0, newScale));

    const actualFactor = newScale / currentScale;

    // Zoom towards point (viewX, viewY)
    this.tree.x = viewX - (viewX - this.tree.x) * actualFactor;
    this.tree.y = viewY - (viewY - this.tree.y) * actualFactor;
    this.tree.scale = newScale;

    this.zoomLevel = newScale;
    this.onZoomChange(this.zoomLevel);
    this.updateGridOffset();
  }

  zoomIn() {
    const cx = this.container.clientWidth / 2;
    const cy = this.container.clientHeight / 2;
    this.zoomAt(cx, cy, 1.25);
  }

  zoomOut() {
    const cx = this.container.clientWidth / 2;
    const cy = this.container.clientHeight / 2;
    this.zoomAt(cx, cy, 0.8);
  }

  resetZoom() {
    const cx = this.container.clientWidth / 2;
    const cy = this.container.clientHeight / 2;
    const currentScale = this.tree.scaleX || 1;
    this.zoomAt(cx, cy, 1 / currentScale);
  }

  zoomToFit() {
    const bounds = this.artLayer.getBounds();
    if (!bounds || bounds.width === 0 || bounds.height === 0) {
      this.resetZoom();
      this.tree.x = 0;
      this.tree.y = 0;
      return;
    }

    const pad = 80;
    const vw = this.container.clientWidth - pad * 2;
    const vh = this.container.clientHeight - pad * 2;

    const scale = Math.min(vw / bounds.width, vh / bounds.height, 1.5);
    this.tree.scale = scale;
    this.tree.x = (this.container.clientWidth - bounds.width * scale) / 2 - bounds.x * scale;
    this.tree.y = (this.container.clientHeight - bounds.height * scale) / 2 - bounds.y * scale;

    this.zoomLevel = scale;
    this.onZoomChange(this.zoomLevel);
    this.updateGridOffset();
  }

  updateGridOffset() {
    // Dynamic CSS background sync
    const gridEl = document.getElementById('canvas-grid-bg');
    if (!gridEl) return;
    const x = this.tree.x || 0;
    const y = this.tree.y || 0;
    const scale = this.tree.scaleX || 1;
    const gridSize = 32 * scale;
    gridEl.style.backgroundPosition = `${x}px ${y}px`;
    gridEl.style.backgroundSize = `${gridSize}px ${gridSize}px`;
  }

  // --- Element Creation ---

  async addImage(url, x, y, width, height, name = 'AI 生成图片') {
    const { Image } = window.LeaferUI;

    // If x, y not provided, place in center of view
    if (x === undefined || y === undefined) {
      const center = this.getViewportCenter();
      x = center.x - (width || 512) / 2;
      y = center.y - (height || 512) / 2;
    }

    const img = new Image({
      name,
      url,
      x,
      y,
      width: width || 512,
      height: height || 512,
      editable: true,
      cornerRadius: 4,
      shadow: {
        x: 0,
        y: 8,
        blur: 24,
        color: 'rgba(0, 0, 0, 0.45)'
      }
    });

    this.artLayer.add(img);
    this.select(img);
    this.onTreeChange();
    return img;
  }

  addRect(options = {}) {
    const { Rect } = window.LeaferUI;
    const center = this.getViewportCenter();
    const rect = new Rect({
      name: options.name || '矩形',
      x: options.x ?? (center.x - 120),
      y: options.y ?? (center.y - 80),
      width: options.width || 240,
      height: options.height || 160,
      fill: options.fill || 'rgba(99, 102, 241, 0.25)',
      stroke: options.stroke || '#6366f1',
      strokeWidth: options.strokeWidth || 2,
      cornerRadius: options.cornerRadius || 8,
      editable: true
    });
    this.artLayer.add(rect);
    this.select(rect);
    this.onTreeChange();
    return rect;
  }

  addEllipse(options = {}) {
    const { Ellipse } = window.LeaferUI;
    const center = this.getViewportCenter();
    const ellipse = new Ellipse({
      name: options.name || '圆形',
      x: options.x ?? (center.x - 100),
      y: options.y ?? (center.y - 100),
      width: options.width || 200,
      height: options.height || 200,
      fill: options.fill || 'rgba(236, 72, 153, 0.25)',
      stroke: options.stroke || '#ec4899',
      strokeWidth: options.strokeWidth || 2,
      editable: true
    });
    this.artLayer.add(ellipse);
    this.select(ellipse);
    this.onTreeChange();
    return ellipse;
  }

  addText(text = '双击编辑文字', options = {}) {
    const { Text } = window.LeaferUI;
    const center = this.getViewportCenter();
    const textNode = new Text({
      name: '文本',
      text,
      x: options.x ?? (center.x - 80),
      y: options.y ?? (center.y - 20),
      fontSize: options.fontSize || 24,
      fill: options.fill || '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      editable: true
    });
    this.artLayer.add(textNode);
    this.select(textNode);
    this.onTreeChange();
    return textNode;
  }

  getViewportCenter() {
    const vw = this.container.clientWidth;
    const vh = this.container.clientHeight;
    const scale = this.tree.scaleX || 1;
    return {
      x: (vw / 2 - this.tree.x) / scale,
      y: (vh / 2 - this.tree.y) / scale
    };
  }

  select(element) {
    if (this.editor) {
      this.editor.target = element;
    }
  }

  getSelected() {
    if (!this.editor) return [];
    return this.editor.list || [];
  }

  removeSelected() {
    const selected = this.getSelected();
    if (selected.length === 0) return;
    selected.forEach(el => el.remove());
    if (this.editor) this.editor.target = null;
    this.onTreeChange();
  }

  duplicateSelected() {
    const selected = this.getSelected();
    if (selected.length === 0) return;
    const duplicated = [];
    selected.forEach(el => {
      const cloneData = el.toJSON();
      delete cloneData.id;
      cloneData.x = (cloneData.x || 0) + 30;
      cloneData.y = (cloneData.y || 0) + 30;
      const { UI } = window.LeaferUI;
      const clone = UI.one(cloneData);
      clone.editable = true;
      this.artLayer.add(clone);
      duplicated.push(clone);
    });
    if (this.editor && duplicated.length > 0) {
      this.editor.target = duplicated;
    }
    this.onTreeChange();
  }

  reorderSelected(action) {
    const selected = this.getSelected();
    if (selected.length === 0) return;
    const parent = selected[0].parent;
    if (!parent) return;

    selected.forEach(el => {
      const idx = parent.children.indexOf(el);
      if (idx === -1) return;
      if (action === 'top') {
        parent.add(el);
      } else if (action === 'bottom') {
        parent.addAt(el, 0);
      } else if (action === 'up' && idx < parent.children.length - 1) {
        parent.addAt(el, idx + 1);
      } else if (action === 'down' && idx > 0) {
        parent.addAt(el, idx - 1);
      }
    });
    this.onTreeChange();
  }

  clearCanvas() {
    this.artLayer.clear();
    if (this.editor) this.editor.target = null;
    this.onTreeChange();
  }

  async exportCanvas(filename = 'canvas_export.png') {
    return await this.artLayer.export(filename);
  }
}
