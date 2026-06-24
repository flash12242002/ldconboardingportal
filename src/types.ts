export interface Dependent {
  name: string;
  relationship: string;
  idNumber: string;
  birthday: string;
}

export interface PersonalData {
  name: string;
  englishName?: string;
  avatarUrl?: string;
  idNumber: string;
  birthday: string;
  gender: string;
  bloodType?: string;
  phone: string;
  email: string;
  legalAddress: string;
  contactAddress: string;
  bankName: string;
  bankAccount: string;
  dependentsCount: string;
  dependents?: Dependent[];
  healthDependentsCount?: string;
  healthDependents?: Dependent[];
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
}

export interface CareerExperience {
  companyName: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  leaveReason: string;
}

export interface Education {
  schoolName: string;
  major: string;
  degree: string;
  period: string;
  status: '畢業' | '肄業' | '就讀中' | '';
}

export interface ProfessionalLicense {
  licenseName: string;
  badgeLevel: string;
  issueDate: string;
  expiryDate: string;
}

export interface LanguageSkill {
  language: string; // '英文' | '日文' | '韓文' | '其他'
  level: '精通' | '優良' | '中等' | '略懂' | '';
  customName?: string; // If '其他', custom language name
}

export interface CareerData {
  experiences: CareerExperience[];
  educations?: Education[];
  licenses: ProfessionalLicense[];
  languages?: LanguageSkill[];
  additionalNotes: string;
}

export interface UploadedFile {
  name: string;
  size: number;
  uploadedAt: string;
  base64Data?: string;
  docType?: string;
}

export interface Employee {
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
  personalData?: PersonalData;
  careerData?: CareerData;
  uploadedFiles: UploadedFile[];
  rulesAgreed: boolean;
  privacyAgreed: boolean;
  taxDeclaration?: TaxDeclaration;
  contractSigned: boolean;
  contractDate?: string;
  contractWorkLocation?: string;
  contractLeaveOption?: string;
  contractLeavedays?: string;
  contractSalaryType?: string;
  contractSalaryAmount?: string;
  contractProbationMonths?: string;
  guarantorSigned?: boolean;
  guarantorDate?: string;
  guarantorData?: GuarantorData;
  serviceSigned?: boolean;
  serviceDate?: string;
  updatedAt: string;
}

export interface GuarantorData {
  guarantorName: string;
  birthday: string;
  idNumber: string;
  address: string;
  phone: string;
  companyName: string;
  companyTitle: string;
  companyAddress: string;
  companyPhone: string;
  relationship: string;
  validUntil: string;
}

export interface TaxDependent {
  name: string;
  relationship: string;
  birthday: string;
  idNumber: string;
  condition: string;
  type: '直系尊親屬' | '子女' | '同胞兄弟姊妹' | '其他親屬' | string;
}

export interface TaxDeclaration {
  spouseName: string;
  spouseBirthday: string;
  spouseIdNumber: string;
  dependents: TaxDependent[];
  signed: boolean;
  signName?: string;
  signedAt?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
