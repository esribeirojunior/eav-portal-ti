const fs = require('fs');
const filePath = 'App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const startIdx = content.indexOf('  // Filtra fora');
const endIdx = content.indexOf('  if (!isAuthenticated && sharedTutorialId) {');

const oldBlock = content.substring(startIdx, endIdx);

const newBlock = [
  "  // Filtra fora acessórios virtuais (criados pela Entrega Rápida) da listagem e contagem geral do inventário",
  "  const activeDevices = devices.filter(d => !(d.serialNumber || '').startsWith('ACESSÓRIO'));",
  "",
  "  const searchedDevices = activeDevices.filter(d => {",
  "    const term = searchQuery.toLowerCase();",
  "    return (d.tag || '').toLowerCase().includes(term) ||",
  "           (d.model || '').toLowerCase().includes(term) ||",
  "           (d.serialNumber || '').toLowerCase().includes(term) ||",
  "           (d.responsible || '').toLowerCase().includes(term) ||",
  "           (d.currentAssignment?.userName || '').toLowerCase().includes(term);",
  "  });",
  "",
  "  const triageDevicesForStats = searchedDevices.filter(d => d.condition && d.condition.includes('Sistema:') && !d.custom_department && !d.currentAssignment);",
  "  const availableDevicesForStats = searchedDevices.filter(d => d.status === DeviceStatus.AVAILABLE && !triageDevicesForStats.find(t => t.id === d.id));",
  "  const inUseDevicesForStats = searchedDevices.filter(d => d.status === DeviceStatus.IN_USE && !triageDevicesForStats.find(t => t.id === d.id));",
  "  const maintenanceDevicesForStats = searchedDevices.filter(d => d.status === DeviceStatus.MAINTENANCE && !triageDevicesForStats.find(t => t.id === d.id));",
  "",
  "  const stats = {",
  "    total: searchedDevices.length,",
  "    available: availableDevicesForStats.length,",
  "    inUse: inUseDevicesForStats.length,",
  "    maintenance: maintenanceDevicesForStats.length,",
  "    triage: triageDevicesForStats.length,",
  "  };",
  "",
  "  const filteredDevices = searchedDevices.filter(d => {",
  "    const matchesCategory =",
  "      selectedCategory === 'Todos' ? true :",
  "        selectedCategory === 'Manutenção' ? d.status === DeviceStatus.MAINTENANCE :",
  "          (d.type || '').toLowerCase() === selectedCategory.toLowerCase();",
  "",
  "    const matchesCampus =",
  "      selectedCampus === 'Todos' ? true :",
  "      selectedCampus === 'Álvares / Aeroporto' ? (",
  "        d.currentAssignment ? (",
  "          normalizeText(d.currentAssignment.campus).includes('alvares') &&",
  "          normalizeText(d.currentAssignment.campus).includes('aeroporto')",
  "        ) : false",
  "      ) :",
  "      selectedCampus === 'Álvares' ? (",
  "        d.currentAssignment ? (",
  "          normalizeText(d.currentAssignment.campus).includes('alvares') &&",
  "          !normalizeText(d.currentAssignment.campus).includes('aeroporto')",
  "        ) : false",
  "      ) :",
  "      selectedCampus === 'Aeroporto' ? (",
  "        d.currentAssignment ? (",
  "          normalizeText(d.currentAssignment.campus).includes('aeroporto') &&",
  "          !normalizeText(d.currentAssignment.campus).includes('alvares')",
  "        ) : false",
  "      ) : false;",
  "",
  "    return matchesCategory && matchesCampus;",
  "  });",
  ""
].join('\n');

content = content.replace(oldBlock, newBlock);
fs.writeFileSync(filePath, content, 'utf8');
console.log('App.tsx updated successfully');
