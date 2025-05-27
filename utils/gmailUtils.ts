// For security purposes the token was delated as well as credentials.json
import { google, Auth } from "googleapis";
import path from "path";
import fs from 'fs';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const CREDENTIALS_PATH = path.join(__dirname, '../data/credentials.json');
const TOKEN_PATH = path.join(__dirname, '../data/token.json');

export async function authenticate(): Promise<Auth.OAuth2Client> {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        throw new Error("credentials.json not found in ./data. Download Google Cloud credentials.");
    }

    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8')).web;
    const { client_id, client_secret } = credentials;
    const redirect_uris = ['http://localhost'];

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (!fs.existsSync(TOKEN_PATH)) {
        throw new Error("token.json wasn't found. Execute `npx tsx generateToken.ts` to creat it");
    }

    console.log("Loading token from token.json...");
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    oAuth2Client.setCredentials(token);
    console.log("Token loaded correctly.");

    return oAuth2Client;
}


export async function waitForResetEmail(auth, timeout = 60_000): Promise<{html: string; resetUrl?: string}> {
    const gmail = google.gmail({ version: 'v1', auth });
    const start = Date.now();
    const linkPattern = /https?:\/\/[^\s"']+/g
  
    while (Date.now() - start < timeout) {
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'subject:"Finalis Password Reset"',
        maxResults: 1,
        labelIds:['UNREAD'], 		
      });
  
      const msg = res.data.messages?.[0];
      if (msg) {
        const full = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'full',
        });
  
        const bodyData = full.data.payload?.parts?.find(p => p.mimeType === 'text/html')?.body?.data;
        if (bodyData) {
          const html = Buffer.from(bodyData, 'base64').toString('utf-8');
          //const match = html.match(/https?:\/\/[^\s"]+reset[^"\s]+/);
          const allMatches = html.match(linkPattern);
          const firstMatch = allMatches?.find(link => link.toLowerCase().includes('reset'));
          if (firstMatch){
            return { html, resetUrl: firstMatch };
          }
        }
      }
  
      await new Promise(r => setTimeout(r, 5000));
    }
  
    throw new Error('Password reset email not received in time.');
  }

  