#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import webpush from 'web-push';

const envPath = path.resolve(process.cwd(), '.env');

function writeEnv(updates) {
  let content = '';
  try {
    content = fs.readFileSync(envPath, 'utf8');
  } catch (e) {
    content = '';
  }

  Object.keys(updates).forEach(k => {
    const re = new RegExp(`^${k}=.*$`, 'm');
    if (re.test(content)) {
      content = content.replace(re, `${k}=${updates[k]}`);
    } else {
      content += `\n${k}=${updates[k]}`;
    }
  });

  fs.writeFileSync(envPath, content, 'utf8');
  console.log('Wrote keys to', envPath);
}

const keys = webpush.generateVAPIDKeys();
console.log('VAPID keys generated:');
console.log(keys);

const updates = {
  VAPID_PUBLIC_KEY: keys.publicKey,
  VAPID_PRIVATE_KEY: keys.privateKey,
  VAPID_SUBJECT: 'mailto:admin@example.com'
};

writeEnv(updates);
console.log('Done.');
