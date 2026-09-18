/**
 * AI Generation Frame (AI 生成选框)
 * Inspired by Leonardo.ai, Midjourney Canvas, and Photoshop Generative Fill
 * Synchronized with Canvas World Coordinate Space & Interactive 8-point Resizing
 */

import { ASPECT_RATIOS } from '../api/providers.js';

export class GenerationFrame {
  constructor(canvasApp) {
    this.canvasApp = canvasApp;
    this.aspectRatio = '1:1';
    
    // Default size is the real 1:1 image resolution
    this.width = 1024;
    this.height = 1024;
    this.x = 0;
    this.y = 0;
    this.visible = true;

    this.group = null;
    this.bgRect = null;
    this.tagGroup = null;
    this.tagBg = null;
    this.tagText = null;
    this.handles = {};

    this.onBoundsChange = () => {};
    this.init();
  }

  init() {
    const { Group, Rect, Text } = window.LeaferUI;

    // Start at world coordinate (0, 0)
    this.x = 0;
    this.y = 0;

    // Generation Frame Group (lives directly in canvas tree / overlayLayer)
    this.group = new Group({
      name: '__AI_GENERATION_FRAME__',
      x: this.x,
      y: this.y,
      draggable: true
    });

    // Frame Body / Background fill
    this.bgRect = new Rect({
      width: this.width,
      height: this.height,
      fill: 'rgba(99, 102, 241, 0.06)',
      stroke: '#6366f1',
      strokeWidth: 2,
      dashPattern: [10, 8],
      cornerRadius: 6,
      shadow: {
        x: 0,
        y: 0,
        blur: 20,
        color: 'rgba(99, 102, 241, 0.4)'
      }
    });

    // Top Label Tag (Dimension & Ratio Pill)
    this.tagGroup = new Group({
      x: 0,
      y: -36
    });

    this.tagBg = new Rect({
      width: 170,
      height: 28,
      fill: 'rgba(15, 17, 23, 0.95)',
      stroke: '#6366f1',
      strokeWidth: 1.5,
      cornerRadius: 14
    });

    this.tagText = new Text({
      text: '✨ 1:1 (1024×1024)',
      x: 14,
      y: 6,
      fontSize: 12,
      fill: '#c7d2fe',
      fontFamily: 'system-ui, sans-serif',
      fontWeight: '600'
    });

    this.tagGroup.add(this.tagBg);
    this.tagGroup.add(this.tagText);

    this.group.add(this.bgRect);
    this.group.add(this.tagGroup);

    // Create 8 interactive resize handles
    this.createHandles();

    // Add directly to overlayLayer in the canvas tree (shares exact same pan/zoom matrix as artwork)
    if (this.canvasApp.overlayLayer) {
      this.canvasApp.overlayLayer.add(this.group);
    } else {
      this.canvasApp.tree.add(this.group);
    }

    this.setupEvents();
    this.updateLabel();
    this.updateHandles();
  }

  createHandles() {
    const { Rect } = window.LeaferUI;
    const handleSize = 14;
    const handleNames = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

    handleNames.forEach(name => {
      const handle = new Rect({
        name: `handle_${name}`,
        width: handleSize,
        height: handleSize,
        around: 'center',
        fill: '#ffffff',
        stroke: '#6366f1',
        strokeWidth: 2.5,
        cornerRadius: 3,
        draggable: true,
        shadow: {
          x: 0,
          y: 2,
          blur: 6,
          color: 'rgba(0, 0, 0, 0.5)'
        }
      });

      this.handles[name] = handle;
      this.group.add(handle);
    });
  }

  updateHandles() {
    const w = this.width;
    const h = this.height;

    if (this.handles.nw) { this.handles.nw.x = 0; this.handles.nw.y = 0; }
    if (this.handles.n)  { this.handles.n.x = w / 2; this.handles.n.y = 0; }
    if (this.handles.ne) { this.handles.ne.x = w; this.handles.ne.y = 0; }
    if (this.handles.e)  { this.handles.e.x = w; this.handles.e.y = h / 2; }
    if (this.handles.se) { this.handles.se.x = w; this.handles.se.y = h; }
    if (this.handles.s)  { this.handles.s.x = w / 2; this.handles.s.y = h; }
    if (this.handles.sw) { this.handles.sw.x = 0; this.handles.sw.y = h; }
    if (this.handles.w)  { this.handles.w.x = 0; this.handles.w.y = h / 2; }
  }

