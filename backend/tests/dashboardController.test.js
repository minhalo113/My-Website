import dashboardController from '../controllers/dashbaord/dashboardController.js';
import automatedSocialPostService from '../services/AutomatedSocialPostService.js';
import responseReturn from '../utils/response.js';

jest.mock('../services/AutomatedSocialPostService.js');
jest.mock('../utils/response.js');

describe('Dashboard Controller - trigger_social_post', () => {
    let req, res;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    it('should trigger the service and return 200', async () => {
        automatedSocialPostService.createAutomatedSocialPost.mockImplementation(async () => { });

        await dashboardController.trigger_social_post(req, res);

        expect(automatedSocialPostService.createAutomatedSocialPost).toHaveBeenCalledTimes(1);
        expect(responseReturn).toHaveBeenCalledWith(res, 200, { message: 'Social post generation triggered successfully.' });
    });

    it('should return 500 if an error occurs (though highly unlikely due to async void call)', async () => {
        automatedSocialPostService.createAutomatedSocialPost.mockImplementation(() => {
            throw new Error('Sync error');
        });

        await dashboardController.trigger_social_post(req, res);

        expect(responseReturn).toHaveBeenCalledWith(res, 500, { error: 'Failed to trigger social post generation' });
    });
});
