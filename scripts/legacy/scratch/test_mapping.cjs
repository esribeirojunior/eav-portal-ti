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
      const devicesData = parsed.data || [];
      
      const formattedData = devicesData.map((device) => {
        const mappedHistory = (device.assignments || []).map((a) => ({
          id: a.id,
          userName: a.user_name,
          userDepartment: a.department?.name || 'N/A',
          userRole: a.user_role,
          userGrade: a.grade,
          startDate: a.assigned_at,
          endDate: a.returned_at,
          returnPhoto: a.return_photo_url,
          campus: a.campus
        }));

        const sortedHistory = mappedHistory.sort((a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );

        const activeAssignment = sortedHistory.find((a) => !a.endDate);

        return {
          id: device.id,
          tag: device.tag,
          status: device.status,
          currentAssignment: activeAssignment || null,
          department: activeAssignment ? activeAssignment.userDepartment : '-'
        };
      });

      const inUse = formattedData.filter(d => d.status === 'Em Uso');
      console.log('In Use Devices mapped count:', inUse.length);
      inUse.forEach(d => {
        console.log(`Device Tag: ${d.tag}, Department field: ${d.department}, currentAssignment.userDepartment: ${d.currentAssignment?.userDepartment}`);
      });
      
    } catch (e) {
      console.error(e);
    }
  });
});

req.write(postData);
req.end();
