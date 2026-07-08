const fs = require('fs');
const filePath = 'components/TasksModule.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add User icon import
content = content.replace(
  '    AlertOctagon\r\n} from \'lucide-react\';',
  '    AlertOctagon,\r\n    User\r\n} from \'lucide-react\';'
).replace(
  '    AlertOctagon\n} from \'lucide-react\';',
  '    AlertOctagon,\n    User\n} from \'lucide-react\';'
);

// 2. Add users state and newTaskAssignedTo state
content = content.replace(
  '    const [newTaskDueDate, setNewTaskDueDate] = useState(\'\');',
  '    const [newTaskDueDate, setNewTaskDueDate] = useState(\'\');\n    const [newTaskAssignedTo, setNewTaskAssignedTo] = useState(\'\');\n    const [systemUsers, setSystemUsers] = useState<any[]>([]);'
);

// 3. Update useEffect and fetchUsers
content = content.replace(
  '    useEffect(() => {\n        fetchTasks();\n    }, []);',
  '    useEffect(() => {\n        fetchTasks();\n        fetchSystemUsers();\n    }, []);\n\n    const fetchSystemUsers = async () => {\n        try {\n            const { data, error } = await apiClient.from(\'authorized_users\').select(\'email\');\n            if (data) setSystemUsers(data);\n        } catch (err) {}\n    };'
).replace(
  '    useEffect(() => {\r\n        fetchTasks();\r\n    }, []);',
  '    useEffect(() => {\n        fetchTasks();\n        fetchSystemUsers();\n    }, []);\n\n    const fetchSystemUsers = async () => {\n        try {\n            const { data, error } = await apiClient.from(\'authorized_users\').select(\'email\');\n            if (data) setSystemUsers(data);\n        } catch (err) {}\n    };'
);

// 4. Update handleCreateTask to include assigned_to
content = content.replace(
  '                    due_date: newTaskDueDate || null,\n                    created_by: userEmail,\n                    status: \'pending\'\n                }]);',
  '                    due_date: newTaskDueDate || null,\n                    created_by: userEmail,\n                    assigned_to: newTaskAssignedTo || null,\n                    status: \'pending\'\n                }]);'
).replace(
  '                    due_date: newTaskDueDate || null,\r\n                    created_by: userEmail,\r\n                    status: \'pending\'\r\n                }]);',
  '                    due_date: newTaskDueDate || null,\n                    created_by: userEmail,\n                    assigned_to: newTaskAssignedTo || null,\n                    status: \'pending\'\n                }]);'
);

content = content.replace(
  '            setNewTaskDueDate(\'\');\n            fetchTasks();',
  '            setNewTaskDueDate(\'\');\n            setNewTaskAssignedTo(\'\');\n            fetchTasks();'
).replace(
  '            setNewTaskDueDate(\'\');\r\n            fetchTasks();',
  '            setNewTaskDueDate(\'\');\n            setNewTaskAssignedTo(\'\');\n            fetchTasks();'
);

// 5. Add handleAssignTask
content = content.replace(
  '    const handleUpdateStatus = async (taskId: string, newStatus: string) => {',
  '    const handleAssignTask = async (taskId: string, assignedTo: string) => {\n        try {\n            const { error } = await apiClient.from(\'it_tasks\').update({ assigned_to: assignedTo || null }).eq(\'id\', taskId);\n            if (error) throw error;\n            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assigned_to: assignedTo || undefined } : t));\n            if (selectedTask && selectedTask.id === taskId) {\n                setSelectedTask(prev => prev ? { ...prev, assigned_to: assignedTo || undefined } : null);\n            }\n        } catch (err) {\n            console.error(\'Error assigning task:\', err);\n        }\n    };\n\n    const handleUpdateStatus = async (taskId: string, newStatus: string) => {'
);

// 6. Add "Meus Chamados" logic to filteredTasks
content = content.replace(
  '    const filteredTasks = React.useMemo(() => {\n        return tasks.filter(t => {\n            if (filterStatus === \'all\') return true;\n            return t.status === filterStatus;\n        });\n    }, [tasks, filterStatus]);',
  '    const filteredTasks = React.useMemo(() => {\n        return tasks.filter(t => {\n            if (filterStatus === \'all\') return true;\n            if (filterStatus === \'mine\') return t.assigned_to === userEmail || t.created_by === userEmail;\n            return t.status === filterStatus;\n        });\n    }, [tasks, filterStatus, userEmail]);'
).replace(
  '    const filteredTasks = React.useMemo(() => {\r\n        return tasks.filter(t => {\r\n            if (filterStatus === \'all\') return true;\r\n            return t.status === filterStatus;\r\n        });\r\n    }, [tasks, filterStatus]);',
  '    const filteredTasks = React.useMemo(() => {\n        return tasks.filter(t => {\n            if (filterStatus === \'all\') return true;\n            if (filterStatus === \'mine\') return t.assigned_to === userEmail || t.created_by === userEmail;\n            return t.status === filterStatus;\n        });\n    }, [tasks, filterStatus, userEmail]);'
);

