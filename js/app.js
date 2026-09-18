/**
 * Main Application Coordinator for RollDek AI Canvas Studio
 */

import { ConfigStore } from './store/config-store.js';
import { HistoryStore } from './store/history-store.js';
import { APIManager } from './api/api-manager.js';
import { PROVIDERS, ALL_MODELS, ASPECT_RATIOS, STYLE_PRESETS } from './api/providers.js';

import { CanvasApp } from './engine/canvas-app.js';
import { GenerationFrame } from './engine/generation-frame.js';
import { InpaintBrush } from './engine/inpaint-brush.js';
import { LayerManager } from './engine/layer-manager.js';
import { Minimap } from './engine/minimap.js';

class StudioApp {
  constructor() {
    this.configStore = new ConfigStore();
    this.historyStore = new HistoryStore();
    this.apiManager = new APIManager(this.configStore);

    this.canvasApp = null;
    this.generationFrame = null;
    this.inpaintBrush = null;
    this.layerManager = null;
    this.minimap = null;

    this.selectedElement = null;
    this.referenceImages = [];

    this.init();
  }

  async init() {
    this.initCanvasEngine();
    this.populateModelSelect();
    this.populateRatioSelect();
    this.populateStyleChips();
    this.bindToolbars();
    this.bindPromptDock();
    this.bindSettingsModal();
    this.bindExportModal();
    this.bindDropzone();
    this.bindInspectorPanel();
    this.bindAgentDrawer();
    this.loadHistoryGallery();
    this.updateApiStatusBadge();

    // Check if initial key is empty; if so, show friendly tip toast
    if (!this.configStore.getActiveKey()) {
      setTimeout(() => {
        this.showToast('提示: 当前未配置 API Key，已为您开启内置演示模式，可自由体验画布生成与编辑！', 'info', 6000);
      }, 800);
    }
  }

  initCanvasEngine() {
    this.canvasApp = new CanvasApp('leafer-canvas-wrapper', {
      onSelectionChange: (list) => this.handleSelection(list),
      onZoomChange: (scale) => {
        const zoomText = Math.round(scale * 100) + '%';
        const el = document.getElementById('zoom-indicator');
        if (el) el.innerText = zoomText;
      },
      onToolbarAction: (action, node) => this.handleToolbarAction(action, node)
    });

    this.generationFrame = new GenerationFrame(this.canvasApp);
    this.inpaintBrush = new InpaintBrush(this.canvasApp);
    this.inpaintBrush.onExecuteInpaint = async (data) => this.handleInpaintExecute(data);

    this.layerManager = new LayerManager(this.canvasApp, 'layers-container');
    this.minimap = new Minimap(this.canvasApp, 'minimap-card');
  }

  handleSelection(list) {
    this.selectedElement = list[0] || null;
    this.updateInspector();
  }

