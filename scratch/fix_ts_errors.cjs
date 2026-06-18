const fs = require('fs');
let txt = fs.readFileSync('App.tsx', 'utf-8');

// Dashboard fix
txt = txt.replace(/<Dashboard[\s\S]*?onAction=\{[\s\S]*?\}\s*\/>/m, `<Dashboard 
                      stats={stats} 
                      devices={devices}
                      userEmail={userEmail}
                      onBack={() => setCurrentModule('selector')}
                      onLogout={handleLogout}
                    />`);

// DeviceList fix
txt = txt.replace(/onViewHistory/g, "onHistory");

// DeviceModal fix
txt = txt.replace(/<DeviceModal\s+onClose/g, "<DeviceModal isOpen={true} userEmail={userEmail} onClose");

// AssignmentModal fix
txt = txt.replace(/<AssignmentModal\s+device/g, "<AssignmentModal isOpen={true} userEmail={userEmail} device");

// ReturnModal fix
txt = txt.replace(/<ReturnModal\s+device/g, "<ReturnModal isOpen={true} device");

// HistoryModal fix
txt = txt.replace(/<HistoryModal\s+device/g, "<HistoryModal isOpen={true} device");

// InspectionModal fix
txt = txt.replace(/<InspectionModal\s+device/g, "<InspectionModal isOpen={true} device");

// AccessoryModal fix
txt = txt.replace(/<AccessoryModal\s+onClose/g, "<AccessoryModal isOpen={true} userEmail={userEmail} onClose");

fs.writeFileSync('App.tsx', txt);
console.log('Fixed typescript errors');
