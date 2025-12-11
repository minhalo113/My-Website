import axios from 'axios';
import blogModel from '../../models/blogModel.js';
import adminModel from '../../models/adminModel.js';
import productModel from '../../models/productModel.js';

const JIKAN_API_BASE = 'https://api.jikan.moe/v4';
const OPENAI_ENDPOINT = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-5-nano';

class AnimeBlogService {
    async fetchTrendingCharacter() {
        console.log('[AnimeBlogService] Fetching trending anime...');

        const seasonResponse = await axios.get(`${JIKAN_API_BASE}/seasons/now?limit=25`);
        const animeList = seasonResponse.data?.data || [];

        if (animeList.length === 0) {
            throw new Error('No anime found for current season');
        }

        const randomAnime = animeList[Math.floor(Math.random() * animeList.length)];
        console.log(`[AnimeBlogService] Selected Anime: ${randomAnime.title} (ID: ${randomAnime.mal_id})`);

        const charactersResponse = await axios.get(`${JIKAN_API_BASE}/anime/${randomAnime.mal_id}/characters`);
        const allCharacters = charactersResponse.data?.data || [];

        const mainCharacters = allCharacters.filter(c => c.role === 'Main');

        if (mainCharacters.length === 0) {
            console.log('[AnimeBlogService] No main characters found, falling back to any character');
            if (allCharacters.length === 0) {
                return null; // Dead end for this anime
            }
        }

        const pool = mainCharacters.length > 0 ? mainCharacters : allCharacters;
        const randomCharEntry = pool[Math.floor(Math.random() * pool.length)];
        const characterId = randomCharEntry.character.mal_id;

        console.log(`[AnimeBlogService] Fetching details for character ID: ${characterId}`);
        const charDetailResponse = await axios.get(`${JIKAN_API_BASE}/characters/${characterId}`);
        const charData = charDetailResponse.data?.data;

        return { character: charData, anime: randomAnime };
    }

    async generateBlogContent(character, animeTitle) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OpenAI API key is not configured');

        const systemPrompt = `You are an expert anime blogger writing for a website that sells high-quality anime figures.

                                    Your goal is to write an engaging, SEO-friendly blog post about a specific anime character.

                                    The tone should be enthusiastic, knowledgeable, and persuasive (subtly encouraging figure collection).



                                    Respond strictly with a JSON object that matches this schema:

                                    {

                                    "title": string,            // Catchy title involving the character name (max 60 chars)

                                    "content": string,          // Markdown format, 500-800 words. Deep dive into personality, role, and why fans love them.

                                    "description": string,      // Meta description (150-160 chars)

                                    "blockQuote": string,       // A memorable quote from the character or about them (max 200 chars)

                                    "tags": string[]            // 5-8 relevant SEO tags (character name, anime name, 'figure', etc.)

                                    }

                                    Do not include markdown code blocks (like \`\`\`json) in the response, just the raw JSON string.`;

        const userPrompt = `Write a blog post about the character "${character.name}" from the anime "${animeTitle || 'popular anime'}".

       

                        Character Details:

                        ${character.about || 'No detailed description available, please use your knowledge about this popular character.'}



                        Image URL (for context): ${character.images?.jpg?.image_url}



                        Focus on:

                        1. Who they are and their role in the story.

                        2. Their key personality traits and appeal.

                        3. Why they make a great addition to an anime figure collection.

                        `;

