import axios from 'axios';
import blogModel from '../../models/blogModel.js';
import adminModel from '../../models/adminModel.js';

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

        const systemPrompt = `You are an elite anime figure collector and blogger.
        Your goal is to write a highly engaging, SEO-optimized blog post that drives desire for ownership.
        Your audience loves anime but needs a reason to buy a physical figure of this character.

        RESPONSE FORMAT:
        Respond strictly with a VALID JSON object. No markdown formatting (like \`\`\`json) outside the JSON structure.
        Schema:
        {
        "title": "string (Max 60 chars, catchy, includes Character Name + 'Figure' or 'Statue')",
        "content": "string (Markdown format. MUST use ## H2 and ### H3 headers. Split into sections. Total 600-900 words.)",
        "description": "string (150-160 chars, optimized for CTR)",
        "blockQuote": "string (Max 200 chars, iconic quote or character catchphrase)",
        "tags": ["string"]
        }

        CONTENT GUIDELINES:
        1. **Visual Focus:** Describe the character's design details (hair, outfit, pose) enthusiastically.
        2. **Psychological Trigger:** Explain why this character represents a "must-have" for fans.
        3. **NEUTRAL CTA:** Do NOT explicitly say "Buy from our store" or "In stock now" because we might not have it yet.
        - Instead, use phrases like: "Adding this figure to your shelf would be...", "Keep an eye out for high-quality figures of [Name]...", "A collection isn't complete without..."
        - Let the website's UI handle the actual sales button.
        `;

        const userPrompt = `Write a blog post about "${character.name}" from "${animeTitle || 'popular anime'}".

        DATA CONTEXT:
        - About: ${character.about ? character.about.substring(0, 1500) : 'Use your internal expert knowledge about this character.'}
        - Image Reference: ${character.images?.jpg?.image_url} (Use this to describe their look if you can see it, otherwise recall their iconic design).

        FOCUS POINTS (Crucial):
        1. **The Legend:** Who they are and their most epic moments in the story.
        2. **The Aesthetic (Money Maker):** Analyze their design details—costume textures, dynamic hair, colors, or weapons. Why is this character visually stunning?
        3. **Collector's Appeal:** Why does this character make a centerpiece display figure? (e.g., "Their dynamic combat pose looks incredible on a shelf").

        IMPORTANT: If the provided 'About' is empty, rely entirely on your training data. Do not mention "based on the provided text".`;

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

            const blogData = await this.generateBlogContent(character, anime.title);

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
                slug: `${Date.now()}-${blogData.tags?.[0] || 'anime'}`
            });

            await newBlog.save();
            console.log(`[AnimeBlogService] Successfully created blog: "${newBlog.title}"`);

        } catch (err) {
            console.error('[AnimeBlogService] Error generating/saving blog:', err.response.data.error);
        }
    }
}

export default new AnimeBlogService();
