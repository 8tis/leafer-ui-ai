/**
 * Canvas Minimap Radar
 */

export class Minimap {
  constructor(canvasApp, containerId) {
    this.canvasApp = canvasApp;
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.canvas = null;
    this.ctx = null;
    this.visible = true;

    this.init();
  }

  init() {
    if (!this.container) return;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 180;
    this.canvas.height = 110;
    this.canvas.className = 'minimap-canvas';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.bindEvents();
    this.startLoop();
  }

  bindEvents() {
    this.canvas.onclick = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Pan canvas to center on clicked mini point
      const bounds = this.canvasApp.artLayer.getBounds();
      if (!bounds || bounds.width === 0) return;

      const scale = Math.min(this.canvas.width / (bounds.width + 400), this.canvas.height / (bounds.height + 400));
      const targetWorldX = bounds.x - 200 + clickX / scale;
      const targetWorldY = bounds.y - 200 + clickY / scale;

      const curScale = this.canvasApp.tree.scaleX || 1;
      this.canvasApp.tree.x = this.canvasApp.container.clientWidth / 2 - targetWorldX * curScale;
      this.canvasApp.tree.y = this.canvasApp.container.clientHeight / 2 - targetWorldY * curScale;
      this.canvasApp.updateGridOffset();
    };
  }

  startLoop() {
    const render = () => {
      if (this.visible) this.draw();
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(22, 25, 32, 0.95)';
    ctx.fillRect(0, 0, w, h);

    const bounds = this.canvasApp.artLayer?.getBounds();
    if (!bounds || bounds.width === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = '10px sans-serif';
      ctx.fillText('暂无画布内容', w / 2 - 30, h / 2 + 4);
      return;
    }

    const pad = 200;
    const worldW = Math.max(bounds.width + pad * 2, 1000);
    const worldH = Math.max(bounds.height + pad * 2, 700);
    const worldX = bounds.x - pad;
    const worldY = bounds.y - pad;

    const scale = Math.min(w / worldW, h / worldH);

    // Draw elements thumbnail
    const children = this.canvasApp.artLayer.children || [];
    children.forEach(el => {
      if (el.visible === false) return;
      const ex = (el.x - worldX) * scale;
      const ey = (el.y - worldY) * scale;
      const ew = (el.width || 100) * scale;
      const eh = (el.height || 100) * scale;

      ctx.fillStyle = el.url ? 'rgba(99, 102, 241, 0.7)' : 'rgba(168, 85, 247, 0.5)';
      ctx.fillRect(ex, ey, Math.max(ew, 2), Math.max(eh, 2));
    });

    // Draw current camera viewport box
    const appTree = this.canvasApp.tree;
    const appCont = this.canvasApp.container;
    const curScale = appTree.scaleX || 1;

    const vpWorldX = -appTree.x / curScale;
    const vpWorldY = -appTree.y / curScale;
    const vpWorldW = appCont.clientWidth / curScale;
    const vpWorldH = appCont.clientHeight / curScale;

    const rx = (vpWorldX - worldX) * scale;
    const ry = (vpWorldY - worldY) * scale;
    const rw = vpWorldW * scale;
    const rh = vpWorldH * scale;

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.fillRect(rx, ry, rw, rh);
  }
}
