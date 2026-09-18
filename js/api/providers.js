/**
 * Multi-Provider & Model Registry for AI Canvas Studio
 */

export const PROVIDER_TYPES = {
  ROLLDEK: 'rolldek',
  OPENAI: 'openai',
  MIDJOURNEY: 'midjourney',
  CUSTOM: 'custom'
};

export const PROVIDERS = [
  {
    id: PROVIDER_TYPES.ROLLDEK,
    name: 'RollDek (官方全系列)',
    description: '支持 GPT-Image 2/2.5、Sunburst/Flare 旗舰及香蕉 (Gemini 3) 原生画图',
    defaultBaseUrl: 'https://rolldek.com/v1',
    defaultGeminiBaseUrl: 'https://rolldek.com/v1beta',
    requiresKey: true,
    website: 'https://rolldek.com'
  },
  {
    id: PROVIDER_TYPES.OPENAI,
    name: 'OpenAI / 兼容平台',
    description: '官方 DALL-E 3 / DALL-E 2，或 OneAPI、SiliconFlow、OpenRouter 等中转',
    defaultBaseUrl: 'https://api.openai.com/v1',
    requiresKey: true,
    website: 'https://openai.com'
  },
  {
    id: PROVIDER_TYPES.MIDJOURNEY,
    name: 'Midjourney Proxy',
    description: '对接第三方 Midjourney 代理服务 (Go-Proxy-Midjourney 等标准接口)',
    defaultBaseUrl: 'https://api.midjourney-proxy.com/mj',
    requiresKey: true
  },
  {
    id: PROVIDER_TYPES.CUSTOM,
    name: '自定义三方 API (Custom)',
    description: '自由配置端点 URL、模型名与鉴权 Header',
    defaultBaseUrl: 'https://api.example.com/v1',
    requiresKey: false
  }
];

export const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 正方形', width: 1024, height: 1024, icon: 'square' },
  { id: '16:9', label: '16:9 横屏宽幅', width: 1280, height: 720, icon: 'landscape' },
  { id: '9:16', label: '9:16 竖屏海报', width: 720, height: 1280, icon: 'portrait' },
  { id: '4:3', label: '4:3 经典横幅', width: 1024, height: 768, icon: 'tv' },
  { id: '3:4', label: '3:4 经典竖幅', width: 768, height: 1024, icon: 'book' },
  { id: '3:2', label: '3:2 单反横幅', width: 1152, height: 768, icon: 'camera' },
  { id: '2:3', label: '2:3 单反竖幅', width: 768, height: 1152, icon: 'film' },
  { id: '21:9', label: '21:9 影院宽银幕', width: 1344, height: 576, icon: 'film-alt' },
  { id: '8:1', label: '8:1 极长横幅', width: 2048, height: 256, icon: 'scroll' },
  { id: '1:8', label: '1:8 极长竖幅', width: 256, height: 2048, icon: 'scroll-v' }
];

