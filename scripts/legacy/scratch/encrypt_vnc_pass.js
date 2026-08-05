import crypto from 'crypto';

function reverseBits(b) {
  let r = 0;
  for (let i = 0; i < 8; i++) {
    if ((b & (1 << i)) !== 0) {
      r |= (1 << (7 - i));
    }
  }
  return r;
}

function encryptVncPassword(password) {
  // Pad or truncate to 8 bytes
  const passBytes = Buffer.alloc(8, 0);
  Buffer.from(password.slice(0, 8), 'ascii').copy(passBytes);
  
  // Reverse bits of each byte
  const reversed = Buffer.alloc(8);
  for (let i = 0; i < 8; i++) {
    reversed[i] = reverseBits(passBytes[i]);
  }
  
  // VNC DES key: e8 4a d6 60 c4 72 1a e0
  const key = Buffer.from([0xe8, 0x4a, 0xd6, 0x60, 0xc4, 0x72, 0x1a, 0xe0]);
  
  const cipher = crypto.createCipheriv('des-ecb', key, null);
  cipher.setAutoPadding(false);
  const encrypted = Buffer.concat([cipher.update(reversed), cipher.final()]);
  
  return encrypted;
}

const pass = 'eav@2017';
const encrypted = encryptVncPassword(pass);
console.log('Password:', pass);
console.log('Hex hash:', encrypted.toString('hex').toUpperCase());
console.log('Decimal byte array:', JSON.stringify(Array.from(encrypted)));
