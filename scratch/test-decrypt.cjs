const crypto = require('crypto');

function reverseBits(b) {
    let r = 0;
    for (let i = 0; i < 8; i++) {
        if ((b & (1 << i)) !== 0) {
            r |= (1 << (7 - i));
        }
    }
    return r;
}

function reverseBuffer(buf) {
    const rev = Buffer.alloc(buf.length);
    for (let i = 0; i < buf.length; i++) {
        rev[i] = reverseBits(buf[i]);
    }
    return rev;
}

const keyHex = 'e84ad660c4721ae0';
const key = Buffer.from(keyHex, 'hex');

function decryptVncPassword(encryptedHex) {
    try {
        const encrypted = Buffer.from(encryptedHex, 'hex');
        
        // Decrypt using DES-ECB
        const decipher = crypto.createDecipheriv('des-ecb', key, null);
        decipher.setAutoPadding(false);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        
        // Reverse bits of the decrypted plaintext to get the final password
        const finalPass = reverseBuffer(decrypted);
        return finalPass.toString('utf-8');
    } catch (e) {
        return 'ERROR: ' + e.message;
    }
}

console.log('Decrypted value of c4eabc3abf000050:', JSON.stringify(decryptVncPassword('c4eabc3abf000050')));
console.log('Decrypted value of 1ffda5eeb38f5f4f:', JSON.stringify(decryptVncPassword('1ffda5eeb38f5f4f')));
