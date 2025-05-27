// For security purposes the token was delated as well as credentials.json

import { test, expect, request, chromium } from '@playwright/test';
import { waitForResetEmail, authenticate } from '../utils/gmailUtils';
import Mailosaur from 'mailosaur';


test('Reset password with Google API', async ({ page }) => {
  const auth = await authenticate();
  await page.goto('https://client.qa.finalis.com');
  await page.getByRole('link', { name: 'Reset password →' }).click();
  await page.fill('input[name="email"]', 'ob4wfirm@finalis.com');
  await page.getByRole('button', { name: 'Continue' }).click();

  const { html, resetUrl } =  await waitForResetEmail(auth);
  console.log('Reset link:', resetUrl);
 
  const browser = await chromium.launch();
  await browser.newPage();
  await page.setContent(`<html><body>${html}</body></html>`, { waitUntil: 'load' });
  await page.screenshot({ path: 'email-screenshot.png', fullPage: true });
  await browser.close();

   if (!resetUrl) {
    throw new Error('Reset link was not found in the email.');
  }
  await page.goto(resetUrl);
  await page.fill('input[name="password-reset"]', 'newSecurePassword123!');
  await page.fill('input[name="re-enter-password"]', 'newSecurePassword123!');
  await page.getByRole('button', { name: 'Reset password' }).click(); 
   
  await expect(page.locator('text=Password Changed!')).toBeVisible();
  
});

test('test mailosaur connection', async ({ page }) => {
  const MailosaurClient = require("mailosaur");
  const mailosaur = new MailosaurClient(""); // Complete with api key
  const result = await mailosaur.servers.list();
  console.log(`Inbox name is ${result.items[0].name}`);
  const latestMessage = result.items[0];

});


test('Reset password with Mailsour', async ({ page }) => {
  const apiKey = '' // Complete with api key
  const serverId = '' // Complete with server ID
  const mailosaur = new Mailosaur(apiKey);
  const emailAddress = '@.mailosaur.net'; // Complete with mail


  await page.goto('https://client.qa.finalis.com');
  await page.getByRole('link', { name: 'Reset password →' }).click();
  await page.fill('input[name="email"]', emailAddress);
  await page.getByRole('button', { name: 'Continue' }).click();

  const message = await mailosaur.messages.get(serverId, {
    sentTo: emailAddress,
    subject: 'Finalis Password Reset',
  });

  const resetUrl = message.html?.links?.[0]?.href;
  console.log(resetUrl)
  if (!resetUrl) {
  throw new Error('No reset link found in the email.');
  }
  const html = message.html?.body;
  if (!html) throw new Error('No HTML body found in the email.');

  const browser = await chromium.launch();
  page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: 'email-preview.png', fullPage: true });
  await browser.close();
  

  await page.goto(resetUrl);
  await page.fill('input[name="password-reset"]', 'newSecurePassword123!');
  await page.fill('input[name="re-enter-password"]', 'newSecurePassword123!');
  await page.getByRole('button', { name: 'Reset password' }).click(); 
     await expect(page.locator('text=Password Changed!')).toBeVisible();
  
});



