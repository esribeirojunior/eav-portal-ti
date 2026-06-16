async function check() {
  try {
    const res = await fetch('http://localhost:3001/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'assignments',
        filters: {}
      })
    });
    const result = await res.json();
    const assignments = result.data || [];
    
    console.log("=== Assignments mentioning Vinicius or Moulin ===");
    assignments.forEach(a => {
      if (a.user_name && (a.user_name.toLowerCase().includes('vinicius') || a.user_name.toLowerCase().includes('moulin'))) {
        console.log(JSON.stringify(a, null, 2));
      }
    });
  } catch (err) {
    console.error(err);
  }
}
check();
