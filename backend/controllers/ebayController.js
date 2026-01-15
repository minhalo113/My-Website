import crypto from 'crypto';
import responseReturn from "../utils/response.js";

class ebayController {
    handleDeletionNotification = (req, res) => {
        try {

            const challengeCode = req.query.challenge_code;

            const verificationToken = process.env.EBAY_VERIFICATION_TOKEN;

            const endpoint = process.env.EBAY_DELETION_ENDPOINT;

            if (!challengeCode || !verificationToken || !endpoint) {
                return responseReturn(res, 500, { error: "Missing config" });
            }

            console.log("challengeCode", challengeCode);
            console.log("verificationToken", verificationToken);
            console.log("endpoint", endpoint);

            const hash = crypto.createHash('sha256');
            hash.update(challengeCode);
            hash.update(verificationToken);
            hash.update(endpoint);
            const responseHash = hash.digest('hex');
            console.log("responseHash", new Buffer.from(responseHash).toString());

            return res.status(200).json({
                "challengeResponse": responseHash
            });

        } catch (error) {
            console.error("eBay Challenge Error:", error);
            return responseReturn(res, 500, { error: "Internal Error" });
        }
    }

    handleDeletionPost = async (req, res) => {
        try {
            const payload = req.body;
            const headers = req.headers;

            console.log("[eBay Deletion POST] headers:", {
                "content-type": headers["content-type"],
                "user-agent": headers["user-agent"],
            });
            console.log("[eBay Deletion POST] payload:", JSON.stringify(payload));

            return res.sendStatus(204);
        } catch (error) {
            console.error("[eBay Deletion POST] Error:", error);
            return responseReturn(res, 500, { error: "Internal Error" });
        }
    };
}

export default new ebayController();