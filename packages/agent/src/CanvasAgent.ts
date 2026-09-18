import type { App } from 'leafer-ui'
import { SceneSerializer, ICanvasSceneContext } from './SceneSerializer'
import { CANVAS_AGENT_TOOLS, IAgentToolDefinition } from './AgentTools'
import { AgentExecutor } from './AgentExecutor'

export interface IAgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  tool_calls?: any[]
  name?: string
}

export class CanvasAgent {
  public app: App
  public tools: IAgentToolDefinition[] = CANVAS_AGENT_TOOLS
  public executor: AgentExecutor
  public history: IAgentMessage[] = []
  public apiKey: string = ''
  public apiBase: string = '/api/proxy'
  public agentModel: string = 'gemini-2.5-flash'

  constructor(app: App, config?: { apiKey?: string; apiBase?: string; model?: string }) {
    this.app = app
    this.executor = new AgentExecutor(app)
    if (config?.apiKey) this.apiKey = config.apiKey
    if (config?.apiBase) this.apiBase = config.apiBase
    if (config?.model) this.agentModel = config.model
  }

  public getSceneContext(): ICanvasSceneContext {
    return SceneSerializer.serializeScene(this.app)
  }

  public async chat(userPrompt: string, onProgress?: (status: string) => void): Promise<string> {
    onProgress?.('🔍 正在理解当前画布全景与选区...')
    const sceneContext = this.getSceneContext()
    const scenePrompt = SceneSerializer.toLLMPromptContext(sceneContext)

    const systemPrompt = `你是一个内置在 Leafer UI 高性能无限画布中的 Canvas AI Agent（智能画布副驾驶）。
你可以通过感知画布元素状态与调用工具来协助用户完成设计构图、AI 生图、自动排版与图形修改。

${scenePrompt}

【你的指导原则】
1. 始终依据当前画布的尺寸与选区进行操作。如果用户选定了某个区域或元素，优先针对选区进行处理。
2. 当用户需要生成特定图像时，请使用 \`create_ai_frame\` 在合理坐标处布置生成框。
3. 当用户要求排版或布局时，调用 \`auto_layout\` 工具。
4. 当需要创建图形、流程连线或更新属性时，选择最贴切的工具调用。
5. 友好、专业、简明扼要地向用户说明你完成的操作。`

    onProgress?.('🧠 Agent 正在规划画布操作方案...')

    try {
      const res = await fetch(`${this.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: this.agentModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...this.history.slice(-6),
            { role: 'user', content: userPrompt },
          ],
          tools: this.tools.map(t => ({
            type: 'function',
            function: {
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            },
          })),
          tool_choice: 'auto',
        }),
      })

      if (!res.ok) {
        throw new Error(`LLM API 响应异常: HTTP ${res.status}`)
      }

      const data = await res.json()
      const choice = data.choices?.[0]
      const msg = choice?.message

      if (!msg) throw new Error('未能从模型获取到有效响应')

      let reply = msg.content || ''

      if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
        onProgress?.(`⚡ 正在执行画布指令 (${msg.tool_calls.length} 项)...`)
        const executionResults: string[] = []

        for (const toolCall of msg.tool_calls) {
          const fnName = toolCall.function?.name
          let fnArgs: any = {}
          try {
            fnArgs = JSON.parse(toolCall.function?.arguments || '{}')
          } catch (e) {
            fnArgs = {}
          }

          const result = await this.executor.executeTool(fnName, fnArgs)
          executionResults.push(result.message)
        }

        const summary = executionResults.join('\n- ')
        reply = (reply ? `${reply}\n\n` : '') + `已在画布上自动执行操作：\n- ${summary}`
      }

      this.history.push({ role: 'user', content: userPrompt })
      this.history.push({ role: 'assistant', content: reply })

      return reply
    } catch (err: any) {
      console.error('[CanvasAgent Error]', err)
      return `Agent 处理中遇到错误: ${err.message}`
    }
  }
}
