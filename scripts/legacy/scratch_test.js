import fetch from 'node-fetch';

async function run() {
  const token = 'ANY'; // /api/db auth is tricky if not localhost.
  // Wait, if I run this script on MY machine, IP is not localhost for the VPS. 
  // BUT the script needs to run ON the server.
}
run();
