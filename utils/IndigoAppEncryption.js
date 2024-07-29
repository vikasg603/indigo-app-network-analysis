const crypto = require('crypto');

class IndiGoAppEncryption {
    constructor(encryptionKey, encryptionIv) {
        this.encryptionKey = encryptionKey;
        this.encryptionIv = encryptionIv;
    }

    encrypt(plainText) {
        const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, this.encryptionIv);
        cipher.setAutoPadding(true);
        let encrypted = cipher.update(plainText, 'utf-8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    }
    
    decrypt(encryptedText) {
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, this.encryptionIv);
        decipher.setAutoPadding(true);
        let decrypted = decipher.update(encryptedText, 'base64', 'utf-8');
        decrypted += decipher.final('utf-8');
        return decrypted;
    }
}

module.exports = IndiGoAppEncryption;