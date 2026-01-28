require('dotenv').config({ path: '../.env' });
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground';

// Fallback to prompting if env vars are missing
const promptForCredentials = async () => {
    const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });

    const question = (query) => new Promise((resolve) => rl2.question(query, resolve));

    let clientId = CLIENT_ID;
    let clientSecret = CLIENT_SECRET;

    if (!clientId) {
        console.log('GMAIL_CLIENT_ID not found in .env');
        clientId = await question('Enter your Client ID: ');
    }

    if (!clientSecret) {
        console.log('GMAIL_CLIENT_SECRET not found in .env');
        clientSecret = await question('Enter your Client Secret: ');
    }

    rl2.close();
    return { clientId, clientSecret };
};

const main = async () => {
    const { clientId, clientSecret } = await promptForCredentials();

    if (!clientId || !clientSecret) {
        console.error('Error: Client ID and Secret are required.');
        process.exit(1);
    }

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);


    const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent' // Force to get a fresh refresh token
    });

    console.log('Authorize this app by visiting this url:');
    console.log(authUrl);
    console.log('\nNOTE: After authorizing, you will be redirected to the redirect URL.');
    console.log('Copy the "Authorization code" or the code from the URL and paste it below.');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('\nEnter the code here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            console.log('\nSUCCESS! Here is your new refresh token:');
            console.log('\n' + token.refresh_token + '\n');
            console.log('Please update GMAIL_REFRESH_TOKEN in your backend/.env file with this value.');
            console.log('Then restart the server.');
        });
    });
};

main();
