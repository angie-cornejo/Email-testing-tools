// For security purposes the token was delated as well as credentials.json

import { google } from 'googleapis';
import fs from 'fs';
import readline from 'readline';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const CREDENTIALS_PATH = path.join(__dirname, './data/credentials.json');
const TOKEN_PATH = path.join(__dirname, './data/token.json');

async function getAccessToken(oAuth2Client: any) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('Authorize the app by visiting this URL:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise<void>((resolve, reject) => {
        rl.question('Authorization code here: ', (code: string) => {
            rl.close();
            oAuth2Client.getToken(code, (err: Error | null, token: any) => {
                if (err || !token) {
                    console.error('Error:', err);
                    reject(err);
                    return;
                }
                oAuth2Client.setCredentials(token);
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
                console.log('Token saved up at token.json');
                resolve();
            });
        });
    });
}

async function generateToken() {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.error("credentials.json not found in ./data. Download Google Cloud credentials.");
        return;
    }

    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8')).web;
    const { client_id, client_secret } = credentials;
    const redirect_uris = ['http://localhost'];

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (fs.existsSync(TOKEN_PATH)) {
        console.log('The token already exists.');
        return;
    }

    await getAccessToken(oAuth2Client);
}

generateToken().catch(console.error);