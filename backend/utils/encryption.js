// backend/utils/encryption.js
const crypto = require('crypto');
const ENCRYPTION_KEY = '12345678901234567890123456789012'; // 32 chars
const IV_LENGTH = 16;

function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  // Check if text is in the expected encrypted format
  let parts = text.split(':');
  if (parts.length < 2) {
    // Not encrypted, return as is
    return text;
  }
  
  let iv = Buffer.from(parts.shift(), 'hex');
  if (iv.length !== 16) {
    // Invalid IV length, return as is
    return text;
  }
  
  let encryptedText = Buffer.from(parts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

module.exports = { encrypt, decrypt };
