import OpenAI from "openai";
import productModel from '../models/productModel.js'

let openai;

const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = 'gpt-5-nano';

class AiChatService {
    constructor() {
        this._initOpenAI();
    }

    _initOpenAI() {
        if (!openai && process.env.OPENAI_API_KEY) {
            openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
        }
    }

    _ensureOpenAI() {
        if (!openai) {
            this._initOpenAI();
            if (!openai) {
                console.warn('[AiChatService] OpenAI client not initialized. Missing API Key?');
            }
        }
        return openai;
    }

    async extractFilters(userQuery) {
        const client = this._ensureOpenAI();
        if (!client) return { searchTerm: userQuery, filters: {} };

        const systemPrompt = `
        You are a helpful assistant for an anime figure shop.
        Your task is to extract search filters and a search term from the user's natural language query.
        
        Available Filters:
        - category (string, exact match)
        - productType (string, exact match: 'standard' or 'affiliate')
        - minPrice (number)
        - maxPrice (number)
        
        The 'searchTerm' should be the core concept/character/series to search for (e.g., "Goku", "cool figure", "naruto").
        If the user asks for "figures under $50", the searchTerm is "figures" (or empty if generic) and maxPrice is 50.
        
        Respond strictly with a JSON object:
        {
          "searchTerm": string,
          "filters": {
            "category": string | null,
            "productType": string | null,
            "minPrice": number | null,
            "maxPrice": number | null
          }
        }
        `;

        try {
            const response = await client.chat.completions.create({
                model: CHAT_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userQuery }
                ],
                response_format: {
                    type: 'json_object'
                }
            })
            const content = response.choices[0].message.content
            console.log(content)
            return JSON.parse(content)
        } catch (error) {
            console.error('[AiChatService] Error extracting filters:', error)
            return { searchTerm: userQuery, filters: {} };
        }
    }

    async getEmbedding(text) {
        const client = this._ensureOpenAI();
        if (!client || !text) return null;

        try {
            const response = await client.embeddings.create({
                model: EMBEDDING_MODEL,
                input: text,
                encoding_format: 'float'
            })
            return response.data[0].embedding
        } catch (error) {
            console.error('[AiChatService] Error getting embedding:', error)
            return null;
        }
    }

    async generateProductEmbedding(product) {
        if (!product) return null;
        const name = product.name || '';
        const category = product.category || 'Unknown';
        const description = product.description || '';

        const text = `Name: ${name}. Category: ${category}. Description: ${description}`;

        return await this.getEmbedding(text);
    }

    async searchProducts(queryVector, filters) {
        const vectorSearchStage = {
            $vectorSearch: {
                index: 'vector_index',
                path: 'embedding',
                queryVector: queryVector,
                numCandidates: 100,
                limit: 10
            }
        };

        const searchFilters = []

        searchFilters.push({ isHidden: { $eq: false } })

        if (filters.category) {
            searchFilters.push({ category: { $eq: filters.category } })
        }
        if (filters.productType) {
            searchFilters.push({ productType: { $eq: filters.productType } })
        }
        if (filters.minPrice) {
            searchFilters.push({ effectivePrice: { $gte: filters.minPrice } })
        }
        if (filters.maxPrice) {
            searchFilters.push({ effectivePrice: { $lte: filters.maxPrice } })
        }
        if (searchFilters.length > 0) {
            if (searchFilters.length === 1) {
                vectorSearchStage.$vectorSearch.filter = searchFilters[0];
            } else {
                vectorSearchStage.$vectorSearch.filter = { $and: searchFilters };
            }
        }

        const pipeline = [
            vectorSearchStage,
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    effectivePrice: 1,
                    price: 1,
                    currency: 1,
                    brand: 1,
                    category: 1,
                    images: { $slice: ['$images', 1] },
                    slug: 1,
                    productType: 1,
                    score: { $meta: 'vectorSearchScore' }
                }
            }
        ]
        try {
            const result = await productModel.aggregate(pipeline)
            return result
        } catch (error) {
            console.error('[AiChatService] Error searching products:', error)
            return []
        }
    }

    async generateResponse(userQuery, products) {
        const client = this._ensureOpenAI();
        if (!client) {
            return {
                headline: "Here are my finds",
                content: "Check out these figures below.",
                highlights: {}
            };
        }

        const productContext = products.map(
            p => {
                return `-ID: ${p._id} , Name: ${p.name}, Price: ${p.effectivePrice || p.price} ${p.currency || 'USD'}): ${p.description ? p.description.substring(0, 150) + '...' : 'No description'}`;
            }
        ).join('\n')

        const systemPrompt = `
        You are an expert figure curator. The user asked: "${userQuery}"
        
        Your goal is to explain WHY specific products match their request.
        
        Respond strictly with this JSON structure:
        {
            "headline": string, // Short, exciting summary (e.g. "Top picks for aggressive poses!")
            "content": string, // General advice or comment on the collection found.
            "highlights": {
                // Key must be the Product ID exactly as provided in context.
                // Value is a sentence explaining the match.
                "product_id_1": "Best detail for under $100",
                "product_id_2": "Perfect matches the 'sexy' keyword"
            }
        }

        Product Context:
        ${productContext}
        
        Rules:
        - Only highlight the top 1-3 most relevant products in the "highlights" object. You don't need to list all.
        - Keep highlight text VERY short and punchy.
        `;

        try {
            const response = await client.chat.completions.create({
                model: CHAT_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userQuery }
                ],
                response_format: { type: 'json_object' }
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error('[AiChatService] Error:', error);
            return {
                headline: "Here are my finds",
                content: "Check out these figures below.",
                highlights: {}
            };
        }
    }

    async processUserMessage(message) {
        const extraction = await this.extractFilters(message);
        const searchTerm = extraction.searchTerm || message;
        const vector = await this.getEmbedding(searchTerm);
        let products = [];
        if (vector) {
            products = await this.searchProducts(vector, extraction.filters);
        }

        const answer = await this.generateResponse(message, products);

        return {
            text: answer,
            products: products
        }
    }
}

export default new AiChatService();