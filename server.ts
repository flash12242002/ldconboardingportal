import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Database mock with file persistence
const DB_FILE = path.join(process.cwd(), 'onboard_db.json');

// Default HR admin accounts as specified in the requirements with custom password support
let hrAdmins: any[] = [
  { email: 'gordon.huang@ldchotels.com', password: 'mis' },
  { email: 'vivian.chiang@ldchotels.com', password: 'mis' }
];

// Helper to normalize legacy string admins to objects
function getNormalizedAdmins(): { email: string; password: string; permissions?: string[] }[] {
  return hrAdmins.map(admin => {
    if (typeof admin === 'string') {
      const email = admin.toLowerCase().trim();
      return { 
        email, 
        password: 'mis',
        permissions: email === 'gordon.huang@ldchotels.com' 
          ? ['admin', 'tracker', 'publish', 'ai', 'audit'] 
          : ['tracker', 'publish', 'ai']
      };
    }
    const email = (admin.email || '').toLowerCase().trim();
    return {
      email,
      password: admin.password || 'mis',
      permissions: admin.permissions || (
        email === 'gordon.huang@ldchotels.com' 
          ? ['admin', 'tracker', 'publish', 'ai', 'audit'] 
          : ['tracker', 'publish', 'ai']
      )
    };
  });
}

// Memory store for forgot password tokens
let forgotPasswordTokens: Record<string, { email: string; expires: number }> = {};

interface Employee {
  id: string;
  empId?: string;
  name: string;
  email: string;
  authToken: string;
  department: string;
  title: string;
  onboardDate: string;
  status: 'pending' | 'completed';
  progress: number;
  personalData?: any;
  careerData?: any;
  uploadedFiles: any[];
  rulesAgreed: boolean;
  privacyAgreed: boolean;
  contractSigned: boolean;
  contractDate?: string;
  contractWorkLocation?: string;
  contractLeaveOption?: string;
  contractLeavedays?: string;
  contractSalaryType?: string;
  contractSalaryAmount?: string;
  contractProbationMonths?: string;
  taxDeclaration?: any;
  guarantorSigned?: boolean;
  guarantorDate?: string;
  guarantorData?: any;
  serviceSigned?: boolean;
  serviceDate?: string;
  updatedAt: string;
}

let employees: Employee[] = [
  {
    id: 'emp_001',
    name: 'Alex 陳',
    email: 'alex.chen@example.com',
    authToken: 'LDC888',
    department: '君品酒店 - 餐飲部',
    title: '餐飲領班',
    onboardDate: '2026-06-15',
    status: 'pending',
    progress: 15,
    uploadedFiles: [],
    rulesAgreed: false,
    privacyAgreed: false,
    contractSigned: false,
    contractWorkLocation: '君品酒店 (台北) (台北市承德路一段3號)',
    contractLeaveOption: 'biweekly',
    contractLeavedays: '8',
    contractSalaryType: 'monthly',
    contractSalaryAmount: '36,000',
    contractProbationMonths: '三',
    updatedAt: new Date().toISOString(),
    personalData: {
      name: 'Alex 陳',
      idNumber: 'A123456789',
      birthday: '1998-05-12',
      gender: '男',
      phone: '0912-345-678',
      email: 'alex.chen@example.com',
      legalAddress: '台北市大安區新生南路三段 10 號',
      contactAddress: '台北市大安區新生南路三段 10 號',
      bankName: '兆豐國際商業銀行',
      bankAccount: '017123456789',
      dependentsCount: '0 人',
      emergencyName: '陳大同',
      emergencyRelationship: '父親',
      emergencyPhone: '0988-765-432'
    }
  },
  {
    id: 'emp_002',
    name: 'Sophia 林',
    email: 'sophia.lin@example.com',
    authToken: 'LDC999',
    department: '雲品溫泉酒店 - 客房部',
    title: '尊榮客務接待專員',
    onboardDate: '2026-07-01',
    status: 'pending',
    progress: 0,
    uploadedFiles: [],
    rulesAgreed: false,
    privacyAgreed: false,
    contractSigned: false,
    contractWorkLocation: '雲品溫泉酒店 (日月潭) (南投縣魚池鄉中正路23號)',
    contractLeaveOption: 'weekly',
    contractLeavedays: '8',
    contractSalaryType: 'monthly',
    contractSalaryAmount: '36,000',
    contractProbationMonths: '三',
    updatedAt: new Date().toISOString()
  }
];

