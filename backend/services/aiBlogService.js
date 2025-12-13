import axios from 'axios'
const DEFAULT_MODEL = 'gpt-5-nano'

const DEFAULT_ENDPOINT = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';

const normalizeTags = (tags) => {
    if (!Array.isArray(tags)) {
        return [];
    }

    return tags
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter((tag) => tag.length > 0);
};

export const generateBlogEnhancement = async ({ title, content, instructions }) => {
    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    const trimmedContent = typeof content === 'string' ? content.trim() : '';
    const extraInstructions = typeof instructions === 'string' ? instructions.trim() : '';

    if (!trimmedTitle || !trimmedContent) {
        throw new Error('A title and content are required to generate AI suggestions');
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OpenAI API key is not configured');
    }

    const systemPrompt = `You are an assistant that edits and enhances marketing blog posts.
Return polished results while preserving the author's intent.

Respond strictly with a JSON object that matches this schema:
{
  "title": string,            // engaging, SEO-friendly rewrite of the title (max ~12 words)
  "content": string,          // improved multi-paragraph Markdown content (~450-650 words)
  "description": string,      // 1-2 sentence meta description under 160 characters
  "blockQuote": string,       // short quote (max 200 characters) highlighting a key insight
  "tags": string[]            // 4-6 concise SEO tags in kebab or lower case without # symbols
}

Keep terminology consistent with the provided draft. Avoid adding HTML except standard Markdown formatting.`;

    const userPromptParts = [
        `Existing title: ${trimmedTitle}`,
        `Existing content:\n${trimmedContent}`,
    ];

    if (extraInstructions) {
        userPromptParts.push(`Additional guidance: ${extraInstructions}`);
    }

    const { data } = await axios.post(
        DEFAULT_ENDPOINT,
        {
            model: DEFAULT_MODEL,
            temperature: 1,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPromptParts.join('\n\n') },
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
    if (!message) {
        throw new Error('The AI service returned an empty response');
    }

    let parsed;
    try {
        parsed = JSON.parse(message);
    } catch (error) {
        throw new Error('Failed to parse the AI response');
    }

    return {
        title: typeof parsed.title === 'string' ? parsed.title.trim() : trimmedTitle,
        content: typeof parsed.content === 'string' ? parsed.content.trim() : trimmedContent,
        description: typeof parsed.description === 'string' ? parsed.description.trim() : '',
        blockQuote: typeof parsed.blockQuote === 'string' ? parsed.blockQuote.trim() : '',
        tags: normalizeTags(parsed.tags),
    };
};

export default generateBlogEnhancement;