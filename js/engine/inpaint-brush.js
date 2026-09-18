/**
 * Inpainting Mask Brush Engine for AI Canvas
 * Compatible with RollDek /v1/images/edits mask parameter
 */

export class InpaintBrush {
  constructor(canvasApp) {
    this.canvasApp = canvasApp;
    this.active = false;
    this.targetImage = null;
    this.overlayCanvas = null;
    this.ctx = null;
    this.brushSize = 32;
    this.isErasing = false;
    this.isDrawing = false;
    this.lastPoint = null;

    this.onClose = () => {};
  }

  start(targetImageElement) {
    if (!targetImageElement) {
      alert('请先在画布中选中一张需要局部重绘的图片');
      return;
    }

    this.targetImage = targetImageElement;
    this.active = true;

    // Create or open the Inpaint Modal overlay
    this.createOverlay();
  }

  createOverlay() {
    let modal = document.getElementById('inpaint-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'inpaint-modal';
      modal.className = 'inpaint-modal-backdrop';
      modal.innerHTML = `
        <div class="inpaint-modal-card">
          <div class="inpaint-modal-header">
            <div class="inpaint-modal-title">
              <i class="fa-solid fa-paintbrush"></i>
              <span>局部重绘涂抹 (Inpainting Mask)</span>
            </div>
            <button class="icon-btn close-inpaint-btn" id="close-inpaint-btn" title="关闭">
              ✕
            </button>
          </div>

          <div class="inpaint-toolbar">
            <div class="tool-group">
              <button class="inpaint-tool-btn active" id="inpaint-brush-btn" title="画笔">
                🖌️ 涂抹遮罩
              </button>
              <button class="inpaint-tool-btn" id="inpaint-eraser-btn" title="橡皮擦">
                🧹 橡皮擦
              </button>
            </div>

            <div class="brush-size-group">
              <span>笔刷大小:</span>
              <input type="range" id="brush-size-slider" min="8" max="100" value="32" />
              <span id="brush-size-label">32px</span>
            </div>

            <button class="action-btn secondary" id="clear-mask-btn">清空涂抹</button>
          </div>

          <div class="inpaint-canvas-wrapper" id="inpaint-canvas-wrapper">
            <img id="inpaint-base-img" class="inpaint-base-img" />
            <canvas id="inpaint-mask-canvas" class="inpaint-mask-canvas"></canvas>
          </div>

          <div class="inpaint-footer">
            <div class="inpaint-prompt-box">
              <input type="text" id="inpaint-prompt-input" placeholder="输入局部重绘的修改指令 (例如: 戴上一顶贝雷帽 / 替换为跑车)..." />
              <button class="action-btn primary" id="execute-inpaint-btn">
                ✨ 开始局部重绘
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    modal.classList.add('visible');

    const baseImg = document.getElementById('inpaint-base-img');
    const maskCanvas = document.getElementById('inpaint-mask-canvas');
    this.overlayCanvas = maskCanvas;
    this.ctx = maskCanvas.getContext('2d');

    baseImg.src = this.targetImage.url;
    baseImg.onload = () => {
      maskCanvas.width = baseImg.naturalWidth || 800;
      maskCanvas.height = baseImg.naturalHeight || 800;
      this.clearMask();
    };

    this.bindOverlayEvents();
  }

  bindOverlayEvents() {
    const modal = document.getElementById('inpaint-modal');
    const closeBtn = document.getElementById('close-inpaint-btn');
    const brushBtn = document.getElementById('inpaint-brush-btn');
    const eraserBtn = document.getElementById('inpaint-eraser-btn');
    const slider = document.getElementById('brush-size-slider');
    const sizeLabel = document.getElementById('brush-size-label');
    const clearBtn = document.getElementById('clear-mask-btn');
    const execBtn = document.getElementById('execute-inpaint-btn');

    closeBtn.onclick = () => this.close();

    brushBtn.onclick = () => {
      this.isErasing = false;
      brushBtn.classList.add('active');
      eraserBtn.classList.remove('active');
    };

    eraserBtn.onclick = () => {
      this.isErasing = true;
      eraserBtn.classList.add('active');
      brushBtn.classList.remove('active');
    };

    slider.oninput = (e) => {
      this.brushSize = parseInt(e.target.value);
      sizeLabel.innerText = `${this.brushSize}px`;
    };

    clearBtn.onclick = () => this.clearMask();

    // Drawing on mask canvas
    const canvas = this.overlayCanvas;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    canvas.onmousedown = (e) => {
      this.isDrawing = true;
      this.lastPoint = getPos(e);
      this.drawCircle(this.lastPoint.x, this.lastPoint.y);
    };

    window.onmousemove = (e) => {
      if (!this.isDrawing) return;
      const current = getPos(e);
      this.drawLine(this.lastPoint.x, this.lastPoint.y, current.x, current.y);
      this.lastPoint = current;
    };

    window.onmouseup = () => {
      this.isDrawing = false;
      this.lastPoint = null;
    };

    execBtn.onclick = async () => {
      const promptInput = document.getElementById('inpaint-prompt-input');
      const prompt = promptInput.value.trim();
      if (!prompt) {
        alert('请输入局部重绘的提示词描述');
        return;
      }
      execBtn.disabled = true;
      execBtn.innerText = '重绘处理中...';

      try {
        const maskBlob = await this.getMaskBlob();
        const refImageBlob = await (await fetch(this.targetImage.url)).blob();

        if (this.onExecuteInpaint) {
          await this.onExecuteInpaint({
            prompt,
            maskBlob,
            refImages: [refImageBlob],
            targetElement: this.targetImage
          });
        }
        this.close();
      } catch (err) {
        alert('重绘请求失败: ' + err.message);
      } finally {
        execBtn.disabled = false;
        execBtn.innerText = '✨ 开始局部重绘';
      }
    };
  }

  drawCircle(x, y) {
    this.ctx.save();
    if (this.isErasing) {
      this.ctx.globalCompositeOperation = 'destination-out';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.fillStyle = 'rgba(239, 68, 68, 0.65)'; // Semi-transparent red mask for visual feedback
    }
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.brushSize / 2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawLine(x1, y1, x2, y2) {
    this.ctx.save();
    if (this.isErasing) {
      this.ctx.globalCompositeOperation = 'destination-out';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
    }
    this.ctx.lineWidth = this.brushSize;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  clearMask() {
    if (this.ctx && this.overlayCanvas) {
      this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
  }

  /**
   * Export standard binary mask (black & white PNG)
   */
  async getMaskBlob() {
    const maskCanvas = this.overlayCanvas;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = maskCanvas.width;
    exportCanvas.height = maskCanvas.height;
    const expCtx = exportCanvas.getContext('2d');

    // Fill black
    expCtx.fillStyle = '#000000';
    expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw painted white mask
    const imgData = this.ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const expData = expCtx.getImageData(0, 0, exportCanvas.width, exportCanvas.height);

    for (let i = 0; i < imgData.data.length; i += 4) {
      const alpha = imgData.data[i + 3];
      if (alpha > 10) {
        expData.data[i] = 255;
        expData.data[i + 1] = 255;
        expData.data[i + 2] = 255;
        expData.data[i + 3] = 255;
      }
    }
    expCtx.putImageData(expData, 0, 0);

    return new Promise(resolve => exportCanvas.toBlob(resolve, 'image/png'));
  }

  close() {
    const modal = document.getElementById('inpaint-modal');
    if (modal) modal.classList.remove('visible');
    this.active = false;
    this.clearMask();
  }
}