interface ActivityLog {
  id: string;
  operatorEmail: string;
  operatorName: string;
  employeeName: string;
  actionType: string;
  details: string;
  timestamp: string;
}

let activityLogs: ActivityLog[] = [];

// Load from disk if exists
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed.hrAdmins) {
        hrAdmins = parsed.hrAdmins.map((admin: any) => {
          if (typeof admin === 'string') {
            return { email: admin.toLowerCase().trim(), password: 'mis' };
          }
          return {
            email: (admin.email || '').toLowerCase().trim(),
            password: admin.password || 'mis',
            permissions: admin.permissions
          };
        });
      }
      if (parsed.employees) employees = parsed.employees;
      if (parsed.activityLogs) activityLogs = parsed.activityLogs;
      console.log('Database loaded successfully.');
      cleanOldLogs();
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.error('Error loading database:', err);
  }
}

function cleanOldLogs() {
  const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
  const originalLength = activityLogs.length;
  activityLogs = activityLogs.filter(log => {
    const logTime = new Date(log.timestamp).getTime();
    return logTime >= fifteenDaysAgo;
  });
  if (activityLogs.length !== originalLength) {
    console.log(`Cleaned ${originalLength - activityLogs.length} activity logs older than 15 days.`);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify({ hrAdmins, employees, activityLogs }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

function logActivity(req: express.Request, employeeName: string, actionType: string, details: string) {
  const operatorEmail = (req.headers['x-operator-email'] as string) || '';
  let operatorName = (req.headers['x-operator-name'] as string) || '';
  
  if (operatorName) {
    try {
      operatorName = decodeURIComponent(operatorName);
    } catch (e) {
      // ignore decoding error if it is already regular string
    }
  }

  const newLog: ActivityLog = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    operatorEmail: operatorEmail.trim() || 'system@ldchotels.com',
    operatorName: operatorName.trim() || '系統管理員',
    employeeName: employeeName ? employeeName.trim() : '全體項目',
    actionType,
    details: details.trim(),
    timestamp: new Date().toISOString()
  };

  activityLogs.unshift(newLog);
  cleanOldLogs();
  saveDatabase();
}

loadDatabase();

// Initialize Server-Side Gemini API
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini AI Client initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini AI Client:', err);
  }
}

// APIs
// 1. Auth Login Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, authToken } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: '請輸入電子郵件' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if is HR Admin first
  const normalizedAdmins = getNormalizedAdmins();
  const adminObj = normalizedAdmins.find(admin => admin.email === normalizedEmail);
  if (adminObj) {
    const expectedPassword = adminObj.password || 'mis';
    if (!authToken || authToken.trim() !== expectedPassword) {
      return res.status(400).json({ error: 'HR 密碼不正確' });
    }
    return res.json({
      role: 'hr',
      user: { email: normalizedEmail, name: normalizedEmail === 'gordon.huang@ldchotels.com' ? 'Gordon (主要負責人)' : 'HR 負責人' },
      employees: employees
    });
  }

  // Check if is Employee
  if (!authToken) {
    return res.status(400).json({ error: '電子郵件未授權，請再次確認' });
  }

  const employee = employees.find(
    emp => emp.email.toLowerCase() === normalizedEmail && emp.authToken.trim() === authToken.trim()
  );

  if (employee) {
    return res.json({
      role: 'employee',
      user: employee
    });
  }

  return res.status(401).json({ error: '登入失敗，電子郵件或授權碼不正確' });
});

// 2. HR Endpoints
// Get all activity logs
app.get('/api/hr/activity-logs', (req, res) => {
  cleanOldLogs();
  saveDatabase();
  return res.json(activityLogs || []);
});

// Get all employees
app.get('/api/hr/employees', (req, res) => {
  return res.json(employees);
});