// 7. Update header title
content = content.replace(
  '<h1 className="text-2xl font-[900] uppercase tracking-tighter">Tarefas TI</h1>',
  '<h1 className="text-2xl font-[900] uppercase tracking-tighter text-slate-800 dark:text-white leading-none">Gestão de Chamados</h1>'
);

// 8. Update filter buttons
content = content.replace(
  '                            { id: \'all\', label: \'Todas\' },\n                            { id: \'pending\', label: \'Pendentes\' },',
  '                            { id: \'all\', label: \'Todas\' },\n                            { id: \'mine\', label: \'Meus Chamados\' },\n                            { id: \'pending\', label: \'Pendentes\' },'
).replace(
  '                            { id: \'all\', label: \'Todas\' },\r\n                            { id: \'pending\', label: \'Pendentes\' },',
  '                            { id: \'all\', label: \'Todas\' },\n                            { id: \'mine\', label: \'Meus Chamados\' },\n                            { id: \'pending\', label: \'Pendentes\' },'
);

// 9. Show responsible in list card (ADDED MISSING DIV!)
content = content.replace(
  '                                        {task.status === \'in_progress\' ? \'Em Progresso\' : task.status === \'pending\' ? \'Pendente\' : task.status === \'completed\' ? \'Concluído\' : \'Bloqueado\'}\n                                        </span>\n                                    </div>\n                                    {task.due_date && (',
  '                                        {task.status === \'in_progress\' ? \'Em Progresso\' : task.status === \'pending\' ? \'Pendente\' : task.status === \'completed\' ? \'Concluído\' : \'Bloqueado\'}\n                                        </span>\n                                    </div>\n                                    <div className="flex gap-2 items-center">\n                                    {task.assigned_to && (\n                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-white/5 rounded-md text-[10px]" title={`Responsável: ${task.assigned_to}`}>\n                                            <User size={12} className="text-indigo-500" />\n                                            <span className="truncate max-w-[80px]">{task.assigned_to.split(\'@\')[0]}</span>\n                                        </div>\n                                    )}\n                                    {task.due_date && ('
).replace(
  '                                        {task.status === \'in_progress\' ? \'Em Progresso\' : task.status === \'pending\' ? \'Pendente\' : task.status === \'completed\' ? \'Concluído\' : \'Bloqueado\'}\r\n                                        </span>\r\n                                    </div>\r\n                                    {task.due_date && (',
  '                                        {task.status === \'in_progress\' ? \'Em Progresso\' : task.status === \'pending\' ? \'Pendente\' : task.status === \'completed\' ? \'Concluído\' : \'Bloqueado\'}\n                                        </span>\n                                    </div>\n                                    <div className="flex gap-2 items-center">\n                                    {task.assigned_to && (\n                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-white/5 rounded-md text-[10px]" title={`Responsável: ${task.assigned_to}`}>\n                                            <User size={12} className="text-indigo-500" />\n                                            <span className="truncate max-w-[80px]">{task.assigned_to.split(\'@\')[0]}</span>\n                                        </div>\n                                    )}\n                                    {task.due_date && ('
);

// ADD THE CLOSING DIV FOR THE FLEX GAP-2 ITEMS-CENTER
content = content.replace(
  '                                    )}\n                                </div>\n                            </div>\n                        ))\n                    )}',
  '                                    )}\n                                    </div>\n                                </div>\n                            </div>\n                        ))\n                    )}'
).replace(
  '                                    )}\r\n                                </div>\r\n                            </div>\r\n                        ))\r\n                    )}',
  '                                    )}\n                                    </div>\n                                </div>\n                            </div>\n                        ))\n                    )}'
);