        const { data } = await axios.post(
            OPENAI_ENDPOINT,
            {
                model: OPENAI_MODEL,
                temperature: 1,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const message = data?.choices?.[0]?.message?.content;
        if (!message) throw new Error('OpenAI returned empty response');

        try {
            return JSON.parse(message);
        } catch (e) {
            console.error('[AnimeBlogService] Failed to parse JSON from AI:', message);
            throw new Error('Failed to parse AI response');
        }
    }

    async findRelatedProducts(characterName, animeTitle) {
        try {
            // Escape special characters for regex
            const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const nameRegex = new RegExp(escapeRegex(characterName), 'i');
            const animeRegex = new RegExp(escapeRegex(animeTitle), 'i');

            const query = {
                $or: [
                    { name: { $regex: nameRegex } },
                    { name: { $regex: animeRegex } }
                ],
                isHidden: false
            };

            // Fetch potential matches
            const products = await productModel.find(query)
                .select('_id productType name price images slug')
                .limit(20); // Fetch a bit more to sort in memory if needed

            // Sort: Standard products first, then others
            products.sort((a, b) => {
                const typeA = a.productType === 'standard' ? 0 : 1;
                const typeB = b.productType === 'standard' ? 0 : 1;
                return typeA - typeB;
            });

            // Take top 5
            return products.slice(0, 5).map(p => p._id);
        } catch (err) {
            console.error('[AnimeBlogService] Error finding related products:', err);
            return [];
        }
    }

    async createBlogPost() {
        console.log('[AnimeBlogService] Starting blog generation job...');

        let adminUser;
        try {
            adminUser = await adminModel.findOne({ role: 'admin' });
        } catch (err) {
            console.error('[AnimeBlogService] Error finding admin:', err);
            return;
        }

        if (!adminUser) {
            console.error('[AnimeBlogService] No admin user found. Aborting.');
            return;
        }

        const MAX_RETRIES = 5;
        let retries = 0;
        let selectedData = null;

        while (retries < MAX_RETRIES) {
            try {
                if (retries > 0) await new Promise(r => setTimeout(r, 2000));

                const result = await this.fetchTrendingCharacter();
                if (!result || !result.character) {
                    console.log('[AnimeBlogService] Failed to fetch character data, retrying...');
                    retries++;
                    continue;
                }

                const { character } = result;

                const exists = await blogModel.findOne({
                    'metaList': {
                        $elemMatch: { key: 'jikan_character_id', value: String(character.mal_id) }
                    }
                });

                if (exists) {
                    console.log(`[AnimeBlogService] Blog for character ${character.name} (${character.mal_id}) already exists. Skipping.`);
                    retries++;
                    continue;
                }

                selectedData = result;
                break;

            } catch (err) {
                console.error('[AnimeBlogService] Error in fetch loop:', err.message);
                retries++;
            }
        }

        if (!selectedData) {
            console.error('[AnimeBlogService] Could not find a unique character after max retries.');
            return;
        }

        const { character, anime } = selectedData;

        try {
            console.log(`[AnimeBlogService] Generating blog for ${character.name} from ${anime.title}...`);

            // Parallel execution for content generation and product search
            const [blogData, relatedProductIds] = await Promise.all([
                this.generateBlogContent(character, anime.title),
                this.findRelatedProducts(character.name, anime.title)
            ]);

            const imageUrl = character.images?.jpg?.image_url;

            const newBlog = new blogModel({
                title: blogData.title,
                content: blogData.content,
                desc: blogData.description,
                image: {
                    url: imageUrl,
                    publicId: `jikan_${character.mal_id}`
                },
                tags: blogData.tags,
                blockquote: blogData.blockQuote,
                status: 'pending',
                author: adminUser._id,
                metaList: [
                    { key: 'jikan_character_id', value: String(character.mal_id) },
                    { key: 'source', value: 'auto-generated-jikan' },
                    { key: 'original_anime', value: anime.title }
                ],
                slug: `${Date.now()}-${blogData.tags?.[0] || 'anime'}`,
                products: relatedProductIds
            });

            await newBlog.save();
            console.log(`[AnimeBlogService] Successfully created blog: "${newBlog.title}" with ${relatedProductIds.length} related products.`);

        } catch (err) {
            console.error('[AnimeBlogService] Error generating/saving blog:', err?.response?.data?.error || err.message);
        }
    }
}

export default new AnimeBlogService();
