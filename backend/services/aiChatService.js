import OpenAI from "openai";
import productModel from '../models/productModel.js'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = 'gpt-5-nano';

class AiChatService {
    async extractFilters(userQuery) {
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
            const response = await openai.chat.completions.create({
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
            return JSON.parse(content)
        } catch (error) {
            console.error('[AiChatService] Error extracting filters:', error)
            return { searchTerm: userQuery, filters: {} };
        }
    }

    async getEmbedding(text) {
        if (!text) return null;
        try {
            const response = await openai.embeddings.create({
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

    async searchProducts(queryVector, filters) {
        const vectorSearchStage = {
            $vectorSearch: {
                index: 'default',
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
        const productContext = products.map(
            p => {
                return `- ${p.name}, Price: ${p.effectivePrice || p.price} ${p.currency || 'USD'}): ${p.description ? p.description.substring(0, 150) + '...' : 'No description'}`;
            }
        ).join('\n')
        const systemPrompt = `
        You are an expert anime figure sales assistant.
        Answer the user's question based ONLY on the provided product context.
        
        If products are found:
        - Recommend the specific products that match the user's request best.
        - Mention their key features or why they fit the request (e.g., "looking cool").
        - Be enthusiastic and helpful.
        - Do not list URLs directly in the text, the system will display product cards separately.
        
        If NO products are found in the context that match well, apologize and suggest general categories.
        
        User Question: "${userQuery}"
        
        Product Context:
        ${productContext}
        `;

        try {
            const response = await openai.chat.completions.create({
                model: CHAT_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userQuery }
                ]
            })
            return response.choices[0].message.content
        } catch (error) {
            console.error('[AiChatService] Error generating response:', error);
            return "I'm having trouble thinking of a response right now. Please check the products below!";
        }
    }

    async processUserMessage(message) {
        const extraction = await this.extractFilters(message);
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