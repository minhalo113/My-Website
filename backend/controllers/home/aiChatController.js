import aiChatService from "../../services/aiChatService.js";

export const handleAiChat = async (req, res) => {
    try {
        const { message } = req.body
        if (!message || typeof message !== 'string') {
            return responseReturn(res, 400, 'Message is required')
        }
        const result = await aiChatService.processUserMessage(message)
        return responseReturn(res, 200, result)
    } catch (error) {
        console.error('[AiChatController] Error:', error)
        return responseReturn(res, 500, error)
    }
}