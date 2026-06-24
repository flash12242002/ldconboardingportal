import React, { useState, useRef, useEffect } from 'react';
import { 
  ClipboardList, 
  BookOpen, 
  Sparkles, 
  LogOut, 
  User, 
  MapPin, 
  Building,
  CreditCard,
  FileText,
  Briefcase,
  Layers,
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Send,
  Download,
  Trash2,
  Users
} from 'lucide-react';
import { Employee, PersonalData, CareerExperience, Education, ProfessionalLicense, LanguageSkill, TaxDependent, TaxDeclaration, GuarantorData } from '../types';
import LdcLogo from './LdcLogo';
import { TaxDeclarationPrintModal, ContractPrintModal, GuarantorPrintModal, ServicePrintModal } from './PrintModals';
import { Printer } from 'lucide-react';

const eHrdLoginDemo = "/src/assets/images/ehrd_login_demo_1781503393310.jpg";

// Helper to get company details based on employee branch / department
export const getCompanyDetails = (emp: { department?: string; contractWorkLocation?: string }) => {
  const dept = (emp.department || '').toLowerCase();
  const loc = (emp.contractWorkLocation || '').toLowerCase();

  if (dept.includes('雲品') || loc.includes('雲品')) {
    return {
      name: '雲品國際酒店股份有限公司',
      owner: '盛治仁',
      taxId: '54023418',
      address: '台北市中山區中山北路二段96號8樓'
    };
  } else if (dept.includes('致和') || loc.includes('致和')) {
    return {
      name: '致和管理顧問股份有限公司',
      owner: '辜懷如',
      taxId: '12955445',
      address: '台北市中山區中山北路二段96號8樓'
    };
  } else {
    return {
      name: '雲朗觀光股份有限公司',
      owner: '賈子南',
      taxId: '62021700',
      address: '台北市中山區中山北路二段96號8樓'
    };
  }
};


interface EmployeeDashboardProps {
  initialEmployee: Employee;
  onLogout: () => void;
}