export const ALL_MODELS = [
  // --- RollDek: GPT-Image-2 ---
  {
    id: 'gpt-image-2',
    name: 'GPT Image 2',
    provider: PROVIDER_TYPES.ROLLDEK,
    family: 'gpt-image-2',
    badge: 'RollDek 基础',
    description: '1K/2K/4K 分辨率，画质固定 medium，支持文生图、图像编辑及多参考图',
    resolutions: ['1024x1024', '1024x1536', '1536x1024', '2048x2048', '3840x2160'],
    qualities: ['medium'],
    supportsInpaint: true,
    supportsOutpaint: true,
    maxRefImages: 16
  },
  {
    id: 'gpt-image-2-high',
    name: 'GPT Image 2 High',
    provider: PROVIDER_TYPES.ROLLDEK,
    family: 'gpt-image-2',
    badge: 'RollDek 高质感',
    description: '1K/2K/4K 分辨率，支持 medium/high 档位细节与光影增强',
    resolutions: ['1024x1024', '1024x1536', '1536x1024', '2048x2048', '3840x2160'],
    qualities: ['high', 'medium'],
    supportsInpaint: true,
    supportsOutpaint: true,
    maxRefImages: 16
  },

  // --- RollDek: GPT-Image-2.5 ---
  {
    id: 'gpt-image-2.5',
    name: 'GPT Image 2.5 标准',
    provider: PROVIDER_TYPES.ROLLDEK,
    family: 'gpt-image-25',
    badge: 'RollDek 快速',
    description: '快速出图，固定 1K 分辨率 (1024x1024 等指定比例规格)',
    resolutions: ['1024x1024', '1280x720', '720x1280', '1024x768', '768x1024'],
    qualities: [],
    supportsInpaint: true,
    supportsOutpaint: true,
    maxRefImages: 16
  },
  {
    id: 'gpt-image-2.5-sunburst',
    name: 'GPT Image 2.5 Sunburst (阳光旗舰)',
    provider: PROVIDER_TYPES.ROLLDEK,
    family: 'gpt-image-25-flagship',
    badge: 'RollDek 旗舰',
    description: '全档质量 (含 max/xhigh)、支持透明背景、局部重绘(mask)、多种格式',
    resolutions: ['1024x1024', '1280x720', '720x1280', '2048x1152', '2048x2048', '3840x2160'],
    qualities: ['auto', 'max', 'xhigh', 'high', 'medium', 'low'],
    supportsTransparent: true,
    supportsInpaint: true,
    supportsOutpaint: true,
    formats: ['png', 'webp', 'jpeg'],
    maxRefImages: 16
  },
  {
    id: 'gpt-image-2.5-flare',
    name: 'GPT Image 2.5 Flare (极光艺术)',
    provider: PROVIDER_TYPES.ROLLDEK,
    family: 'gpt-image-25-flagship',
    badge: 'RollDek 艺术',
    description: '全档质量，艺术美感微调，支持透明背景、细节重绘与格式控制',
    resolutions: ['1024x1024', '1280x720', '720x1280', '2048x1152', '2048x2048', '3840x2160'],
    qualities: ['auto', 'max', 'xhigh', 'high', 'medium', 'low'],
    supportsTransparent: true,
    supportsInpaint: true,
    supportsOutpaint: true,
    formats: ['png', 'webp', 'jpeg'],
    maxRefImages: 16
  },

  // --- RollDek: Gemini 香蕉系列 ---
  {
    id: 'gemini-3-pro-image-preview',
    name: '香蕉 Pro (Gemini 3 Pro Image)',
    provider: PROVIDER_TYPES.ROLLDEK,
    family: 'gemini-banana',
    badge: 'Gemini 画质档',
    description: 'Gemini 原生 generateContent，细腻构图，支持 10 种通用比例与 1K/2K/4K',
    resolutions: ['1K', '2K', '4K'],
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '5:4', '4:5', '21:9'],
    supportsInpaint: true,
    supportsOutpaint: true,
    maxRefImages: 14
  },
  {
    id: 'gemini-3.1-flash-image-preview',
    name: '香蕉 2 (Gemini 3.1 Flash Image)',
    provider: PROVIDER_TYPES.ROLLDEK,
    family: 'gemini-banana',
    badge: 'Gemini 极速档',
    description: '毫秒级响应，额外支持 8:1 / 4:1 / 1:4 / 1:8 超宽长幅比例',
    resolutions: ['1K', '2K', '4K'],
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '5:4', '4:5', '21:9', '8:1', '4:1', '1:4', '1:8'],
    supportsInpaint: true,
    supportsOutpaint: true,
    maxRefImages: 14
  },

  // --- OpenAI ---
  {
    id: 'dall-e-3',
    name: 'DALL·E 3',
    provider: PROVIDER_TYPES.OPENAI,
    family: 'dalle',
    badge: 'OpenAI 官方',
    description: '语义理解极强，支持 1024x1024, 1024x1792, 1792x1024，高清 standard/hd',
    resolutions: ['1024x1024', '1792x1024', '1024x1792'],
    qualities: ['standard', 'hd'],
    supportsInpaint: false,
    supportsOutpaint: false,
    maxRefImages: 0
  },
  {
    id: 'dall-e-2',
    name: 'DALL·E 2 (含重绘)',
    provider: PROVIDER_TYPES.OPENAI,
    family: 'dalle',
    badge: 'OpenAI 编辑',
    description: '经典 DALL-E 2 模型，支持 Edit 与 Inpainting 局部重绘',
    resolutions: ['1024x1024', '512x512', '256x256'],
    qualities: ['standard'],
    supportsInpaint: true,
    supportsOutpaint: true,
    maxRefImages: 1
  },

  // --- Midjourney ---
  {
    id: 'midjourney-fast',
    name: 'Midjourney v6.1 (Proxy)',
    provider: PROVIDER_TYPES.MIDJOURNEY,
    family: 'midjourney',
    badge: 'MJ 代理',
    description: '顶尖艺术质感与写实光影，支持各种比例与垫图融合',
    resolutions: ['1024x1024', '1456x816', '816x1456'],
    supportsInpaint: true,
    supportsOutpaint: true,
    maxRefImages: 5
  },

  // --- Custom ---
  {
    id: 'custom-model',
    name: '自定义三方模型 (Custom)',
    provider: PROVIDER_TYPES.CUSTOM,
    family: 'custom',
    badge: '自定义 API',
    description: '通过自定义端点适配 Flux、SDXL、ComfyUI 或兼容 OpenAI 接口',
    resolutions: ['1024x1024', '1280x720', '720x1280', '512x512'],
    supportsInpaint: true,
    supportsOutpaint: true,
    maxRefImages: 4
  }
];

export const STYLE_PRESETS = [
  { name: '赛博朋克', prompt: 'cyberpunk style, neon lights, futuristic city, cinematic lighting, ultra detailed, 8k resolution, volumetric smoke' },
  { name: '电影质感', prompt: 'cinematic film still, 35mm photograph, master photography, shallow depth of field, natural lighting, shot on Arri Alexa' },
  { name: '商业静物', prompt: 'commercial product photography, studio softbox lighting, clean studio background, sharp focus, 8k octane render' },
  { name: '极简插画', prompt: 'minimalist vector illustration, clean lines, flat colors, elegant modern composition, trending on Dribbble' },
  { name: '3D动画', prompt: 'Pixar Disney style, 3D character design, cute, vibrant colors, warm lighting, Blender 3d, clay render' },
  { name: '东方水墨', prompt: 'traditional Chinese ink wash painting, ethereal mountain landscape, elegant brush strokes, misty atmosphere, aesthetic poetry' },
  { name: '唯美动漫', prompt: 'Makoto Shinkai anime style, beautiful sky, fluffy clouds, nostalgic atmosphere, gorgeous vibrant lighting, masterpiece' },
  { name: '概念原画', prompt: 'epic concept art, fantasy environment, matte painting, hyper-detailed scenery, grand scale, Artstation trending' }
];
