const http = require('http');

const postData = JSON.stringify({
  table: 'devices'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/db',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Total devices returned:', parsed.data ? parsed.data.length : 'error');
      if (parsed.data && parsed.data.length > 0) {
        // Find a device that is Em Uso
        const inUseDev = parsed.data.find(d => d.status === 'Em Uso');
        if (inUseDev) {
          console.log('\nSample in-use device:');
          console.log('ID:', inUseDev.id);
          console.log('Tag:', inUseDev.tag);
          console.log('Assignments:', JSON.stringify(inUseDev.assignments, null, 2));
        } else {
          console.log('No in use device found');
        }
      }
    } catch (e) {
      console.error('Failed to parse response:', e);
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