export default function EmployeeDashboard({ initialEmployee, onLogout }: EmployeeDashboardProps) {
  const [employee, setEmployee] = useState<Employee>(initialEmployee);
  const [activeTab, setActiveTab] = useState<'tasks' | 'training' | 'ai'>('tasks');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [printTaxOpen, setPrintTaxOpen] = useState(false);
  const [printContractOpen, setPrintContractOpen] = useState(false);
  const [printGuarantorOpen, setPrintGuarantorOpen] = useState(false);
  const [printServiceOpen, setPrintServiceOpen] = useState(false);

  // Guarantor state
  const [guarantorForm, setGuarantorForm] = useState<GuarantorData>({
    guarantorName: employee.guarantorData?.guarantorName || '',
    birthday: employee.guarantorData?.birthday || '',
    idNumber: employee.guarantorData?.idNumber || '',
    address: employee.guarantorData?.address || '',
    phone: employee.guarantorData?.phone || '',
    companyName: employee.guarantorData?.companyName || '',
    companyTitle: employee.guarantorData?.companyTitle || '',
    companyAddress: employee.guarantorData?.companyAddress || '',
    companyPhone: employee.guarantorData?.companyPhone || '',
    relationship: employee.guarantorData?.relationship || '',
    validUntil: employee.guarantorData?.validUntil || ''
  });

  // Personal state
  const [personalForm, setPersonalForm] = useState<PersonalData>({
    name: employee.personalData?.name || employee.name || '',
    englishName: employee.personalData?.englishName || '',
    avatarUrl: employee.personalData?.avatarUrl || '',
    idNumber: employee.personalData?.idNumber || '',
    birthday: employee.personalData?.birthday || '',
    gender: employee.personalData?.gender || '',
    bloodType: employee.personalData?.bloodType || '',
    phone: employee.personalData?.phone || '',
    email: employee.personalData?.email || employee.email || '',
    legalAddress: employee.personalData?.legalAddress || '',
    contactAddress: employee.personalData?.contactAddress || '',
    bankName: '中國信託銀行 (822)',
    bankAccount: employee.personalData?.bankAccount || '',
    dependentsCount: employee.personalData?.dependentsCount || '0 人',
    healthDependentsCount: employee.personalData?.healthDependentsCount || '0 人',
    healthDependents: employee.personalData?.healthDependents || [],
    emergencyName: employee.personalData?.emergencyName || '',
    emergencyRelationship: employee.personalData?.emergencyRelationship || '',
    emergencyPhone: employee.personalData?.emergencyPhone || ''
  });

  // Expand state for task panels
  const [openSection, setOpenSection] = useState<string | null>('personal');

  // Career state
  const [experiences, setExperiences] = useState<CareerExperience[]>(
    employee.careerData?.experiences || []
  );
  const [educations, setEducations] = useState<Education[]>(
    employee.careerData?.educations || []
  );
  const [licenses, setLicenses] = useState<ProfessionalLicense[]>(
    employee.careerData?.licenses || [
      { licenseName: '', badgeLevel: '', issueDate: '', expiryDate: '' }
    ]
  );
  const [additionalNotes, setAdditionalNotes] = useState(
    employee.careerData?.additionalNotes || ''
  );
  
  const [languages, setLanguages] = useState<LanguageSkill[]>(() => {
    if (employee.careerData?.languages && employee.careerData.languages.length > 0) {
      return employee.careerData.languages;
    }
    return [
      { language: '英文', level: '' },
      { language: '日文', level: '' },
      { language: '韓文', level: '' },
      { language: '其他', level: '', customName: '' }
    ];
  });
  
  // New temporary subform states
  const [expShowForm, setExpShowForm] = useState(false);
  const [tempExp, setTempExp] = useState<CareerExperience>({
    companyName: '', jobTitle: '', startDate: '', endDate: '', leaveReason: ''
  });

  const [eduShowForm, setEduShowForm] = useState(false);
  const [tempEdu, setTempEdu] = useState<Education>({
    schoolName: '', major: '', degree: '', period: '', status: ''
  });

  // Agreement states
  const [rulesRead, setRulesRead] = useState(employee.rulesAgreed || false);
  const [privacyRead, setPrivacyRead] = useState(employee.privacyAgreed || false);
  const [sameAddress, setSameAddress] = useState(false);

  // Tax declaration states
  const [spouseName, setSpouseName] = useState(employee.taxDeclaration?.spouseName || '');
  const [spouseBirthday, setSpouseBirthday] = useState(employee.taxDeclaration?.spouseBirthday || '');
  const [spouseIdNumber, setSpouseIdNumber] = useState(employee.taxDeclaration?.spouseIdNumber || '');
  const [taxDependents, setTaxDependents] = useState<TaxDependent[]>(employee.taxDeclaration?.dependents || []);
  const [taxSigned, setTaxSigned] = useState(employee.taxDeclaration?.signed || false);
  const [taxSignName, setTaxSignName] = useState(employee.taxDeclaration?.signName || '');
  
  // Temporary dependent additions
  const [tempDepName, setTempDepName] = useState('');
  const [tempDepRel, setTempDepRel] = useState('');
  const [tempDepBirth, setTempDepBirth] = useState('');
  const [tempDepId, setTempDepId] = useState('');
  const [tempDepCond, setTempDepCond] = useState('');
  const [tempDepType, setTempDepType] = useState('直系尊親屬');
  const [showDepForm, setShowDepForm] = useState(false);


  // Contract specific states (to match physical image)
  const [contractWorkLocation, setContractWorkLocation] = useState('君品酒店 (台北市中山區)');
  const [contractLeaveOption, setContractLeaveOption] = useState<string>('biweekly'); // 'monthly' or 'biweekly'
  const [contractLeavedays, setContractLeavedays] = useState('8-10');
  const [contractSalaryType, setContractSalaryType] = useState<string>('monthly'); // 'monthly', 'daily', 'hourly'
  const [contractMonthlySalary, setContractMonthlySalary] = useState('36,000');
  const [contractDailySalary, setContractDailySalary] = useState('1,800');
  const [contractHourlySalary, setContractHourlySalary] = useState('190');

  // File Upload states
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState('');

  // AI Assistant states
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'assistant',
      content: `您好，**${employee.name}**！我是您的報到流程 AI秘書 🌸。恭喜您加入雲朗觀光！這裡將會回答您的疑問並能協助您迅速填寫流程。

我能為您解答：
- 集團員工有哪些專屬休假（如生日假）與特惠住宿？
- 勞動契約或工作規則中有哪些需要留意？
- 目前的8個入職報到任務要怎麼完成與核驗？

歡迎隨時在此詢問我任何問題！`,
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Dynamic status update
  const syncWithServer = async (updatedFields: Partial<Employee>) => {
    setLoading(true);
    setSaveStatus('正在快取雲端檔案...');
    try {
      const response = await fetch('/api/employee/save', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: employee.id,
          ...updatedFields
        })
      });
      const data = await response.json();
      if (response.ok) {
        setEmployee(data.employee);
        setSaveStatus('進度儲存成功');
        setTimeout(() => setSaveStatus(''), 2000);
      } else {
        setSaveStatus('快取失敗，請重新嘗試');
      }
    } catch {
      setSaveStatus('網際網絡連線中中斷，自動啟用本機快取');
    } finally {
      setLoading(false);
    }
  };

  const handleHealthDependentsCountChange = (countStr: string) => {
    const count = parseInt(countStr) || 0;
    const currentDeps = personalForm.healthDependents || [];
    let updatedDeps = [...currentDeps];

    if (updatedDeps.length < count) {
      const diff = count - updatedDeps.length;
      for (let i = 0; i < diff; i++) {
        updatedDeps.push({ name: '', relationship: '', idNumber: '', birthday: '' });
      }
    } else if (updatedDeps.length > count) {
      updatedDeps = updatedDeps.slice(0, count);
    }

    setPersonalForm({
      ...personalForm,
      healthDependentsCount: countStr,
      healthDependents: updatedDeps
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('⚠️ 大頭照格式僅支援 JPG、JPEG 或 PNG 格式。');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPersonalForm(prev => ({
        ...prev,
        avatarUrl: base64
      }));
    };
    reader.readAsDataURL(file);
  };

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !personalForm.avatarUrl ||
      !personalForm.name || 
      !personalForm.phone || 
      !personalForm.idNumber ||
      !personalForm.birthday ||
      !personalForm.gender ||
      !personalForm.legalAddress ||
      !personalForm.bankAccount ||
      !personalForm.dependentsCount
    ) {
      alert('請完整上傳個人大頭照、填寫姓名、身分證字號、出生日期、性別、聯絡電話、戶籍地址、匯款銀行帳號與所得扣繳親屬格！');
      return;
    }
    syncWithServer({ personalData: personalForm });
    setOpenSection('career');
  };

  const addExperience = () => {
    if (!tempExp.companyName || !tempExp.jobTitle) {
      alert('請輸入公司名稱與職位');
      return;
    }
    const newList = [...experiences, tempExp];
    setExperiences(newList);
    setTempExp({ companyName: '', jobTitle: '', startDate: '', endDate: '', leaveReason: '' });
    setExpShowForm(false);
    syncWithServer({ careerData: { experiences: newList, educations, licenses, languages, additionalNotes } });
  };

  const removeExperience = (index: number) => {
    const newList = experiences.filter((_, i) => i !== index);
    setExperiences(newList);
    syncWithServer({ careerData: { experiences: newList, educations, licenses, languages, additionalNotes } });
  };

  const addEducation = () => {
    if (!tempEdu.schoolName) {
      alert('請輸入學校名稱');
      return;
    }
    const newList = [...educations, tempEdu];
    setEducations(newList);
    setTempEdu({ schoolName: '', major: '', degree: '', period: '', status: '' });
    setEduShowForm(false);
    syncWithServer({ careerData: { experiences, educations: newList, licenses, languages, additionalNotes } });
  };

  const removeEducation = (index: number) => {
    const newList = educations.filter((_, i) => i !== index);
    setEducations(newList);
    syncWithServer({ careerData: { experiences, educations: newList, licenses, languages, additionalNotes } });
  };

  const addLicenseRow = () => {
    const newList = [...licenses, { licenseName: '', badgeLevel: '', issueDate: '', expiryDate: '' }];
    setLicenses(newList);
  };

  const updateLicense = (index: number, field: keyof ProfessionalLicense, val: string) => {
    const newList = [...licenses];
    newList[index][field] = val;
    setLicenses(newList);
  };

  const saveCareer = () => {
    const validLicenses = licenses.filter(l => l.licenseName.trim());
    syncWithServer({
      careerData: {
        experiences,
        educations,
        licenses: validLicenses,
        languages,
        additionalNotes
      }
    });
    setOpenSection('upload');
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Convert files checking ONLY .pdf files
  const processFiles = async (files: FileList) => {
    setFileError('');
    const file = files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setFileError('⚠️ 請注意，證件及專業證照僅接受高解析度 PDF 檔案以供查驗。');
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/employee/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: employee.id,
            fileName: file.name,
            fileSize: file.size,
            base64Data: base64
          })
        });
        const data = await res.json();
        if (res.ok) {
          setEmployee(data.employee);
          setSaveStatus('證件 PDF 上傳完畢並已就位');
          setTimeout(() => setSaveStatus(''), 2000);
        } else {
          setFileError(data.error || '上傳失敗');
        }
      };
    } catch {
      setFileError('檔案處理失敗');
    } finally {
      setLoading(false);
    }
  };

  const deleteUploadedFile = async (name: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/employee/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: employee.id,
          fileName: name
        })
      });
      const data = await res.json();
      if (res.ok) {
        setEmployee(data.employee);
        setSaveStatus('檔案已移除');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch {
      alert('刪除失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotUploadChange = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('⚠️ 請注意，指定核驗文件格式僅接受 PDF 檔案。');
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/employee/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: employee.id,
            fileName: file.name,
            fileSize: file.size,
            base64Data: base64,
            docType: docType
          })
        });
        const data = await res.json();
        if (res.ok) {
          setEmployee(data.employee);
          setSaveStatus('文件上傳成功');
          setTimeout(() => setSaveStatus(''), 2000);
        } else {
          alert(data.error || '上傳失敗');
        }
      };
    } catch {
      alert('檔案處理失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRulesSubmit = () => {
    if (!rulesRead || !privacyRead) {
      alert('請先閱讀完兩項守則並勾選同意');
      return;
    }
    syncWithServer({ rulesAgreed: rulesRead, privacyAgreed: privacyRead });
    setOpenSection('tax');
  };

  const handleContractSign = () => {
    syncWithServer({
      contractSigned: true,
      contractDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
    });
    setOpenSection('guarantor');
  };

  const handleGuarantorSign = (andSubmit: boolean) => {
    if (andSubmit && !guarantorForm.guarantorName.trim()) {
      alert('請填寫保證人姓名以進行數位連帶保證認證，謝謝。');
      return;
    }
    syncWithServer({
      guarantorSigned: andSubmit,
      guarantorDate: andSubmit ? new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '',
      guarantorData: guarantorForm
    });
    if (andSubmit) {
      setOpenSection('service');
    }
  };

  const handleServiceSign = () => {
    syncWithServer({
      serviceSigned: true,
      serviceDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
    });
    setOpenSection(null);
  };

  // AI chat call
  const sendAIMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || aiLoading) return;

    const userMsg = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    };

    const currentHistory = [...messages, userMsg];
    setMessages(currentHistory);
    setInputMessage('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          roleContext: 'employee'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.response,
            timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error();
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '抱歉，祕書目前連線稍微雍塞，請稍後提問，您的資料皆已安全送達。',
          timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiLoading]);

  useEffect(() => {
    if (employee.taxDeclaration) {
      setSpouseName(employee.taxDeclaration.spouseName || '');
      setSpouseBirthday(employee.taxDeclaration.spouseBirthday || '');
      setSpouseIdNumber(employee.taxDeclaration.spouseIdNumber || '');
      setTaxDependents(employee.taxDeclaration.dependents || []);
      setTaxSigned(employee.taxDeclaration.signed || false);
      setTaxSignName(employee.taxDeclaration.signName || '');
    }
  }, [employee]);

  const addTaxDependent = () => {
    if (!tempDepName.trim()) {
      alert('請輸入受扶養親屬姓名');
      return;
    }
    const newDep: TaxDependent = {
      name: tempDepName,
      relationship: tempDepRel,
      birthday: tempDepBirth,
      idNumber: tempDepId,
      condition: tempDepCond,
      type: tempDepType
    };
    const newList = [...taxDependents, newDep];
    setTaxDependents(newList);
    setTempDepName('');
    setTempDepRel('');
    setTempDepBirth('');
    setTempDepId('');
    setTempDepCond('');
    setShowDepForm(false);
    
    const dec = {
      spouseName,
      spouseBirthday,
      spouseIdNumber,
      dependents: newList,
      signed: taxSigned,
      signName: taxSignName,
      signedAt: employee.taxDeclaration?.signedAt
    };
    syncWithServer({ taxDeclaration: dec });
  };

  const removeTaxDependent = (index: number) => {
    const newList = taxDependents.filter((_, i) => i !== index);
    setTaxDependents(newList);
    
    const dec = {
      spouseName,
      spouseBirthday,
      spouseIdNumber,
      dependents: newList,
      signed: taxSigned,
      signName: taxSignName,
      signedAt: employee.taxDeclaration?.signedAt
    };
    syncWithServer({ taxDeclaration: dec });
  };

  const handleTaxSave = (andSubmit: boolean) => {
    if (andSubmit && !taxSignName.trim()) {
      alert('請填寫 薪資受領人（簽章）以進行數位核對確認，謝謝。');
      return;
    }
    const dec = {
      spouseName,
      spouseBirthday,
      spouseIdNumber,
      dependents: taxDependents,
      signed: andSubmit ? true : taxSigned,
      signName: taxSignName,
      signedAt: andSubmit ? new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }) : employee.taxDeclaration?.signedAt
    };
    syncWithServer({ taxDeclaration: dec });
    if (andSubmit) {
      setOpenSection('contract');
    }
  };

  // Checklist computation helper
  const taskChecklist = [
    { key: 'personal', title: '填寫個人資料', done: !!(employee.personalData && employee.personalData.phone) },
    { key: 'career', title: '登錄學經歷與證照', done: !!(employee.careerData && (employee.careerData.experiences?.length > 0 || (employee.careerData.educations && employee.careerData.educations.length > 0) || employee.careerData.licenses?.length > 0)) },
    { 
      key: 'upload', 
      title: '上傳指定文件影本驗查 (僅接受 PDF)', 
      done: !!(
        employee.uploadedFiles?.some(f => f.docType === 'idCard') &&
        employee.uploadedFiles?.some(f => f.docType === 'degree') &&
        employee.uploadedFiles?.some(f => f.docType === 'healthReport') &&
        employee.uploadedFiles?.some(f => f.docType === 'bankCover')
      ) || (employee.uploadedFiles?.length > 0 && !employee.uploadedFiles?.some(f => f.docType))
    },
    { key: 'rules', title: '閱讀工作規程與個資蒐集利用告知', done: employee.rulesAgreed && employee.privacyAgreed },
    { key: 'tax', title: '薪資受領人免稅額申報表', done: !!(employee.taxDeclaration && employee.taxDeclaration.signed) },
    { key: 'contract', title: '確認並線上簽署「聘僱合約書」', done: employee.contractSigned },
    { key: 'guarantor', title: '確認並線上簽署「職員保證書」', done: !!employee.guarantorSigned },
    { key: 'service', title: '確認並線上簽署「職工服務約定」', done: !!employee.serviceSigned }
  ];

  const totalFinished = taskChecklist.filter(t => t.done).length;
  const overallProgress = employee.progress;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-stone-800">
      
      {/* Upper Brand bar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <LdcLogo size="header" color="gold" className="bg-stone-50 p-1 px-2 rounded-lg border border-stone-200" />
          <div>
            <h2 className="text-base font-semibold text-slate-900 tracking-wide">
              新進同仁入職報到平台
            </h2>
            <p className="text-xs text-slate-500">
              {employee.department}  •  {employee.title}  •  到職日：{employee.onboardDate}
            </p>
          </div>
        </div>

        {/* View Switches */}
        <div className="flex items-center gap-1.5 md:self-center">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 text-xs font-medium tracking-wide rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'tasks'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            我的報到任務 ({totalFinished}/{taskChecklist.length})
          </button>
          <button
            onClick={() => setActiveTab('training')}
            className={`px-4 py-2 text-xs font-medium tracking-wide rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'training'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            教育訓練導讀
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 text-xs font-medium tracking-wide rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'ai'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            問問 AI 秘書
          </button>

          <div className="h-4 w-px bg-stone-200 mx-1"></div>

          <button
            onClick={onLogout}
            className="px-3 py-2 text-stone-500 hover:text-rose-600 text-xs font-medium flex items-center gap-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            登出
          </button>
        </div>
      </nav>

      {/* Main Content Pane */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">

        {/* Overall Progress Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-1 text-center md:text-left">
            <h3 className="text-lg font-medium text-slate-900">
              誠摯地歡迎您，{employee.name}！
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed max-w-xl">
              這是為您量身準備的報到清單，完成 {taskChecklist.length} 大任務並至進度達 100% 後將自動發送至HR部門。如遇問題可點擊右上方「問問 AI 秘書」獲得協助。
            </p>
          </div>
          
          <div className="w-full md:w-80 space-y-2.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-stone-600">填寫進度統計</span>
              <span className="font-semibold text-indigo-600">{overallProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>完成全部欄位即可退出</span>
              <span>
                {employee.status === 'completed' ? (
                  <span className="text-emerald-700 font-semibold">🎉 已完成 100% 隨時可關閉</span>
                ) : (
                  <span>目前待補辦</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {saveStatus && (
          <div className="bg-[#1E293B] text-white px-4 py-2 rounded-lg text-center text-xs animate-bounce w-fit mx-auto shadow-sm">
            ✨ {saveStatus}
          </div>
        )}

        {/* Dynamic Display based on Tabs */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Checklist Overview Side */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h4 className="text-xs font-semibold text-stone-500 tracking-wider uppercase mb-2">
                入職工作指引步驟
              </h4>
              <div className="space-y-2">
                {taskChecklist.map((task, i) => (
                  <div
                    key={task.key}
                    onClick={() => setOpenSection(task.key)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                      task.done 
                        ? 'bg-slate-50 border-slate-200 text-stone-400' 
                        : openSection === task.key 
                          ? 'border-indigo-200 bg-indigo-50/50 text-indigo-700 font-semibold' 
                          : 'border-stone-100 hover:border-stone-200 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        task.done ? 'bg-[#0D9488]/10 text-[#0D9488]' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {task.done ? '✓' : i + 1}
                      </div>
                      <span className="truncate">{task.title}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </div>
                ))}
              </div>

              {employee.status === 'completed' && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center space-y-2">
                  <span className="text-emerald-800 font-bold text-sm block">🎊 太棒了，報到手續已全部完成！</span>
                  <p className="text-[11px] text-emerald-600 leading-relaxed">
                    您的基本資料、工作經歷、核驗文件、讀畢宣告和勞僱合約均已由系統妥善保護。您現在可安心使用，不需再手動存擋。
                  </p>
                </div>
              )}
            </div>

            {/* Editing Section Area */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* 1. Personal Form Section */}
              {openSection === 'personal' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-2 pb-4 border-b border-stone-100">
                    <User className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-base font-semibold text-stone-900">1. 填寫個人基本資料表</h4>
                      <p className="text-xs text-stone-500">為維護您的權益，煩請您填寫正確資料，因HR將依您填寫的資料進行相關手續並建立人事資料檔。</p>
                    </div>
                  </div>

                  <form onSubmit={handlePersonalSubmit} className="space-y-6">
                    {/* 大頭照上傳區塊 */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div className="relative w-24 h-24 rounded-xl border border-stone-200 bg-white overflow-hidden flex items-center justify-center flex-shrink-0 group shadow-sm">
                        {personalForm.avatarUrl ? (
                          <img 
                            src={personalForm.avatarUrl} 
                            alt="大頭照" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-center p-2 text-stone-400">
                            <span className="text-[10px] block leading-snug">未上傳<br />大頭照</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 flex-grow text-center sm:text-left">
                        <span className="block text-xs font-bold text-stone-800">上傳個人大頭照 <span className="text-rose-500">*</span></span>
                        <p className="text-[10px] text-stone-500 leading-relaxed">
                          格式限定為 JPG、JPEG 或 PNG 影像檔案。<br />
                          此照片將用於新進員工識別證及門禁出入與人資系統建檔。
                        </p>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <label className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-700 cursor-pointer transition-colors shadow-sm">
                            選擇照片
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/png, image/jpeg, image/jpg" 
                              onChange={handleAvatarChange}
                            />
                          </label>
                          {personalForm.avatarUrl && (
                            <button
                              type="button"
                              onClick={() => setPersonalForm(prev => ({ ...prev, avatarUrl: '' }))}
                              className="px-3 py-1.5 bg-white border border-stone-200 text-stone-500 rounded-lg text-[11px] font-semibold hover:bg-stone-50 hover:text-stone-700 transition"
                            >
                              清除照片
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          中文姓名 <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={personalForm.name}
                          onChange={e => setPersonalForm({...personalForm, name: e.target.value})}
                          className="w-full text-stone-950 px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          英文別名
                        </label>
                        <input
                          type="text"
                          placeholder="例: David Lin"
                          value={personalForm.englishName || ''}
                          onChange={e => setPersonalForm({...personalForm, englishName: e.target.value})}
                          className="w-full text-stone-950 px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          身分證字號 <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="A123456789"
                          value={personalForm.idNumber}
                          onChange={e => setPersonalForm({...personalForm, idNumber: e.target.value.toUpperCase()})}
                          maxLength={10}
                          className="w-full text-stone-950 px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">出生日期 <span className="text-rose-500">*</span></label>
                        <input
                          type="date"
                          value={personalForm.birthday}
                          onChange={e => setPersonalForm({...personalForm, birthday: e.target.value})}
                          className="w-full text-stone-950 px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">性別 <span className="text-rose-500">*</span></label>
                        <select
                          value={personalForm.gender}
                          onChange={e => setPersonalForm({...personalForm, gender: e.target.value})}
                          className="w-full text-stone-950 px-3 py-3 text-xs border border-stone-200 rounded-lg focus:border-indigo-500 focus:outline-none bg-white"
                          required
                        >
                          <option value="">請選擇</option>
                          <option value="男">男</option>
                          <option value="女">女</option>
                          <option value="其他">其他</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">血型</label>
                        <select
                          value={personalForm.bloodType || ''}
                          onChange={e => setPersonalForm({...personalForm, bloodType: e.target.value})}
                          className="w-full text-stone-950 px-3 py-3 text-xs border border-stone-200 rounded-lg focus:border-indigo-500 focus:outline-none bg-white"
                        >
                          <option value="">請選擇</option>
                          <option value="A型">A型</option>
                          <option value="B型">B型</option>
                          <option value="O型">O型</option>
                          <option value="AB型">AB型</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">聯絡電話 <span className="text-rose-500">*</span></label>
                        <input
                          type="tel"
                          placeholder="0911-222-333"
                          value={personalForm.phone}
                          onChange={e => setPersonalForm({...personalForm, phone: e.target.value})}
                          className="w-full text-stone-950 px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">電郵信箱 (預設)</label>
                        <input
                          type="email"
                          value={personalForm.email}
                          readOnly
                          className="w-full px-3 py-2 text-xs border border-stone-100 rounded-lg bg-stone-50 text-stone-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">戶籍地址 <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                          <input
                            type="text"
                            placeholder="請填入身分證背面之法定戶籍地址"
                            value={personalForm.legalAddress}
                            onChange={e => setPersonalForm({...personalForm, legalAddress: e.target.value})}
                            className="w-full text-stone-950 pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="sameAddress"
                          checked={sameAddress}
                          onChange={() => {
                            const val = !sameAddress;
                            setSameAddress(val);
                            if (val) {
                              setPersonalForm({
                                ...personalForm,
                                contactAddress: personalForm.legalAddress
                              });
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="sameAddress" className="text-xs text-stone-500 select-none cursor-pointer">
                          同上（通訊地址與戶籍地址相同）
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">通訊住址</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                          <input
                            type="text"
                            placeholder="目前居住地址"
                            value={personalForm.contactAddress}
                            onChange={e => setPersonalForm({...personalForm, contactAddress: e.target.value})}
                            disabled={sameAddress}
                            className={`w-full text-stone-950 pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none ${
                              sameAddress ? 'bg-stone-50 text-stone-400' : 'focus:border-indigo-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-stone-100 pt-6 space-y-4">
                      <h5 className="text-xs font-semibold text-stone-900 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        公司撥薪、扶養親屬與健保眷屬設定
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-1">
                          <label className="block text-xs font-semibold text-indigo-900 mb-1.5 flex items-center gap-1">
                            <span>撥款銀行 <span className="text-rose-500">*</span></span>
                            <span className="text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded font-normal">指定撥薪行</span>
                          </label>
                          <input
                            type="text"
                            readOnly
                            value="中國信託銀行 (822)"
                            className="w-full text-stone-600 bg-stone-50 border border-stone-150 px-3 py-2 text-xs rounded-lg focus:outline-none font-semibold"
                            required
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-xs font-semibold text-stone-700 mb-1.5">匯款銀行帳號 <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            placeholder="請填入個人完整存摺帳號"
                            value={personalForm.bankAccount}
                            onChange={e => setPersonalForm({...personalForm, bankAccount: e.target.value})}
                            className="w-full text-stone-950 px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-indigo-500 focus:outline-none font-mono"
                            required
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-xs font-semibold text-stone-700 mb-1.5">所得扣繳扶養親屬 <span className="text-rose-500">*</span></label>
                          <select
                            value={personalForm.dependentsCount}
                            onChange={e => setPersonalForm({...personalForm, dependentsCount: e.target.value})}
                            className="w-full text-stone-950 px-3 py-3 text-xs border border-stone-200 rounded-lg focus:border-indigo-500 focus:outline-none bg-white"
                            required
                          >
                            <option>0 人</option>
                            <option>1 人</option>
                            <option>2 人</option>
                            <option>3 人以上</option>
                          </select>
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-xs font-semibold text-indigo-900 mb-1.5">健保眷屬投保</label>
                          <select
                            value={personalForm.healthDependentsCount || '0 人'}
                            onChange={e => handleHealthDependentsCountChange(e.target.value)}
                            className="w-full text-indigo-950 px-3 py-3 text-xs border border-indigo-200 rounded-lg focus:border-indigo-500 focus:outline-none bg-indigo-50/30 font-semibold"
                          >
                            <option>0 人</option>
                            <option>1 人</option>
                            <option>2 人</option>
                            <option>3 人</option>
                          </select>
                        </div>
                      </div>

                      {/* 健保眷屬投保表格 */}
                      {parseInt(personalForm.healthDependentsCount || '0') > 0 && (
                        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                            <h6 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                              <Users className="w-4 h-4 text-indigo-600" />
                              健保眷屬投保詳細資料填寫
                            </h6>
                            <span className="text-[10px] text-stone-500 font-medium">健保投保限直系血親或配偶</span>
                          </div>
                          <div className="space-y-4">
                            {(personalForm.healthDependents || []).map((dep, idx) => (
                              <div key={idx} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                                    眷屬 {idx + 1} 姓名 <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="請填寫姓名"
                                    value={dep.name || ''}
                                    onChange={(e) => {
                                      const newDeps = [...(personalForm.healthDependents || [])];
                                      newDeps[idx] = { ...newDeps[idx], name: e.target.value };
                                      setPersonalForm({ ...personalForm, healthDependents: newDeps });
                                    }}
                                    className="w-full text-stone-950 bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                                    關係 <span className="text-rose-500">*</span>
                                  </label>
                                  <select
                                    required
                                    value={dep.relationship || ''}
                                    onChange={(e) => {
                                      const newDeps = [...(personalForm.healthDependents || [])];
                                      newDeps[idx] = { ...newDeps[idx], relationship: e.target.value };
                                      setPersonalForm({ ...personalForm, healthDependents: newDeps });
                                    }}
                                    className="w-full text-stone-950 bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors bg-white select-none"
                                  >
                                    <option value="">請選擇</option>
                                    <option value="配偶">配偶</option>
                                    <option value="子女">子女</option>
                                    <option value="父母">父母</option>
                                    <option value="祖父母及外祖父母">祖父母及外祖父母</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                                    眷屬身分證字號 <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    maxLength={10}
                                    placeholder="例: A123456789"
                                    value={dep.idNumber || ''}
                                    onChange={(e) => {
                                      const newDeps = [...(personalForm.healthDependents || [])];
                                      newDeps[idx] = { ...newDeps[idx], idNumber: e.target.value.toUpperCase() };
                                      setPersonalForm({ ...personalForm, healthDependents: newDeps });
                                    }}
                                    className="w-full text-stone-950 bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                                    眷屬生日 <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="date"
                                    required
                                    value={dep.birthday || ''}
                                    onChange={(e) => {
                                      const newDeps = [...(personalForm.healthDependents || [])];
                                      newDeps[idx] = { ...newDeps[idx], birthday: e.target.value };
                                      setPersonalForm({ ...personalForm, healthDependents: newDeps });
                                    }}
                                    className="w-full text-stone-950 bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-stone-100 pt-6 space-y-4">
                      <h5 className="text-xs font-semibold text-stone-900">
                        🚨 緊急應變與聯絡人諮詢
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1.5">聯絡人真實姓名 <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            placeholder="與您關係密切者之姓名"
                            value={personalForm.emergencyName}
                            onChange={e => setPersonalForm({...personalForm, emergencyName: e.target.value})}
                            className="w-full text-stone-950 px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-[#8D1B1B] focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1.5">關係說明</label>
                          <input
                            type="text"
                            placeholder="例：配偶、父母、手足"
                            value={personalForm.emergencyRelationship}
                            onChange={e => setPersonalForm({...personalForm, emergencyRelationship: e.target.value})}
                            className="w-full text-stone-950 px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-[#8D1B1B] focus:outline-none font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1.5">聯絡電話 <span className="text-rose-500">*</span></label>
                          <input
                            type="tel"
                            placeholder="行動電話或室內電話"
                            value={personalForm.emergencyPhone}
                            onChange={e => setPersonalForm({...personalForm, emergencyPhone: e.target.value})}
                            className="w-full text-stone-950 px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-[#8D1B1B] focus:outline-none"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-stone-100 pt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => syncWithServer({ personalData: personalForm })}
                        className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                      >
                        暫存基本資料
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                      >
                        儲存並前往下一步
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 2. Career Experience Form Section */}
              {openSection === 'career' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-2 pb-4 border-b border-stone-100">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-base font-semibold text-stone-900">2. 登錄經歷暨專業證照檔案</h4>
                      <p className="text-xs text-stone-500">協助公司更完整瞭解您的經歷與專業技能</p>
                    </div>
                  </div>

                  {/* Experience List */}
                  <div className="space-y-3">
                    <span className="block text-xs font-semibold text-stone-500 uppercase tracking-widest">
                      一、工作經歷
                    </span>
                    {experiences.length === 0 ? (
                      <p className="text-xs text-stone-400 italic bg-stone-50/50 p-4 rounded-lg text-center">
                        若無工作紀錄，您可以填入過往的工讀或社團經歷。
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {experiences.map((exp, val) => (
                          <div key={val} className="flex justify-between items-start bg-stone-50 border border-stone-100 p-4 rounded-xl">
                            <div>
                              <strong className="text-xs text-indigo-600 block">{exp.companyName}</strong>
                              <span className="text-[11px] text-stone-600 font-semibold block">{exp.jobTitle}</span>
                              <span className="text-[10px] text-stone-400">{exp.startDate} ~ {exp.endDate || '至今'}</span>
                              {exp.leaveReason && <p className="text-[10px] text-stone-500 mt-1">離職事由：{exp.leaveReason}</p>}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeExperience(val)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Experience subform toggle */}
                    {expShowForm ? (
                      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                              服務公司名稱 <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={tempExp.companyName}
                              onChange={e => setTempExp({...tempExp, companyName: e.target.value})}
                              placeholder="例：君品酒店 / OO餐飲"
                              className="w-full text-stone-950 px-2.5 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                              擔當職位名稱 <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={tempExp.jobTitle}
                              onChange={e => setTempExp({...tempExp, jobTitle: e.target.value})}
                              placeholder="例：接待專員 / 主廚"
                              className="w-full text-stone-950 px-2.5 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-600 mb-1">任職起月</label>
                            <input
                              type="month"
                              value={tempExp.startDate}
                              onChange={e => setTempExp({...tempExp, startDate: e.target.value})}
                              className="w-full text-stone-950 px-2.5 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-600 mb-1">離任年月（空白代表現職中）</label>
                            <input
                              type="month"
                              value={tempExp.endDate}
                              onChange={e => setTempExp({...tempExp, endDate: e.target.value})}
                              className="w-full text-stone-950 px-2.5 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">離職原因（選填）</label>
                          <input
                            type="text"
                            placeholder="說明離職之事由 (例如: 合約期滿 / 個人生涯規劃)"
                            value={tempExp.leaveReason}
                            onChange={e => setTempExp({...tempExp, leaveReason: e.target.value})}
                            className="w-full text-stone-950 px-2.5 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                          />
                        </div>
                        <div className="flex justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => setExpShowForm(false)}
                            className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-slate-100 border border-stone-200 rounded cursor-pointer"
                          >
                            取消
                          </button>
                          <button
                            type="button"
                            onClick={addExperience}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded cursor-pointer"
                          >
                            確認
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExpShowForm(true)}
                        className="w-full border border-dashed border-stone-200 text-stone-500 p-3 rounded-lg text-xs hover:border-indigo-600 hover:text-indigo-600 transition-colors leading-relaxed block text-center cursor-pointer"
                      >
                        + 點擊新增您的工作經歷
                      </button>
                    )}
                  </div>

                  {/* Education List */}
                  <div className="border-t border-stone-100 pt-6 space-y-3">
                    <span className="block text-xs font-semibold text-stone-500 uppercase tracking-widest">
                      二、教育背景與學歷證明
                    </span>
                    {educations.length === 0 ? (
                      <p className="text-xs text-stone-400 italic bg-stone-50/50 p-4 rounded-lg text-center">
                        尚無學歷紀錄，您可以填入過往的高中、大學、研究所以上學歷。
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {educations.map((edu, idx) => (
                          <div key={idx} className="flex justify-between items-start bg-stone-50 border border-stone-100 p-4 rounded-xl">
                            <div>
                              <strong className="text-xs text-indigo-600 block">{edu.schoolName}</strong>
                              <span className="text-[11px] text-stone-600 font-semibold block">{edu.major ? `${edu.major} ` : ''}({edu.degree || '學位無填寫'})</span>
                              <span className="text-[10px] text-stone-400">就讀期間：{edu.period || '無填'} ｜ 狀態：{edu.status || '未選擇'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeEducation(idx)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Education subform toggle */}
                    {eduShowForm ? (
                      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                              學校名稱 <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={tempEdu.schoolName}
                              onChange={e => setTempEdu({...tempEdu, schoolName: e.target.value})}
                              placeholder="例：台灣大學 / 台北商大"
                              className="w-full text-stone-950 px-2.5 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                              科系
                            </label>
                            <input
                              type="text"
                              value={tempEdu.major}
                              onChange={e => setTempEdu({...tempEdu, major: e.target.value})}
                              placeholder="例：企業管理學系 / 觀光事業科"
                              className="w-full text-stone-950 px-2.5 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-600 mb-1">學位</label>
                            <input
                              type="text"
                              value={tempEdu.degree}
                              onChange={e => setTempEdu({...tempEdu, degree: e.target.value})}
                              placeholder="例：學士 / 碩士 / 副學士 / 高中職"
                              className="w-full text-stone-950 px-2.5 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-600 mb-1">就讀期間</label>
                            <input
                              type="text"
                              value={tempEdu.period}
                              onChange={e => setTempEdu({...tempEdu, period: e.target.value})}
                              placeholder="例：2018年9月 ~ 2022年6月"
                              className="w-full text-stone-950 px-2.5 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                              是否畢業 <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={tempEdu.status}
                              onChange={e => setTempEdu({...tempEdu, status: e.target.value as any})}
                              className="w-full text-stone-950 px-2.5 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                            >
                              <option value="">-- 請選擇 --</option>
                              <option value="畢業">畢業</option>
                              <option value="肄業">肄業</option>
                              <option value="就讀中">就讀中</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => setEduShowForm(false)}
                            className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-slate-100 border border-stone-200 rounded cursor-pointer"
                          >
                            取消
                          </button>
                          <button
                            type="button"
                            onClick={addEducation}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded cursor-pointer"
                          >
                            確認
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEduShowForm(true)}
                        className="w-full border border-dashed border-stone-200 text-stone-500 p-3 rounded-lg text-xs hover:border-indigo-600 hover:text-indigo-600 transition-colors leading-relaxed block text-center cursor-pointer"
                      >
                        + 點擊新增您的教育/學歷背景
                      </button>
                    )}
                  </div>

                  {/* Licenses Rows */}
                  <div className="border-t border-stone-100 pt-6 space-y-4">
                    <span className="block text-xs font-semibold text-stone-500 uppercase tracking-widest">
                      三、持有專業證照與國家資格申報
                    </span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-stone-100 text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                            <th className="pb-2">證照/證書名稱</th>
                            <th className="pb-2">等級/分數說明</th>
                            <th className="pb-2">取得/生效期</th>
                            <th className="pb-2">有效截止限（若無可不填）</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50 text-xs">
                          {licenses.map((lic, val) => (
                            <tr key={val}>
                              <td className="py-2 pr-2">
                                <input
                                  type="text"
                                  placeholder="例：多益 (TOEIC) / 乙級中餐烹調"
                                  value={lic.licenseName}
                                  onChange={e => updateLicense(val, 'licenseName', e.target.value)}
                                  className="w-full text-stone-950 px-2 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-5050 focus:outline-none bg-white font-sans"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input
                                  type="text"
                                  placeholder="例：金級 / 850 分"
                                  value={lic.badgeLevel}
                                  onChange={e => updateLicense(val, 'badgeLevel', e.target.value)}
                                  className="w-full text-stone-950 px-2 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-550 focus:outline-none bg-white font-sans"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input
                                  type="month"
                                  value={lic.issueDate}
                                  onChange={e => updateLicense(val, 'issueDate', e.target.value)}
                                  className="w-full text-stone-950 px-2 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-550 focus:outline-none bg-white font-sans"
                                />
                              </td>
                              <td className="py-2">
                                <input
                                  type="month"
                                  value={lic.expiryDate}
                                  onChange={e => updateLicense(val, 'expiryDate', e.target.value)}
                                  className="w-full text-stone-950 px-2 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-550 focus:outline-none bg-white font-sans"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      type="button"
                      onClick={addLicenseRow}
                      className="text-xs text-indigo-600 font-semibold hover:underline block"
                    >
                      + 新增一列證書欄位
                    </button>
                  </div>

                  {/* Languages Section */}
                  <div className="border-t border-stone-100 pt-6 space-y-4">
                    <span className="block text-xs font-semibold text-stone-500 uppercase tracking-widest font-sans">
                      四、語言能力
                    </span>
                    <p className="text-[11px] text-stone-400 font-sans">
                      請選取您具備的語言能力，若為「其他」請輸入語言名稱，程度區分為：「精通」、「優良」、「中等」、「略懂」（再次點選可取消選取）。
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {languages.map((lang, idx) => {
                        const isOther = lang.language === '其他';
                        return (
                          <div key={idx} className="bg-stone-50 border border-stone-100 p-4 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-stone-800">
                                {isOther ? '其他語言' : `${lang.language}`}
                              </span>
                              {isOther && (
                                <input
                                  type="text"
                                  placeholder="請填寫語言名稱"
                                  value={lang.customName || ''}
                                  onChange={e => {
                                    const newList = [...languages];
                                    newList[idx].customName = e.target.value;
                                    setLanguages(newList);
                                    syncWithServer({ careerData: { experiences, educations, licenses, languages: newList, additionalNotes } });
                                  }}
                                  className="text-xs px-2.5 py-1 border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans w-40 text-stone-900"
                                />
                              )}
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                              {(['精通', '優良', '中等', '略懂'] as const).map(lev => {
                                const active = lang.level === lev;
                                return (
                                  <button
                                    key={lev}
                                    type="button"
                                    onClick={() => {
                                      const newList = [...languages];
                                      newList[idx].level = active ? '' : lev;
                                      setLanguages(newList);
                                      syncWithServer({ careerData: { experiences, educations, licenses, languages: newList, additionalNotes } });
                                    }}
                                    className={`py-1.5 text-[11px] font-medium rounded-lg border transition-all text-center cursor-pointer ${
                                      active
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                                    }`}
                                  >
                                    {lev}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional notes */}
                  <div className="border-t border-stone-100 pt-6">
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      其餘專長、體檢狀況 or 備註事項補充說明
                    </label>
                    <textarea
                      placeholder="如有其餘特殊才能、外語證書、或是體格檢查之特別留言說明，請在此不拘格式自由補充輸入..."
                      value={additionalNotes}
                      onChange={e => setAdditionalNotes(e.target.value)}
                      className="w-full text-stone-950 px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-indigo-500 focus:outline-none min-h-[90px]"
                    />
                  </div>

                  <div className="border-t border-stone-100 pt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => syncWithServer({ careerData: { experiences, educations, licenses, languages, additionalNotes } })}
                      className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                    >
                      暫存學經歷
                    </button>
                    <button
                      type="button"
                      onClick={saveCareer}
                      className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                    >
                      儲存並前往下一步
                    </button>
                  </div>
                </div>
              )}

              {/* 3. File upload Section */}
              {openSection === 'upload' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-2 pb-4 border-b border-stone-100">
                    <Upload className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-base font-semibold text-stone-900">3. 驗查並上傳報到文件 (限定 PDF)</h4>
                      <p className="text-xs text-stone-500">
                        依法配合加保與核驗，請分別點擊上傳下列文件 (限 PDF 格式，最大 10MB)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { id: 'idCard', label: '1. 身分證正反面影本', required: true, desc: '請提供清晰、無反光之身分證正反面合併影本影本 PDF。' },
                      { id: 'degree', label: '2. 最高學歷證明影本', required: true, desc: '請提供最高學歷之畢業證書或同等學力證明 PDF。' },
                      { id: 'military', label: '3. 退伍令', required: false, desc: '男性同仁需檢附，女性同仁免附。若為免役請附免役證明 PDF。', femaleExempt: true },
                      { id: 'healthReport', label: '4. 體檢報告', required: true, desc: '依勞基法規定檢附之特約醫療機構入職體檢合格報告 PDF。' },
                      { id: 'healthIns', label: '5. 原投保單位健保轉出單', required: false, desc: '若要在公司加保健保，請提供前一投保單位之健保轉出證明單 PDF。' },
                      { id: 'bankCover', label: '6. 中國信託銀行帳戶封面影本', required: true, desc: '公司指定撥薪存摺封面 PDF (戶名與帳號必須清晰可辨)。' }
                    ].map((slot) => {
                      const loadedFile = employee.uploadedFiles?.find(f => f.docType === slot.id);
                      return (
                        <div key={slot.id} className="border border-stone-150 rounded-xl p-4 bg-stone-50/40 hover:bg-stone-50/70 transition-colors space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-stone-900">{slot.label}</span>
                              {slot.required ? (
                                <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-100">
                                  必填
                                </span>
                              ) : (
                                <span className="bg-stone-200 text-stone-600 text-[10px] font-medium px-2 py-0.5 rounded border border-stone-300">
                                  {slot.femaleExempt ? '選填 / 女性免附' : '選填'}
                                </span>
                              )}
                            </div>
                            {loadedFile && (
                              <span className="text-[11px] text-[#0D9488] font-semibold bg-[#0D9488]/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 self-start sm:self-auto">
                                <span>● 已上傳</span>
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[11px] text-stone-500 leading-relaxed">{slot.desc}</p>
                          
                          {loadedFile ? (
                            <div className="bg-white border border-[#0D9488]/20 rounded-lg p-3 flex items-center justify-between gap-3 text-xs shadow-sm">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-[#0D9488]" />
                                <span className="font-semibold text-stone-700 truncate">{loadedFile.name}</span>
                                <span className="text-[10px] text-stone-400">({(loadedFile.size / 1024).toFixed(1)} KB)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => deleteUploadedFile(loadedFile.name)}
                                  className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                                  title="移除檔案"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100/50 rounded-lg cursor-pointer transition-colors">
                                <Upload className="w-3.5 h-3.5" />
                                選擇 PDF 檔案上傳
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  className="hidden"
                                  onChange={(e) => handleSlotUploadChange(e, slot.id)}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {fileError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-lg text-xs">
                      {fileError}
                    </div>
                  )}

                  <div className="border-t border-stone-100 pt-6 flex justify-between items-center">
                    <p className="text-[10px] text-stone-400">
                      * 提醒：填妥 4 項必填文件後，該步驟即刻標記為完成。
                    </p>
                    <button
                      type="button"
                      onClick={() => setOpenSection('rules')}
                      className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                    >
                      前往下一步：閱讀規章
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Rules & Disclosures Section */}
              {openSection === 'rules' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-2 pb-4 border-b border-stone-100">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-base font-semibold text-stone-900">4. 閱讀工作規則及個資同意書</h4>
                      <p className="text-xs text-stone-500">為謀求健全共同合作、明定勞資義務權益，請務必詳細瀏覽</p>
                    </div>
                  </div>

                  {/* Centered Google Drive Rules Link */}
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/50 border border-indigo-100 rounded-2xl p-6 text-center space-y-4 max-w-xl mx-auto my-4 shadow-sm">
                      <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center border border-indigo-100 shadow-sm">
                        <FileText className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-sm font-bold text-stone-850">
                          雲朗觀光《工作規程要點及附約說明書》全文
                        </h5>
                        <p className="text-[11px] text-stone-500 leading-relaxed">
                          為維護您的合法勞動與保密權事宜，我們已將全套 27 頁（含性騷擾防治及申訴管道辦法）之完整《工作規程》文件置於 Google 雲端安全空間。
                        </p>
                      </div>
                      <div>
                        <a
                          href="https://drive.google.com/file/d/1m7ogOK0tN95ghoO-eIrs3I1IU7NWBs3X/view?usp=sharing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg active:translate-y-0 hover:-translate-y-0.5 cursor-pointer"
                        >
                          <span>📖 點此於新分頁瀏覽完整規約 (共 27 頁 PDF)</span>
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 py-1 justify-center max-w-md mx-auto">
                      <input
                        type="checkbox"
                        id="rulesCheckbox"
                        checked={rulesRead}
                        onChange={() => setRulesRead(!rulesRead)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <label htmlFor="rulesCheckbox" className="text-xs text-stone-700 select-none cursor-pointer font-semibold leading-normal">
                        我已詳讀並完全承諾遵守「本公司工作規程」之各項共同義務與規範
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-stone-100 pt-7">
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-widest text-center">
                      個人資料蒐集處理與授權同意告知事項
                    </label>
                    <div className="h-100 overflow-y-auto border border-stone-100 rounded-xl p-4 text-[11px] text-stone-500 leading-relaxed space-y-4 bg-stone-50/50 select-none max-w-2xl mx-auto">
                      <p>本公司依個人資料保護法（下稱個資法）第8條第1項規定，向  台端告知下列事項，請台端詳閱：</p>
                      <p>一、 蒐集之目的：</p>
                      <p>     ㄧ)	人事管理（包含甄選、離職及所屬員工基本資訊、現職、學經歷、考績獎懲、薪資待遇、蒐集之目的差勤、福利措施、特殊查核或其他人事措施）</p>
                      <p>     二)	全民健康保險及勞工保險</p>
                      <p>     三)	存款與匯款</p>
                      <p>     四)	契約、類似契約或其他法律關係事務及僱用與服務管理</p>
                      <p>     五)	稅務行政及會計與相關服務</p>
                      <p>     六)	資通安全與管理及資(通)訊與資料庫管理</p>
                      <p>     七)	觀光旅館業、旅館業經營管理業務及其他經營合於營業登記項目或組織章程所定之業務</p>
                      <p>二、	蒐集之個人資料類別</p>
                      <p>     一)	辨識個人者、財務者及政府資料中之辨識者</p>
                      <p>     二)	個性及身體描述、職業、僱用經過、工作經驗、健康紀錄、學校紀錄、犯罪嫌疑資料、家庭情形與家庭成員之細節</p>
                      <p>     三)	薪資與預扣款、健康與安全紀錄、津貼、福利、贈款、社會保險給付、就養給付及其他退休給付、與營業有關之執照、家庭情形與家庭成員之細節</p>
                      <p>     四)	未分類之資料</p>
                      <p>三、	個人資料利用之期間、地區、對象及方式：</p>
                      <p>     一)	期間：個人資料蒐集之特定目的存續期間/依相關法令規定或契約約定之保存年限（如：勞動基準法等）/本公司營運或業務所必須之保存期間。</p>
                      <p>     二)	地區：本國、本公司海外分支機構所在地、未受中央目的事業主管機關限制之國際傳輸個人資料之接收者所在地、本公司業務委外機構所在地、與本公司有業務往來之機構營業處所所在地。</p>
                      <p>     三)	對象：本公司、與本公司有控制關係之母公司暨其分公司或集團關係之公司、未受中央目的事業主管機關限制之國際傳輸個人資料之接收者、其他與本公司或前述公司因業務需要訂有契約關係或有業務往來之機構（含共同行銷、合作推廣）。</p>
                      <p>四、	依個資法第3條規定，台端就本公司保有台端之個人資料得行使下列權利，及行使權利之方式：</p>
                      <p>     一)	得向本公司查詢、請求閱覽或請求製給複製本，而本公司依法得酌收必要成本費用。</p>
                      <p>     二)	得向本公司請求補充或更正，惟依法台端應為適當之釋明。</p>
                      <p>     三)	得向本公司請求停止蒐集、處理或利用及請求刪除，惟依法本公司因執行業務所必須者，得不依台端請求為之。</p>
                      <p>五、	台端不提供個人資料所致權益之影響：</p>
                      <p>     台端得自由選擇是否提供相關個人資料，惟台端若拒絕提供相關個人資料，本公司將無法進行必要之審核、處理、作業或其他相關事項，致可能影響台端權益或無法進行本公司新進人員之進用流程。</p>
                      <p>六、	台端同意本公司有權修訂本告知條款內容，並同意本公司於修訂後，得以言詞、書面、電話、簡訊、電子郵件、傳真、電子文件或其他足以使台端知悉或可得知悉之方式（包括但不限於以前述方式告知提供詳載本告知條款內容之網站連結），告知 台端修訂要點及指定網頁。</p>
                    </div>
                    <div className="flex items-center gap-2.5 py-1 justify-center max-w-lg mx-auto">
                      <input
                        type="checkbox"
                        id="privacyCheckbox"
                        checked={privacyRead}
                        onChange={() => setPrivacyRead(!privacyRead)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <label htmlFor="privacyCheckbox" className="text-xs text-stone-700 select-none cursor-pointer font-semibold leading-normal">
                        我已瞭解並同意上開事項，填寫蒐集、處理及利用個人資料告知條款及相關個人資料欄位暨同意本公司得以法令規定蒐集、處理及利用顧客之個人資料，資料處理地區涵蓋台灣與前述相關對象之所在地。本人已清楚瞭解貴公司蒐集、處理或利用本人個人資料之目的及用途。
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-stone-100 pt-6 flex justify-end">
                    <button
                      type="button"
                      disabled={!rulesRead || !privacyRead}
                      onClick={handleRulesSubmit}
                      className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      確認並送出規章聲明
                    </button>
                  </div>
                </div>
              )}

              {/* 5. Tax Allowance Declaration Section */}
              {openSection === 'tax' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-2 pb-4 border-b border-stone-100">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-base font-semibold text-stone-900">5. 薪資受領人免稅額申報表</h4>
                      <p className="text-xs text-stone-500">此申報表關係到您每月薪資所得撥付時之預扣稅款計算，請詳實填列</p>
                    </div>
                  </div>

                  {/* Prefilled payer info Linked from personal profile */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 md:p-5 space-y-3 shadow-inner">
                    <span className="block text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                      📋 薪資受領人基本資料 (同步自個人基本資料)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="block text-[10px] font-semibold text-stone-500">薪資受領人姓名</span>
                        <span className="text-xs text-stone-850 font-bold bg-white px-2.5 py-1.5 rounded border border-stone-200 block mt-1">
                          {personalForm.name || employee.personalData?.name || employee.name || '未填寫'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold text-stone-500">出生年月日</span>
                        <span className="text-xs text-stone-850 font-medium bg-white px-2.5 py-1.5 rounded border border-stone-200 block mt-1">
                          {personalForm.birthday || employee.personalData?.birthday || '未填寫'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold text-stone-500">國民身分證/統一證號</span>
                        <span className="text-xs text-stone-850 font-mono bg-white px-2.5 py-1.5 rounded border border-stone-200 block mt-1">
                          {personalForm.idNumber || employee.personalData?.idNumber || '未填寫'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold text-stone-500">住址</span>
                        <span className="text-xs text-stone-850 font-medium bg-white px-2.5 py-1.5 rounded border border-stone-200 block mt-1 truncate" title={personalForm.contactAddress || employee.personalData?.contactAddress || '未填寫'}>
                          {personalForm.contactAddress || employee.personalData?.contactAddress || '未填寫'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Spouse section */}
                  <div className="border border-stone-200/80 rounded-2xl p-4 md:p-5 space-y-4">
                    <span className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      👫 薪資受領人配偶資料 (無配偶者免填)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">配偶姓名</label>
                        <input
                          type="text"
                          value={spouseName}
                          onChange={e => {
                            setSpouseName(e.target.value);
                            syncWithServer({ taxDeclaration: { spouseName: e.target.value, spouseBirthday, spouseIdNumber, dependents: taxDependents, signed: taxSigned, signName: taxSignName } });
                          }}
                          placeholder="請輸入姓名"
                          className="w-full text-stone-950 px-2.5 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">配偶出生年月日</label>
                        <input
                          type="text"
                          value={spouseBirthday}
                          onChange={e => {
                            setSpouseBirthday(e.target.value);
                            syncWithServer({ taxDeclaration: { spouseName, spouseBirthday: e.target.value, spouseIdNumber, dependents: taxDependents, signed: taxSigned, signName: taxSignName } });
                          }}
                          placeholder="例：民國75年8月20日"
                          className="w-full text-stone-950 px-2.5 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">配偶身分證號/統一證號</label>
                        <input
                          type="text"
                          value={spouseIdNumber}
                          onChange={e => {
                            setSpouseIdNumber(e.target.value);
                            syncWithServer({ taxDeclaration: { spouseName, spouseBirthday, spouseIdNumber: e.target.value, dependents: taxDependents, signed: taxSigned, signName: taxSignName } });
                          }}
                          placeholder="例：A234567890"
                          className="w-full text-stone-950 px-2.5 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dependents list and edit */}
                  <div className="border border-stone-200/80 rounded-2xl p-4 md:p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                      <span className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                        👨‍👩‍👧‍👦 合於減除扶養親屬免稅額之受扶養親屬 (共 {taxDependents.length} 員)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowDepForm(!showDepForm)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-150 cursor-pointer"
                      >
                        {showDepForm ? '✕ 關閉新增欄' : '＋ 新增受扶養親屬'}
                      </button>
                    </div>

                    {/* Add Dependent Form Inline */}
                    {showDepForm && (
                      <div className="bg-slate-50 border border-indigo-100 rounded-xl p-4 space-y-3.5">
                        <strong className="block text-xs font-bold text-indigo-700">📌 新增受扶養親屬資料</strong>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-stone-600 mb-1">親屬類別</label>
                            <select
                              value={tempDepType}
                              onChange={e => setTempDepType(e.target.value)}
                              className="w-full text-stone-950 px-2 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white"
                            >
                              <option value="直系尊親屬">一、直系尊親屬</option>
                              <option value="子女">二、子女</option>
                              <option value="同胞兄弟姊妹">三、同胞兄弟姊妹</option>
                              <option value="其他親屬">四、其他親屬或家屬</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-stone-600 mb-1">親屬姓名</label>
                            <input
                              type="text"
                              value={tempDepName}
                              onChange={e => setTempDepName(e.target.value)}
                              placeholder="家屬姓名"
                              className="w-full text-stone-950 px-2 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-stone-600 mb-1">稱謂</label>
                            <input
                              type="text"
                              value={tempDepRel}
                              onChange={e => setTempDepRel(e.target.value)}
                              placeholder="例：家嚴 / 次子"
                              className="w-full text-stone-950 px-2 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-stone-600 mb-1">出生年月日</label>
                            <input
                              type="text"
                              value={tempDepBirth}
                              onChange={e => setTempDepBirth(e.target.value)}
                              placeholder="例：民國40年3月1日"
                              className="w-full text-stone-950 px-2 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-stone-600 mb-1">登錄身分證號</label>
                            <input
                              type="text"
                              value={tempDepId}
                              onChange={e => setTempDepId(e.target.value)}
                              placeholder="例：E123456789"
                              className="w-full text-stone-950 px-2 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                            />
                          </div>
                          <div className="md:col-span-2 lg:col-span-4">
                            <label className="block text-[10px] font-semibold text-stone-600 mb-1">符合條件之說明</label>
                            <input
                              type="text"
                              value={tempDepCond}
                              onChange={e => setTempDepCond(e.target.value)}
                              placeholder="例：年滿60歲 / 在校就學 / 無謀生能力並有共同生活事實"
                              className="w-full text-stone-950 px-2 py-1.5 text-xs border border-stone-200 rounded focus:border-indigo-500 focus:outline-none bg-white font-sans"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={addTaxDependent}
                              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded transition cursor-pointer"
                            >
                              ＋ 新增申報亲属
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dependent Group Sections rendered */}
                    <div className="space-y-4">
                      {['直系尊親屬', '子女', '同胞兄弟姊妹', '其他親屬'].map(type => {
                        const list = taxDependents.filter(d => d.type === type);
                        return (
                          <div key={type} className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                            <span className="block text-[10px] font-bold text-[#8D1B1B] mb-2 font-mono">
                              {type === '直系尊親屬' && '一、納稅義務人及其配偶之直系尊親屬 (如父母、祖父母，需滿60歲或無謀生能力者)'}
                              {type === '子女' && '二、子女 (未成年，或已成年在學、身心障礙、無謀生能力者)'}
                              {type === '同胞兄弟姊妹' && '三、同胞兄弟姊妹 (未成年，或已成年在學、身心障礙、無謀生能力者)'}
                              {type === '其他親屬' && '四、其他親屬 or 家屬 (合於民法規定，未成年或已成年在學且具共同生活者)'}
                            </span>
                            {list.length === 0 ? (
                              <p className="text-[10px] text-stone-400 italic pl-2">當前無申報此目指定受扶養親屬</p>
                            ) : (
                              <div className="space-y-1.5 animate-fade-in">
                                {list.map((dep) => {
                                  const actualIdx = taxDependents.indexOf(dep);
                                  return (
                                    <div key={actualIdx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-stone-150 rounded-xl text-xs hover:border-stone-300 transition-colors">
                                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 flex-grow font-sans">
                                        <div>
                                          <span className="text-[10px] text-stone-400 block font-semibold mb-0.5">親屬姓名</span>
                                          <span className="font-bold text-stone-800">{dep.name}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-stone-400 block font-semibold mb-0.5">關係/稱謂</span>
                                          <span className="text-stone-700 font-medium">{dep.relationship}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-stone-400 block font-semibold mb-0.5">出生年月日</span>
                                          <span className="text-stone-700 font-medium">{dep.birthday}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-stone-400 block font-semibold mb-0.5">身分證/統一證號</span>
                                          <span className="text-stone-700 font-mono tracking-wider">{dep.idNumber}</span>
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                          <span className="text-[10px] text-stone-400 block font-semibold mb-0.5">符合撫養之法律要件原因</span>
                                          <span className="text-stone-500 font-medium truncate block max-w-[200px]" title={dep.condition}>{dep.condition}</span>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeTaxDependent(actualIdx)}
                                        className="text-stone-400 hover:text-red-750 p-1.5 rounded-lg hover:bg-stone-50 transition-colors self-end sm:self-auto cursor-pointer"
                                        title="移除此受扶養親屬"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Signature area */}
                  <div className="bg-[#FAF6F0] border-2 border-dashed border-[#8D1B1B]/20 rounded-2xl p-6 space-y-4 shadow-sm text-center">
                    <div className="space-y-1">
                      <strong className="block text-xs font-bold text-stone-850">
                        聲明切結 ── 本人依所得稅法規定，證明以上填報事項均確實無訛
                      </strong>
                      <p className="text-[10px] text-stone-500 leading-relaxed max-w-lg mx-auto">
                        本表係依所得稅法第十七條第一項第一款規定申報免稅額之用。受領人填報之受扶養親屬，其身分、關係、生日及所得狀況等，如有不實、重複申報，願自負法律責任。
                      </p>
                    </div>

                    {employee.taxDeclaration?.signed ? (
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-4 rounded-xl text-center text-xs space-y-2 max-w-md mx-auto shadow-sm flex flex-col justify-center items-center">
                        <p className="font-bold">🎉 免稅額申報表數位簽署已成功歸卷！</p>
                        <p className="text-[10px] text-emerald-600/90 font-mono">
                          安全核對人：<strong>{employee.taxDeclaration.signName}</strong> ｜ 簽署時間：<strong>{employee.taxDeclaration.signedAt}</strong>
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                        <div className="w-full">
                          <input
                            type="text"
                            value={taxSignName}
                            onChange={e => {
                              setTaxSignName(e.target.value);
                              syncWithServer({ taxDeclaration: { spouseName, spouseBirthday, spouseIdNumber, dependents: taxDependents, signed: taxSigned, signName: e.target.value } });
                            }}
                            placeholder="請在此輸入您的姓名作為數位印鑑章"
                            className="w-full text-stone-950 px-3 py-2 text-xs border border-stone-200 rounded-xl focus:border-indigo-500 focus:outline-none bg-white font-semibold font-sans text-center"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTaxSave(true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-xs font-bold rounded-xl shadow-md transition whitespace-nowrap cursor-pointer hover:scale-105"
                        >
                          簽署並儲存至下一步
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 6. Direct Contract Agreement Section */}
              {openSection === 'contract' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-2 pb-4 border-b border-stone-100">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-base font-semibold text-stone-900">6. 簽署集團聘僱合約書</h4>
                      <p className="text-xs text-stone-500">線上合約簽核，請確認合約條款與各項約定事項後，執行數位安全簽章</p>
                    </div>
                  </div>

                  {(() => {
                    const dObj = employee.onboardDate ? new Date(employee.onboardDate) : new Date();
                    const rocYear = isNaN(dObj.getTime()) ? 115 : dObj.getFullYear() - 1911;
                    const rocMonth = isNaN(dObj.getTime()) ? 6 : dObj.getMonth() + 1;
                    const rocDay = isNaN(dObj.getTime()) ? 15 : dObj.getDate();
                    const companyDetails = getCompanyDetails(employee);
                    return (
                      <div className="border border-stone-300 bg-[#FCFBF7] rounded-2xl p-6 md:p-8 space-y-6 max-h-[500px] overflow-y-auto text-stone-800 font-sans text-xs leading-relaxed shadow-inner border-t-4 border-t-amber-805">
                        <div className="space-y-2 text-center pb-2">
                          <h2 className="text-base font-bold text-stone-900 tracking-wider">
                            {companyDetails.name}
                          </h2>
                          <h3 className="text-sm font-bold text-stone-850 tracking-widest border-b border-stone-300 pb-4">
                            聘 僱 合 約 書
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-stone-900 leading-loose">
                          <div className="flex items-center gap-1.5 md:justify-end">
                            <div>
                             立契約人：<span className="text-stone-900 font-bold border-b border-stone-500 px-2">{companyDetails.name}</span>(以下簡稱甲方)
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5 md:justify-end">
                             立契約人：<span className="border-b border-stone-300 font-bold text-indigo-700 px-4 py-0.5 bg-slate-50 rounded"> {personalForm.name || employee.personalData?.name || employee.name || '未填寫'}</span>(以下簡稱乙方)
                          </div>
                        </div>

                        <p className="mt-4 font-semibold text-stone-900 leading-relaxed bg-[#FAF6F0] p-3 rounded-lg border border-dashed border-[#8D1B1B]/15">
                          茲因甲方僱用乙方為員工，雙方同意訂立本契約，共同遵守約定條款如下：
                        </p>

                        <ol className="space-y-5 text-stone-800 text-[11px] leading-relaxed">
                          <li>
                            <strong className="text-stone-950 text-xs font-bold block mb-1">一、契約期間及試用期：</strong>
                            本契約自中華民國 <strong>{rocYear}</strong> 年 <strong>{rocMonth}</strong> 月 <strong>{rocDay}</strong> 日起。試用期間為 
                            <span className="font-bold border-b border-stone-400 px-3 py-0.5 bg-stone-100 rounded text-stone-900 mx-1 inline-block selection:bg-indigo-200">
                              {employee.contractProbationMonths || '三'}
                            </span>
                            個月，試用期間得隨時終止契約，試用期滿考核不合格者，依勞基法規定辦理。乙方於試用期間如欲離職，應於七日前預告。若有必要，試用期間可再展延一期。
                          </li>

                          <li>
                            <strong className="text-stone-950 text-xs font-bold block mb-1">二、工作項目：</strong>
                            擔任 <strong>{employee.department || '餐飲服務'}</strong> 之 <strong>{employee.title || '服務專員'}</strong> 工作。
                          </li>

                          <li>
                            <strong className="text-stone-950 text-xs font-bold block mb-1">三、工作規則：</strong>
                            乙方同意遵守甲方制定之工作規則及規章制度。
                          </li>

                          <li>
                            <strong className="text-stone-950 text-xs font-bold block mb-1">四、工作地點：</strong>
                            乙方接受在 <span className="text-stone-950 font-bold border-b border-stone-300 px-2 bg-stone-50">{employee.contractWorkLocation || '君品酒店 (台北) (台北市承德路一段3號)'}</span> 地方擔任約定之工作。
                          </li>

                          <li>
                            <strong className="text-stone-950 text-xs font-bold block mb-1">五、工作轉換：</strong>
                            甲方因營業或工作需要，得適當派任、兼任、轉調或輪調乙方至其他班別、職務或至各地分支機構，乙方同意接受甲方之調動。
                          </li>

                          <li>
                            <strong className="text-stone-950 text-xs font-bold block mb-1">六、工作時間：</strong>
                            乙方同意每日正常工作時間為依公司規定之起迄時間辦理。
                            如因業務所需得採四週變形工時，甲方得彈性調整休假及工時之起迄，並得於事前公告周知。
                            甲方因業務需要得延長乙方延長工作時間時，其延時工資之給付，依勞動基準法之規定辦理，惟應依甲方規定之加班程序辦理，並應加班前提出申請經核後始得計入加班費。出勤紀錄不實者應予註銷。若乙方為另行約定薪資給付方式人員，則依工作達成狀況，自行調整工作時間，不適用前揭之規定。
                          </li>

                          <li>
                            <strong className="text-stone-950 text-xs font-bold block mb-1">七、休假排定：</strong>
                            <div className="space-y-2.5 mt-2 bg-stone-50 border border-stone-150 rounded-xl p-3 text-[11px] text-stone-800">
                              {(employee.contractLeaveOption || 'biweekly') === 'monthly' ? (
                                <div className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#8D1B1B] mt-1.5 flex-shrink-0"></span>
                                  <span>
                                    依雙方約定於符合法令規定範圍內，由甲方排定休假方式月排休 <span className="text-stone-950 font-bold border-b border-stone-300 px-2 bg-stone-50 font-mono">{employee.contractLeavedays || '8-10'}</span> 日。
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#8D1B1B] mt-1.5 flex-shrink-0"></span>
                                  <span>於符合法定工作時數規定之前提，採 <strong>週休二日制</strong>。</span>
                                </div>
                              )}
                              <p className="text-[10px] text-stone-500 border-t border-stone-200/60 pt-2 leading-relaxed">
                                甲方因業務需要乙方配合採排班排休或畫夜輪班方式工作，且同意甲方得將休假日、國定假日與其他工作日挪移，挪移後之休假日、國定假日已成正常工作日，乙方於休假日出勤不生加倍工資。
                              </p>
                            </div>
                          </li>

                          <li>
                            <strong className="text-stone-950 text-xs font-bold block mb-1">八、工資議定：</strong>
                            次月 5 日為發薪日 (如遇例假日則提前至前一工作日)。薪資作業採取保密制，不得討論或洩漏第三者。若乙方離職須完成離職交接手續，無法完成離職交接手續，離職當月薪資改依公司規定之日期及方式發放。
                            <div className="space-y-2 mt-2 bg-stone-50 border border-stone-150 rounded-xl p-3 text-[11px] text-stone-800">
                              {(employee.contractSalaryType || 'monthly') === 'monthly' && (
                                <div className="flex items-center gap-1.5 font-sans">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#8D1B1B] flex-shrink-0"></span>
                                  <span>
                                    雙方議定為<strong>月薪制</strong>，每月薪津為新台幣 <span className="text-stone-950 font-bold border-b border-stone-300 px-2 bg-stone-50 font-mono text-xs">{employee.contractSalaryAmount || '36,000'}</span> 元。
                                  </span>
                                </div>
                              )}
                              {(employee.contractSalaryType || 'monthly') === 'daily' && (
                                <div className="flex items-center gap-1.5 font-sans">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#8D1B1B] flex-shrink-0"></span>
                                  <span>
                                    雙方議定為<strong>日薪制</strong>，每日薪津為新台幣 <span className="text-stone-950 font-bold border-b border-stone-300 px-2 bg-stone-50 font-mono text-xs">{employee.contractSalaryAmount || '1,800'}</span> 元。
                                  </span>
                                </div>
                              )}
                              {(employee.contractSalaryType || 'monthly') === 'hourly' && (
                                <div className="flex items-center gap-1.5 font-sans">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#8D1B1B] flex-shrink-0"></span>
                                  <span>
                                    雙方議定為<strong>時薪制</strong>，每小時薪津為新台幣 <span className="text-stone-950 font-bold border-b border-stone-300 px-2 bg-stone-50 font-mono text-xs">{employee.contractSalaryAmount || '190'}</span> 元。
                                  </span>
                                </div>
                              )}
                            </div>
                          </li>

                          <li>
                            <strong className="text-stone-950 text-xs font-bold block mb-1">九、智慧財產權約定：</strong>
                            <div className="space-y-1.5 mt-1 pl-2">
                              <p>（一） 乙方確認於任職期間提供之勞務、資訊絕無侵害前任公司或其他第三人之智慧財產權、營業秘密或應履行之保密義務（包括但不限於競業禁止）。</p>
                              <p>（二） 乙方並保證於任職期間所提供或完成之智慧財產成果，均係由乙方自行創作，且絕無抄襲或仿冒他人之著作，並確實尊重他人之智慧財產權。</p>
                              <p>（三） 於任職期間，於職務上所完成之著作，同意以甲方或其代表人為著作人，相關之著作人格權及著作財產權皆歸甲方自始所有。</p>
                            </div>
                          </li>

                          <li>
                            <strong className="text-stone-950 text-xs font-bold block mb-1">十、保密條款：</strong>
                            乙方保證任職或受僱研究期間不使用、利用、複製、保留因參與工作任務所取得、知悉之任何經營資訊、營業秘密、機密文件，亦不以任何形式，直接或間接對第三人洩露、移轉或評論，或提供第三人使用。離職後亦負有上述保密義務，並同意於離職時簽署「離職申請單」中之保密相關約定。如有違反致甲方發生損失，同意負擔賠償責任。
                          </li>

                          <li>
                            <strong className="text-stone-950 text-xs font-bold block mb-1">十一、個資保護：</strong>
                            乙方因職務涉及之職務涉及及蒐集、處理、利用個人資料之行為者，乙方擔保遵循我國「個人資料保護法」及歐盟「資料保護一般規則(General Data Protection Regulation, GDPR)」相關規定，並同意恪守職責遵守甲方關於個人資料保護所訂定之相關制度、辦法及措施。
                          </li>
                        </ol>

                        {/* Sigs area */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-stone-300 font-sans text-[10px] text-stone-600 mt-6 leading-loose">
                          <div className="space-y-1">
                            <strong className="text-stone-900 text-xs font-bold block mb-1.5">甲方 (立契約人)</strong>
                            <div>公司名稱：{companyDetails.name}</div>
                            <div>統一編號：{companyDetails.taxId}</div>
                            <div>負責人：{companyDetails.owner}</div>
                            <div>公司地址：{companyDetails.address}</div>
                          </div>
                          <div className="space-y-1 bg-indigo-50/20 border border-stone-150 p-3 rounded-xl">
                            <strong className="text-stone-900 text-xs font-bold block mb-1.5">乙方 (立契約人)</strong>
                            <div>乙方姓名：<strong className="text-indigo-700 font-bold text-xs">{personalForm.name || employee.personalData?.name || employee.name}</strong></div>
                            <div>身分證號：<strong className="font-mono tracking-wider">{personalForm.idNumber || employee.personalData?.idNumber || '待補填個人基本資料'}</strong></div>
                            <div>現設住址：{personalForm.contactAddress || employee.personalData?.contactAddress || '待補填個人基本資料'}</div>
                            <div>簽署狀態：{employee.contractSigned ? (
                              <span className="text-emerald-700 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded">
                                已完成線上數位簽署 (生效)
                              </span>
                            ) : (
                              <span className="text-indigo-600 font-bold">待數位簽署</span>
                            )}</div>
                            {employee.contractSigned && (
                              <div className="text-stone-400 mt-1">
                                數位印鑑歸檔時間：{employee.contractDate}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {employee.contractSigned ? (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-5 rounded-2xl text-center text-xs space-y-3 flex flex-col items-center justify-center">
                      <p className="font-bold">🎉 這是生效的網頁確認，您已在 <strong>{employee.contractDate}</strong> 執行合約確認簽署！</p>
                      <button
                        type="button"
                        onClick={() => setPrintContractOpen(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        列印 / 匯出 A4 聘僱合約書 (PDF)
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 bg-stone-50 p-5 border border-stone-200 rounded-xl text-center">
                      <span className="text-xs text-stone-500">
                        點擊下方進行確認，將以 <strong>{personalForm.name || employee.name}</strong> 的名義對合約進行數位認證並存檔。
                      </span>
                      <button
                        type="button"
                        onClick={handleContractSign}
                        className="px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        我同意並完成聘僱合約簽署
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 7. Direct Guarantor Agreement Section */}
              {openSection === 'guarantor' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-2 pb-4 border-b border-stone-100">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-base font-semibold text-stone-900">7. 簽署集團職員保證書 (人事聯保)</h4>
                      <p className="text-xs text-stone-500">請填寫您的連帶保證人(聯保人)基本聯絡資訊，並完成數位特保認證</p>
                    </div>
                  </div>

                  {(() => {
                    const companyDetails = getCompanyDetails(employee);
                    return (
                      <div className="space-y-6">
                        <div className="border border-stone-300 bg-[#FCFBF7] rounded-2xl p-6 md:p-8 max-h-[420px] overflow-y-auto text-stone-850 font-sans text-xs leading-relaxed shadow-inner border-t-4 border-t-amber-805 space-y-4">
                          <div className="space-y-2 text-center pb-2">
                            <h2 className="text-base font-bold text-stone-900 tracking-wider">
                              {companyDetails.name}
                            </h2>
                            <h3 className="text-sm font-bold text-stone-850 tracking-widest border-b border-stone-300 pb-4">
                              職 員 保 證 書
                            </h3>
                          </div>

                          <p className="font-semibold text-stone-900 leading-relaxed bg-[#FAF6F0] p-3 rounded-lg border border-dashed border-[#8D1B1B]/15 text-justify">
                            立保證書人茲保證 <strong>{personalForm.name || employee.name}</strong> 君（以下簡稱被保證人）在貴公司（<strong>{companyDetails.name}</strong>）擔任職務期間，遵守貴公司所訂定之一切規章。倘有違背情事或侵佔公款、財物及其他危害公司行為，致損害於貴公司時，除被保證人應受法律制裁及公司處分外，保證人同意放棄先訴抗辯權，對被保證人之債務負完全賠償責任。
                          </p>

                          <div className="space-y-3">
                            <h4 className="font-bold text-stone-950 border-b border-stone-200 pb-1 text-xs">【保證規約摘要】</h4>
                            <p className="text-[11px] text-stone-600 leading-normal pl-2">
                              1. 保證人須為年滿二十歲以上有正當職業及固定住所之個人。<br />
                              2. 被保證人之配偶與同公司職員不得互為保證人。<br />
                              3. 保證期間如有住址變更、離職、退保需求，應第一時間以書面形式申報。
                            </p>
                          </div>
                        </div>

                        {/* Guarantor Info Inputs */}
                        {!employee.guarantorSigned && (
                          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 md:p-5 space-y-4">
                            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 mb-1">
                              <span className="text-xs font-bold text-slate-800">✍️ 填寫連帶保證人(聯保人)基本個資</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-[11px] font-semibold text-stone-600 mb-1">保證人姓名 <span className="text-rose-500">*</span></label>
                                <input
                                  type="text"
                                  value={guarantorForm.guarantorName}
                                  onChange={e => {
                                    const updated = { ...guarantorForm, guarantorName: e.target.value };
                                    setGuarantorForm(updated);
                                  }}
                                  placeholder="請輸入姓名"
                                  className="w-full text-stone-950 px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-stone-600 mb-1">保證人出生年月日 <span className="text-rose-500">*</span></label>
                                <input
                                  type="text"
                                  value={guarantorForm.birthday}
                                  onChange={e => {
                                    const updated = { ...guarantorForm, birthday: e.target.value };
                                    setGuarantorForm(updated);
                                  }}
                                  placeholder="例：民國70年5月20日"
                                  className="w-full text-stone-950 px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-stone-600 mb-1">保證人身分證號 <span className="text-rose-500">*</span></label>
                                <input
                                  type="text"
                                  value={guarantorForm.idNumber}
                                  onChange={e => {
                                    const updated = { ...guarantorForm, idNumber: e.target.value };
                                    setGuarantorForm(updated);
                                  }}
                                  placeholder="例：A123456789"
                                  className="w-full text-stone-950 px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-[11px] font-semibold text-stone-600 mb-1">保證人現住地址 <span className="text-rose-500">*</span></label>
                                <input
                                  type="text"
                                  value={guarantorForm.address}
                                  onChange={e => {
                                    const updated = { ...guarantorForm, address: e.target.value };
                                    setGuarantorForm(updated);
                                  }}
                                  placeholder="請核實輸入完整地址"
                                  className="w-full text-stone-950 px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-stone-600 mb-1">保證人聯絡電話 <span className="text-rose-500">*</span></label>
                                <input
                                  type="text"
                                  value={guarantorForm.phone}
                                  onChange={e => {
                                    const updated = { ...guarantorForm, phone: e.target.value };
                                    setGuarantorForm(updated);
                                  }}
                                  placeholder="請輸入手機或住家電話"
                                  className="w-full text-stone-950 px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-stone-600 mb-1">與被保證人關係 <span className="text-rose-500">*</span></label>
                                <input
                                  type="text"
                                  value={guarantorForm.relationship}
                                  onChange={e => {
                                    const updated = { ...guarantorForm, relationship: e.target.value };
                                    setGuarantorForm(updated);
                                  }}
                                  placeholder="如：父、母、兄弟、朋友..."
                                  className="w-full text-stone-950 px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-stone-600 mb-1">服務機構名稱</label>
                                <input
                                  type="text"
                                  value={guarantorForm.companyName}
                                  onChange={e => {
                                    const updated = { ...guarantorForm, companyName: e.target.value };
                                    setGuarantorForm(updated);
                                  }}
                                  placeholder="例：台灣水泥股份有限公司"
                                  className="w-full text-stone-950 px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-stone-600 mb-1">機構擔任職位</label>
                                <input
                                  type="text"
                                  value={guarantorForm.companyTitle}
                                  onChange={e => {
                                    const updated = { ...guarantorForm, companyTitle: e.target.value };
                                    setGuarantorForm(updated);
                                  }}
                                  placeholder="例：經理、課員..."
                                  className="w-full text-stone-950 px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-[11px] font-semibold text-stone-600 mb-1">機構服務地址</label>
                                <input
                                  type="text"
                                  value={guarantorForm.companyAddress}
                                  onChange={e => {
                                    const updated = { ...guarantorForm, companyAddress: e.target.value };
                                    setGuarantorForm(updated);
                                  }}
                                  placeholder="請輸入保證人服務公司的地址"
                                  className="w-full text-stone-950 px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-stone-600 mb-1">機構聯絡電話</label>
                                <input
                                  type="text"
                                  value={guarantorForm.companyPhone}
                                  onChange={e => {
                                    const updated = { ...guarantorForm, companyPhone: e.target.value };
                                    setGuarantorForm(updated);
                                  }}
                                  placeholder="例：02-21234567"
                                  className="w-full text-stone-950 px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                            </div>
                            <div className="flex justify-start text-[10px] text-stone-500 italic">
                              * 保證規約：保證人應隨同本保證書交付身份證（影本一份）至人事單位核對留底存卷。
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {employee.guarantorSigned ? (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-5 rounded-2xl text-center text-xs space-y-3 flex flex-col items-center justify-center">
                      <p className="font-bold">🎉 這是生效的網頁確認，您已在 <strong>{employee.guarantorDate}</strong> 執行職員保證書簽署！</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 bg-stone-50 p-5 border border-stone-200 rounded-xl text-center">
                      <span className="text-xs text-stone-500">
                        點擊下方進行正式確認，系統將建立加密的數位簽署存檔，並將該簽署生效職員保證書並留檔於HR資料庫中。
                      </span>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleGuarantorSign(false)}
                          className="px-5 py-2.5 bg-stone-200 text-stone-700 hover:bg-stone-300 font-semibold text-xs rounded-xl transition cursor-pointer"
                        >
                          暫存保證人資訊
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGuarantorSign(true)}
                          className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          我同意並完成職員保證書簽署 (前往下一步)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 8. Direct Service Agreement Section */}
              {openSection === 'service' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-2 pb-4 border-b border-stone-100">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-base font-semibold text-stone-900">8. 簽署職工服務約定</h4>
                      <p className="text-xs text-stone-500">線上職工服務約定，承諾遵守以客為尊、試用期約定、個資守則及保密條款等規範</p>
                    </div>
                  </div>

                  {(() => {
                    const companyDetails = getCompanyDetails(employee);
                    const dObj = employee.onboardDate ? new Date(employee.onboardDate) : new Date();
                    const rocYear = isNaN(dObj.getTime()) ? 115 : dObj.getFullYear() - 1911;
                    const rocMonth = isNaN(dObj.getTime()) ? 6 : dObj.getMonth() + 1;
                    const rocDay = isNaN(dObj.getTime()) ? 15 : dObj.getDate();
                    return (
                      <div className="border border-stone-300 bg-[#FCFBF7] rounded-2xl p-6 md:p-8 space-y-5 max-h-[500px] overflow-y-auto text-stone-800 font-sans text-xs leading-relaxed shadow-inner border-t-4 border-t-amber-805">
                        <div className="space-y-2 text-center pb-2">
                          <h2 className="text-base font-bold text-stone-900 tracking-wider">
                            {companyDetails.name}
                          </h2>
                          <h3 className="text-sm font-bold text-stone-850 tracking-widest border-b border-stone-300 pb-4">
                            職 工 服 務 約 定
                          </h3>
                        </div>

                        <div className="space-y-4 text-xs font-serif leading-relaxed text-justify">
                          <p><strong>第一條：</strong>本公司職工任職期間須以客為尊，並遵守本公司各項規章。</p>
                          <p><strong>第二條：</strong>職工同意自實際工作日起九十天內為試用期間，在此期間如工作能力不足或服務態度不滿意或為本公司評估無法勝任所應徵之職務，得依相關規定停止試用。</p>
                          <p><strong>第三條：</strong>職工應依「個人資料保護法」不得將顧客或本公司員工之個人資料提供予無關之第三人。</p>
                          <p><strong>第四條：</strong>就職工所填寫個人資料，本公司、分公司及關係企業（下稱本公司）將於職工聘僱期間，於中華民國地區，作為人事管理、組織調整、及與營運有關之使用。</p>
                          <p><strong>第五條：</strong>本公司依「個人資料保護法」不會提供予無關之第三人。職工依「個人資料保護法」並可向本公司為個人資料查詢、請求閱覽、補充或更正或請求交付複製本。另，雖亦可請求停止蒐集、處理或利用及刪除，但於聘僱關係存續期間，或聘僱關係終止後，本公司因執行職務 or 業務所必須者，職工無權請求停止蒐集、處理或利用及刪除。</p>
                          
                          <div className="p-3 bg-stone-50 border border-stone-150 rounded-xl text-stone-900 font-bold mt-2 leading-relaxed">
                            以上守則，經本人（{personalForm.name || employee.name}）逐條仔細閱讀並為同意。本人願意遵守，如有違反，願依照本公司員工手冊第十二條職工獎懲辦法處理，絕無異議。
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-stone-200 pt-4 text-[10px] text-stone-500">
                          <div>
                            立同意書人：<strong className="text-indigo-700 text-xs border-b border-stone-300 px-3 pl-1 inline-block">{personalForm.name || employee.name}</strong>（簽章）
                          </div>
                          <div className="text-right font-bold mt-1.5 font-sans whitespace-nowrap">
                            中華民國 {rocYear} 年 {rocMonth} 月 {rocDay} 日
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {employee.serviceSigned ? (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-5 rounded-2xl text-center text-xs space-y-3 flex flex-col items-center justify-center">
                      <p className="font-bold">🎉 這是生效的網頁確認，您已在 <strong>{employee.serviceDate}</strong> 職工服務約定簽署！</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 bg-stone-50 p-5 border border-stone-200 rounded-xl text-center">
                      <span className="text-xs text-stone-500">
                        點擊下方進行確認，將以 <strong>{personalForm.name || employee.name}</strong> 的名義對本服務約定進行數位認證並備存檔案。
                      </span>
                      <button
                        type="button"
                        onClick={handleServiceSign}
                        className="px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        我已詳細閱讀並同意遵守本職工服務約定
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Default Welcome if none expanded */}
              {!openSection && (
                <div className="bg-white border border-[#E9E1D6] rounded-2xl p-12 text-center space-y-4">
                  <CheckCircle className="w-12 h-12 text-[#8D1B1B] mx-auto opacity-70 animate-pulse" />
                  <h4 className="text-sm font-semibold text-stone-800">
                    {employee.status === 'completed' ? '任務均已大功告成！' : '請選擇一個任務開始填答'}
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
                    左側清單顯示目前報到資料的填寫進度，您可以點選其中一項以修改或是填寫您的資料。
                  </p>
                </div>
              )}

            </div>

          </div>
        )}

        {/* Tab 2: Training Booklet Section */}
        {activeTab === 'training' && (
          <div className="bg-white border border-[#EAE4DC] rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-stone-100">
              <BookOpen className="w-5 h-5 text-[#8D1B1B]" />
              <div>
                <h4 className="text-base font-semibold text-stone-900">雲朗觀光新進同仁入職教育訓練導讀</h4>
                <p className="text-xs text-stone-500">
                  幫助您快速跨越起步期，融入雲朗觀光的文化及環境
                </p>
              </div>
            </div>

            {/* 教學導覽 Section */}
            <div className="bg-[#FAF8F5] border border-[#E9E1D6] rounded-2xl p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-2 select-none">
                <span className="text-xs font-bold text-[#8D1B1B] px-2.5 py-0.5 bg-[#8D1B1B]/10 rounded-md font-sans">
                  教學導覽
                </span>
                <span className="text-xs font-medium text-stone-600">雲朗觀光培訓系統與人事請假系統操作說明</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* 左側：雲朗知識庫 */}
                <div className="space-y-4 w-full max-w-md">
                  {/* 雲朗知識庫連結 */}
                  <div className="w-full">
                    <a 
                      href="https://elearning.ldchotels.com/cltcms/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="group flex items-center justify-between p-6 w-full border border-[#8D1B1B]/20 hover:border-[#8D1B1B] bg-white hover:bg-[#8D1B1B]/5 rounded-xl transition shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-[#8D1B1B]/10 flex items-center justify-center text-[#8D1B1B] group-hover:scale-105 transition-transform">
                          <BookOpen className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="text-left">
                          <span className="block text-xs font-bold text-[#8D1B1B]">雲朗知識庫</span>
                          <span className="block text-[10px] text-stone-400 font-mono">eHRD 線上培訓及學習平台↗</span>
                        </div>
                      </div>
                      <span className="text-xs text-[#8D1B1B] font-bold group-hover:translate-x-1 transition-transform">→</span>
                    </a>
                  </div>

                  {/* 下面放置說明 */}
                  <div className="text-xs text-stone-600 bg-white border border-[#E9E1D6]/60 p-6 rounded-xl w-full space-y-2 font-sans shadow-sm">
                    <div className="flex items-center gap-1.5 font-bold text-stone-800 border-b border-stone-100 pb-1.5 mb-1.5 text-[11px] select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8D1B1B]"></span>
                      學習平台登入資訊：
                    </div>
                    <div className="font-mono flex flex-col gap-1.5">
                      <div className="flex items-start gap-1">
                        <span className="w-4 text-[#8D1B1B] font-bold">▪</span>
                        <div>
                          <span className="font-sans font-semibold text-stone-500">登入帳號：</span>
                          <span className="font-semibold text-stone-800 font-sans">員工編號</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="w-4 text-[#8D1B1B] font-bold">▪</span>
                        <div>
                          <span className="font-sans font-semibold text-stone-500">密碼：</span>
                          <span className="font-semibold text-stone-800 font-sans">您的身分證字號(初始密碼)</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-stone-400 font-sans italic pt-1 border-t border-stone-50 select-none">
                      * 初始登入本系統後建議立即更改密碼，以確保您的個資安全。
                    </p>
                  </div>
                </div>

                {/* 右側：德安Flow系統 */}
                <div className="space-y-4 w-full max-w-md">
                  {/* 德安Flow系統連結 */}
                  <div className="w-full">
                    <a 
                      href="https://hrms.ldchotels.com/pms/node/api/callback/eip/305" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="group flex items-center justify-between p-6 w-full border border-[#8D1B1B]/20 hover:border-[#8D1B1B] bg-white hover:bg-[#8D1B1B]/5 rounded-xl transition shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#8D1B1B]/10 flex items-center justify-center text-[#8D1B1B] group-hover:scale-105 transition-transform">
                          <Layers className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="text-left">
                          <span className="block text-xs font-bold text-[#8D1B1B]">德安Flow系統</span>
                          <span className="block text-[10px] text-stone-400 font-mono">人事請假及出缺勤紀錄查詢平台↗</span>
                        </div>
                      </div>
                      <span className="text-xs text-[#8D1B1B] font-bold group-hover:translate-x-1 transition-transform">→</span>
                    </a>
                  </div>

                  {/* 下面放置說明 */}
                  <div className="text-xs text-stone-600 bg-white border border-[#E9E1D6]/60 p-6 rounded-xl w-full space-y-2 font-sans shadow-sm">
                    <div className="flex items-center gap-1.5 font-bold text-stone-800 border-b border-stone-100 pb-1.5 mb-1.5 text-[11px] select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8D1B1B]"></span>
                      德安Flow登入資訊：
                    </div>
                    <div className="font-mono flex flex-col gap-1.5">
                      <div className="flex items-start gap-1">
                        <span className="w-4 text-[#8D1B1B] font-bold">▪</span>
                        <div>
                          <span className="font-sans font-semibold text-stone-500">登入帳號：</span>
                          <span className="font-semibold text-stone-800 font-sans">員工編號</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="w-4 text-[#8D1B1B] font-bold">▪</span>
                        <div>
                          <span className="font-sans font-semibold text-stone-500">密碼：</span>
                          <span className="font-semibold text-stone-800 font-sans">mis(初始密碼)</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-stone-400 font-sans italic pt-1 border-t border-stone-50 select-none">
                      * 初始密碼由系統自動配置，登入後建議立即進行安全性修改。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <a 
                href="https://drive.google.com/file/d/16cddV6W-77rVwhuU7iiQ9wnfAJa7re4j/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="group block border border-stone-200/60 p-5 rounded-2xl space-y-2.5 bg-white hover:border-[#8D1B1B]/40 hover:bg-[#8D1B1B]/5 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between">
                   <span className="text-[10px] uppercase font-bold text-[#8D1B1B] tracking-widest block">課程一</span>
                   <span className="text-[10px] font-bold text-[#8D1B1B] bg-[#8D1B1B]/10 px-2 py-0.5 rounded-full flex items-center gap-1 group-hover:scale-105 transition-transform">
                     <FileText className="w-3 h-3" />
                     開啟教學 ↗
                   </span>
                </div>
                <strong className="text-sm block text-stone-900 font-bold group-hover:text-[#8D1B1B] transition-colors">
                  雲朗觀光培訓系統教學步驟
                </strong>
                <p className="text-xs text-stone-500 leading-relaxed group-hover:text-stone-600 transition-colors">
                  手把手教學，讓新進員工使用系統不孤單，也無須害怕陌生環境與同事不敢提問的窘境，看完教學一次就上手，更能快速瞭解集團組織與文化。
                </p>
              </a>

              <a 
                href="https://drive.google.com/file/d/19IH9CBkOyIL4eyA_lvhsfsA0jK7X3l_f/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="group block border border-stone-200/60 p-5 rounded-2xl space-y-2.5 bg-white hover:border-[#8D1B1B]/40 hover:bg-[#8D1B1B]/5 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between">
                   <span className="text-[10px] uppercase font-bold text-[#8D1B1B] tracking-widest block">課程二</span>
                   <span className="text-[10px] font-bold text-[#8D1B1B] bg-[#8D1B1B]/10 px-2 py-0.5 rounded-full flex items-center gap-1 group-hover:scale-105 transition-transform">
                     <FileText className="w-3 h-3" />
                     開啟教學 ↗
                   </span>
                </div>
                <strong className="text-sm block text-stone-900 font-bold group-hover:text-[#8D1B1B] transition-colors">
                  德安Flow系統教學步驟
                </strong>
                <p className="text-xs text-stone-500 leading-relaxed group-hover:text-stone-600 transition-colors">
                  手把手教學，讓新進員工可以瞭解如何查詢自身出缺勤狀況以及如何獨立完成線上請假，讓架單不再卡關，也無須讓別人知道你請了什麼假，化解尷尬氛圍。
                </p>
              </a>
            </div>
            
            <div className="bg-amber-50/30 p-5 rounded-xl border border-amber-100 flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#8D1B1B] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-[#8D1B1B] block">提醒：</strong>
                <p className="text-[11px] text-stone-600 mt-1">
                  後續的線上測驗及新人訓練，人資處將會在您完成報到後，另行通知。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: AI chatbot panel */}
        {activeTab === 'ai' && (
          <div className="bg-white border border-[#EAE4DC] flex flex-col rounded-2xl h-[560px] overflow-hidden shadow-sm">
            
            {/* Header info */}
            <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#8D1B1B] flex items-center justify-center text-[#D4AF37]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-stone-900">雲朗觀光 AI 秘書</h4>
                  <p className="text-[10px] text-stone-500">24H及時為您解答特休福利、工作時間及合約內容等相關問題</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                • 隨時在線
              </span>
            </div>

            {/* Messages box */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[380px]">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-1 shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-[#8D1B1B] text-white rounded-br-none' 
                      : 'bg-stone-50 text-stone-850 border border-stone-100 rounded-bl-none'
                  }`}>
                    {/* Preserve linebreaks and support Markdown lists roughly */}
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    <span className={`block text-[9px] text-right mt-1.5 ${m.role === 'user' ? 'text-stone-300' : 'text-stone-400'}`}>
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-stone-50 border border-stone-100 rounded-2xl rounded-bl-none p-4 text-xs flex items-center gap-2.5">
                    <span className="inline-block w-2.5 h-2.5 bg-stone-300 rounded-full animate-bounce"></span>
                    <span className="inline-block w-2.5 h-2.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="inline-block w-2.5 h-2.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    <span className="text-stone-500">秘書正在為您查核公司規章...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef}></div>
            </div>

            {/* Quick recommendation prompts */}
            <div className="px-5 pb-3 pt-2 border-t border-stone-50 flex flex-wrap gap-1.5 select-none bg-stone-50/20">
              <button 
                onClick={() => sendAIMessage('特別休假與生日假規定為何？')}
                className="text-[10px] text-stone-600 bg-white border border-stone-200 px-2.5 py-1 rounded-full hover:border-[#8D1B1B] hover:text-[#8D1B1B] transition-colors cursor-pointer"
              >
                🏝️ 生日假與特假規定？
              </button>
              <button 
                onClick={() => sendAIMessage('不提供身分基本資料或個資會有什麼影響嗎？')}
                className="text-[10px] text-stone-600 bg-white border border-stone-200 px-2.5 py-1 rounded-full hover:border-[#8D1B1B] hover:text-[#8D1B1B] transition-colors cursor-pointer"
              >
                🔐 關於個資的顧慮？
              </button>
              <button 
                onClick={() => sendAIMessage('完成我目前的 8 個入職報到任務步驟後會怎樣？')}
                className="text-[10px] text-stone-600 bg-white border border-stone-200 px-2.5 py-1 rounded-full hover:border-[#8D1B1B] hover:text-[#8D1B1B] transition-colors cursor-pointer"
              >
                📋 如何完成入職流程？
              </button>
            </div>

            {/* Input form */}
            <div className="p-4 border-t border-stone-100 flex items-center gap-2">
              <input
                type="text"
                placeholder="在此輸入您對於入職、福利、契約等的問題..."
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') sendAIMessage();
                }}
                className="flex-grow text-stone-900 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#8D1B1B] focus:bg-white transition-colors"
                disabled={aiLoading}
              />
              <button
                onClick={() => sendAIMessage()}
                className="p-3 bg-[#8D1B1B] text-[#D4AF37] rounded-xl hover:bg-[#721515] transition-colors active:scale-95 flex items-center justify-center cursor-pointer"
                disabled={aiLoading || !inputMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </main>

      {/* A4 Print Modals */}
      {printTaxOpen && (
        <TaxDeclarationPrintModal
          employee={employee}
          onClose={() => setPrintTaxOpen(false)}
        />
      )}
      {printContractOpen && (
        <ContractPrintModal
          employee={employee}
          onClose={() => setPrintContractOpen(false)}
        />
      )}
      {printGuarantorOpen && (
        <GuarantorPrintModal
          employee={employee}
          onClose={() => setPrintGuarantorOpen(false)}
        />
      )}
      {printServiceOpen && (
        <ServicePrintModal
          employee={employee}
          onClose={() => setPrintServiceOpen(false)}
        />
      )}
    </div>
  );
}
