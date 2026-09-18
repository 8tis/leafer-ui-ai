/**
 * Layer Tree Manager
 * Syncs canvas scene graph with UI layer panel
 */

export class LayerManager {
  constructor(canvasApp, containerId) {
    this.canvasApp = canvasApp;
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.selectedElement = null;

    this.onSelectElement = () => {};
    this.init();
  }

  init() {
    this.canvasApp.onTreeChange = () => this.render();
    this.canvasApp.onSelectionChange = (selectedList) => {
      this.selectedElement = selectedList[0] || null;
      this.updateHighlight();
    };
  }

  getIconForElement(el) {
    const tag = el.__tag || el.tag || '';
    if (tag.includes('Image') || el.url) return '🖼️';
    if (tag.includes('Rect')) return '⬜';
    if (tag.includes('Ellipse')) return '⚪';
    if (tag.includes('Text')) return '🔤';
    if (tag.includes('Group')) return '📁';
    return '🔹';
  }

  render() {
    if (!this.container) return;
    const artLayer = this.canvasApp.artLayer;
    if (!artLayer || !artLayer.children) {
      this.container.innerHTML = '<div class="empty-layers">画布暂无图层</div>';
      return;
    }

    const children = [...artLayer.children].reverse(); // top layer first
    if (children.length === 0) {
      this.container.innerHTML = '<div class="empty-layers">画布暂无图层</div>';
      return;
    }

    this.container.innerHTML = '';
    children.forEach((el) => {
      const item = document.createElement('div');
      item.className = 'layer-item';
      if (this.selectedElement === el) item.classList.add('selected');

      const icon = this.getIconForElement(el);
      const name = el.name || el.__tag || '图层';

      item.innerHTML = `
        <span class="layer-drag-handle">⋮⋮</span>
        <span class="layer-icon">${icon}</span>
        <span class="layer-name" title="${name}">${name}</span>
        <div class="layer-actions">
          <button class="layer-action-btn vis-btn" title="显示/隐藏">
            ${el.visible !== false ? '👁️' : '🙈'}
          </button>
          <button class="layer-action-btn lock-btn" title="锁定/解锁">
            ${el.editable !== false ? '🔓' : '🔒'}
          </button>
          <button class="layer-action-btn del-btn" title="删除">
            🗑️
          </button>
        </div>
      `;

      // Select element on click
      item.onclick = (e) => {
        if (e.target.closest('.layer-action-btn')) return;
        this.canvasApp.select(el);
      };

      // Visibility toggle
      const visBtn = item.querySelector('.vis-btn');
      visBtn.onclick = (e) => {
        e.stopPropagation();
        el.visible = el.visible === false ? true : false;
        visBtn.innerText = el.visible ? '👁️' : '🙈';
      };

      // Lock toggle
      const lockBtn = item.querySelector('.lock-btn');
      lockBtn.onclick = (e) => {
        e.stopPropagation();
        el.editable = el.editable === false ? true : false;
        lockBtn.innerText = el.editable ? '🔓' : '🔒';
      };

      // Delete
      const delBtn = item.querySelector('.del-btn');
      delBtn.onclick = (e) => {
        e.stopPropagation();
        el.remove();
        this.canvasApp.onTreeChange();
      };

      this.container.appendChild(item);
    });
  }

  updateHighlight() {
    if (!this.container) return;
    const items = this.container.querySelectorAll('.layer-item');
    const artLayer = this.canvasApp.artLayer;
    if (!artLayer || !artLayer.children) return;

    const children = [...artLayer.children].reverse();
    items.forEach((item, idx) => {
      if (children[idx] === this.selectedElement) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }
}
