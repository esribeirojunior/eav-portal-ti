async function check() {
  try {
    const resDevices = await fetch('http://localhost:3001/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'devices',
        filters: {},
        orderCol: 'tag',
        orderAsc: true
      })
    });
    const resultDevices = await resDevices.json();
    const devices = resultDevices.data || [];

    const resAssignments = await fetch('http://localhost:3001/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'assignments',
        filters: {}
      })
    });
    const resultAssignments = await resAssignments.json();
    const assignments = resultAssignments.data || [];

    // Map active assignments to devices like App.tsx does
    const formattedData = devices.map(device => {
      const mappedHistory = assignments
        .filter(a => String(a.device_id) === String(device.id))
        .map(a => ({
          id: a.id,
          userName: a.user_name,
          userDepartment: a.department_id || 'N/A',
          userRole: a.user_role,
          grade: a.grade,
          startDate: a.assigned_at,
          endDate: a.returned_at,
          returnPhoto: a.return_photo_url,
          campus: a.campus
        }));

      const sortedHistory = mappedHistory.sort((a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );

      const activeAssignment = sortedHistory.find(a => !a.endDate);

      return {
        ...device,
        currentAssignment: activeAssignment || null,
        status: device.status
      };
    });

    const normalizeText = (text) => {
      return (text || '')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    };

    console.log("=== EQUIPAMENTOS COM CAMPUS 'Aeroporto/Alvares' (Compartilhados) ===");
    formattedData.forEach(d => {
      if (d.currentAssignment && normalizeText(d.currentAssignment.campus).includes('alvares') && normalizeText(d.currentAssignment.campus).includes('aeroporto')) {
        console.log(`- Tag: ${d.tag}`);
        console.log(`  Modelo: ${d.model}`);
        console.log(`  Responsável: ${d.currentAssignment.userName}`);
        console.log(`  Setor: ${d.currentAssignment.userDepartment}`);
        console.log(`  Campus na Planilha: "${d.currentAssignment.campus}"`);
        console.log(`-----------------------------------`);
      }
    });

  } catch (err) {
    console.error("Error:", err);
  }
}

check();
