export type QuotationType = 'LEAD' | 'PROJECT' | 'MATERIAL';

export type InvoiceMode =
  | 'Tax Invoice'
  | 'Quotation'
  | 'Estimate'
  | 'Proforma Invoice'
  | 'Bill'
  | 'Cash Bill'
  | 'Purchase Invoice'
  | 'Credit Note'
  | 'Debit Note'
  | 'Receipt';

export interface InvoiceItem {
  id: string;
  description: string;
  hsn: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number; // percentage
  gst: number; // percentage
  amount: number;
}

export interface ClientInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  location?: string;
  requirement?: string;
  propertyType?: string;
}

export interface ProjectOverviewDetails {
  property?: string; // e.g. '4BHK Villa'
  area?: string; // e.g. '4,200 Sft'
  scope?: string; // e.g. 'Full Interiors + Custom Woodwork'
  finish?: string; // e.g. 'Acrylic + Veneer + Fluted Glass'
  timeline?: string; // e.g. '60 – 75 Days'
  consultation?: string; // e.g. 'Included'
  designConsultation?: string; // e.g. 'Included'
}

export interface HeaderLifestyleBanner {
  imageUrl?: string;
  headline?: string;
  subheadline?: string;
  quoteLine1?: string;
  quoteLine2?: string;
  subQuote?: string;
  showBanner?: boolean;
  showTextOverlay?: boolean;
}

export interface ProjectDetails {
  name: string;
  address: string;
  designer: string;
  salesExecutive: string;
  stage: string;
  expectedCompletion: string;
  type: string; // 'Villa' | 'Apartment' | 'Commercial' | 'Office' etc.
  overview?: ProjectOverviewDetails;
}

export interface CompanyDetails {
  name: string;
  address: string;
  gstin: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  signatureUrl?: string;
  stampUrl?: string;
}

export interface BankDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  upiId: string;
  customQrUrl?: string;
}

export interface RoomGroup {
  id: string;
  name?: string;
  roomName?: string;
  finish?: string;
  finishSpec?: string;
  inclusions?: string[];
  exclusions?: string[];
  items: InvoiceItem[];
}

export interface PaymentMilestone {
  id: string;
  name: string;
  percentage?: number;
  amount?: number;
  stage?: string;
  stageRef?: string;
}

export interface ComplianceDetails {
  placeOfSupply?: string;
  companyPan?: string;
  clientPan?: string;
  tdsDeduction?: number;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Accepted' | 'Partially Paid' | 'Paid' | 'Pending' | 'Cancelled';

export interface DispatchDetails {
  supplyType?: string;
  dispatchFrom?: string;
  freightTerms?: string;
  placeOfSupply?: string;
}

export interface Invoice {
  id: string;
  quotationType?: QuotationType;
  customTitle?: string;
  showSignature?: boolean;
  mode: InvoiceMode;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  status: InvoiceStatus;
  leadId?: string;
  projectId?: string;
  clientId?: string;
  client: ClientInfo;
  project: ProjectDetails;
  company: CompanyDetails;
  items: InvoiceItem[];
  rooms?: RoomGroup[];
  paymentMilestones?: PaymentMilestone[];
  compliance?: ComplianceDetails;
  dispatchDetails?: DispatchDetails;
  lifestyleBanner?: HeaderLifestyleBanner;
  projectOverview?: ProjectOverviewDetails;
  warrantyInfo?: string;
  structuralWarranty?: string;
  hardwareWarranty?: string;
  supportContact?: string;
  supportSubtext?: string;
  supportEmail?: string;
  supportPhone?: string;
  enableRoundOff?: boolean;
  showHsnColumn?: boolean;
  advanceAmount?: number;
  advanceDate?: string;
  advanceReceiptRef?: string;
  bank: BankDetails;
  notes: string;
  terms: string[];
  importantNotes?: string[];
  advancePaid: number;
  overallDiscount?: number;
  discountType?: 'PERCENTAGE' | 'FIXED';
  taxRate?: number;
  paymentType?: 'Advance Payment' | 'Partial Payment' | 'Final Payment' | string;
  previousPayments?: number;
  currentPayment?: number;
  quotationReference?: string;
  estimatedTimeline?: string;
  acceptedAt?: string;
  isLocked?: boolean;
  acceptedSignature?: string;
}

