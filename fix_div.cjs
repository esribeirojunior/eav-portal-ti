const fs = require('fs');
const filePath = 'components/TasksModule.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  '                                    {task.due_date && (\r\n                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-white/5 rounded-md text-[10px]">\r\n                                            <Calendar size={12} />\r\n                                            <span>{new Date(task.due_date).toLocaleDateString(\\'pt-BR\\')}</span>\r\n                                        </div>\r\n                                    )}\r\n                                </div>\r\n                            </div>\r\n                        ))\r\n                    )}',
  '                                    {task.due_date && (\r\n                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-white/5 rounded-md text-[10px]">\r\n                                            <Calendar size={12} />\r\n                                            <span>{new Date(task.due_date).toLocaleDateString(\\'pt-BR\\')}</span>\r\n                                        </div>\r\n                                    )}\r\n                                    </div>\r\n                                </div>\r\n                            </div>\r\n                        ))\r\n                    )}'
).replace(
  '                                    {task.due_date && (\n                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-white/5 rounded-md text-[10px]">\n                                            <Calendar size={12} />\n                                            <span>{new Date(task.due_date).toLocaleDateString(\'pt-BR\')}</span>\n                                        </div>\n                                    )}\n                                </div>\n                            </div>\n                        ))\n                    )}',
  '                                    {task.due_date && (\n                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-white/5 rounded-md text-[10px]">\n                                            <Calendar size={12} />\n                                            <span>{new Date(task.due_date).toLocaleDateString(\'pt-BR\')}</span>\n                                        </div>\n                                    )}\n                                    </div>\n                                </div>\n                            </div>\n                        ))\n                    )}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed missing closing div');