// Create single employee
app.post('/api/hr/employees', (req, res) => {
  const { 
    name, 
    email, 
    authToken, 
    department, 
    title, 
    onboardDate,
    empId,
    contractWorkLocation,
    contractLeaveOption,
    contractLeavedays,
    contractSalaryType,
    contractSalaryAmount,
    contractProbationMonths
  } = req.body;
  
  if (!name || !email || !authToken || !department || !title || !onboardDate) {
    return res.status(400).json({ error: '所有欄位均為必填' });
  }

  const exists = employees.some(emp => emp.email.toLowerCase() === email.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ error: '此電子郵件已存在於新進同仁名單中' });
  }

  const newEmp: Employee = {
    id: 'emp_' + Date.now(),
    empId: empId ? empId.trim() : '',
    name: name.trim(),
    email: email.trim().toLowerCase(),
    authToken: authToken.trim(),
    department: department.trim(),
    title: title.trim(),
    onboardDate: onboardDate,
    status: 'pending',
    progress: 0,
    uploadedFiles: [],
    rulesAgreed: false,
    privacyAgreed: false,
    contractSigned: false,
    contractWorkLocation: contractWorkLocation || '君品酒店 (台北市承德路一段3號)',
    contractLeaveOption: contractLeaveOption || 'biweekly',
    contractLeavedays: contractLeavedays || '8',
    contractSalaryType: contractSalaryType || 'monthly',
    contractSalaryAmount: contractSalaryAmount || '36,000',
    contractProbationMonths: contractProbationMonths || '三',
    updatedAt: new Date().toISOString()
  };

  employees.push(newEmp);
  logActivity(req, newEmp.name, 'CREATE_EMPLOYEE', `新增新進同仁: ${newEmp.name} (${newEmp.department} - ${newEmp.title})`);
  saveDatabase();
  return res.json({ message: '成功新增新進同仁', employee: newEmp, employees });
});

// Delete individual employee
app.delete('/api/hr/employees/:id', (req, res) => {
  const { id } = req.params;
  const index = employees.findIndex(emp => emp.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '找不到該同仁資料' });
  }

  const emp = employees[index];
  const empName = emp.name;
  employees.splice(index, 1);
  logActivity(req, empName, 'DELETE_EMPLOYEE', `刪除同仁資料: ${empName} (${emp.department})`);
  saveDatabase();
  return res.json({ message: '成功刪除同仁資料', employees });
});

// Reject / Return employee onboarding to fill state (Reset signatures but keep text fields)
app.post('/api/hr/employees/:id/reject', (req, res) => {
  const { id } = req.params;
  const empIndex = employees.findIndex(emp => emp.id === id);
  if (empIndex === -1) {
    return res.status(404).json({ error: '找不到該同仁資料' });
  }

  const emp = employees[empIndex];
  emp.status = 'pending';
  emp.contractSigned = false;
  emp.rulesAgreed = false;
  emp.privacyAgreed = false;
  emp.guarantorSigned = false;
  emp.serviceSigned = false;
  if (emp.taxDeclaration) {
    emp.taxDeclaration.signed = false;
  }

  // Recalculate progress across 8 parts:
  let newProgress = 0;
  if (emp.personalData && emp.personalData.name && emp.personalData.phone) {
    newProgress += 15;
  }
  if (emp.careerData && (emp.careerData.experiences?.length > 0 || emp.careerData.educations?.length > 0 || emp.careerData.licenses?.length > 0)) {
    newProgress += 15;
  }
  if (emp.uploadedFiles && emp.uploadedFiles.length > 0) {
    newProgress += 15;
  }
  if (emp.rulesAgreed && emp.privacyAgreed) {
    newProgress += 10;
  }
  if (emp.taxDeclaration && emp.taxDeclaration.signed) {
    newProgress += 15;
  }
  if (emp.contractSigned) {
    newProgress += 10;
  }
  if (emp.guarantorSigned) {
    newProgress += 10;
  }
  if (emp.serviceSigned) {
    newProgress += 10;
  }

  emp.progress = newProgress;
  emp.updatedAt = new Date().toISOString();
  
  employees[empIndex] = emp;
  logActivity(req, emp.name, 'REJECT_ONBOARDING', `將同仁報到退回開放修改: ${emp.name}`);
  saveDatabase();
  return res.json({ message: '已將同仁申請退回，開放修改', employee: emp, employees });
});

// Update employee ID (員工編號)
app.put('/api/hr/employees/:id/empid', (req, res) => {
  const { id } = req.params;
  const { empId } = req.body;
  const empIndex = employees.findIndex(emp => emp.id === id);
  if (empIndex === -1) {
    return res.status(404).json({ error: '找不到該同仁資料' });
  }

  const emp = employees[empIndex];
  const oldId = emp.empId || '未設定';
  const newId = empId ? empId.trim() : '';
  emp.empId = newId;
  emp.updatedAt = new Date().toISOString();
  logActivity(req, emp.name, 'UPDATE_EMP_ID', `更新同仁編號: "${oldId}" -> "${newId || '未設定'}"`);
  saveDatabase();
  return res.json({ message: '員工編號更新完成', employee: emp, employees });
});

