async function check() {
  try {
    const res = await fetch('http://localhost:3001/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'devices',
        filters: { id: 'ujchwx2' }
      })
    });
    const result = await res.json();
    console.log(JSON.stringify(result.data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
check();
