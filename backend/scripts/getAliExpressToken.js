import axios from 'axios';
import readline from 'readline';

const appKey = process.env.ALIEXPRESS_APP_KEY;
const appSecret = process.env.ALIEXPRESS_APP_SECRET;
const redirectUri = 'https://www.afigureaday.com/';

if (!appKey || !appSecret) {
    console.error('❌ Error: ALIEXPRESS_APP_KEY or ALIEXPRESS_APP_SECRET not found in .env');
    console.log('Please add them and try again.');
    process.exit(1);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n🛍️  AliExpress Token Generator 🛍️\n');
console.log('1. Please visit the following URL to authorize your app:');
console.log(`   https://oauth.aliexpress.com/authorize?response_type=code&client_id=${appKey}&redirect_uri=${redirectUri}&view=web&sp=ae\n`);
console.log('2. After logging in and authorizing, you will be redirected to a URL');
console.log('3. Look at the address bar for the "code" parameter (e.g., ?code=YOUR_CODE).');

rl.question('\n👉 Paste the "code" here: ', async (code) => {
    if (!code) {
        console.error('❌ No code provided.');
        rl.close();
        return;
    }

    // Clean the code if user pasted full URL
    if (code.includes('code=')) {
        code = code.split('code=')[1].split('&')[0];
    }

    console.log(`\n🔄 Exchanging code "${code}" for access token...`);

    try {
        const response = await axios.post('https://oauth.aliexpress.com/token', new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: appKey,
            client_secret: appSecret,
            redirect_uri: redirectUri,
            code: code
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const data = response.data;
        if (data.access_token) {
            console.log('\n✅ Success! Add these to your .env file:\n');
            console.log(`ALIEXPRESS_ACCESS_TOKEN=${data.access_token}`);
            // Often "refresh_token" is provided too
            if (data.refresh_token) {
                console.log(`ALIEXPRESS_REFRESH_TOKEN=${data.refresh_token}`);
            }
            console.log(`\n(Expires in: ${data.expires_in} seconds)`);
        } else {
            console.error('❌ Failed to retrieve token. Response:', data);
        }

    } catch (error) {
        console.error('❌ Error exchanging token:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
        } else {
            console.error(error.message);
        }
    }

    rl.close();
});