  setupEvents() {
    // Frame Drag
    this.group.on('drag', () => {
      this.x = this.group.x;
      this.y = this.group.y;
      this.onBoundsChange(this.getBounds());
    });

    // Handle Drag for 8 directions
    const bindHandleDrag = (handleKey, onDragDelta) => {
      const handle = this.handles[handleKey];
      if (!handle) return;

      let startBox = null;

      handle.on('drag.start', (e) => {
        e.stopDefault();
        startBox = {
          x: this.group.x,
          y: this.group.y,
          width: this.width,
          height: this.height
        };
      });

      handle.on('drag', (e) => {
        e.stopDefault();
        if (!startBox) return;

        // Apply scale delta
        const scale = this.canvasApp.tree.scaleX || 1;
        const totalDx = (e.totalX || 0) / scale;
        const totalDy = (e.totalY || 0) / scale;

        onDragDelta(startBox, totalDx, totalDy);

        this.bgRect.width = this.width;
        this.bgRect.height = this.height;
        this.updateHandles();
        this.updateLabel();
        this.onBoundsChange(this.getBounds());
      });

      handle.on('drag.end', () => {
        startBox = null;
        this.updateHandles();
      });
    };

    // SE handle (Bottom-Right)
    bindHandleDrag('se', (sb, dx, dy) => {
      this.width = Math.max(256, Math.round((sb.width + dx) / 16) * 16);
      this.height = Math.max(256, Math.round((sb.height + dy) / 16) * 16);
      this.aspectRatio = 'custom';
    });

    // E handle (Right)
    bindHandleDrag('e', (sb, dx) => {
      this.width = Math.max(256, Math.round((sb.width + dx) / 16) * 16);
      this.aspectRatio = 'custom';
    });

    // S handle (Bottom)
    bindHandleDrag('s', (sb, dx, dy) => {
      this.height = Math.max(256, Math.round((sb.height + dy) / 16) * 16);
      this.aspectRatio = 'custom';
    });

    // SW handle (Bottom-Left)
    bindHandleDrag('sw', (sb, dx, dy) => {
      const newW = Math.max(256, Math.round((sb.width - dx) / 16) * 16);
      const shiftX = sb.width - newW;
      this.group.x = sb.x + shiftX;
      this.width = newW;
      this.height = Math.max(256, Math.round((sb.height + dy) / 16) * 16);
      this.x = this.group.x;
      this.aspectRatio = 'custom';
    });

    // NE handle (Top-Right)
    bindHandleDrag('ne', (sb, dx, dy) => {
      this.width = Math.max(256, Math.round((sb.width + dx) / 16) * 16);
      const newH = Math.max(256, Math.round((sb.height - dy) / 16) * 16);
      const shiftY = sb.height - newH;
      this.group.y = sb.y + shiftY;
      this.height = newH;
      this.y = this.group.y;
      this.aspectRatio = 'custom';
    });

    // NW handle (Top-Left)
    bindHandleDrag('nw', (sb, dx, dy) => {
      const newW = Math.max(256, Math.round((sb.width - dx) / 16) * 16);
      const shiftX = sb.width - newW;
      const newH = Math.max(256, Math.round((sb.height - dy) / 16) * 16);
      const shiftY = sb.height - newH;
      this.group.x = sb.x + shiftX;
      this.group.y = sb.y + shiftY;
      this.width = newW;
      this.height = newH;
      this.x = this.group.x;
      this.y = this.group.y;
      this.aspectRatio = 'custom';
    });
  }

  setAspectRatio(ratioId) {
    this.aspectRatio = ratioId;
    const preset = ASPECT_RATIOS.find(r => r.id === ratioId) || ASPECT_RATIOS[0];

    // Real target pixel dimensions
    this.width = preset.width;
    this.height = preset.height;

    this.bgRect.width = this.width;
    this.bgRect.height = this.height;

    this.updateHandles();
    this.updateLabel();
    this.onBoundsChange(this.getBounds());
  }

  updateLabel() {
    let text = `✨ ${this.aspectRatio} (${this.width}×${this.height})`;
    if (this.aspectRatio === 'custom') {
      text = `✨ 自由尺寸 (${this.width}×${this.height})`;
    }
    this.tagText.text = text;
    this.tagBg.width = text.length * 7.5 + 32;
  }

  getBounds() {
    return {
      x: this.group.x,
      y: this.group.y,
      width: this.width,
      height: this.height,
      aspectRatio: this.aspectRatio
    };
  }

  getApiSize() {
    return `${Math.round(this.width)}x${Math.round(this.height)}`;
  }

  moveTo(x, y) {
    this.group.x = x;
    this.group.y = y;
    this.x = x;
    this.y = y;
    this.onBoundsChange(this.getBounds());
  }

  centerInViewport() {
    const center = this.canvasApp.getViewportCenter();
    this.moveTo(center.x - this.width / 2, center.y - this.height / 2);
  }

  show() {
    this.group.visible = true;
    this.visible = true;
  }

  hide() {
    this.group.visible = false;
    this.visible = false;
  }

  toggle() {
    this.visible ? this.hide() : this.show();
  }

  /**
   * Place generated image exactly matching the frame's position and dimensions
   */
  async placeGeneratedImage(imageUrl, prompt) {
    // Exact match: x, y, width, height in canvas world coordinates
    const img = await this.canvasApp.addImage(
      imageUrl,
      this.group.x,
      this.group.y,
      this.width,
      this.height,
      prompt ? `AI: ${prompt.substring(0, 16)}` : 'AI 生成图片'
    );

    return img;
  }
}
