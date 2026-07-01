
export enum UserRole {
  STUDENT = 'Aluno',
  TEACHER = 'Professor',
  COLLABORATOR = 'Colaborador'
}

export enum DeviceType {
  NOTEBOOK = 'Notebook',
  MACBOOK = 'MacBook',
  CHROMEBOOK = 'Chromebook',
  MONITOR = 'Monitor',
  HEADSET = 'Headset',
  MOUSE = 'Mouse',
  KEYBOARD = 'Teclado',
  KEYBOARD_MOUSE_KIT = 'Kit Teclado/mouse',
  ADAPTER = 'Adaptador',
  MINI_PC = 'Mini PC',
  TV = 'TV Corporativa',
  OTHER = 'Outro'
}

export enum DeviceStatus {
  AVAILABLE = 'Disponível',
  IN_USE = 'Em Uso',
  MAINTENANCE = 'Manutenção'
}

export interface TechnicalInspection {
  checklist: {
    screen: boolean;
    keyboard: boolean;
    battery: boolean;
    body: boolean;
    charger: boolean;
  };
  photo?: string;
  report?: string;
  date: string;
}

export interface Assignment {
  id: string;
  userName: string;
  userEmail?: string;
  userDepartment: string;
  userRole?: UserRole;
  startDate: string;
  endDate?: string;
  returnPhoto?: string;
  inspection?: TechnicalInspection;
  campus?: string;
}

export interface Device {
  id: string;
  tag: string; // Internal asset number
  serialNumber: string;
  model: string;
  type: DeviceType;
  status: DeviceStatus;
  currentAssignment?: Assignment;
  history: Assignment[];
  responsible?: string;
  department?: string;
  condition?: string;
  ip_address?: string;
}

export interface InventoryStats {
  total: number;
  available: number;
  inUse: number;
  byType: Record<DeviceType, number>;
}

export interface Shortcut {
  id: string;
  title: string;
  description: string;
  url: string;
  icon_name: string;
  color: string;
  campus?: string;
}

export type ModuleKey = 'assets' | 'links' | 'tasks' | 'vault' | 'tutorials' | 'lab' | 'signage';

export interface ITTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  created_by: string;
  created_at: string;
}

export interface ITTaskComment {
  id: string;
  task_id: string;
  user_email: string;
  content: string;
  created_at: string;
}

export interface BitwardenSecret {
  id: string;
  organizationId: string;
  key: string;
  value: string;
  note: string;
  creationDate: string;
  revisionDate: string;
  projectIds: string[];
}

export interface BitwardenProject {
  id: string;
  organizationId: string;
  name: string;
  creationDate: string;
  revisionDate: string;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  content: string; // Markdown content
  category: string;
  icon_name: string;
  video_url?: string;
  created_at: string;
}

