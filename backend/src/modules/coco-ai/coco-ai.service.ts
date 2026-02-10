import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import OpenAI from 'openai';
import { MerchantsService } from '../merchants/merchants.service';
import { ProductsService } from '../products/products.service';
import { EventsService } from '../events/events.service';
import { OrdersService } from '../orders/orders.service';
import { COCO_TOOLS } from './coco-tools';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CocoAiService implements OnModuleInit {
    private readonly logger = new Logger(CocoAiService.name);
    private openai: OpenAI;
    private knowledgeBase: any = {};

    constructor(
        private configService: ConfigService,
        private merchantsService: MerchantsService,
        private productsService: ProductsService,
        private eventsService: EventsService,
        private ordersService: OrdersService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    onModuleInit() {
        const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
        this.logger.log(`OpenRouter API Key: ${apiKey ? 'CONFIGURED' : 'MISSING'}`);

        this.openai = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: apiKey,
            defaultHeaders: {
                'HTTP-Referer': 'https://caribedigital.cr',
                'X-Title': 'DIGITAL PARADISE',
            },
        });

        // Load knowledge base
        try {
            // Try different paths for development and production
            const pathsToTry = [
                path.join(process.cwd(), 'src', 'modules', 'coco-ai', 'data', 'knowledge-base.json'),
                path.join(__dirname, 'data', 'knowledge-base.json'),
                path.join(process.cwd(), 'dist', 'modules', 'coco-ai', 'data', 'knowledge-base.json')
            ];

            let loaded = false;
            for (const kbPath of pathsToTry) {
                if (fs.existsSync(kbPath)) {
                    this.knowledgeBase = JSON.parse(fs.readFileSync(kbPath, 'utf-8'));
                    this.logger.log(`Knowledge base loaded from: ${kbPath}`);
                    loaded = true;
                    break;
                }
            }

            if (!loaded) {
                this.logger.warn('Knowledge base file not found in any expected location.');
            }
        } catch (error) {
            this.logger.error('Failed to load knowledge base:', error);
        }
    }

    private async getHistory(userId: string): Promise<OpenAI.Chat.ChatCompletionMessageParam[]> {
        if (!userId) return [];
        const key = `coco_history_${userId}`;
        return (await this.cacheManager.get(key)) || [];
    }

    private async saveHistory(userId: string, messages: OpenAI.Chat.ChatCompletionMessageParam[]) {
        if (!userId) return;
        const key = `coco_history_${userId}`;
        // Keep last 10 messages for context
        const trimmed = messages.slice(-10);
        await this.cacheManager.set(key, trimmed);
    }

    private async prepareSystemPrompt(user?: any): Promise<string> {
        let userContext = '';

        if (user) {
            const userId = user.userId || user.id;
            let activeOrdersContext = '';

            try {
                const orders = await this.ordersService.findAllByUser(userId);
                const activeOrders = orders.filter(o => ['PENDING', 'PAID', 'PREPARING', 'READY', 'ON_THE_WAY'].includes(o.status));

                if (activeOrders.length > 0) {
                    activeOrdersContext = `\nPEDIDOS ACTIVOS:\n${activeOrders.map(o => `- Pedido #${o.id.substring(0, 8)} (${o.status})`).join('\n')}\n`;
                }
            } catch (e) {
                this.logger.warn('Could not fetch orders for AI context');
            }

            userContext = `\nCONTEXTO DEL USUARIO:\n- Puntos Coco Rewards: ${user.points || 0}\n- Ubicación: ${user.lastLat && user.lastLng ? `${user.lastLat}, ${user.lastLng}` : 'Desconocida (Puerto Viejo base)'}\n${activeOrdersContext}`;
        }

        return `Eres COCO Caribeño, Inteligencia Tropical de DIGITAL PARADISE (Puerto Viejo, Cahuita, Cocles).
        
MODO: "TROPICAL MINIMALIST"
- Tu objetivo es dar la respuesta más útil en el MENOR tiempo posible.
- Estilo: Olas suaves, no tsunamis de texto.
- Tono: "Pura Vida", relajado pero eficiente. Como un local sabio que no pierde tiempo.

REGLAS DE ORO (AESTHETIC):
1. **Brevedad Extrema**: Respuestas de 1-3 frases si es posible. Ve al grano.
2. **Identidad**: Usa slang caribeño (Pura Vida, Mae, Rice&Beans) con naturalidad, no forzado.
3. **Cero Relleno**: Evita introducciones largas ("¡Hola! Qué gusto saludarte..."). Responde la pregunta.
4. **Sostenibilidad**: Si recomiendas algo, prioriza lo local y sostenible.
5. **Formato**: Usa listas (bullets) para enumerar. Es más fácil de leer en móvil.

${userContext}`;
    }

    private getTools(): OpenAI.Chat.ChatCompletionTool[] {
        return COCO_TOOLS;
    }

    async chat(message: string, user?: any) {
        try {
            const model = this.configService.get<string>('OPENROUTER_MODEL') || 'nvidia/nemotron-3-nano-30b-a3b:free';
            const userId = user?.userId || user?.id; // Robust ID detection
            const history = userId ? await this.getHistory(userId) : [];

            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                { role: 'system', content: await this.prepareSystemPrompt(user) },
                ...history,
                { role: 'user', content: message },
            ];

            const response = await this.openai.chat.completions.create({
                model: model,
                messages: messages,
                tools: this.getTools(),
                tool_choice: 'auto',
            });

            const responseMessage = response.choices[0].message;

            if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                const toolCall = responseMessage.tool_calls[0];

                if (toolCall.type === 'function') {
                    const functionName = toolCall.function.name;
                    const functionArgs = JSON.parse(toolCall.function.arguments);

                    let toolResult;
                    if (functionName === 'searchMerchants') {
                        const category = functionArgs.category ? functionArgs.category.toLowerCase() : undefined;
                        toolResult = await this.merchantsService.findAll(
                            undefined,
                            category,
                            'name',
                        );
                    } else if (functionName === 'getProducts') {
                        toolResult = await this.productsService.findAllByMerchant(functionArgs.merchantId);
                    } else if (functionName === 'getCaribbeanInfo') {
                        toolResult = functionArgs.topic ? this.knowledgeBase[functionArgs.topic] : this.knowledgeBase;
                    } else if (functionName === 'getFeaturedEvents') {
                        toolResult = await this.eventsService.findNearbyEvents(
                            functionArgs.lat || 9.65,
                            functionArgs.lng || -82.75,
                            functionArgs.radius || 10
                        );
                    }

                    // Send tool result back to model
                    messages.push(responseMessage);
                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(toolResult || { info: 'No result found' }),
                    });

                    const secondResponse = await this.openai.chat.completions.create({
                        model: model,
                        messages: messages,
                    });

                    const finalMessage = secondResponse.choices[0].message;
                    if (userId) {
                        await this.saveHistory(userId, [...messages, finalMessage]);
                    }
                    return { text: finalMessage.content };
                }
            }

            if (userId) {
                await this.saveHistory(userId, [...messages, responseMessage]);
            }
            return { text: responseMessage.content };
        } catch (error) {
            this.logger.error('CocoAi chat error:', error);
            return {
                text: "¡Uy! Se me cayó el coco. 🥥 Soy COCO Caribeño y la conexión satelital está un poco lenta por la lluvia tropical. ¿Me repites lo que ocupas, porfa?"
            };
        }
    }

    async *chatStream(message: string, user?: any): AsyncGenerator<string> {
        try {
            const model = this.configService.get<string>('OPENROUTER_MODEL') || 'nvidia/nemotron-3-nano-30b-a3b:free';
            const userId = user?.userId || user?.id;
            const history = userId ? await this.getHistory(userId) : [];

            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                { role: 'system', content: await this.prepareSystemPrompt(user) },
                ...history,
                { role: 'user', content: message },
            ];

            let toolCalls: any[] = [];
            let finalContent = "";

            // First attempt with tools enabled
            const stream = await this.openai.chat.completions.create({
                model: model,
                messages: messages,
                stream: true,
                tools: this.getTools(),
                tool_choice: 'auto',
            });

            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta;

                // Handle tool call fragments
                if (delta?.tool_calls) {
                    for (const tc of delta.tool_calls) {
                        if (!toolCalls[tc.index]) {
                            toolCalls[tc.index] = { id: tc.id, function: { name: "", arguments: "" } };
                        }
                        if (tc.function?.name) toolCalls[tc.index].function.name += tc.function.name;
                        if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments;
                    }
                }

                // Handle content fragments
                const content = delta?.content || '';
                if (content) {
                    yield content;
                    finalContent += content;
                }
            }

            // If tools were called, we handle them and get the second response
            if (toolCalls.length > 0) {
                const toolCall = toolCalls[0]; // Currently handling first tool call for simplicity
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments || "{}");

                let toolResult;
                if (functionName === 'searchMerchants') {
                    const category = functionArgs.category ? functionArgs.category.toLowerCase() : undefined;
                    toolResult = await this.merchantsService.findAll(undefined, category, 'name');
                } else if (functionName === 'getProducts') {
                    toolResult = await this.productsService.findAllByMerchant(functionArgs.merchantId);
                } else if (functionName === 'getFeaturedEvents') {
                    toolResult = await this.eventsService.findNearbyEvents(functionArgs.lat || 9.65, functionArgs.lng || -82.75, functionArgs.radius || 10);
                } else if (functionName === 'getCaribbeanInfo') {
                    toolResult = functionArgs.topic ? this.knowledgeBase[functionArgs.topic] : this.knowledgeBase;
                }

                // Update messages with tool results
                messages.push({
                    role: 'assistant',
                    content: null,
                    tool_calls: toolCalls
                } as any);
                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(toolResult || { info: 'No result found' }),
                });

                // Second pass (the final answer based on tool result)
                const secondStream = await this.openai.chat.completions.create({
                    model: model,
                    messages: messages,
                    stream: true,
                });

                for await (const chunk of secondStream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        yield content;
                        finalContent += content;
                    }
                }

                if (userId) {
                    await this.saveHistory(userId, [...messages, { role: 'assistant', content: finalContent }]);
                }
            } else if (userId && finalContent) {
                await this.saveHistory(userId, [...messages, { role: 'assistant', content: finalContent }]);
            }
        } catch (error) {
            this.logger.error('CocoAi stream error:', error);
            yield "Perdona, se me metió el agua por la ventana. ⛈️ ¿Me repites eso?";
        }
    }
}