// Update employee contract probation months (合約試用期)
app.put('/api/hr/employees/:id/probation', (req, res) => {
  const { id } = req.params;
  const { contractProbationMonths } = req.body;
  const empIndex = employees.findIndex(emp => emp.id === id);
  if (empIndex === -1) {
    return res.status(404).json({ error: '找不到該同仁資料' });
  }

  const emp = employees[empIndex];
  const oldProbation = emp.contractProbationMonths || '三';
  const newProbation = contractProbationMonths ? contractProbationMonths.trim() : '三';
  emp.contractProbationMonths = newProbation;
  emp.updatedAt = new Date().toISOString();
  logActivity(req, emp.name, 'UPDATE_PROBATION', `更新同仁試用期: "${oldProbation}" -> "${newProbation}"`);
  saveDatabase();
  return res.json({ message: '合約試用期更新完成', employee: emp, employees });
});

// Get HR Admins
app.get('/api/hr/admins', (req, res) => {
  const normalized = getNormalizedAdmins();
  const clientAdmins = normalized.map(admin => ({
    email: admin.email,
    permissions: admin.permissions || []
  }));
  return res.json(clientAdmins);
});

// Add HR Admin
app.post('/api/hr/admins', (req, res) => {
  const operatorEmail = decodeURIComponent(req.headers['x-operator-email'] as string || '').toLowerCase().trim();
  const normalized = getNormalizedAdmins();
  const operatorAdmin = normalized.find(a => a.email === operatorEmail);
  const operatorPermissions = operatorAdmin?.permissions || (
    operatorEmail === 'gordon.huang@ldchotels.com' 
      ? ['admin', 'tracker', 'publish', 'ai', 'audit'] 
      : ['tracker', 'publish', 'ai']
  );

  if (!operatorPermissions.includes('admin')) {
    return res.status(403).json({ error: '⚠️ 您的管理帳號並未附加「管理權限」(admin)，無法進行管理者帳號之新增！' });
  }

  const { email, permissions } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email 欄位不能為空' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const exists = normalized.some(admin => admin.email === cleanEmail);

  if (exists) {
    return res.status(400).json({ error: '此 Email 已是HR管理者之一' });
  }

  const finalPermissions = Array.isArray(permissions) && permissions.length > 0
    ? permissions
    : ['tracker', 'publish', 'ai'];

  hrAdmins.push({ 
    email: cleanEmail, 
    password: 'mis',
    permissions: finalPermissions
  });
  logActivity(req, '人資管理系統', 'ADD_ADMIN', `新增 HR 管理者: ${cleanEmail} (權限: ${finalPermissions.join(', ')})`);
  saveDatabase();

  const freshAdmins = getNormalizedAdmins().map(admin => ({
    email: admin.email,
    permissions: admin.permissions || []
  }));
  return res.json({ message: '成功新增HR管理者', hrAdmins: freshAdmins });
});

// Delete HR Admin
app.delete('/api/hr/admins', (req, res) => {
  const operatorEmail = decodeURIComponent(req.headers['x-operator-email'] as string || '').toLowerCase().trim();
  const targetEmail = (req.body.email || '').toLowerCase().trim();

  if (!targetEmail) {
    return res.status(400).json({ error: '⚠️ 請提供欲刪除的管理員信箱' });
  }

  // 1. Verify operator has 'admin' permission
  const normalized = getNormalizedAdmins();
  const operatorAdmin = normalized.find(a => a.email === operatorEmail);
  const operatorPermissions = operatorAdmin?.permissions || (
    operatorEmail === 'gordon.huang@ldchotels.com' 
      ? ['admin', 'tracker', 'publish', 'ai', 'audit'] 
      : ['tracker', 'publish', 'ai']
  );

  if (!operatorPermissions.includes('admin')) {
    return res.status(403).json({ error: '⚠️ 您的管理帳號並未附加「管理權限」(admin)，無法進行管理員帳號之刪除！' });
  }

  // 2. Prevent deleting Gordon
  if (targetEmail === 'gordon.huang@ldchotels.com') {
    return res.status(400).json({ error: '⚠️ 主要負責人 Gordon 黃 (gordon.huang@ldchotels.com) 為系統稽核核心帳戶，禁止刪除！' });
  }

  // 3. Prevent deleting themselves
  if (targetEmail === operatorEmail) {
    return res.status(400).json({ error: '⚠️ 為避免管理權限真空，群組帳號禁止刪除目前正在登入使用的帳戶！' });
  }

  // Find target in current hrAdmins
  const targetIdx = hrAdmins.findIndex(admin => {
    const email = typeof admin === 'string' ? admin.toLowerCase().trim() : (admin.email || '').toLowerCase().trim();
    return email === targetEmail;
  });

  if (targetIdx === -1) {
    return res.status(404).json({ error: '⚠️ 找不到欲刪除的管理員帳號' });
  }

  // Remove from hrAdmins list
  hrAdmins.splice(targetIdx, 1);
  logActivity(req, '人資管理系統', 'DELETE_ADMIN', `刪除 HR 管理者: ${targetEmail}`);
  saveDatabase();

  const freshAdmins = getNormalizedAdmins().map(admin => ({
    email: admin.email,
    permissions: admin.permissions || []
  }));
  return res.json({ message: '成功刪除 HR 管理者', hrAdmins: freshAdmins });
});

