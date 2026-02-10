import OpenAI from 'openai';

export const COCO_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'searchMerchants',
            description: 'Busca comercios (restaurantes, tiendas, servicios) en el Caribe Sur.',
            parameters: {
                type: 'object',
                properties: {
                    category: {
                        type: 'string',
                        enum: ['restaurant', 'cafe', 'grocery', 'pharmacy', 'bakery', 'seafood', 'bar', 'other'],
                        description: 'Categoría del comercio',
                    },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'getProducts',
            description: 'Obtiene el menú o productos de un comercio específico.',
            parameters: {
                type: 'object',
                properties: {
                    merchantId: { type: 'string', description: 'ID del comercio' },
                },
                required: ['merchantId'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'getFeaturedEvents',
            description: 'Busca eventos, conciertos o festivales cercanos en el Caribe Sur.',
            parameters: {
                type: 'object',
                properties: {
                    radius: { type: 'number', description: 'Radio de búsqueda en km' },
                },
            },
        },
    },
];
