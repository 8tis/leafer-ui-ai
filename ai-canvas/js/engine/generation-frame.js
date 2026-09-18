/**
 * AI Generation Frame (AI 生成选框)
 * Inspired by Leonardo.ai, Midjourney Canvas, and Krea
 */

import { ASPECT_RATIOS } from '../api/providers.js';

export class GenerationFrame {
  constructor(canvasApp) {
    this.canvasApp = canvasApp;
    this.frameElement = null;
    this.aspectRatio = '1:1';
    this.width = 512;
    this.height = 512;
    this.x = 0;
    this.y = 0;
    this.visible = true;

    this.onBoundsChange = () => {};
    this.init();
  }

  init() {
    const { Group, Rect, Text } = window.LeaferUI;

    const center = this.canvasApp.getViewportCenter();
    this.x = center.x - this.width / 2;
    this.y = center.y - this.height / 2;

    // Generation Frame Group
    this.group = new Group({
      name: '__AI_GENERATION_FRAME__',
      x: this.x,
      y: this.y,
      draggable: true,
      editable: false // Custom control or drag
    });

    // Frame Body / Background fill
    this.bgRect = new Rect({
      width: this.width,
      height: this.height,
      fill: 'rgba(99, 102, 241, 0.05)',
      stroke: '#6366f1',
      strokeWidth: 2,
      dashPattern: [8, 6],
      cornerRadius: 6,
      shadow: {
        x: 0,
        y: 0,
        blur: 16,
        color: 'rgba(99, 102, 241, 0.35)'
      }
    });

    // Top Label Tag (Dimension & Ratio Pill)
    this.tagGroup = new Group({
      x: 0,
      y: -30
    });

    this.tagBg = new Rect({
      width: 140,
      height: 24,
      fill: 'rgba(15, 17, 23, 0.9)',
      stroke: '#6366f1',
      strokeWidth: 1,
      cornerRadius: 12
    });

    this.tagText = new Text({
      text: '✨ 1:1 (1024×1024)',
      x: 12,
      y: 4,
      fontSize: 11,
      fill: '#a5b4fc',
      fontFamily: 'system-ui, sans-serif'
    });

    this.tagGroup.add(this.tagBg);
    this.tagGroup.add(this.tagText);

    this.group.add(this.bgRect);
    this.group.add(this.tagGroup);

    // Add to sky layer so it floats above user art
    if (this.canvasApp.app.sky) {
      this.canvasApp.app.sky.add(this.group);
    } else {
      this.canvasApp.tree.add(this.group);
    }

    this.setupEvents();
    this.updateLabel();
  }

  setupEvents() {
    this.group.on('drag', () => {
      this.x = this.group.x;
      this.y = this.group.y;
      this.onBoundsChange(this.getBounds());
    });
  }

  setAspectRatio(ratioId) {
    this.aspectRatio = ratioId;
    const preset = ASPECT_RATIOS.find(r => r.id === ratioId) || ASPECT_RATIOS[0];

    const baseSize = 512;
    if (preset.width >= preset.height) {
      this.width = baseSize;
      this.height = Math.round((baseSize * preset.height) / preset.width);
    } else {
      this.height = baseSize;
      this.width = Math.round((baseSize * preset.width) / preset.height);
    }

    this.bgRect.width = this.width;
    this.bgRect.height = this.height;

    this.updateLabel();
    this.onBoundsChange(this.getBounds());
  }

  updateLabel() {
    const preset = ASPECT_RATIOS.find(r => r.id === this.aspectRatio) || ASPECT_RATIOS[0];
    const text = `✨ ${this.aspectRatio} (${preset.width}×${preset.height})`;
    this.tagText.text = text;
    this.tagBg.width = text.length * 7 + 36;
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
    const preset = ASPECT_RATIOS.find(r => r.id === this.aspectRatio) || ASPECT_RATIOS[0];
    return `${preset.width}x${preset.height}`;
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
   * Place a newly generated image directly into the frame position
   */
  async placeGeneratedImage(imageUrl, prompt, autoNudge = false) {
    const img = await this.canvasApp.addImage(
      imageUrl,
      this.group.x,
      this.group.y,
      this.width,
      this.height,
      prompt ? `AI: ${prompt.substring(0, 16)}` : 'AI 生成图片'
    );

    // If explicitly requested to auto-nudge (e.g. storyboard continuous mode)
    if (autoNudge) {
      this.moveTo(this.group.x + this.width + 40, this.group.y);
    }
    return img;
  }
}