// Change Password Endpoint
app.post('/api/hr/change-password', (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  if (!email || !oldPassword || !newPassword) {
    return res.status(400).json({ error: '所有欄位均為必選填' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalized = getNormalizedAdmins();
  const adminIndex = normalized.findIndex(admin => admin.email === normalizedEmail);

  if (adminIndex === -1) {
    return res.status(404).json({ error: '找不到該管理員帳號' });
  }

  const currentPassword = normalized[adminIndex].password || 'mis';
  if (oldPassword !== currentPassword) {
    return res.status(400).json({ error: '目前密碼驗證不正確，變更失敗' });
  }

  if (newPassword.length < 3) {
    return res.status(400).json({ error: '新密碼長度至少需 3 個字元' });
  }

  // Update in official array
  hrAdmins[adminIndex] = {
    email: normalizedEmail,
    password: newPassword
  };

  logActivity(req, '人資管理系統', 'CHANGE_PASSWORD', `變更 HR 管理者密碼成功: ${normalizedEmail}`);
  saveDatabase();

  return res.json({ success: true, message: '密碼變更成功，請記住您的新密碼' });
});

// Request Forgot Password (Simulated Email reset link)
app.post('/api/hr/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: '請輸入電子郵件' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalized = getNormalizedAdmins();
  const exists = normalized.some(admin => admin.email === normalizedEmail);

  if (!exists) {
    return res.status(404).json({ error: '此電子郵件非授權之 HR 管理者，請與主要負責人聯絡' });
  }

  // Generate simple token: "tok_xxxx"
  const token = 'tok_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  
  // Save token in memory memory map (Expires in 30 minutes)
  forgotPasswordTokens[token] = {
    email: normalizedEmail,
    expires: Date.now() + 30 * 60 * 1000
  };

  // Construct standard HTTP link pointing to port 3000 web index
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const resetLink = `${protocol}://${host}/?reset_token=${token}`;

  console.log(`\n==========================================\n[模擬電子郵件通知 SMS / EMAIL SIMULATOR]\n==========================================\n收件者 (To): ${normalizedEmail}\n標題 (Subject): 雲朗集團人事系統 - HR管理者重設密碼信件\n內容 (Body):\n您好，請點選以下連結重設您的 HR 後台登入密碼（連結 30 分鐘內有效）：\n${resetLink}\n==========================================\n`);

  return res.json({
    success: true,
    message: '重設密碼信件已成功發送 (本系統已為您模擬收信通知)！',
    simulatedEmail: {
      to: normalizedEmail,
      subject: '雲朗集團人事系統 - HR管理者重設密碼信件',
      link: resetLink,
      token: token
    }
  });
});

// Confirm Password Reset with Token
app.post('/api/hr/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: '請提供重設 Token 與新密碼' });
  }

  const record = forgotPasswordTokens[token];
  if (!record) {
    return res.status(400).json({ error: '重設連結無效、或此連結已被使用過' });
  }

  if (Date.now() > record.expires) {
    delete forgotPasswordTokens[token];
    return res.status(400).json({ error: '此連結已過期，請重新申請重設密碼' });
  }

  const normalizedEmail = record.email.toLowerCase().trim();
  const normalized = getNormalizedAdmins();
  const adminIndex = normalized.findIndex(admin => admin.email === normalizedEmail);

  if (adminIndex === -1) {
    delete forgotPasswordTokens[token];
    return res.status(404).json({ error: '找不到該管理員帳號' });
  }

  if (newPassword.length < 3) {
    return res.status(400).json({ error: '密碼長度至少需 3 個字元' });
  }

  // Overwrite password
  hrAdmins[adminIndex] = {
    email: normalizedEmail,
    password: newPassword
  };

  // Burn token
  delete forgotPasswordTokens[token];

  logActivity(req, '人資管理系統', 'RESET_PASSWORD', `HR管理員依靠重設信完成重設密碼: ${normalizedEmail}`);
  saveDatabase();

  return res.json({ success: true, message: '密碼重設成功！請回到登入頁面並使用新密碼進行登入。' });
});

