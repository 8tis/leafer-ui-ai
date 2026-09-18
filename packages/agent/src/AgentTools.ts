export interface IAgentToolDefinition {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

export const CANVAS_AGENT_TOOLS: IAgentToolDefinition[] = [
  {
    name: 'create_shape',
    description: '在 Leafer 画布上创建一个基础图形（如矩形 Rect, 圆形 Ellipse, 文本 Text, 星形 Star）',
    parameters: {
      type: 'object',
      properties: {
        tag: { type: 'string', enum: ['Rect', 'Ellipse', 'Text', 'Star', 'Box'], description: '图形类型' },
        x: { type: 'number', description: '世界X坐标' },
        y: { type: 'number', description: '世界Y坐标' },
        width: { type: 'number', description: '宽度' },
        height: { type: 'number', description: '高度' },
        fill: { type: 'string', description: '填充色，支持 HEX、RGBA 或渐变' },
        stroke: { type: 'string', description: '描边颜色' },
        strokeWidth: { type: 'number', description: '描边粗细' },
        cornerRadius: { type: 'number', description: '圆角半径' },
        text: { type: 'string', description: '如果是文本，要显示的文字' },
        fontSize: { type: 'number', description: '文本字号' },
      },
      required: ['tag', 'x', 'y'],
    },
  },
  {
    name: 'create_ai_frame',
    description: '在指定位置部署一个 AI 图像生成框，并设置提示词与分辨率',
    parameters: {
      type: 'object',
      properties: {
        x: { type: 'number', description: '世界X坐标' },
        y: { type: 'number', description: '世界Y坐标' },
        aspectRatio: { type: 'string', enum: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'], description: '比例' },
        prompt: { type: 'string', description: '正向提示词' },
        model: { type: 'string', description: '所用模型ID' },
        autoGenerate: { type: 'boolean', description: '是否布框后立即触发图像生成' },
      },
      required: ['x', 'y', 'prompt'],
    },
  },
  {
    name: 'auto_layout',
    description: '将一组元素进行智能自动排列（横向水平分布、纵向垂直分布或网格排列）',
    parameters: {
      type: 'object',
      properties: {
        direction: { type: 'string', enum: ['horizontal', 'vertical', 'grid'], description: '排列方向' },
        gap: { type: 'number', description: '间距大小(像素)' },
        align: { type: 'string', enum: ['start', 'center', 'end'], description: '对齐方式' },
      },
      required: ['direction'],
    },
  },
  {
    name: 'connect_elements',
    description: '在两个元素之间创建箭头或连线',
    parameters: {
      type: 'object',
      properties: {
        fromId: { type: 'string', description: '起点元素ID' },
        toId: { type: 'string', description: '终点元素ID' },
        label: { type: 'string', description: '连线上的文字标签' },
        color: { type: 'string', description: '连线颜色' },
      },
      required: ['fromId', 'toId'],
    },
  },
  {
    name: 'modify_element',
    description: '修改指定元素的属性（位置、大小、填充色、文字等）',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '元素ID' },
        x: { type: 'number' },
        y: { type: 'number' },
        width: { type: 'number' },
        height: { type: 'number' },
        fill: { type: 'string' },
        text: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_elements',
    description: '删除画布上的元素',
    parameters: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' }, description: '待删除元素ID列表' },
      },
      required: ['ids'],
    },
  },
]