  populateModelSelect() {
    const select = document.getElementById('model-select');
    if (!select) return;
    select.innerHTML = '';

    const currentModelId = this.configStore.get('activeModel') || 'gpt-image-2';
    const allModels = this.apiManager.getAllAvailableModels();

    // Group models by provider
    const groups = {
      rolldek: { label: 'RollDek 模型 (官方与动态)', items: [] },
      openai: { label: 'OpenAI 兼容模型 (官方/三方)', items: [] },
      midjourney: { label: 'Midjourney Proxy', items: [] },
      custom: { label: '自定义模型 (Custom)', items: [] }
    };

    allModels.forEach(m => {
      const p = m.provider || 'custom';
      if (groups[p]) {
        groups[p].items.push(m);
      } else {
        groups.custom.items.push(m);
      }
    });

    Object.values(groups).forEach(g => {
      if (g.items.length === 0) return;
      const optGroup = document.createElement('optgroup');
      optGroup.label = g.label;
      g.items.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.innerText = `${m.name} (${m.badge || m.provider})`;
        if (m.id === currentModelId) opt.selected = true;
        optGroup.appendChild(opt);
      });
      select.appendChild(optGroup);
    });

    // Custom model manual input action
    const customGroup = document.createElement('optgroup');
    customGroup.label = '➕ 自定义指定';
    const customOpt = document.createElement('option');
    customOpt.value = '__CUSTOM_INPUT__';
    customOpt.innerText = '➕ 手动输入模型名称...';
    customGroup.appendChild(customOpt);
    select.appendChild(customGroup);

    select.onchange = (e) => {
      const selectedId = e.target.value;
      if (selectedId === '__CUSTOM_INPUT__') {
        const customName = prompt('请输入三方模型名称 (例如: black-forest-labs/FLUX.1-schnell 或 stabilityai/sd-3):');
        if (customName && customName.trim()) {
          const trimmed = customName.trim();
          const activeProv = this.configStore.get('activeProvider') || 'openai';
          this.configStore.addCustomModel({
            id: trimmed,
            name: trimmed,
            provider: activeProv,
            badge: '手动指定'
          });
          this.configStore.set('activeModel', trimmed);
          this.populateModelSelect();
          this.showToast(`已添加并选用自定义模型: ${trimmed}`, 'success');
        } else {
          select.value = this.configStore.get('activeModel') || 'gpt-image-2';
        }
        return;
      }

      this.configStore.set('activeModel', selectedId);
      const modelMeta = this.apiManager.getModel(selectedId);
      this.configStore.set('activeProvider', modelMeta.provider);
      this.updateApiStatusBadge();
    };
  }

  populateRatioSelect() {
    const select = document.getElementById('ratio-select');
    if (!select) return;
    select.innerHTML = '';

    const curRatio = this.configStore.get('aspectRatio') || '1:1';
    ASPECT_RATIOS.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.innerText = r.label;
      if (r.id === curRatio) opt.selected = true;
      select.appendChild(opt);
    });

    select.onchange = (e) => {
      const rId = e.target.value;
      this.configStore.set('aspectRatio', rId);
      this.generationFrame.setAspectRatio(rId);
    };
  }

  populateStyleChips() {
    const container = document.getElementById('style-chips-bar');
    if (!container) return;
    container.innerHTML = '';

    STYLE_PRESETS.forEach(p => {
      const chip = document.createElement('button');
      chip.className = 'style-chip';
      chip.innerText = p.name;
      chip.onclick = () => {
        const textarea = document.getElementById('prompt-input');
        if (!textarea) return;
        const current = textarea.value.trim();
        textarea.value = current ? `${current}, ${p.prompt}` : p.prompt;
        textarea.focus();
      };
      container.appendChild(chip);
    });
  }

  bindToolbars() {
    // Left Toolbar Tools
    const toolButtons = document.querySelectorAll('.tool-btn[data-tool]');
    toolButtons.forEach(btn => {
      btn.onclick = () => {
        toolButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tool = btn.dataset.tool;
        this.canvasApp.setTool(tool);

        if (tool === 'frame') {
          this.generationFrame.show();
          this.generationFrame.centerInViewport();
        } else if (tool === 'rect') {
          this.canvasApp.addRect();
        } else if (tool === 'circle') {
          this.canvasApp.addEllipse();
        } else if (tool === 'text') {
          this.canvasApp.addText();
        } else if (tool === 'brush') {
          if (this.selectedElement && this.selectedElement.url) {
            this.inpaintBrush.start(this.selectedElement);
          } else {
            this.showToast('请先在画布上选择一张图片进行涂抹重绘', 'info');
          }
        }
      };
    });

    // Top Bar Actions
    document.getElementById('zoom-in-btn')?.addEventListener('click', () => this.canvasApp.zoomIn());
    document.getElementById('zoom-out-btn')?.addEventListener('click', () => this.canvasApp.zoomOut());
    document.getElementById('zoom-reset-btn')?.addEventListener('click', () => this.canvasApp.resetZoom());
    document.getElementById('zoom-fit-btn')?.addEventListener('click', () => this.canvasApp.zoomToFit());

    // Grid Toggle
    const gridToggleBtn = document.getElementById('toggle-grid-btn');
    gridToggleBtn?.addEventListener('click', () => {
      const gridEl = document.getElementById('canvas-grid-bg');
      if (gridEl) {
        gridEl.classList.toggle('hidden');
        gridToggleBtn.classList.toggle('active');
      }
    });

    // Frame Toggle
    document.getElementById('toggle-frame-btn')?.addEventListener('click', () => {
      this.generationFrame.toggle();
    });

    // Clear Canvas
    document.getElementById('clear-canvas-btn')?.addEventListener('click', () => {
      if (confirm('确认清空画布上的所有图层吗？')) {
        this.canvasApp.clearCanvas();
        this.showToast('画布已清空', 'info');
      }
    });

    // Right Sidebar Tabs
    const tabs = document.querySelectorAll('.sidebar-tab');
    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
        const activePane = document.getElementById(`tab-${target}`);
        if (activePane) activePane.style.display = 'flex';
      };
    });
  }

  async triggerGeneration() {
    const generateBtn = document.getElementById('generate-btn');
    const promptInput = document.getElementById('prompt-input');
    const prompt = promptInput ? promptInput.value.trim() : '';

    if (!prompt) {
      this.showToast('请输入提示词 (Prompt)', 'error');
      promptInput?.focus();
      return;
    }

    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.dataset.originalHtml = generateBtn.innerHTML;
      generateBtn.innerHTML = '<span>⏳ 生成中...</span>';
    }

    try {
      const modelId = this.configStore.get('activeModel') || 'gpt-image-2';
      const aspectRatio = this.configStore.get('aspectRatio') || '1:1';
      const size = this.generationFrame.getApiSize();

      const result = await this.apiManager.generateImage({
        model: modelId,
        prompt,
        aspectRatio,
        size,
        refImages: this.referenceImages.map(r => r.url || r)
      }, (progress) => {
        this.showToast(progress.message, 'info', 2000);
      });

      // Place image inside the generation frame on the canvas!
      await this.generationFrame.placeGeneratedImage(result.url, prompt);

      // Save to IndexedDB history
      await this.historyStore.addItem(result);
      this.loadHistoryGallery();

      this.showToast(result.isDemo ? '✨ 演示模式已在选框生成图片！' : '🎉 AI 图片已成功绘制在画布选框中！', 'success');
    } catch (err) {
      console.error('Generation failed:', err);
      this.showToast(err.message || '生成失败，请检查网络或 API Key', 'error', 5000);
    } finally {
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.innerHTML = generateBtn.dataset.originalHtml || '<span>✨ 选框生成</span>';
      }
    }
  }

  bindPromptDock() {
    this.activeDockMode = 'generate'; // 'generate' | 'agent'
    const genBtn = document.getElementById('dock-mode-gen-btn');
    const agentBtn = document.getElementById('dock-mode-agent-btn');
    const genControls = document.getElementById('dock-gen-controls');
    const agentQuickBar = document.getElementById('dock-agent-quick-bar');
    const agentChatPanel = document.getElementById('dock-agent-chat-panel');
    const styleChipsBar = document.getElementById('style-chips-bar');
    const promptInput = document.getElementById('prompt-input');
    const generateBtn = document.getElementById('generate-btn');
    const generateBtnText = document.getElementById('generate-btn-text');

    const switchMode = (mode) => {
      this.activeDockMode = mode;
      if (mode === 'agent') {
        genBtn?.classList.remove('active');
        agentBtn?.classList.add('active');
        if (genControls) genControls.style.display = 'none';
        if (styleChipsBar) styleChipsBar.style.display = 'none';
        if (agentQuickBar) agentQuickBar.style.display = 'flex';
        if (agentChatPanel) agentChatPanel.style.display = 'flex';
        if (promptInput) {
          promptInput.placeholder = '向 Canvas Agent 下达自然语言指令 (例如: 自动横向排版图层 / 在画布中心放一个16:9画框 / 生成赛博猫咪卡片)...';
          promptInput.focus();
        }
        if (generateBtnText) generateBtnText.innerText = '🤖 执行指令';
        const msgContainer = document.getElementById('agent-chat-messages');
        if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;
      } else {
        agentBtn?.classList.remove('active');
        genBtn?.classList.add('active');
        if (agentQuickBar) agentQuickBar.style.display = 'none';
        if (agentChatPanel) agentChatPanel.style.display = 'none';
        if (genControls) genControls.style.display = 'flex';
        if (styleChipsBar) styleChipsBar.style.display = 'flex';
        if (promptInput) {
          promptInput.placeholder = '描述你想生成的画面 (例如: 湖蓝色调的山谷，清晨薄雾，极简插画风 / 按 Cmd+Enter 快速生成)...';
        }
        if (generateBtnText) generateBtnText.innerText = '✨ 选框生成';
      }
    };

    genBtn?.addEventListener('click', () => switchMode('generate'));
    agentBtn?.addEventListener('click', () => switchMode('agent'));

    const handleAction = () => {
      if (this.activeDockMode === 'agent') {
        const cmd = promptInput?.value?.trim();
        if (!cmd) return;
        promptInput.value = '';
        this.executeAgentCommand(cmd);
      } else {
        this.triggerGeneration();
      }
    };

    generateBtn?.addEventListener('click', handleAction);

    promptInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        if (this.activeDockMode === 'agent') {
          e.preventDefault();
          handleAction();
        } else if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          handleAction();
        }
      }
    });

    // Quick Agent Pills
    document.querySelectorAll('.dock-quick-pill[data-agent-cmd]').forEach(pill => {
      pill.addEventListener('click', () => {
        const cmd = pill.getAttribute('data-agent-cmd');
        if (cmd) {
          this.executeAgentCommand(cmd);
        }
      });
    });

    // Clear Agent Chat
    document.getElementById('dock-agent-clear-btn')?.addEventListener('click', () => {
      const msgContainer = document.getElementById('agent-chat-messages');
      if (msgContainer) {
        msgContainer.innerHTML = `
          <div class="agent-msg assistant">
            <div class="agent-msg-author">🤖 Canvas AI Agent</div>
            已重置对话！请随时在下方大输入框输入指令或点击上方快捷操作。
          </div>
        `;
      }
    });

    // Random inspiration prompt button
    document.getElementById('random-prompt-btn')?.addEventListener('click', () => {
      const presets = [
        '赛博朋克风格的空中飞车，雨夜霓虹流光，电影级景深，8K 超清细节',
        '极简扁平插画，晨光熹微的森林湖泊与小木屋，治愈系配色，Dribbble 推荐',
        '微距摄影，晨露凝结在一朵晶莹剔透的水晶蓝莲花花瓣上，柔和日光，极致微观',
        '高品质香水商业广告海报，深黑曜石背景，金丝光晕勾勒瓶身，极简奢华',
        '可爱三维毛绒白熊探险家，佩戴微缩飞行员护目镜，皮克斯动画电影质感',
        '东方青绿水墨群山，仙鹤掠过云海，金箔点缀，空灵壮阔'
      ];
      if (promptInput) {
        promptInput.value = presets[Math.floor(Math.random() * presets.length)];
        promptInput.focus();
      }
    });

    // Fetch models button in dock
    document.getElementById('fetch-models-dock-btn')?.addEventListener('click', () => {
      this.handleFetchModels();
    });
  }

  async handleInpaintExecute(data) {
    const { prompt, maskBlob, refImages, targetElement } = data;
    const modelId = this.configStore.get('activeModel') || 'gpt-image-2.5-sunburst';

    this.showToast('正在向 RollDek 提交局部重绘请求...', 'info', 4000);

    const result = await this.apiManager.generateImage({
      model: modelId,
      prompt,
      maskBlob,
      refImages,
      size: `${targetElement.width}x${targetElement.height}`
    });

    // Replace original image url or place directly over it
    targetElement.url = result.url;
    await this.historyStore.addItem(result);
    this.loadHistoryGallery();
    this.showToast('✨ 局部重绘成功应用！', 'success');
  }

  bindInspectorPanel() {
    const inpaintBtn = document.getElementById('prop-inpaint-btn');
    const asRefBtn = document.getElementById('prop-as-ref-btn');
    const deleteBtn = document.getElementById('prop-delete-btn');
    const bringTopBtn = document.getElementById('prop-bring-top-btn');
    const sendBottomBtn = document.getElementById('prop-send-bottom-btn');

    inpaintBtn?.addEventListener('click', () => {
      if (this.selectedElement && this.selectedElement.url) {
        this.inpaintBrush.start(this.selectedElement);
      } else {
        this.showToast('只有图片图层支持局部重绘', 'info');
      }
    });

    asRefBtn?.addEventListener('click', () => {
      if (this.selectedElement && this.selectedElement.url) {
        this.addReferenceImage(this.selectedElement.url);
      } else {
        this.showToast('请选择图片图层作为参考图', 'info');
      }
    });

    deleteBtn?.addEventListener('click', () => this.canvasApp.removeSelected());
    bringTopBtn?.addEventListener('click', () => this.canvasApp.reorderSelected('top'));
    sendBottomBtn?.addEventListener('click', () => this.canvasApp.reorderSelected('bottom'));
  }

  handleToolbarAction(action, nodeOrPayload) {
    if (!nodeOrPayload) return;

    // Handle contextual Image Agent command input
    if (action === 'agent-image-command') {
      const { node, prompt } = nodeOrPayload;
      if (!node) return;
      if (node.url) {
        this.addReferenceImage(node.url);
      }
      const promptInput = document.getElementById('prompt-input');
      if (promptInput) {
        promptInput.value = prompt;
      }
      const w = Math.round(node.width || 1024);
      const h = Math.round(node.height || 1024);
      this.generationFrame.updateDimensions(w, h);
      this.generationFrame.group.x = (node.x || 0) + w + 30;
      this.generationFrame.group.y = node.y || 0;
      this.generationFrame.show();

      this.showToast(`🤖 Agent 已锚定图像并部署生成框，正在发起变体: "${prompt}"...`, 'info', 3000);
      this.triggerGeneration();
      return;
    }

    const node = nodeOrPayload;
    switch (action) {
      case 'inpaint':
        if (node.url || (node.fill && typeof node.fill === 'object' && node.fill.url)) {
          this.inpaintBrush.start(node);
          this.showToast('🖌️ 已进入局部重绘涂抹模式，涂抹后点击完成', 'info');
        } else {
          this.showToast('只有图片图层支持局部重绘', 'info');
        }
        break;
      case 'ref':
        if (node.url) {
          this.addReferenceImage(node.url);
          this.showToast('🔗 已将选中图像设为参考垫图', 'success');
        }
        break;
      case 'variation':
        if (node.url) {
          this.addReferenceImage(node.url);
          const promptInput = document.getElementById('prompt-input');
          if (promptInput && !promptInput.value) {
            promptInput.value = 'high quality masterpiece variation, exquisite detail';
          }
          const w = Math.round(node.width || 1024);
          const h = Math.round(node.height || 1024);
          this.generationFrame.updateDimensions(w, h);
          this.generationFrame.group.x = (node.x || 0) + w + 40;
          this.generationFrame.group.y = node.y || 0;
          this.generationFrame.show();
          this.showToast('🪄 已就绪！已部署变体选区框，点击【立即生成】即可生图', 'info');
        }
        break;
      case 'create-frame': {
        const w = Math.round(node.width || 1024);
        const h = Math.round(node.height || 1024);
        this.generationFrame.updateDimensions(w, h);
        this.generationFrame.group.x = node.x || 0;
        this.generationFrame.group.y = node.y || 0;
        this.generationFrame.show();
        this.showToast(`✨ 已在当前位置创建 ${w}×${h} AI 生成框`, 'success');
        break;
      }
      case 'generate-now':
        this.triggerGeneration();
        break;
      case 'front':
        this.canvasApp.reorderSelected('top');
        break;
      case 'back':
        this.canvasApp.reorderSelected('bottom');
        break;
      case 'delete':
        this.canvasApp.removeSelected();
        break;
      case 'download': {
        const url = node.url || (node.export ? node.export('png').data : null);
        if (url) {
          const a = document.createElement('a');
          a.href = url;
          a.download = `leafer-element-${Date.now()}.png`;
          a.click();
          this.showToast('💾 图片下载已就绪', 'success');
        }
        break;
      }
    }
  }

  async executeAgentCommand(text) {
    if (!text || !text.trim()) return;
    const trimmed = text.trim();
    const msgContainer = document.getElementById('agent-chat-messages');
    if (!msgContainer) return;

    // User message
    const uMsg = document.createElement('div');
    uMsg.className = 'agent-msg user';
    uMsg.innerHTML = `<div class="agent-msg-author">👤 用户</div><div>${trimmed}</div>`;
    msgContainer.appendChild(uMsg);

    // Status response
    const aMsg = document.createElement('div');
    aMsg.className = 'agent-msg assistant';
    aMsg.innerHTML = '<div class="agent-msg-author">🤖 Canvas AI Agent</div><div>🤖 思考中，正在感知画布并规划操作...</div>';
    msgContainer.appendChild(aMsg);
    msgContainer.scrollTop = msgContainer.scrollHeight;

    // Intelligent canvas agent commands parsing & execution
    setTimeout(async () => {
      try {
        let reply = '';
        const lower = trimmed.toLowerCase();

        if (lower.includes('排版') || lower.includes('排列') || lower.includes('对齐') || lower.includes('layout')) {
          const isVertical = lower.includes('纵') || lower.includes('垂直');
          const done = this.canvasApp.autoLayout(isVertical ? 'vertical' : 'horizontal', 32);
          reply = done
            ? `✅ 已为您将选中的图层完成智能${isVertical ? '纵向' : '横向'}自动排版对齐！`
            : `⚠️ 当前画布或选区中元素少于2个，无需重新排列。`;
        } else if (lower.includes('生成框') || lower.includes('frame') || lower.includes('布框') || lower.includes('画框')) {
          const ratio = lower.includes('16:9') ? '16:9' : (lower.includes('9:16') ? '9:16' : '1:1');
          const ratioSelect = document.getElementById('ratio-select');
          if (ratioSelect) {
            ratioSelect.value = ratio;
            ratioSelect.dispatchEvent(new Event('change'));
          }
          this.generationFrame.setAspectRatio(ratio);
          this.generationFrame.show();
          this.generationFrame.centerInViewport();
          const promptInput = document.getElementById('prompt-input');
          if (promptInput) {
            const cleaned = trimmed.replace(/生成框|布框|画框/g, '').trim();
            if (cleaned) promptInput.value = cleaned;
          }
          reply = `✨ 已为您在画布中央部署 [${ratio}] 尺寸的物理 AI 生成选区，已就绪可随时触发生成！`;
        } else if (lower.includes('变体') || lower.includes('参考') || lower.includes('修改')) {
          if (this.selectedElement && this.selectedElement.url) {
            this.addReferenceImage(this.selectedElement.url);
            const promptInput = document.getElementById('prompt-input');
            if (promptInput) promptInput.value = trimmed;
            const w = Math.round(this.selectedElement.width || 1024);
            const h = Math.round(this.selectedElement.height || 1024);
            this.generationFrame.updateDimensions(w, h);
            this.generationFrame.group.x = (this.selectedElement.x || 0) + w + 30;
            this.generationFrame.group.y = this.selectedElement.y || 0;
            this.generationFrame.show();
            reply = `🪄 已锚定选中图片并就近部署 AI 变体框，正在发起任务！`;
            this.triggerGeneration();
          } else {
            reply = `💡 请先在画布上点击选中一张图片，然后再次告诉我变体或修改要求！`;
          }
        } else if (lower.includes('猫') || lower.includes('画') || lower.includes('生成') || lower.includes('card') || lower.includes('卡片') || lower.includes('赛博')) {
          const promptInput = document.getElementById('prompt-input');
          if (promptInput) {
            promptInput.value = trimmed;
          }
          this.generationFrame.show();
          reply = `🚀 已为您提取提示词并在 AI 生成框中自动发起图像生成任务，生成完成后将自动锚定在当前画布！`;
          this.triggerGeneration();
        } else if (lower.includes('矩形') || lower.includes('rect')) {
          const { Rect } = window.LeaferUI;
          const r = new Rect({
            x: 100, y: 100, width: 200, height: 140,
            fill: 'rgba(99, 102, 241, 0.2)',
            stroke: '#6366f1',
            strokeWidth: 2,
            cornerRadius: 12
          });
          this.canvasApp.artLayer.add(r);
          this.canvasApp.editor.target = r;
          reply = `🎨 已在画布上为您创建现代化圆角矩形卡片。`;
        } else {
          reply = `🤖 收到指令: "${trimmed}"。建议您点击上方生成框或直接使用提示词栏与浮动工具栏进行创作！`;
        }

        aMsg.innerHTML = `<div class="agent-msg-author">🤖 Canvas AI Agent</div><div>${reply}</div>`;
        msgContainer.scrollTop = msgContainer.scrollHeight;
      } catch (err) {
        aMsg.innerHTML = `<div class="agent-msg-author">🤖 Canvas AI Agent</div><div style="color: #ef4444;">⚠️ Agent 执行异常: ${err.message}</div>`;
      }
    }, 400);
  }

  bindAgentDrawer() {
    // Kept for backward compatibility if called during init
  }

  updateInspector() {
    const emptyTip = document.getElementById('inspector-empty-tip');
    const propsBody = document.getElementById('inspector-props-body');
    if (!emptyTip || !propsBody) return;

    if (!this.selectedElement) {
      emptyTip.style.display = 'block';
      propsBody.style.display = 'none';
      return;
    }

    emptyTip.style.display = 'none';
    propsBody.style.display = 'flex';

    const el = this.selectedElement;
    const inpX = document.getElementById('prop-x');
    const inpY = document.getElementById('prop-y');
    const inpW = document.getElementById('prop-w');
    const inpH = document.getElementById('prop-h');
    const inpRot = document.getElementById('prop-rot');
    const inpAlpha = document.getElementById('prop-alpha');

    if (inpX) inpX.value = Math.round(el.x || 0);
    if (inpY) inpY.value = Math.round(el.y || 0);
    if (inpW) inpW.value = Math.round(el.width || 0);
    if (inpH) inpH.value = Math.round(el.height || 0);
    if (inpRot) inpRot.value = Math.round(el.rotation || 0);
    if (inpAlpha) inpAlpha.value = Math.round((el.opacity ?? 1) * 100);

    const inpaintRow = document.getElementById('prop-inpaint-row');
    if (inpaintRow) {
      inpaintRow.style.display = el.url ? 'flex' : 'none';
    }
  }

  addReferenceImage(url) {
    if (this.referenceImages.length >= 16) {
      this.showToast('最多可添加 16 张参考图', 'warning');
      return;
    }
    this.referenceImages.push({ id: Date.now(), url });
    this.renderReferenceChips();
    this.showToast('已添加为参考图 (Multi-Reference)', 'info');
  }

  renderReferenceChips() {
    const container = document.getElementById('ref-images-container');
    if (!container) return;
    container.innerHTML = '';

    this.referenceImages.forEach((ref, idx) => {
      const pill = document.createElement('div');
      pill.className = 'ref-pill';
      pill.innerHTML = `
        <img src="${ref.url}" />
        <span>参考图 ${idx + 1}</span>
        <span class="ref-pill-close">✕</span>
      `;
      pill.querySelector('.ref-pill-close').onclick = () => {
        this.referenceImages.splice(idx, 1);
        this.renderReferenceChips();
      };
      container.appendChild(pill);
    });
  }

  bindSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const openBtn = document.getElementById('open-settings-btn');
    const statusBadge = document.getElementById('api-status-badge');
    const closeBtn = document.getElementById('close-settings-btn');
    const saveBtn = document.getElementById('save-settings-btn');
    const testBtn = document.getElementById('test-api-btn');

    const openModal = () => {
      this.loadSettingsForm();
      modal.classList.add('visible');
    };

    openBtn?.addEventListener('click', openModal);
    statusBadge?.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', () => modal.classList.remove('visible'));

    // Provider Tabs in settings
    const pTabs = document.querySelectorAll('.provider-tab-btn');
    pTabs.forEach(btn => {
      btn.onclick = () => {
        pTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const pId = btn.dataset.provider;
        document.querySelectorAll('.provider-config-pane').forEach(pane => pane.style.display = 'none');
        const targetPane = document.getElementById(`provider-pane-${pId}`);
        if (targetPane) targetPane.style.display = 'flex';
      };
    });

    saveBtn?.addEventListener('click', () => {
      this.saveSettingsForm();
      modal.classList.remove('visible');
      this.apiManager.reloadConfigs();
      this.updateApiStatusBadge();
      this.showToast('API 设置已安全保存在本地', 'success');
    });

    testBtn?.addEventListener('click', async () => {
      testBtn.disabled = true;
      testBtn.innerText = '测试中...';
      try {
        const activeTab = document.querySelector('.provider-tab-btn.active');
        const pId = activeTab?.dataset.provider || 'rolldek';
        // Save current form inputs temporarily to test
        this.saveSettingsForm();
        this.apiManager.reloadConfigs();
        await this.apiManager.testConnection(pId);
        this.showToast('✅ 连通性测试成功！服务状态正常', 'success');
      } catch (err) {
        this.showToast(`连通性测试异常: ${err.message}`, 'error', 5000);
      } finally {
        testBtn.disabled = false;
        testBtn.innerText = '测试连通性';
      }
    });

    // Fetch models in settings modal
    const fetchSettingsBtn = document.getElementById('fetch-models-settings-btn');
    fetchSettingsBtn?.addEventListener('click', async () => {
      const activeTab = document.querySelector('.provider-tab-btn.active');
      const pId = activeTab?.dataset.provider || 'rolldek';
      this.saveSettingsForm();
      this.apiManager.reloadConfigs();
      fetchSettingsBtn.disabled = true;
      fetchSettingsBtn.innerText = '拉取中...';
      await this.handleFetchModels(pId);
      fetchSettingsBtn.disabled = false;
      fetchSettingsBtn.innerText = '🔄 自动拉取模型';
    });
  }

  async handleFetchModels(providerId) {
    const pId = providerId || this.configStore.get('activeProvider') || 'rolldek';
    this.showToast(`正在从 ${pId.toUpperCase()} API 获取模型列表...`, 'info', 2500);
    try {
      const models = await this.apiManager.fetchModels(pId);
      this.populateModelSelect();
      this.showToast(`🎉 成功从 ${pId} 获取到 ${models.length} 个模型！已更新下拉菜单`, 'success', 4000);
    } catch (err) {
      console.error('Fetch models failed:', err);
      this.showToast(`获取模型失败: ${err.message}`, 'error', 5000);
    }
  }

  loadSettingsForm() {
    const configs = this.configStore.getProviderConfigs();

    const rolldekKey = document.getElementById('rolldek-api-key');
    const rolldekBase = document.getElementById('rolldek-base-url');
    const rolldekGemini = document.getElementById('rolldek-gemini-url');

    if (rolldekKey) rolldekKey.value = configs.rolldek?.apiKey || '';
    if (rolldekBase) rolldekBase.value = configs.rolldek?.baseUrl || 'https://rolldek.com/v1';
    if (rolldekGemini) rolldekGemini.value = configs.rolldek?.geminiBaseUrl || 'https://rolldek.com/v1beta';

    const openaiKey = document.getElementById('openai-api-key');
    const openaiBase = document.getElementById('openai-base-url');
    if (openaiKey) openaiKey.value = configs.openai?.apiKey || '';
    if (openaiBase) openaiBase.value = configs.openai?.baseUrl || 'https://api.openai.com/v1';

    const mjKey = document.getElementById('mj-api-key');
    const mjBase = document.getElementById('mj-base-url');
    if (mjKey) mjKey.value = configs.midjourney?.apiKey || '';
    if (mjBase) mjBase.value = configs.midjourney?.baseUrl || 'https://api.midjourney-proxy.com/mj';
  }

  saveSettingsForm() {
    const rolldekKey = document.getElementById('rolldek-api-key')?.value.trim() || '';
    const rolldekBase = document.getElementById('rolldek-base-url')?.value.trim() || 'https://rolldek.com/v1';
    const rolldekGemini = document.getElementById('rolldek-gemini-url')?.value.trim() || 'https://rolldek.com/v1beta';

    this.configStore.updateProviderConfig('rolldek', {
      apiKey: rolldekKey,
      baseUrl: rolldekBase,
      geminiBaseUrl: rolldekGemini
    });

    const openaiKey = document.getElementById('openai-api-key')?.value.trim() || '';
    const openaiBase = document.getElementById('openai-base-url')?.value.trim() || 'https://api.openai.com/v1';
    this.configStore.updateProviderConfig('openai', { apiKey: openaiKey, baseUrl: openaiBase });

    const mjKey = document.getElementById('mj-api-key')?.value.trim() || '';
    const mjBase = document.getElementById('mj-base-url')?.value.trim() || 'https://api.midjourney-proxy.com/mj';
    this.configStore.updateProviderConfig('midjourney', { apiKey: mjKey, baseUrl: mjBase });
  }

  updateApiStatusBadge() {
    const badge = document.getElementById('api-status-badge');
    const dot = badge?.querySelector('.status-dot');
    const text = badge?.querySelector('.status-text');
    if (!badge || !dot || !text) return;

    const key = this.configStore.getActiveKey();
    const provider = this.configStore.get('activeProvider') || 'rolldek';

    if (key) {
      dot.className = 'status-dot';
      text.innerText = `${provider.toUpperCase()} 已配置`;
    } else {
      dot.className = 'status-dot warning';
      text.innerText = '演示模式 (点击配Key)';
    }
  }

  bindExportModal() {
    const modal = document.getElementById('export-modal');
    const openBtn = document.getElementById('open-export-btn');
    const closeBtn = document.getElementById('close-export-btn');
    const execBtn = document.getElementById('execute-export-btn');

    openBtn?.addEventListener('click', () => modal.classList.add('visible'));
    closeBtn?.addEventListener('click', () => modal.classList.remove('visible'));

    execBtn?.addEventListener('click', async () => {
      execBtn.disabled = true;
      execBtn.innerText = '导出中...';
      try {
        const type = document.querySelector('input[name="export-target"]:checked')?.value || 'canvas';
        if (type === 'canvas') {
          await this.canvasApp.exportCanvas('ai_canvas_artwork.png');
        } else if (type === 'selection' && this.selectedElement) {
          await this.selectedElement.export('selection_export.png');
        } else {
          await this.canvasApp.exportCanvas('ai_canvas_artwork.png');
        }
        modal.classList.remove('visible');
        this.showToast('导出成功并开始下载！', 'success');
      } catch (err) {
        this.showToast('导出失败: ' + err.message, 'error');
      } finally {
        execBtn.disabled = false;
        execBtn.innerText = '立即导出';
      }
    });
  }

  bindDropzone() {
    const overlay = document.getElementById('canvas-dropzone-overlay');
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (overlay) overlay.classList.add('active');
    });

    window.addEventListener('dragleave', (e) => {
      if (e.relatedTarget === null && overlay) {
        overlay.classList.remove('active');
      }
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (overlay) overlay.classList.remove('active');

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        for (const file of files) {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              this.canvasApp.addImage(ev.target.result, undefined, undefined, 512, 512, file.name);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    });
  }

  async loadHistoryGallery() {
    const container = document.getElementById('history-gallery-grid');
    if (!container) return;

    const items = await this.historyStore.getAll(50);
    if (items.length === 0) {
      container.innerHTML = '<div class="empty-layers">暂无生成历史</div>';
      return;
    }

    container.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-card';
      card.innerHTML = `
        <img src="${item.url}" loading="lazy" />
        <div class="history-overlay">
          <span class="history-badge">${item.modelName || item.model}</span>
          <div class="history-card-actions">
            <button class="icon-btn add-btn" title="放上画布">➕</button>
            <button class="icon-btn ref-btn" title="作为参考图">🔗</button>
            <button class="icon-btn del-btn" title="删除">🗑️</button>
          </div>
        </div>
      `;

      // Click to place on canvas
      card.querySelector('.add-btn').onclick = (e) => {
        e.stopPropagation();
        this.canvasApp.addImage(item.url);
        this.showToast('已添加至画布中心', 'info');
      };

      // Use as reference
      card.querySelector('.ref-btn').onclick = (e) => {
        e.stopPropagation();
        this.addReferenceImage(item.url);
      };

      // Delete history item
      card.querySelector('.del-btn').onclick = async (e) => {
        e.stopPropagation();
        await this.historyStore.deleteItem(item.id);
        card.remove();
      };

      container.appendChild(card);
    });
  }

  showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Bootstrap Application
window.addEventListener('DOMContentLoaded', () => {
  window.studioApp = new StudioApp();
});