// 3. Employee Endpoints
// Save / Update employee onboarding progress & data
app.put('/api/employee/save', (req, res) => {
  const { id, personalData, careerData, rulesAgreed, privacyAgreed, taxDeclaration, contractSigned, contractDate, guarantorSigned, guarantorDate, guarantorData, serviceSigned, serviceDate } = req.body;
  
  const empIndex = employees.findIndex(emp => emp.id === id);
  if (empIndex === -1) {
    return res.status(404).json({ error: '找不到新進同仁資料' });
  }

  const emp = employees[empIndex];

  if (personalData !== undefined) emp.personalData = personalData;
  if (careerData !== undefined) emp.careerData = careerData;
  if (rulesAgreed !== undefined) emp.rulesAgreed = rulesAgreed;
  if (privacyAgreed !== undefined) emp.privacyAgreed = privacyAgreed;
  if (taxDeclaration !== undefined) emp.taxDeclaration = taxDeclaration;
  if (contractSigned !== undefined) emp.contractSigned = contractSigned;
  if (contractDate !== undefined) emp.contractDate = contractDate;
  if (guarantorSigned !== undefined) emp.guarantorSigned = guarantorSigned;
  if (guarantorDate !== undefined) emp.guarantorDate = guarantorDate;
  if (guarantorData !== undefined) emp.guarantorData = guarantorData;
  if (serviceSigned !== undefined) emp.serviceSigned = serviceSigned;
  if (serviceDate !== undefined) emp.serviceDate = serviceDate;

  // Recalculate progress across 8 parts summing to exactly 100%:
  // 1. PersonalData: 15%
  // 2. CareerData: 15%
  // 3. uploadedFiles length > 0: 15%
  // 4. rulesAgreed & privacyAgreed: 10%
  // 5. taxDeclaration signed: 15%
  // 6. contractSigned: 10%
  // 7. guarantorSigned: 10%
  // 8. serviceSigned: 10%
  let newProgress = 0;
  
  if (emp.personalData && emp.personalData.name && emp.personalData.phone) {
    newProgress += 15;
  }
  if (emp.careerData && (emp.careerData.experiences?.length > 0 || emp.careerData.educations?.length > 0 || emp.careerData.licenses?.length > 0)) {
    newProgress += 15;
  }
  if (emp.uploadedFiles && emp.uploadedFiles.length > 0) {
    newProgress += 15;
  }
  if (emp.rulesAgreed && emp.privacyAgreed) {
    newProgress += 10;
  }
  if (emp.taxDeclaration && emp.taxDeclaration.signed) {
    newProgress += 15;
  }
  if (emp.contractSigned) {
    newProgress += 10;
  }
  if (emp.guarantorSigned) {
    newProgress += 10;
  }
  if (emp.serviceSigned) {
    newProgress += 10;
  }

  emp.progress = newProgress;
  if (newProgress === 100) {
    emp.status = 'completed';
  } else {
    emp.status = 'pending';
  }

  emp.updatedAt = new Date().toISOString();
  employees[empIndex] = emp;
  saveDatabase();

  return res.json({ message: '草稿儲存成功', employee: emp });
});

// Upload verification documents (PDF file representation)
app.post('/api/employee/upload', (req, res) => {
  const { id, fileName, fileSize, base64Data, docType } = req.body;
  if (!id || !fileName || !fileSize) {
    return res.status(400).json({ error: '缺少上傳資訊' });
  }

  const empIndex = employees.findIndex(emp => emp.id === id);
  if (empIndex === -1) {
    return res.status(404).json({ error: '找不到該同仁資料' });
  }

  const emp = employees[empIndex];
  
  // Clean file representation
  const newFile = {
    name: fileName,
    size: fileSize,
    uploadedAt: new Date().toLocaleDateString('zh-TW', { hour12: false }),
    base64Data: base64Data || '',
    docType: docType || ''
  };

  // If we receive a docType, make sure we only keep one file for that docType
  if (docType) {
    emp.uploadedFiles = (emp.uploadedFiles || []).filter(f => f.docType !== docType);
  } else {
    emp.uploadedFiles = emp.uploadedFiles || [];
  }
  emp.uploadedFiles.push(newFile);
  
  // Recalculate progress across 8 parts:
  let newProgress = 0;
  if (emp.personalData && emp.personalData.name && emp.personalData.phone) newProgress += 15;
  if (emp.careerData && (emp.careerData.experiences?.length > 0 || emp.careerData.educations?.length > 0 || emp.careerData.licenses?.length > 0)) newProgress += 15;
  if (emp.uploadedFiles && emp.uploadedFiles.length > 0) newProgress += 15;
  if (emp.rulesAgreed && emp.privacyAgreed) newProgress += 10;
  if (emp.taxDeclaration && emp.taxDeclaration.signed) newProgress += 15;
  if (emp.contractSigned) newProgress += 10;
  if (emp.guarantorSigned) newProgress += 10;
  if (emp.serviceSigned) newProgress += 10;

  emp.progress = newProgress;
  if (newProgress === 100) emp.status = 'completed';
  
  emp.updatedAt = new Date().toISOString();
  saveDatabase();
  
  return res.json({ message: '文件上傳成功', employee: emp });
});