// 10. Show responsible in detail view (and allow editing)
content = content.replace(
  '                                    <div className="space-y-1">\n                                        <p className="text-[10px] uppercase tracking-widest text-slate-700 dark:text-white/30 font-bold">Criado por</p>\n                                        <p className="text-xs text-slate-700 dark:text-white/70">{selectedTask.created_by}</p>\n                                    </div>',
  '                                    <div className="space-y-1">\n                                        <p className="text-[10px] uppercase tracking-widest text-slate-700 dark:text-white/30 font-bold">Criado por</p>\n                                        <p className="text-xs text-slate-700 dark:text-white/70">{selectedTask.created_by}</p>\n                                    </div>\n                                    <div className="space-y-1 flex-1">\n                                        <p className="text-[10px] uppercase tracking-widest text-slate-700 dark:text-white/30 font-bold">Responsável</p>\n                                        <select \n                                            value={selectedTask.assigned_to || \'\'} \n                                            onChange={(e) => handleAssignTask(selectedTask.id, e.target.value)}\n                                            className="w-full bg-transparent border-b border-slate-400 dark:border-white/20 text-xs text-indigo-600 dark:text-indigo-400 font-bold pb-1 outline-none"\n                                        >\n                                            <option value="">Não Atribuído</option>\n                                            {systemUsers.map(u => (\n                                                <option key={u.email} value={u.email} className="bg-white dark:bg-slate-900">{u.email}</option>\n                                            ))}\n                                        </select>\n                                    </div>'
).replace(
  '                                    <div className="space-y-1">\r\n                                        <p className="text-[10px] uppercase tracking-widest text-slate-700 dark:text-white/30 font-bold">Criado por</p>\r\n                                        <p className="text-xs text-slate-700 dark:text-white/70">{selectedTask.created_by}</p>\r\n                                    </div>',
  '                                    <div className="space-y-1">\n                                        <p className="text-[10px] uppercase tracking-widest text-slate-700 dark:text-white/30 font-bold">Criado por</p>\n                                        <p className="text-xs text-slate-700 dark:text-white/70">{selectedTask.created_by}</p>\n                                    </div>\n                                    <div className="space-y-1 flex-1">\n                                        <p className="text-[10px] uppercase tracking-widest text-slate-700 dark:text-white/30 font-bold">Responsável</p>\n                                        <select \n                                            value={selectedTask.assigned_to || \'\'} \n                                            onChange={(e) => handleAssignTask(selectedTask.id, e.target.value)}\n                                            className="w-full bg-transparent border-b border-slate-400 dark:border-white/20 text-xs text-indigo-600 dark:text-indigo-400 font-bold pb-1 outline-none"\n                                        >\n                                            <option value="">Não Atribuído</option>\n                                            {systemUsers.map(u => (\n                                                <option key={u.email} value={u.email} className="bg-white dark:bg-slate-900">{u.email}</option>\n                                            ))}\n                                        </select>\n                                    </div>'
);

// 11. New task assigned_to select
content = content.replace(
  '                                <div className="space-y-2">\n                                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-700 dark:text-white/50">Prazo (Opcional)</label>',
  '                                <div className="space-y-2">\n                                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-700 dark:text-white/50">Atribuir para (Opcional)</label>\n                                    <select\n                                        className="w-full bg-white dark:bg-white/5 border border-slate-400 dark:border-white/10 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all appearance-none"\n                                        value={newTaskAssignedTo}\n                                        onChange={e => setNewTaskAssignedTo(e.target.value)}\n                                    >\n                                        <option value="" className="bg-white dark:bg-[#1a1b3b]">Não atribuir agora</option>\n                                        {systemUsers.map(u => (\n                                            <option key={u.email} value={u.email} className="bg-white dark:bg-[#1a1b3b]">{u.email}</option>\n                                        ))}\n                                    </select>\n                                </div>\n                                <div className="space-y-2">\n                                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-700 dark:text-white/50">Prazo (Opcional)</label>'
).replace(
  '                                <div className="space-y-2">\r\n                                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-700 dark:text-white/50">Prazo (Opcional)</label>',
  '                                <div className="space-y-2">\n                                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-700 dark:text-white/50">Atribuir para (Opcional)</label>\n                                    <select\n                                        className="w-full bg-white dark:bg-white/5 border border-slate-400 dark:border-white/10 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all appearance-none"\n                                        value={newTaskAssignedTo}\n                                        onChange={e => setNewTaskAssignedTo(e.target.value)}\n                                    >\n                                        <option value="" className="bg-white dark:bg-[#1a1b3b]">Não atribuir agora</option>\n                                        {systemUsers.map(u => (\n                                            <option key={u.email} value={u.email} className="bg-white dark:bg-[#1a1b3b]">{u.email}</option>\n                                        ))}\n                                    </select>\n                                </div>\n                                <div className="space-y-2">\n                                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-700 dark:text-white/50">Prazo (Opcional)</label>'
);

// 12. Adjust grid columns from grid-cols-2 to grid-cols-3 in New task modal
content = content.replace(
  '                            <div className="grid grid-cols-2 gap-4">',
  '                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('TasksModule.tsx updated!');
