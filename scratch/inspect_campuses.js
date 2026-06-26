import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'inventario.db');
const db = new Database(dbPath);

async function main() {
  try {
    const rows = db.prepare('SELECT * FROM devices').all();
    console.log(`Total devices in SQLite: ${rows.length}`);
    
    const campusMap = [];
    
    rows.forEach(d => {
      let hostname = d.hostname || 'Desconhecido';
      let ip = 'N/A';
      let loggedUser = 'N/A';
      let wifi = 'N/A';
      
      if (d.condition) {
        if (d.condition.includes('Hostname: ')) {
          hostname = d.condition.split('Hostname: ')[1].split(' |')[0];
        }
        if (d.condition.includes('IP: ')) {
          ip = d.condition.split('IP: ')[1].split(' |')[0];
        }
        if (d.condition.includes('Usuário Logado: ')) {
          loggedUser = d.condition.split('Usuário Logado: ')[1].split(' |')[0];
        }
        if (d.condition.includes('Wi-Fi: ')) {
          wifi = d.condition.split('Wi-Fi: ')[1].split(' |')[0];
        }
      }
      
      campusMap.push({
        id: d.id,
        tag: d.tag,
        model: d.model,
        hostname,
        ip,
        wifi,
        campus: d.campus || 'N/A'
      });
    });
    
    console.table(campusMap.slice(0, 30));
    
    // Check assignments for campuses
    const assigns = db.prepare('SELECT * FROM assignments').all();
    console.log(`\nTotal assignments in SQLite: ${assigns.length}`);
    
    const uniqueCampuses = [...new Set(assigns.map(a => a.campus))].filter(Boolean);
    console.log('Campuses found in assignments:', uniqueCampuses);
    
    // Group IPs by campus
    const ipGroups = {};
    campusMap.forEach(item => {
      // Find assignment campus if device campus is N/A
      let camp = item.campus;
      if (camp === 'N/A' || !camp) {
        const matchingAssign = assigns.find(a => String(a.device_id) === String(item.id));
        if (matchingAssign) {
          camp = matchingAssign.campus;
        }
      }
      if (!camp) camp = 'N/A';
      
      if (!ipGroups[camp]) ipGroups[camp] = [];
      if (item.ip && item.ip !== 'N/A') {
        ipGroups[camp].push({ ip: item.ip, wifi: item.wifi });
      }
    });
    
    console.log('\nIPs/Wi-Fi grouped by campus:');
    for (const [camp, entries] of Object.entries(ipGroups)) {
      console.log(`\nCampus: ${camp}`);
      const ips = entries.map(e => e.ip);
      const wifis = [...new Set(entries.map(e => e.wifi))];
      console.log(`Sample IPs: ${ips.slice(0, 10).join(', ')}`);
      console.log(`Wi-Fi networks: ${wifis.join(', ')}`);
      
      const subnets = ips.map(ip => ip.split('.').slice(0, 2).join('.') + '.x.x');
      const uniqueSubnets = [...new Set(subnets)];
      console.log(`Subnets: ${uniqueSubnets.join(', ')}`);
    }
    
  } catch (err) {
    console.error('Error querying local SQLite database:', err);
  }
}

main();