// Delete uploaded verification documents
app.delete('/api/employee/upload', (req, res) => {
  const { id, fileName } = req.body;
  const empIndex = employees.findIndex(emp => emp.id === id);
  if (empIndex === -1) {
    return res.status(404).json({ error: '找不到該同仁資料' });
  }

  const emp = employees[empIndex];
  emp.uploadedFiles = emp.uploadedFiles.filter(f => f.name !== fileName);

  // Recalculate progress across 8 parts:
  let newProgress = 0;
  if (emp.personalData && emp.personalData.name && emp.personalData.phone) newProgress += 15;
  if (emp.careerData && (emp.careerData.experiences?.length > 0 || emp.careerData.educations?.length > 0 || emp.careerData.licenses?.length > 0)) newProgress += 15;
  if (emp.uploadedFiles && emp.uploadedFiles.length > 0) newProgress += 15;
  if (emp.rulesAgreed && emp.privacyAgreed) newProgress += 10;
  if (emp.taxDeclaration && emp.taxDeclaration.signed) newProgress += 15;
  if (emp.contractSigned) newProgress += 10;
  if (emp.guarantorSigned) newProgress += 10;
  if (emp.serviceSigned) newProgress += 10;

  emp.progress = newProgress;
  emp.status = newProgress === 100 ? 'completed' : 'pending';
  emp.updatedAt = new Date().toISOString();
  saveDatabase();

  return res.json({ message: '文件已移除', employee: emp });
});

// 4. Gemini AI Chatbot Router (using "@google/genai")
app.post('/api/chat', async (req, res) => {
  const { prompt, history, roleContext } = req.body;
  
  const systemPrompt = `你是一個在「雲朗觀光股份有限公司 (LDC Hotels & Resorts)」服務的 HR 秘書。
目前這個平台是新進人員入職與教育訓練平台。你應該使用「繁體中文（台灣）」與優雅、積極、溫馨、極致專業的精緻精品酒店款待語氣回答所有入職同仁或是人資夥伴的問題。
服務範疇包括：
- 雲朗觀光旗下的飯店品牌：君品酒店（台北）、雲品溫泉酒店（日月潭）、翰品酒店、兆品酒店、品文旅。
- 入職文件準備：身分證正反影本、學經歷證書、專業證書、扶養親屬申報表、銀行存摺影本（建議兆豐、台灣銀行）、體檢報告。
- 薪資發放：每月 5 日發放前月薪資。
- 福利制度：飯店特惠住宿、免費制服清洗、員工生日假、年度健康檢查與旅遊補助、完善考核晉升。
- 請假與考勤規則：打卡要求、試用期三個月等。
- ${roleContext === 'hr' ? '人資管理指引：如何新增新進同仁資料（提供姓名、Email、隨機六碼英數授權碼即可）、追蹤進度狀態。' : '合約及個資填寫：填答基本資料、工作經歷、證件並上傳 PDF、勾選工作規則同意書、以及確認並簽字以簽署勞動契約、全部步驟 100% 後會自動提交給 HR。'}

請直接提供具有排版、條理分明、層次感高的專業回答。`;

  if (aiClient) {
    try {
      // Reconstruct history formats for @google/genai SDK
      // Using generateContent with system instruction
      const chatHistory = (history || []).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Add actual prompt
      const contents = [...chatHistory, { role: 'user', parts: [{ text: prompt }] }];

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });

      const reply = response.text || '無法取得 AI 的答覆，請稍後再試。';
      return res.json({ response: reply });
    } catch (err: any) {
      console.error('Gemini API call failed:', err);
      // Fallback response with beautiful mock HR assistant rules if key fails or rate-limited
      const fallbackReply = generateFallbackHRResponse(prompt, roleContext);
      return res.json({ response: fallbackReply });
    }
  } else {
    // Elegant fallback rules without Gemini API key configured
    const fallbackReply = generateFallbackHRResponse(prompt, roleContext);
    return res.json({ response: fallbackReply, note: 'Gemini Key not configured, utilizing intelligent rules engine.' });
  }
});

