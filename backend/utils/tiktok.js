import axios from 'axios';
import crypto from 'crypto';


const sha256 = (value) => {
    if (!value) return null;
    return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
};

export const sendTikTokEvent = async (req, eventName, data) => {
    try {
        const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
        const pixelId = process.env.TIKTOK_PIXEL_ID;

        if (!accessToken || !pixelId) {
            console.warn("TikTok Pixel ID or Access Token is missing from environment variables.");
            return;
        }

        const {
            orderId,
            value,
            currency,
            contents,
            content_type,
            page_url,
            user: userData
        } = data;

        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
        if (ip && ip.includes(',')) {
            ip = ip.split(',')[0].trim();
        }

        const userAgent = req.headers['user-agent'];
        const ttclid = req.cookies?.ttclid || req.body?.ttclid || "afigureaday";
        const ttp = req.cookies?.ttp || req.body?.ttp || null;

        const userPayload = {
            ip: ip,
            user_agent: userAgent,
            ttclid: ttclid,
            ttp: ttp
        };

        if (userData?.email) {
            userPayload.email = sha256(userData.email);
        }
        if (userData?.phone) {
            userPayload.phone_number = sha256(userData.phone);
        }
        if (userData?.external_id) {
            userPayload.external_id = sha256(userData.external_id);
        }

        const payload = {
            event_source: "web",
            event_source_id: pixelId,
            // test_event_code: "TEST13892",
            data: [
                {
                    event: eventName,
                    event_time: Math.floor(Date.now() / 1000),
                    event_id: orderId,
                    user: userPayload,
                    properties: {
                        contents: contents || [],
                        currency: currency || 'USD',
                        value: value || 0,
                        content_type: content_type || null
                    },
                    page: {
                        url: page_url || null
                    }
                }
            ]
        };

        console.log(`Sending TikTok event: ${eventName}`, JSON.stringify(payload, null, 2));

        await axios.post(
            'https://business-api.tiktok.com/open_api/v1.3/event/track/',
            payload,
            {
                headers: {
                    'Access-Token': accessToken,
                    'Content-Type': 'application/json'
                }
            }
        );

    } catch (error) {
        console.error('Error sending TikTok event:', error?.response?.data || error.message);
    }
};