function generateFallbackHRResponse(prompt: string, roleContext: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('不提供') || p.includes('個資')) {
    return `### 關於「個資聲明」的說明 💼✨

新進同仁您好，本平台所蒐集的「個人基本資料」、「銀行帳號」及「身分證明」均僅用於**依法申報勞健保、薪資發放、所得申報以及人事檔案建檔**之內部用途。

如果您選擇不提供：
1. **勞健保保障**：將無法於報到當日為您完成申報，會影響您的權益。
2. **薪資核發**：無銀行帳戶資訊，將無法順利撥發薪水。
3. **入職未完成**：可能導致無法完成完整的報到入職流程。

如果您有特定欄位的顧慮，也隨時可以聯繫您的專屬 LDC 人力資源處。`;
  }
  if (p.includes('休假') || p.includes('福利') || p.includes('假')) {
    return `### 🌸 雲朗觀光熱忱福利與特假機制 🌸

我們為每一位夥伴提供完善、暖心的休假方案，包括：
1. **入職特別休假**：依勞基法規定累積年資。半年給予 3 天，一年給予 7 天。
2. **生日祝賀**：首創「員工專屬生日假」，讓您在生日之時，與愛人共享完美時光。
3. **集團旗下專屬福利**：
   - 全台旗下飯店（君品、雲品、品文旅等）享有最高規「員工超低特惠住宿與餐飲價」。
   - 豐盛的年度集團春酒與旅遊補助。
   - 專業的季度在職培訓。
   - 免費洗滌制服與餐食提供。`;
  }
  if (p.includes('流程') || p.includes('任務') || p.includes('步驟') || p.includes('文件')) {
    return `### 📋 新進同仁入職六大完工指南 📋

請依序點擊填寫，並在各視窗中完成：
1. **【填寫個人資料】**：含您的緊急聯絡人與撥款帳戶（必填）。
2. **【工作經歷與證照】**：填寫您的過往成就與證照，並隨時新增補充。
3. **【證件核驗】**：請將文件或證照列印/儲存為 **PDF 檔案**上傳（限 PDF）。
4. **【工作規則閱讀】**：詳細閱讀雲朗工作守則及個資處理告知後，勾選確認。
5. **【薪資免稅額申請表】**：將依照您的薪資確認免稅額申請額度。
6. **【簽署勞動契約】**：系統將自動對接您的個人資料名稱，閱讀完整合約，點選「確認簽署」。

完成以上 5 大步驟（進度達到 100%），即代表完成報到！祝您展開一段令人興奮的雲朗職涯之旅！✨`;
  }
  if (roleContext === 'hr') {
    return `### 🤝 您好，HR！這裡能為您辦理以下事項：

1. **新增同仁帳號**：於此頁面頂部輸入同仁中文姓名、指定 Email，以及設定 6 碼隨機密碼/授權碼（如 \`LDC123\`）即可。完成後，同仁便可使用該 Email 於前台登入。
2. **追蹤進度**：看得到所有人的進度百分比，還可點擊同仁卡片「查看詳情」檢查上傳的 PDF。
3. **新增人資成員**：想要多人共用管理嗎？於下方新增其他負責人的 Email，我們就不限人數授權進站喔！

請問還有什麼需要為人資專員提供諮詢的嗎？`;
  }
  return `### 您好！我是您的AI祕書 🌟

很高興能為您提供服務。關於雲朗觀光（LDC Hotels & Resorts）的報到作業、福利政策、休假細則，或是勞動聘雇合約，您都可以直接在此提問。

*您可以試試：*
- 「特別休假福利有哪些？」
- 「不提供個資會有會有什麼影響？」
- 「入職流程步驟有哪些？」`;
}

// Vite and static build mounting
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Fallback routing for SPA to index.html in dev as well
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) {
      return next();
    }
    if (process.env.NODE_ENV !== 'production') {
      // Rely on Vite handling
      return next();
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
