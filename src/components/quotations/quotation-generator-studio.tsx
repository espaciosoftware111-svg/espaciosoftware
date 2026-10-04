"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Mail,
  MessageSquare,
  MessageCircle,
  Cloud,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  User,
  UserPlus,
  UserX,
  FolderOpen,
  CreditCard,
  Building,
  Loader2,
  FileText,
  ChevronDown,
  Save,
  Check,
  CheckCircle2,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  FileCheck,
  Package,
  Layers,
  Search,
  X,
  Calendar,
  Shield
} from 'lucide-react';
import type {
  Invoice,
  InvoiceItem,
  InvoiceMode,
  QuotationType,
  ClientInfo,
  ProjectDetails,
  BankDetails,
  CompanyDetails,
  RoomGroup,
  PaymentMilestone,
  ComplianceDetails,
  DispatchDetails,
  InvoiceStatus
} from './types';
import {
  amountToWords,
  generateGSTIN,
  generateInvoiceNumber,
  formatDate,
  addDays,
  calculateTotals
} from './quotation-helpers';
import AiDescriptionModal from './AiDescriptionModal';
import { EmailModal, WhatsAppModal, GoogleDriveModal } from './ExportModals';
import { RecordPaymentModal } from '@/components/payments/record-payment-modal';
import './quotation-studio.css';

// Default Luxury Configuration
const DEFAULT_MILESTONES: PaymentMilestone[] = [
  { id: 'ms-1', name: 'Booking & Design Confirmation', percentage: 10, stage: 'Phase 1', stageRef: 'Phase 1' },
  { id: 'ms-2', name: 'Material Sourcing & Production', percentage: 50, stage: 'Phase 2', stageRef: 'Phase 2' },
  { id: 'ms-3', name: 'Modular Installation & Site Fitout', percentage: 30, stage: 'Phase 3', stageRef: 'Phase 3' },
  { id: 'ms-4', name: 'Final Handover & Quality Signoff', percentage: 10, stage: 'Phase 4', stageRef: 'Phase 4' }
];

const INITIAL_ROOMS: RoomGroup[] = [
  {
    id: 'room-1',
    name: 'Modular Kitchen',
    roomName: 'Modular Kitchen',
    finish: 'High-Gloss Acrylic on 18mm BWR Marine Plywood',
    finishSpec: 'High-Gloss Acrylic on 18mm BWR Marine Plywood',
    inclusions: [
      'Base and wall cabinets with Blum soft-close tandem boxes',
      'Dual cutlery trays, bottle pull-out, and under-sink drip tray',
      'Integrated under-cabinet warm LED lighting profile'
    ],
    exclusions: [
      'Kitchen chimney, hob, and appliances',
      'Countertop quartz and backsplash civil tiling'
    ],
    items: [
      {
        id: 'k-1',
        description: 'Base Unit Cabinets with Blum Soft-Close Runners\nMarine grade BWR plywood structure with edge-banded acrylic shutters',
        hsn: '9403',
        quantity: 1,
        unit: 'Lot',
        rate: 110000,
        discount: 0,
        gst: 0,
        amount: 110000
      },
      {
        id: 'k-2',
        description: 'Wall Hanging Units with Bi-Fold Lift-up Mechanism\nFluted glass accents with warm LED illumination',
        hsn: '9403',
        quantity: 1,
        unit: 'Lot',
        rate: 60000,
        discount: 0,
        gst: 0,
        amount: 60000
      }
    ]
  },
  {
    id: 'room-2',
    name: 'Master Bedroom Wardrobe',
    roomName: 'Master Bedroom Wardrobe',
    finish: 'Matte PU Finish & Tinted Glass Shutters',
    finishSpec: 'Matte PU Finish & Tinted Glass Shutters',
    inclusions: [
      'Floor-to-ceiling wardrobe with integrated loft storage',
      'Concealed sensored LED hanger rods and velvet-lined jewelry drawer'
    ],
    exclusions: [
      'Mattress and loose furnishing'
    ],
    items: [
      {
        id: 'w-1',
        description: 'Floor-to-Ceiling 3-Door Wardrobe with Soft-Close Hinges\nCustomized internal organizers, drawer lockers, and loft storage',
        hsn: '9403',
        quantity: 1,
        unit: 'Unit',
        rate: 72830.51,
        discount: 0,
        gst: 0,
        amount: 72830.51
      }
    ]
  }
];

// Default Luxury Configuration
const DEFAULT_COMPANY: CompanyDetails = {
  name: 'Espacio Interiors',
  address: 'Sleek Heights, Floor 4, Jubilee Hills, Road No. 36, Hyderabad, TS - 500033',
  gstin: '36AAAAE1234F1Z9',
  phone: '+91 90000 80000',
  email: 'accounts@theespacio.in',
  website: 'theespacio.in',
  logoUrl: '/brand/espacio-logo.png',
  stampUrl: '/stamp.png'
};

const DEFAULT_BANK: BankDetails = {
  bankName: 'HDFC Bank Ltd',
  accountHolder: 'Espacio Design Studio Private Limited',
  accountNumber: '50200048127390',
  ifsc: 'HDFC0001234',
  branch: 'Jubilee Hills, Hyderabad',
  upiId: 'espacio@hdfcbank'
};

const DEFAULT_TERMS: string[] = [
  'Validity: Quotation is valid until the mentioned Valid Till date.',
  'Scope: Only the items mentioned in the quotation are included.',
  'Changes: Additional changes or work will be charged separately.',
  'Warranty: Warranty applies as per the agreed terms and excludes misuse or damage.',
  'Payment: Payments must be made as per the agreed milestone schedule.',
  'Timeline: Estimated timelines may vary due to approvals, payments, or site-related delays.'
];

const CLIENT_PRESETS: ClientInfo[] = [
  {
    name: 'Ananya Rao',
    phone: '+91 98855 77665',
    email: 'ananya.rao@gmail.com',
    address: 'Plot 42, Silence Valley, Film Nagar, Jubilee Hills, Hyderabad - 500096',
    gstin: '',
    location: 'Jubilee Hills, Hyderabad',
    requirement: '4BHK Full Villa Luxury Interior Design & Custom Woodwork'
  },
  {
    name: 'NeoTech Innovations Pvt Ltd',
    phone: '+91 80088 12345',
    email: 'finance@neotech.io',
    address: 'Block A, 12th Floor, Cyber Towers, HITEC City, Hyderabad - 500081',
    gstin: '36AABCN4321A1ZE',
    location: 'HITEC City, Hyderabad',
    requirement: 'Commercial Executive Office & Acoustic Boardroom Fitout'
  }
];

const PROJECT_PRESETS: ProjectDetails[] = [
  {
    name: 'The Golden Crest Villa',
    address: 'Villa 18, Whisper Valley, Gachibowli, Hyderabad',
    designer: 'Ar. Vikram Aditya',
    salesExecutive: 'Amit Sharma',
    stage: 'Woodwork & Finishings',
    expectedCompletion: '2026-09-15',
    type: 'Villa'
  },
  {
    name: 'Jubilee Luxury Penthouse',
    address: 'Apartment 5B, Skyline Heights, Jubilee Hills, Hyderabad',
    designer: 'Id. Kiara Sen',
    salesExecutive: 'Priya Nair',
    stage: 'False Ceiling & Electrical',
    expectedCompletion: '2026-08-30',
    type: 'Apartment'
  }
];

const MATERIAL_PRESETS = [
  {
    name: 'Marine Plywood (IS:710)',
    description: 'IS:710 Marine Grade BWP Plywood (18mm, 8x4 ft)\nBoiling water proof, calibrated, borer & termite resistant core\nIdeal for modular kitchens & wet areas',
    hsn: '4412',
    quantity: 10,
    unit: 'Sheets',
    rate: 2850,
    discount: 0,
    gst: 18
  },
  {
    name: 'High-Gloss Laminate',
    description: '1mm High-Gloss Anti-Fingerprint Laminate (8x4 ft)\nScratch resistant European decorative surface, zero bubble guarantee',
    hsn: '3920',
    quantity: 8,
    unit: 'Sheets',
    rate: 1950,
    discount: 0,
    gst: 18
  },
  {
    name: 'Blum Soft-Close Runners',
    description: 'Blum Tandembox Soft-Close Drawer Runners (500mm)\nHeavy duty 30kg load capacity with integrated Blumotion cushioning',
    hsn: '8302',
    quantity: 6,
    unit: 'Sets',
    rate: 3400,
    discount: 0,
    gst: 18
  },
  {
    name: 'Hettich Sensys Hinges',
    description: 'Hettich Sensys 110° Soft-Close Hinges (Crank 0)\nIntegrated silent system with nickel plated finish',
    hsn: '8302',
    quantity: 24,
    unit: 'Pcs',
    rate: 280,
    discount: 0,
    gst: 18
  },
  {
    name: 'Royale Luxury Paint',
    description: 'Asian Paints Royale Luxury Emulsion (Apex Ultima / Shyne)\nTeflon surface protector, anti-fungal, washable finish',
    hsn: '3209',
    quantity: 4,
    unit: 'Litres',
    rate: 850,
    discount: 0,
    gst: 28
  },
  {
    name: 'Toughened Glass 12mm',
    description: '12mm Saint-Gobain Toughened Clear Glass\nPolished flat edges with CNC hinge cutouts',
    hsn: '7007',
    quantity: 45,
    unit: 'Sqft',
    rate: 320,
    discount: 0,
    gst: 18
  }
];

const INITIAL_MATERIAL_ITEMS: InvoiceItem[] = [
  {
    id: '1',
    description: 'IS:710 Marine Grade BWP Plywood (18mm, 8x4 ft)\nCalibrated core, borer & termite resistant, waterproof',
    hsn: '4412',
    quantity: 12,
    unit: 'Sheets',
    rate: 2850,
    discount: 0,
    gst: 0,
    amount: 34200
  },
  {
    id: '2',
    description: '1mm High-Gloss Anti-Fingerprint Laminate (8x4 ft)\nDecorative surface for cabinetry shutters',
    hsn: '3920',
    quantity: 8,
    unit: 'Sheets',
    rate: 1950,
    discount: 0,
    gst: 0,
    amount: 15600
  }
];

const INITIAL_ITEMS: InvoiceItem[] = [
  {
    id: '1',
    description: 'Modular Kitchen\nPremium marine plywood cabinets\nSoft close hinges\nQuartz countertop\nPremium laminate finish\nInstallation included',
    hsn: '9403',
    quantity: 1,
    unit: 'Unit',
    rate: 170000,
    discount: 0,
    gst: 0,
    amount: 170000
  },
  {
    id: '2',
    description: 'Wardrobe\nSoft close shutters\nLoft storage\nInternal organizers\nMirror panel\nPremium handles',
    hsn: '9403',
    quantity: 1,
    unit: 'Unit',
    rate: 72830.51,
    discount: 0,
    gst: 0,
    amount: 72830.51
  }
];

const STUDIO_INSTALLMENT_PRESETS = [
  "Booking Confirmation Fee",
  "1st Installment (Booking Advance)",
  "2nd Installment (Woodwork & Carcass Production)",
  "3rd Installment (Laminates & Hardware Fitting)",
  "4th Installment (Quality Check & Site Finishing)",
  "Final Project Handover Balance",
];

export interface QuotationStudioProps {
  quotationId?: string;
  invoiceId?: string;
  leadId?: string;
  projectId?: string;
  initialQuotationType?: QuotationType;
  initialInvoice?: Partial<Invoice>;
  readOnly?: boolean;
  onSaveComplete?: () => void;
  onBack?: () => void;
}

export function QuotationGeneratorStudio({
  quotationId,
  invoiceId,
  leadId,
  projectId,
  initialQuotationType = 'LEAD',
  initialInvoice,
  readOnly,
  onSaveComplete,
  onBack
}: QuotationStudioProps = {}) {
  // --- QUOTATION TYPE STATE ---
  const [quotationType, setQuotationType] = useState<QuotationType>(
    initialQuotationType || (initialInvoice?.quotationType as QuotationType) || 'LEAD'
  );

  // --- SIGNATURE / STAMP TOGGLE ---
  const [showSignature, setShowSignature] = useState<boolean>(
    initialInvoice?.showSignature !== undefined ? initialInvoice.showSignature : true
  );

  // --- CUSTOM DOCUMENT TITLE ---
  const [customTitle, setCustomTitle] = useState<string>(
    initialInvoice?.customTitle || (initialQuotationType === 'MATERIAL' ? 'MATERIAL QUOTATION' : 'QUOTATION')
  );

  // --- PAYMENT ENGINE STATE (Advance, Partial, Final) ---
  const [paymentType, setPaymentType] = useState<string>(
    initialInvoice?.paymentType || 'Advance Payment'
  );
  const [previousPayments, setPreviousPayments] = useState<number>(
    initialInvoice?.previousPayments || 0
  );
  const [currentPayment, setCurrentPayment] = useState<number>(
    initialInvoice?.currentPayment !== undefined
      ? initialInvoice.currentPayment
      : (initialInvoice?.advancePaid !== undefined ? initialInvoice.advancePaid : 0)
  );

  // --- OVERALL DISCOUNT ON TOTAL STATE ---
  const [overallDiscount, setOverallDiscount] = useState<number>(
    initialInvoice?.overallDiscount !== undefined
      ? initialInvoice.overallDiscount
      : 0
  );
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>(
    initialInvoice?.discountType || 'PERCENTAGE'
  );

  // --- MANUAL GST RATE ON TOTAL CALCULATION STATE ---
  const [gstRate, setGstRate] = useState<number>(
    initialInvoice?.taxRate !== undefined
      ? initialInvoice.taxRate
      : 18
  );

  // --- CRM DATA LINKING (Leads & Projects) ---
  const [leadsList, setLeadsList] = useState<Array<{ id: string; referenceNo: string; clientName: string; phone: string; email?: string; location?: string; propertyTypeKey?: string; requirement?: string }>>([]);
  const [projectsList, setProjectsList] = useState<Array<{ id: string; referenceNo: string; title: string; client?: { id?: string; fullName?: string; phone?: string; email?: string; address?: string; gstin?: string }; siteAddress?: string; stage?: string }>>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leadId || initialInvoice?.leadId || '');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || initialInvoice?.projectId || '');

  // --- LEAD SEARCH & MANUAL PERSON REGISTRATION STATE ---
  const [leadSearchQuery, setLeadSearchQuery] = useState<string>('');
  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState<boolean>(false);
  const [isCreatingLead, setIsCreatingLead] = useState<boolean>(false);
  const [addPersonForm, setAddPersonForm] = useState({
    clientName: '',
    phone: '',
    email: '',
    location: '',
    propertyTypeKey: 'APARTMENT_INTERIOR',
    requirement: '',
    budget: '',
    sourceKey: 'DIRECT'
  });

  // --- TERMS STATE (Fully Editable & Reorderable) ---
  const [terms, setTerms] = useState<string[]>(
    initialInvoice?.terms && initialInvoice.terms.length > 0 ? initialInvoice.terms : DEFAULT_TERMS
  );
  const [newTermText, setNewTermText] = useState<string>('');

  // --- EXTENDED CONFIGURATION & COMPLIANCE STATE ---
  const [enableRoundOff, setEnableRoundOff] = useState<boolean>(
    initialInvoice?.enableRoundOff !== undefined
      ? initialInvoice.enableRoundOff
      : (initialInvoice?.mode === 'Tax Invoice' || initialInvoice?.mode === 'Bill')
  );
  const [showHsnColumn, setShowHsnColumn] = useState<boolean>(
    initialInvoice?.showHsnColumn !== undefined
      ? initialInvoice.showHsnColumn
      : (initialInvoice?.mode === 'Tax Invoice')
  );
  const [paymentMilestones, setPaymentMilestones] = useState<PaymentMilestone[]>(
    initialInvoice?.paymentMilestones && initialInvoice.paymentMilestones.length > 0
      ? initialInvoice.paymentMilestones
      : DEFAULT_MILESTONES
  );
  const [compliance, setCompliance] = useState<ComplianceDetails>(
    initialInvoice?.compliance || {
      placeOfSupply: '36 - Telangana',
      companyPan: 'AAAAE1234F',
      clientPan: '',
      tdsDeduction: 0
    }
  );
  const [dispatchDetails, setDispatchDetails] = useState<DispatchDetails>(
    initialInvoice?.dispatchDetails || {
      supplyType: 'Material & Hardware Supply',
      dispatchFrom: 'Ex-Warehouse Hyderabad',
      freightTerms: 'Inclusive of statutory GST',
      placeOfSupply: initialInvoice?.compliance?.placeOfSupply || '36 - Telangana'
    }
  );
  const [warrantyInfo, setWarrantyInfo] = useState<string>(
    initialInvoice?.warrantyInfo || '5-Year Structural & Hardware Warranty as per Espacio SLA'
  );
  const [supportContact, setSupportContact] = useState<string>(
    initialInvoice?.supportContact || 'support@theespacio.in | +91 90000 80000'
  );
  const [advanceDate, setAdvanceDate] = useState<string>(
    initialInvoice?.advanceDate || formatDate(new Date())
  );
  const [advanceReceiptRef, setAdvanceReceiptRef] = useState<string>(
    initialInvoice?.advanceReceiptRef || 'REC-2026-001'
  );
  const [rooms, setRooms] = useState<RoomGroup[]>(
    initialInvoice?.rooms && initialInvoice.rooms.length > 0
      ? initialInvoice.rooms
      : INITIAL_ROOMS
  );

  // --- INVOICE STATE ---
  const [invoice, setInvoice] = useState<Invoice>({
    id: '1',
    quotationType,
    customTitle: customTitle || (quotationType === 'MATERIAL' ? 'MATERIALS & SERVICES QUOTATION' : 'QUOTATION'),
    paymentType,
    previousPayments,
    currentPayment,
    showSignature,
    mode: initialInvoice?.mode || 'Quotation',
    invoiceNumber: quotationType === 'MATERIAL' ? 'MAT-2026-0001' : quotationType === 'PROJECT' ? 'PRJ-2026-0001' : (initialInvoice?.mode === 'Tax Invoice' ? generateInvoiceNumber('Tax Invoice') : 'Q-2026-0001'),
    invoiceDate: formatDate(new Date()),
    dueDate: addDays(formatDate(new Date()), 30),
    paymentTerms: '30 Days Net',
    status: (initialInvoice?.status || 'Draft') as InvoiceStatus,
    company: DEFAULT_COMPANY,
    client: CLIENT_PRESETS[0],
    project: PROJECT_PRESETS[0],
    items: initialInvoice?.items || (quotationType === 'MATERIAL' ? INITIAL_MATERIAL_ITEMS : INITIAL_ITEMS),
    rooms: quotationType === 'LEAD' ? (initialInvoice?.rooms || INITIAL_ROOMS) : undefined,
    paymentMilestones: DEFAULT_MILESTONES,
    compliance: {
      placeOfSupply: '36 - Telangana',
      companyPan: 'AAAAE1234F',
      clientPan: '',
      tdsDeduction: 0
    },
    dispatchDetails: {
      supplyType: 'Material & Hardware Supply',
      dispatchFrom: 'Ex-Warehouse Hyderabad',
      freightTerms: 'Inclusive of statutory GST',
      placeOfSupply: '36 - Telangana'
    },
    warrantyInfo: '5-Year Structural & Hardware Warranty as per Espacio SLA',
    supportContact: 'support@theespacio.in | +91 90000 80000',
    enableRoundOff: initialInvoice?.mode === 'Tax Invoice',
    showHsnColumn: initialInvoice?.mode === 'Tax Invoice',
    advanceDate: formatDate(new Date()),
    advanceReceiptRef: 'REC-2026-001',
    bank: DEFAULT_BANK,
    notes: quotationType === 'MATERIAL'
      ? 'All materials supplied are quality-tested and conform to IS standards. Safe transit & handling included.'
      : 'Thank you for choosing Espacio Interiors. We appreciate your trust. We look forward to creating timeless interiors.',
    terms: DEFAULT_TERMS,
    advancePaid: currentPayment,
    ...initialInvoice
  });

  // --- ACTIONS STATE ---
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [savedQuoteData, setSavedQuoteData] = useState<{
    id: string;
    referenceNo: string;
    title: string;
    clientName: string;
    totalAmount: number;
    quotationType: string;
  } | null>(null);

  // --- CONVERSION & LOCKING STATE ---
  const [conversionEligibility, setConversionEligibility] = useState<{
    canConvert: boolean;
    isLocked: boolean;
    isAccepted: boolean;
    isAlreadyConverted: boolean;
    existingInvoice: { id: string; invoiceNo: string; grandTotal: number } | null;
    reason: string;
    checks?: Array<{ key: string; label: string; satisfied: boolean }>;
  } | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState<boolean>(Boolean(quotationId || invoiceId));
  const [recordError, setRecordError] = useState<string | null>(null);

  // Fetch CRM Leads and Projects for Dynamic Quick-Linking
  useEffect(() => {
    const fetchCrmData = async () => {
      try {
        const [leadsRes, matLeadsRes, projRes] = await Promise.all([
          fetch('/api/v1/leads?limit=100').catch(() => null),
          fetch('/api/v1/material-leads?limit=100').catch(() => null),
          fetch('/api/v1/projects?limit=100').catch(() => null)
        ]);
        let combinedLeads: any[] = [];
        if (leadsRes && leadsRes.ok) {
          const leadsJson = await leadsRes.json();
          if (leadsJson.success && leadsJson.data) {
            const rawLeads = Array.isArray(leadsJson.data)
              ? leadsJson.data
              : (leadsJson.data.leads || []);
            combinedLeads = [...combinedLeads, ...rawLeads];
          }
        }
        if (matLeadsRes && matLeadsRes.ok) {
          const matJson = await matLeadsRes.json();
          if (matJson.success && matJson.data) {
            const rawMatLeads = Array.isArray(matJson.data)
              ? matJson.data
              : (matJson.data.items || matJson.data.materialLeads || []);
            const normalizedMatLeads = rawMatLeads.map((m: any) => ({
              id: m.id,
              referenceNo: m.referenceNo || m.materialLeadId || 'MAT-LEAD',
              clientName: m.customerName || m.clientName || 'Customer',
              phone: m.primaryContact || m.phone || '',
              email: m.email || '',
              location: m.location || m.projectLocation || '',
              requirement: m.notes || m.requirement || 'Materials Order & Supply',
              propertyTypeKey: 'MATERIAL_SUPPLY'
            }));
            combinedLeads = [...combinedLeads, ...normalizedMatLeads];
          }
        }
        if (combinedLeads.length > 0) {
          setLeadsList(combinedLeads);
        }
        if (projRes && projRes.ok) {
          const projJson = await projRes.json();
          if (projJson.success && projJson.data) {
            const rawProjects = Array.isArray(projJson.data)
              ? projJson.data
              : (projJson.data.projects || []);
            setProjectsList(rawProjects);
          }
        }
      } catch (err) {
        console.warn('Could not load CRM selector lists:', err);
      }
    };
    fetchCrmData();
  }, []);

  // Auto-fetch lead and prefill ONLY when creating a brand-new quotation (NOT when loading existing quotationId or invoiceId)
  useEffect(() => {
    if (!leadId || quotationId || invoiceId) return;
    const loadLinkedLead = async () => {
      try {
        let l: any = null;
        if (initialQuotationType === 'MATERIAL') {
          const mRes = await fetch(`/api/v1/material-leads/${leadId}`).catch(() => null);
          if (mRes && mRes.ok) {
            const mJson = await mRes.json();
            if (mJson.success && mJson.data) {
              const raw = mJson.data.materialLead || mJson.data;
              l = {
                id: raw.id,
                referenceNo: raw.referenceNo || raw.materialLeadId,
                clientName: raw.customerName || raw.clientName,
                phone: raw.primaryContact || raw.phone,
                email: raw.email,
                location: raw.location || raw.projectLocation,
                requirement: raw.notes || raw.requirement || 'Materials Order & Supply',
                propertyTypeKey: 'MATERIAL_SUPPLY'
              };
            }
          }
        }
        if (!l) {
          const res = await fetch(`/api/v1/leads/${leadId}`).catch(() => null);
          if (res && res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              l = json.data.lead || json.data;
            }
          }
        }
        if (l) {
          setSelectedLeadId(l.id);
          const reqText = `${l.requirement || ''} ${l.propertyTypeKey || ''} ${l.referenceNo || ''}`.toLowerCase();
          const isMaterialLead = reqText.includes('material') || l.referenceNo?.startsWith('MAT-LEAD') || initialQuotationType === 'MATERIAL';
          const targetType: QuotationType = isMaterialLead ? 'MATERIAL' : (initialQuotationType || 'LEAD');
          setQuotationType(targetType);
          if (targetType === 'MATERIAL' && !initialInvoice?.customTitle) {
            setCustomTitle('MATERIAL QUOTATION');
          }

          let quotationItems: InvoiceItem[] | null = null;
          setInvoice((prev) => ({
            ...prev,
            quotationType: targetType,
            customTitle: initialInvoice?.customTitle || (targetType === 'MATERIAL' ? 'MATERIAL QUOTATION' : prev.customTitle),
            leadId: l.id,
            advancePaid: initialInvoice?.advancePaid !== undefined ? initialInvoice.advancePaid : prev.advancePaid,
            items: quotationItems || ((prev.mode === 'Tax Invoice' && initialInvoice?.items)
              ? initialInvoice.items
              : (targetType === 'MATERIAL' && prev.items === INITIAL_ITEMS ? INITIAL_MATERIAL_ITEMS : prev.items)),
            client: {
              ...prev.client,
              name: l.clientName || prev.client.name,
              phone: l.phone || prev.client.phone,
              email: l.email || prev.client.email || '',
              address: l.location || prev.client.address || '',
              location: l.location || '',
              requirement: l.requirement || (targetType === 'MATERIAL' ? 'MATERIALS REQUIRED' : l.propertyTypeKey || '')
            }
          }));
        }
      } catch (err) {
        console.warn('Could not auto-fetch linked lead:', err);
      }
    };
    loadLinkedLead();
  }, [leadId, quotationId, invoiceId, initialQuotationType]);

  // Auto-fetch project and prefill ONLY when creating a brand-new quotation (NOT when loading existing quotationId or invoiceId)
  useEffect(() => {
    const targetProjectId = projectId || initialInvoice?.projectId;
    if (!targetProjectId || quotationId || invoiceId) return;
    const loadLinkedProject = async () => {
      try {
        const res = await fetch(`/api/v1/projects/${targetProjectId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const p = json.data.project || json.data;
          setSelectedProjectId(p.id);
          setQuotationType('PROJECT');
          setCustomTitle((prev) => (!prev || prev === 'MATERIAL QUOTATION' || prev === 'QUOTATION') ? 'PROJECT QUOTATION' : prev);
          setInvoice((prev) => ({
            ...prev,
            quotationType: 'PROJECT',
            customTitle: (!prev.customTitle || prev.customTitle === 'MATERIAL QUOTATION' || prev.customTitle === 'QUOTATION') ? 'PROJECT QUOTATION' : prev.customTitle,
            projectId: p.id,
            clientId: p.clientId || p.client?.id || prev.clientId,
            client: {
              ...prev.client,
              name: p.client?.fullName || prev.client.name,
              phone: p.client?.phone || prev.client.phone || '',
              email: p.client?.email || prev.client.email || '',
              address: p.siteAddress || p.client?.address || prev.client.address || '',
              gstin: p.client?.gstin || prev.client.gstin || ''
            },
            project: {
              ...prev.project,
              name: p.title || prev.project.name,
              address: p.siteAddress || prev.project.address || '',
              stage: p.stage || prev.project.stage || 'Execution',
              expectedCompletion: p.targetCompletionDate ? formatDate(new Date(p.targetCompletionDate)) : prev.project.expectedCompletion
            }
          }));
        }
      } catch (err) {
        console.warn('Could not auto-fetch linked project:', err);
      }
    };
    loadLinkedProject();
  }, [projectId, initialInvoice?.projectId]);

  // Filter leads based on search query (prioritizing 'MATERIALS REQUIRED' when quotationType === 'MATERIAL')
  const filteredLeads = useMemo(() => {
    let list = leadsList;
    if (leadSearchQuery.trim()) {
      const q = leadSearchQuery.toLowerCase().trim();
      list = leadsList.filter((l) =>
        (l.referenceNo && l.referenceNo.toLowerCase().includes(q)) ||
        (l.clientName && l.clientName.toLowerCase().includes(q)) ||
        (l.phone && l.phone.toLowerCase().includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.location && l.location.toLowerCase().includes(q)) ||
        (l.requirement && l.requirement.toLowerCase().includes(q))
      );
    }

    if (quotationType === 'MATERIAL') {
      return [...list].sort((a, b) => {
        const aReq = `${a.requirement || ''} ${a.propertyTypeKey || ''}`.toLowerCase();
        const bReq = `${b.requirement || ''} ${b.propertyTypeKey || ''}`.toLowerCase();
        const aIsMat = aReq.includes('material');
        const bIsMat = bReq.includes('material');
        if (aIsMat && !bIsMat) return -1;
        if (!aIsMat && bIsMat) return 1;
        return 0;
      });
    }

    return list;
  }, [leadsList, leadSearchQuery, quotationType]);

  // Handle Manual Person Registration -> Auto-Create Lead in DB
  const handleCreateManualPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPersonForm.clientName.trim() || !addPersonForm.phone.trim()) {
      alert('Please enter at least the Client / Lead Name and a valid Phone number.');
      return;
    }
    setIsCreatingLead(true);
    try {
      const defaultReq = quotationType === 'MATERIAL' ? 'MATERIALS REQUIRED' : addPersonForm.requirement.trim() || null;
      const res = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: addPersonForm.clientName.trim(),
          phone: addPersonForm.phone.trim(),
          email: addPersonForm.email.trim() || null,
          location: addPersonForm.location.trim() || null,
          propertyTypeKey: quotationType === 'MATERIAL' ? 'MODULAR_KITCHEN' : addPersonForm.propertyTypeKey || 'APARTMENT_INTERIOR',
          requirement: addPersonForm.requirement.trim() || defaultReq,
          budget: addPersonForm.budget ? Number(addPersonForm.budget) : undefined,
          sourceKey: addPersonForm.sourceKey || 'DIRECT'
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const newLead = json.data;
        setLeadsList((prev) => [newLead, ...prev]);
        setSelectedLeadId(newLead.id);
        const assignedReq = newLead.requirement || (quotationType === 'MATERIAL' ? 'MATERIALS REQUIRED' : newLead.propertyTypeKey || '');
        setInvoice((prev) => ({
          ...prev,
          leadId: newLead.id,
          client: {
            ...prev.client,
            name: newLead.clientName,
            phone: newLead.phone,
            email: newLead.email || '',
            address: newLead.location || '',
            location: newLead.location || '',
            requirement: assignedReq
          }
        }));
        setIsAddPersonModalOpen(false);
        setLeadSearchQuery('');
        setSaveSuccessMsg(`Lead ${newLead.referenceNo} registered & permanently linked!`);
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } else {
        alert(json.error?.message || 'Failed to create new lead in database.');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating lead');
    } finally {
      setIsCreatingLead(false);
    }
  };

  // --- PDF GENERATOR HELPER ---
  const loadHtml2Pdf = async (): Promise<any> => {
    if (typeof window !== 'undefined' && (window as any).html2pdf) {
      return (window as any).html2pdf;
    }
    try {
      const loadedModule = await import('html2pdf.js');
      const html2pdf = (loadedModule && loadedModule.default) ? loadedModule.default : loadedModule;
      if (typeof window !== 'undefined') {
        (window as any).html2pdf = html2pdf;
      }
      return html2pdf;
    } catch {
      // Fallback in case browser environment requires script fallback
      return new Promise((resolve, reject) => {
        if (typeof window !== 'undefined' && (window as any).html2pdf) {
          resolve((window as any).html2pdf);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => resolve((window as any).html2pdf);
        script.onerror = (err) => reject(err);
        document.body.appendChild(script);
      });
    }
  };

  const generatePdfBlob = async (): Promise<{ file: File; filename: string; blob: Blob } | null> => {
    const element = document.getElementById('invoice-print-area');
    if (!element) return null;

    // Temporarily normalize zoom so html2canvas renders full resolution without white clipping
    const originalZoom = (element.style as any).zoom || '';
    const originalTransform = element.style.transform || '';

    (element.style as any).zoom = '1';
    element.style.transform = 'none';

    try {
      const html2pdf = await loadHtml2Pdf();
      const filename = `${(customTitle || invoice.mode).replace(/\s+/g, '_')}_${invoice.invoiceNumber}.pdf`;

      const opt = {
        margin: [6, 8, 6, 8],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { unit: 'mm', format: paperFormat, orientation: paperOrientation },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      const worker = html2pdf().set(opt).from(element);
      const pdfBlob: Blob = await worker.outputPdf('blob');

      // Restore original zoom and transform
      (element.style as any).zoom = originalZoom;
      element.style.transform = originalTransform;

      const file = new File([pdfBlob], filename, { type: 'application/pdf' });
      return { file, filename, blob: pdfBlob };
    } catch (err) {
      (element.style as any).zoom = originalZoom;
      element.style.transform = originalTransform;
      console.error('PDF Generation Error:', err);
      return null;
    }
  };

  // WhatsApp Share Handler - Dispatches the actual Quotation PDF
  const handleSendWhatsApp = async () => {
    const rawPhone = invoice.client.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (!cleanPhone) {
      alert('Please enter a valid phone number for the client to send via WhatsApp.');
      return;
    }
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const docTitle = (customTitle && customTitle.trim()) ? customTitle.trim() : invoice.mode.toUpperCase();

    setIsPdfLoading(true);
    setSaveSuccessMsg('Generating official Quotation PDF for WhatsApp...');

    try {
      const pdfResult = await generatePdfBlob();

      // 1. Web Share API with File Support (Mobile Devices, Mac/Safari/Chrome)
      if (pdfResult && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfResult.file] })) {
        await navigator.share({
          title: `${docTitle} - ${invoice.invoiceNumber}`,
          text: `Please find attached your official ${docTitle} (${invoice.invoiceNumber}) from Espacio Interiors. Total: ₹${totals.grandTotal.toLocaleString('en-IN')}`,
          files: [pdfResult.file]
        });
        setSaveSuccessMsg('Quotation PDF dispatched via WhatsApp!');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
        return;
      }

      // 2. Desktop WhatsApp Web: Download PDF automatically to user's device for drag-and-drop
      if (pdfResult) {
        const downloadUrl = URL.createObjectURL(pdfResult.blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = pdfResult.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
      }

      const message = `*ESPACIO — Timeless Interiors*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📄 *OFFICIAL QUOTATION PDF DOCUMENT*\n` +
        `• *Document Ref:* ${invoice.invoiceNumber}\n` +
        `• *Client Name:* ${invoice.client.name}\n` +
        `• *Milestone / Stage:* ${paymentType}\n` +
        `• *Grand Total Amount:* ₹${totals.grandTotal.toLocaleString('en-IN')}\n` +
        `• *Document Date:* ${invoice.invoiceDate}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📎 _Your official quotation PDF (${pdfResult?.filename || invoice.invoiceNumber + '.pdf'}) is downloaded and ready to attach in this chat._`;

      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
      setSaveSuccessMsg('PDF downloaded & WhatsApp opened! Attach the downloaded PDF in chat.');
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing via WhatsApp:', err);
        window.open(`https://wa.me/${formattedPhone}`, '_blank');
      }
    } finally {
      setIsPdfLoading(false);
    }
  };

  const isInvoiceLookup = Boolean(
    invoiceId ||
    (quotationId && (
      quotationId.toLowerCase().startsWith('inv-') ||
      quotationId.toLowerCase().startsWith('inv_') ||
      quotationId.toLowerCase().startsWith('txi-') ||
      quotationId.toLowerCase().startsWith('txi_')
    ))
  );

  // Auto-fetch quotation from API when quotationId is provided
  useEffect(() => {
    if (!quotationId || isInvoiceLookup) return;
    const loadQuote = async () => {
      setRecordError(null);
      setIsLoadingRecord(true);
      try {
        const res = await fetch(`/api/v1/quotations/${quotationId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const q = json.data;
          const parsedMeta = q.snapshotMetadata || {};
          const isTaxInvoiceMode = initialInvoice?.mode === 'Tax Invoice' || (initialInvoice?.mode as any) === 'INVOICE';
          const loadedType: QuotationType = (q.quotationType || parsedMeta.quotationType || (q.project ? 'PROJECT' : 'LEAD')) as QuotationType;
          const loadedTitle: string = initialInvoice?.customTitle || (isTaxInvoiceMode ? 'TAX INVOICE' : (q.customTitle || parsedMeta.customTitle || q.title || 'QUOTATION'));
          const loadedShowSig: boolean = parsedMeta.showSignature !== undefined ? parsedMeta.showSignature : true;
          const actualDbPayments = (q.payments || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
            || Number(q.totalPaid || 0)
            || Number(q.advancePaid || 0)
            || Number(parsedMeta.advancePaid || 0);

          const loadedAdvance: number = initialInvoice?.advancePaid !== undefined
            ? Math.max(0, Number(initialInvoice.advancePaid))
            : actualDbPayments > 0
              ? actualDbPayments
              : Number(q.advancePaid ?? (parsedMeta.advancePaid || 0));

          const loadedPaymentType: string = initialInvoice?.paymentType || q.paymentType || parsedMeta.paymentType || 'Advance Payment';
          const loadedPrevPayments: number = Number(q.previousPayments ?? (actualDbPayments > 0 ? actualDbPayments : (parsedMeta.previousPayments || 0)));
          const loadedCurrentPayment: number = initialInvoice?.currentPayment !== undefined
            ? Math.max(0, Number(initialInvoice.currentPayment))
            : actualDbPayments > 0
              ? actualDbPayments
              : Number(q.currentPayment ?? (parsedMeta.currentPayment !== undefined ? parsedMeta.currentPayment : loadedAdvance));
          const loadedDiscountType: 'PERCENTAGE' | 'FIXED' = (q.discountType || parsedMeta.discountType || 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED';
          const loadedDiscountValue: number = Number(q.discountValue ?? (parsedMeta.overallDiscount ?? (parsedMeta.discountValue ?? 0)));

          const derivedTaxRate = q.taxRate !== undefined && q.taxRate !== null && Number(q.taxRate) > 0
            ? Number(q.taxRate)
            : (q.taxAmount > 0 && q.subtotal > 0 ? Math.round((q.taxAmount / q.subtotal) * 100) : (parsedMeta.taxRate !== undefined ? Number(parsedMeta.taxRate) : 0));
          const loadedTaxRate: number = initialInvoice?.taxRate !== undefined
            ? Number(initialInvoice.taxRate)
            : derivedTaxRate;

          setQuotationType(loadedType);
          setCustomTitle(loadedTitle);
          setShowSignature(loadedShowSig);
          setPaymentType(loadedPaymentType);
          setPreviousPayments(loadedPrevPayments);
          setCurrentPayment(loadedCurrentPayment);
          setOverallDiscount(loadedDiscountValue);
          setDiscountType(loadedDiscountType);
          setGstRate(loadedTaxRate);
          if (parsedMeta.dispatchDetails) {
            setDispatchDetails(parsedMeta.dispatchDetails);
          }
          if (parsedMeta.compliance) {
            setCompliance(parsedMeta.compliance);
          }
          if (q.leadId) setSelectedLeadId(q.leadId);
          if (q.projectId) setSelectedProjectId(q.projectId);

          if (parsedMeta.rooms && Array.isArray(parsedMeta.rooms) && parsedMeta.rooms.length > 0) {
            setRooms(parsedMeta.rooms.map((r: any, rIdx: number) => {
              const rName = r.roomName || r.name || `Room ${rIdx + 1}`;
              return {
                id: r.id || `room-${rIdx + 1}`,
                name: rName,
                roomName: rName,
                finish: r.finish || r.finishSpec || '',
                finishSpec: r.finishSpec || r.finish || '',
                inclusions: Array.isArray(r.inclusions) ? r.inclusions : [],
                exclusions: Array.isArray(r.exclusions) ? r.exclusions : [],
                description: r.description || '',
                items: (r.items || []).map((it: any, itIdx: number) => {
                  const qty = Number(it.quantity) || 1;
                  const rate = Number(it.rate) || Number(it.unitRate) || 0;
                  const fullDesc = it.description || it.itemDescription || it.name || 'Work Item';
                  return {
                    id: it.id || String(itIdx + 1),
                    name: it.name || it.itemDescription || fullDesc.split('\n')[0] || 'Work Item',
                    description: fullDesc,
                    hsn: it.hsn || '9403',
                    quantity: qty,
                    unit: it.unit || it.unitKey || 'Unit',
                    rate,
                    discount: Number(it.discount) || 0,
                    gst: Number(it.gst) || 0,
                    amount: Number((qty * rate).toFixed(2))
                  };
                })
              };
            }));
          } else if (q.items && q.items.length > 0) {
            // Group quotation items by room to ensure all rooms and items are displayed
            const roomMap: Record<string, any[]> = {};
            q.items.forEach((item: any) => {
              const rawRoomName = item.room || "General & Living";
              const roomName = rawRoomName.replace(/_/g, ' ');
              if (!roomMap[roomName]) roomMap[roomName] = [];
              const qty = Number(item.quantity) || 1;
              const rate = Number(item.unitRate) || 0;
              const fullDesc = item.itemDescription + (item.specifications ? `\n${item.specifications}` : '');
              roomMap[roomName].push({
                id: item.id,
                name: item.itemDescription,
                description: fullDesc,
                hsn: item.hsn || '9403',
                quantity: qty,
                unit: item.unitKey || "Unit",
                rate,
                discount: Number(item.discountAmount) || 0,
                gst: 0,
                amount: Number(item.totalAmount) || Number((qty * rate).toFixed(2))
              });
            });

            const generatedRooms = Object.keys(roomMap).map((rName, rIdx) => ({
              id: `room-${rIdx + 1}`,
              name: rName,
              roomName: rName,
              finish: '',
              finishSpec: '',
              inclusions: [],
              exclusions: [],
              description: "",
              items: roomMap[rName]
            }));

            setRooms(generatedRooms);
          }

          const loadedTerms = q.termsAndConditions
            ? q.termsAndConditions.split('\n').filter((t: string) => t.trim().length > 0)
            : DEFAULT_TERMS;
          setTerms(loadedTerms);

          const loadedInvoiceItems = q.items && q.items.length > 0 ? q.items.map((item: any, idx: number) => {
            const qty = Number(item.quantity) || 1;
            const unitRate = Number(item.unitRate) || 0;
            const baseAmt = Number(item.totalAmount) || Number((qty * unitRate).toFixed(2));
            const fullDesc = item.itemDescription + (item.specifications ? `\n${item.specifications}` : '');
            return {
              id: item.id || String(idx + 1),
              description: fullDesc,
              hsn: item.hsn || (loadedType === 'MATERIAL' ? '4412' : '9403'),
              quantity: qty,
              unit: item.unitKey || (loadedType === 'MATERIAL' ? 'Sheets' : 'Unit'),
              rate: unitRate,
              discount: Number(item.discountAmount) || 0,
              gst: 0,
              amount: baseAmt
            };
          }) : (parsedMeta.items || []);

          setInvoice((prev) => ({
            ...prev,
            id: isTaxInvoiceMode ? undefined : q.id,
            quotationType: loadedType,
            customTitle: loadedTitle,
            paymentType: loadedPaymentType,
            previousPayments: loadedPrevPayments,
            currentPayment: loadedCurrentPayment,
            advancePaid: loadedCurrentPayment,
            advanceReceiptRef: initialInvoice?.advanceReceiptRef || prev.advanceReceiptRef,
            notes: initialInvoice?.notes || q.notes || prev.notes,
            overallDiscount: loadedDiscountValue,
            discountType: loadedDiscountType,
            taxRate: loadedTaxRate,
            showSignature: loadedShowSig,
            mode: isTaxInvoiceMode ? 'Tax Invoice' : 'Quotation',
            invoiceNumber: isTaxInvoiceMode
              ? (initialInvoice?.invoiceNumber || prev.invoiceNumber || generateInvoiceNumber('Tax Invoice'))
              : (q.referenceNo || prev.invoiceNumber),
            invoiceDate: isTaxInvoiceMode ? formatDate(new Date()) : (q.createdAt ? formatDate(new Date(q.createdAt)) : prev.invoiceDate),
            dueDate: isTaxInvoiceMode ? addDays(formatDate(new Date()), 30) : (q.validityDate ? formatDate(new Date(q.validityDate)) : addDays(formatDate(new Date()), 30)),
            paymentTerms: '30 Days Net',
            status: isTaxInvoiceMode ? 'Draft' : (q.status === 'APPROVED' ? 'Paid' : q.status === 'ACCEPTED' ? 'Accepted' : q.status === 'REJECTED' ? 'Cancelled' : 'Pending'),
            leadId: q.leadId || undefined,
            projectId: q.projectId || undefined,
            clientId: q.clientId || undefined,
            company: parsedMeta.company || prev.company,
            client: {
              name: q.client?.fullName || q.lead?.clientName || parsedMeta.clientName || prev.client.name,
              phone: q.client?.phone || q.lead?.phone || parsedMeta.phone || prev.client.phone,
              email: q.client?.email || q.lead?.email || parsedMeta.email || prev.client.email,
              address: q.client?.address || q.lead?.location || parsedMeta.address || prev.client.address,
              gstin: q.client?.gstin || parsedMeta.gstin || '',
              location: q.lead?.location || parsedMeta.location,
              requirement: q.lead?.requirement || parsedMeta.requirement
            },
            project: {
              name: q.project?.title || parsedMeta.projectTitle || q.title || prev.project.name,
              address: q.project?.siteAddress || parsedMeta.siteAddress || prev.project.address,
              designer: parsedMeta.designer || 'Ar. Vikram Aditya',
              salesExecutive: q.createdBy?.fullName || parsedMeta.salesExecutive || 'Espacio Studio',
              stage: q.project?.stage || parsedMeta.stage || 'Woodwork & Finishings',
              expectedCompletion: q.project?.targetCompletionDate ? formatDate(new Date(q.project.targetCompletionDate)) : addDays(formatDate(new Date()), 45),
              type: parsedMeta.propertyType || 'Villa'
            },
            bank: parsedMeta.bank || prev.bank,
            items: loadedInvoiceItems,
            terms: loadedTerms
          }));
          await fetchEligibility(quotationId);
        } else {
          setRecordError(`Unable to load quotation. Quotation ID: ${quotationId}`);
        }
      } catch (err) {
        console.error('Failed to load quotation for studio:', err);
        setRecordError(`Unable to load quotation. Quotation ID: ${quotationId}`);
      } finally {
        setIsLoadingRecord(false);
      }
    };
    loadQuote();
  }, [quotationId, isInvoiceLookup]);

  // Direct Invoice Loader (when opening an already-generated or converted invoice)
  useEffect(() => {
    if (!isInvoiceLookup) return;
    const targetInvoiceId = invoiceId || quotationId;
    if (!targetInvoiceId) return;

    const loadInvoiceData = async () => {
      setRecordError(null);
      setIsLoadingRecord(true);
      try {
        const res = await fetch(`/api/v1/invoices/${targetInvoiceId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const inv = json.data;
          const q = inv.quotation;
          const parsedMeta = q?.snapshotMetadata || {};

          // 1. Maintain full room-wise quotation appearance & line items if linked to a quotation
          if (parsedMeta.rooms && Array.isArray(parsedMeta.rooms) && parsedMeta.rooms.length > 0) {
            setRooms(parsedMeta.rooms.map((r: any, rIdx: number) => {
              const rName = r.roomName || r.name || `Room ${rIdx + 1}`;
              return {
                id: r.id || `room-${rIdx + 1}`,
                name: rName,
                roomName: rName,
                finish: r.finish || r.finishSpec || '',
                finishSpec: r.finishSpec || r.finish || '',
                inclusions: Array.isArray(r.inclusions) ? r.inclusions : [],
                exclusions: Array.isArray(r.exclusions) ? r.exclusions : [],
                description: r.description || '',
                items: (r.items || []).map((it: any, itIdx: number) => {
                  const qty = Number(it.quantity) || 1;
                  const rate = Number(it.rate) || Number(it.unitRate) || 0;
                  const fullDesc = it.description || it.itemDescription || it.name || 'Work Item';
                  return {
                    id: it.id || String(itIdx + 1),
                    name: it.name || it.itemDescription || fullDesc.split('\n')[0] || 'Work Item',
                    description: fullDesc,
                    hsn: it.hsn || '9403',
                    quantity: qty,
                    unit: it.unit || it.unitKey || 'Unit',
                    rate,
                    discount: Number(it.discount) || 0,
                    gst: Number(it.gst) || 0,
                    amount: Number((qty * rate).toFixed(2))
                  };
                })
              };
            }));
          } else if (q?.items && q.items.length > 0) {
            const roomMap: Record<string, any[]> = {};
            q.items.forEach((item: any) => {
              const rawRoomName = item.room || "General & Living";
              const roomName = rawRoomName.replace(/_/g, ' ');
              if (!roomMap[roomName]) roomMap[roomName] = [];
              const qty = Number(item.quantity) || 1;
              const rate = Number(item.unitRate) || 0;
              const fullDesc = item.itemDescription + (item.specifications ? `\n${item.specifications}` : '');
              roomMap[roomName].push({
                id: item.id,
                name: item.itemDescription,
                description: fullDesc,
                hsn: item.hsnSacCode || '9403',
                quantity: qty,
                unit: item.unitKey || 'Unit',
                rate,
                discount: 0,
                gst: 0,
                amount: Number((qty * rate).toFixed(2))
              });
            });

            setRooms(Object.keys(roomMap).map((rName, idx) => ({
              id: `room-${idx + 1}`,
              name: rName,
              roomName: rName,
              finish: 'High-Gloss Acrylic on BWR Plywood',
              finishSpec: 'High-Gloss Acrylic on BWR Plywood',
              inclusions: ['Carcass and shutters with soft-close hardware'],
              exclusions: ['Civil modifications and appliances'],
              description: '',
              items: roomMap[rName]
            })));
          }

          // 2. Tax Rate calculation
          const derivedTaxRate = (q && q.taxRate !== undefined && q.taxRate !== null && Number(q.taxRate) > 0)
            ? Number(q.taxRate)
            : (q && q.taxAmount > 0 && q.subtotal > 0)
              ? Math.round((q.taxAmount / q.subtotal) * 100)
              : (inv.totalTax > 0 && inv.taxableAmount > 0)
                ? Math.round((inv.totalTax / inv.taxableAmount) * 100)
                : (parsedMeta.taxRate !== undefined ? Number(parsedMeta.taxRate) : 0);

          const loadedTaxRate = initialInvoice?.taxRate !== undefined
            ? Number(initialInvoice.taxRate)
            : derivedTaxRate;

          const loadedPaymentAmount = Number(inv.paidAmount) || Number(inv.grandTotal) || (initialInvoice?.currentPayment !== undefined ? Number(initialInvoice.currentPayment) : 0);
          const loadedPaymentType = inv.paymentType || initialInvoice?.paymentType || (inv.notes?.toLowerCase().includes('booking') ? 'Booking Confirmation Fee' : 'Milestone Payment');
          const loadedCustomTitle = initialInvoice?.customTitle || (inv.invoiceNo.startsWith('TXI-') ? 'TAX INVOICE' : 'BOOKING CONFIRMATION TAX INVOICE');

          setGstRate(loadedTaxRate);
          setOverallDiscount(Number(q?.discountValue ?? (parsedMeta.overallDiscount ?? 0)));
          setDiscountType((q?.discountType || parsedMeta.discountType || 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED');
          setCustomTitle(loadedCustomTitle);
          setPaymentType(loadedPaymentType);
          setCurrentPayment(loadedPaymentAmount);
          setPreviousPayments(0);
          if (parsedMeta.dispatchDetails) {
            setDispatchDetails(parsedMeta.dispatchDetails);
          }
          if (parsedMeta.compliance) {
            setCompliance(parsedMeta.compliance);
          }

          setInvoice((prev) => ({
            ...prev,
            id: inv.id,
            mode: 'Tax Invoice',
            invoiceNumber: inv.invoiceNo,
            customTitle: loadedCustomTitle,
            invoiceDate: inv.invoiceDate ? formatDate(new Date(inv.invoiceDate)) : prev.invoiceDate,
            dueDate: inv.dueDate ? formatDate(new Date(inv.dueDate)) : prev.dueDate,
            status: (inv.status === 'PAID' ? 'Paid' : 'Pending') as InvoiceStatus,
            currentPayment: loadedPaymentAmount,
            advancePaid: loadedPaymentAmount,
            previousPayments: 0,
            taxRate: loadedTaxRate,
            overallDiscount: Number(q?.discountValue ?? (parsedMeta.overallDiscount ?? 0)),
            discountType: (q?.discountType || parsedMeta.discountType || 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED',
            enableRoundOff: true,
            notes: (inv.notes && !inv.notes.includes('Payment (Ref:')) ? inv.notes : 'Thank you for choosing Espacio Interiors. We appreciate your trust. We look forward to creating timeless interiors.',
            leadId: inv.leadId || q?.leadId || prev.leadId,
            projectId: inv.projectId || q?.projectId || prev.projectId,
            clientId: inv.clientId || q?.clientId || prev.clientId,
            client: {
              ...prev.client,
              name: inv.customerName || q?.client?.fullName || q?.lead?.clientName || prev.client.name,
              phone: inv.customerPhone || q?.client?.phone || q?.lead?.phone || prev.client.phone,
              email: inv.customerEmail || q?.client?.email || q?.lead?.email || prev.client.email,
              address: inv.customerAddress || q?.client?.address || q?.lead?.location || prev.client.address,
              gstin: inv.customerGstin || q?.client?.gstin || prev.client.gstin,
              location: inv.placeOfSupply || prev.client.location
            },
            project: {
              name: inv.project?.title || q?.project?.title || q?.title || prev.project.name,
              address: inv.project?.siteAddress || q?.project?.siteAddress || prev.project.address,
              designer: 'Ar. Vikram Aditya',
              salesExecutive: q?.createdBy?.fullName || 'Espacio Studio',
              stage: inv.project?.stage || q?.project?.stage || 'Completed',
              expectedCompletion: addDays(formatDate(new Date()), 30),
              type: parsedMeta.propertyType || 'Villa'
            }
          }));
        } else {
          // Fallback: If targetInvoiceId is actually a quotation ID, load as quotation in invoice mode
          const quoteRes = await fetch(`/api/v1/quotations/${targetInvoiceId}`).catch(() => null);
          if (quoteRes && quoteRes.ok) {
            const qJson = await quoteRes.json();
            if (qJson.success && qJson.data) {
              const q = qJson.data;
              const parsedMeta = q.snapshotMetadata || {};
              const loadedTaxRate = initialInvoice?.taxRate !== undefined
                ? Number(initialInvoice.taxRate)
                : (q.taxRate !== undefined && q.taxRate !== null && Number(q.taxRate) > 0)
                  ? Number(q.taxRate)
                  : (q.taxAmount > 0 && q.subtotal > 0)
                    ? Math.round((q.taxAmount / q.subtotal) * 100)
                    : 0;

              const loadedPaymentAmount = initialInvoice?.currentPayment !== undefined
                ? Number(initialInvoice.currentPayment)
                : Number(q.totalAmount) || 0;

              setGstRate(loadedTaxRate);
              setOverallDiscount(Number(q.discountValue ?? (parsedMeta.overallDiscount ?? 0)));
              setDiscountType((q.discountType || parsedMeta.discountType || 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED');
              setCustomTitle(initialInvoice?.customTitle || 'BOOKING CONFIRMATION TAX INVOICE');
              setPaymentType(initialInvoice?.paymentType || 'Booking Confirmation Fee');
              setCurrentPayment(loadedPaymentAmount);
              setPreviousPayments(0);

              setInvoice((prev) => ({
                ...prev,
                mode: 'Tax Invoice',
                invoiceNumber: initialInvoice?.invoiceNumber || prev.invoiceNumber || generateInvoiceNumber('Tax Invoice'),
                customTitle: initialInvoice?.customTitle || 'BOOKING CONFIRMATION TAX INVOICE',
                invoiceDate: formatDate(new Date()),
                dueDate: addDays(formatDate(new Date()), 30),
                status: 'Draft',
                currentPayment: loadedPaymentAmount,
                advancePaid: loadedPaymentAmount,
                previousPayments: 0,
                taxRate: loadedTaxRate,
                overallDiscount: Number(q.discountValue ?? (parsedMeta.overallDiscount ?? 0)),
                discountType: (q.discountType || parsedMeta.discountType || 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED',
                enableRoundOff: true,
                leadId: q.leadId || prev.leadId,
                projectId: q.projectId || prev.projectId,
                clientId: q.clientId || prev.clientId,
                client: {
                  ...prev.client,
                  name: q.client?.fullName || q.lead?.clientName || parsedMeta.clientName || prev.client.name,
                  phone: q.client?.phone || q.lead?.phone || parsedMeta.phone || prev.client.phone,
                  email: q.client?.email || q.lead?.email || parsedMeta.email || prev.client.email,
                  address: q.client?.address || q.lead?.location || parsedMeta.address || prev.client.address,
                  gstin: q.client?.gstin || parsedMeta.gstin || '',
                  location: q.lead?.location || parsedMeta.location
                },
                project: {
                  name: q.project?.title || parsedMeta.projectTitle || q.title || prev.project.name,
                  address: q.project?.siteAddress || parsedMeta.siteAddress || prev.project.address,
                  designer: parsedMeta.designer || 'Ar. Vikram Aditya',
                  salesExecutive: q.createdBy?.fullName || parsedMeta.salesExecutive || 'Espacio Studio',
                  stage: q.project?.stage || parsedMeta.stage || 'Completed',
                  expectedCompletion: addDays(formatDate(new Date()), 30),
                  type: parsedMeta.propertyType || 'Villa'
                }
              }));
              return;
            }
          }
          setRecordError(`Unable to load invoice. Invoice ID: ${targetInvoiceId}`);
        }
      } catch (err) {
        console.warn('Could not load specific GST invoice data:', err);
        setRecordError(`Unable to load invoice. Invoice ID: ${targetInvoiceId}`);
      } finally {
        setIsLoadingRecord(false);
      }
    };
    loadInvoiceData();
  }, [invoiceId, quotationId, initialInvoice?.mode]);

  const fetchEligibility = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/quotations/${id}/convert-invoice`);
      const json = await res.json();
      if (json.success && json.data) {
        setConversionEligibility(json.data);
      }
    } catch (err) {
      console.warn('Failed to fetch conversion eligibility:', err);
    }
  };

  const handleConvertToInvoice = async () => {
    const originalRef = invoice.invoiceNumber || 'Q-2026-001';
    const invoiceNum = generateInvoiceNumber('Tax Invoice');
    setInvoice((prev) => ({
      ...prev,
      mode: 'Tax Invoice',
      invoiceNumber: invoiceNum,
      quotationReference: `${originalRef} v1`,
      enableRoundOff: true,
      showHsnColumn: false,
      status: 'Draft'
    }));
    setCustomTitle('TAX INVOICE');
    setEnableRoundOff(true);

    if (quotationId) {
      setIsConverting(true);
      try {
        const res = await fetch(`/api/v1/quotations/${quotationId}/convert-invoice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const json = await res.json();
        if (json.success && json.data) {
          const inv = json.data.invoice;
          setSaveSuccessMsg(`Converted to Invoice #${inv.invoiceNo}!`);
          setTimeout(() => setSaveSuccessMsg(''), 5000);
          await fetchEligibility(quotationId);
        } else {
          setSaveSuccessMsg(`Converted to Invoice #${invoiceNum}!`);
          setTimeout(() => setSaveSuccessMsg(''), 4000);
        }
      } catch (err: any) {
        setSaveSuccessMsg(`Converted to Invoice #${invoiceNum}!`);
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } finally {
        setIsConverting(false);
      }
    } else {
      setSaveSuccessMsg(`Converted to Invoice ${invoiceNum} (Referencing ${originalRef} v1)`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    }
  };

  // Sync terms to invoice
  useEffect(() => {
    setInvoice((prev) => ({ ...prev, terms }));
  }, [terms]);

  // Sync custom title, signature, payment engine values, dispatch & compliance to invoice
  useEffect(() => {
    setInvoice((prev) => ({
      ...prev,
      customTitle,
      showSignature,
      quotationType,
      paymentType,
      previousPayments: Number(previousPayments) || 0,
      currentPayment: Number(currentPayment) || 0,
      advancePaid: Number(currentPayment) || 0,
      overallDiscount: Number(overallDiscount) || 0,
      discountType,
      taxRate: gstRate,
      dispatchDetails,
      compliance
    }));
  }, [customTitle, showSignature, quotationType, paymentType, previousPayments, currentPayment, overallDiscount, discountType, gstRate, dispatchDetails, compliance]);

  // --- GENERATED INVOICE VIEW MODE CHECK ---
  // Pure read-only view ONLY for already-persisted, generated, paid, or converted invoices.
  // During new invoice creation / generation (invoice.status === 'Draft' and !readOnly), editable options MUST remain active.
  const isGeneratedInvoiceView = Boolean(
    invoice.status !== 'Draft' && (
      (isInvoiceLookup && Boolean(invoice.id)) ||
      readOnly ||
      ((invoice.mode === 'Tax Invoice' || invoice.mode === 'Bill' || invoice.mode === 'Receipt') &&
        (invoice.status === 'Paid' || invoice.status === 'Accepted' || (invoice.status as string) === 'PAID' || (invoice.status as string) === 'ISSUED' || (invoice.status as string) === 'APPROVED'))
    )
  );

  // --- DERIVED FINANCIAL & PAYMENT ENGINE CALCULATIONS ---
  const isRoomWiseMode = quotationType === 'LEAD' && Boolean(rooms && rooms.length > 0);
  const activeItems = isRoomWiseMode
    ? rooms.flatMap((r) => {
        return r.items.map((item) => {
          const lines = (item.description || '').split('\n');
          const title = lines[0] || (item as any).name || r.roomName || 'Work Item';
          const existingBullets = lines.slice(1);
          const fullDesc = existingBullets.length > 0 ? `${title}\n${existingBullets.join('\n')}` : title;
          const qty = Number(item.quantity) || 1;
          const rate = Number(item.rate) || 0;

          return {
            ...item,
            name: title,
            description: fullDesc,
            quantity: qty,
            rate: rate,
            amount: Number((qty * rate).toFixed(2))
          };
        });
      })
    : (invoice.items && invoice.items.length > 0)
      ? invoice.items
      : [];
  const totals = calculateTotals(activeItems, invoice.advancePaid, true, enableRoundOff, overallDiscount, discountType, gstRate);
  const effectivePaidFee = Number(currentPayment) || Number(invoice.advancePaid) || 0;
  const amountWords = (effectivePaidFee > 0 && (invoice.mode === 'Tax Invoice' || invoice.mode === 'Bill' || invoice.mode === 'Receipt' || (Number(currentPayment) || 0) > 0))
    ? amountToWords(effectivePaidFee)
    : amountToWords(totals.grandTotal);
  const totalPaid = (Number(previousPayments) || 0) + (Number(currentPayment) || 0);
  const remainingBalance = Math.max(0, totals.grandTotal - totalPaid);
  const remainingBalanceWords = amountToWords(remainingBalance);
  const maxAllowablePayment = Math.max(0, totals.grandTotal - (Number(previousPayments) || 0));
  const isOverpaid = (Number(currentPayment) || 0) > maxAllowablePayment;
  const isApproved = invoice.status === 'Paid' || invoice.status === 'Accepted' || Boolean(quotationId && totals.grandTotal > 0 && remainingBalance < totals.grandTotal);
  const paymentStatus: InvoiceStatus = remainingBalance === 0 ? 'Paid' : totalPaid > 0 ? 'Partially Paid' : isApproved ? 'Accepted' : 'Draft';

  // --- ROOM & MILESTONE HELPERS ---
  const getRoomSubtotal = (room: RoomGroup) => {
    return room.items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  };

  const handleAddRoom = () => {
    const newRoom: RoomGroup = {
      id: String(Date.now()),
      name: `Room ${rooms.length + 1}`,
      roomName: `Room ${rooms.length + 1}`,
      finish: 'High-Gloss Acrylic on BWR Plywood',
      finishSpec: 'High-Gloss Acrylic on BWR Plywood',
      inclusions: ['Carcass and shutters with soft-close hardware'],
      exclusions: ['Civil modifications and appliances'],
      items: [
        {
          id: String(Date.now() + 1),
          description: 'Modular Woodwork Unit\nCustom-built to site dimensions',
          hsn: '9403',
          quantity: 1,
          unit: 'Unit',
          rate: 45000,
          discount: 0,
          gst: 0,
          amount: 45000
        }
      ]
    };
    setRooms([...rooms, newRoom]);
  };

  const handleDeleteRoom = (roomId: string) => {
    if (rooms.length <= 1) return;
    setRooms(rooms.filter((r) => r.id !== roomId));
  };

  const handleRoomChange = (roomId: string, field: 'name' | 'roomName' | 'finish' | 'finishSpec', value: string) => {
    setRooms(rooms.map((r) => r.id === roomId ? {
      ...r,
      [field]: value,
      ...(field === 'roomName' ? { name: value } : {}),
      ...(field === 'name' ? { roomName: value } : {}),
      ...(field === 'finishSpec' ? { finish: value } : {}),
      ...(field === 'finish' ? { finishSpec: value } : {})
    } : r));
  };

  const handleRoomInclusionsChange = (roomId: string, text: string) => {
    const arr = text.split('\n').filter((t) => t.trim().length > 0);
    setRooms(rooms.map((r) => r.id === roomId ? { ...r, inclusions: arr } : r));
  };

  const handleRoomExclusionsChange = (roomId: string, text: string) => {
    const arr = text.split('\n').filter((t) => t.trim().length > 0);
    setRooms(rooms.map((r) => r.id === roomId ? { ...r, exclusions: arr } : r));
  };

  const handleAddRoomItem = (roomId: string) => {
    const newItem: InvoiceItem = {
      id: String(Date.now()),
      description: 'Custom Woodwork Sub-Item\nSpecifications...',
      hsn: '9403',
      quantity: 1,
      unit: 'Unit',
      rate: 25000,
      discount: 0,
      gst: 0,
      amount: 25000
    };
    setRooms(rooms.map((r) => r.id === roomId ? { ...r, items: [...r.items, newItem] } : r));
  };

  const handleDeleteRoomItem = (roomId: string, itemId: string) => {
    setRooms(rooms.map((r) => {
      if (r.id !== roomId) return r;
      if (r.items.length <= 1) return r;
      return { ...r, items: r.items.filter((it) => it.id !== itemId) };
    }));
  };

  const handleRoomItemChange = (roomId: string, itemId: string, field: keyof InvoiceItem, value: any) => {
    setRooms(rooms.map((r) => {
      if (r.id !== roomId) return r;
      const updatedItems = r.items.map((item) => {
        if (item.id === itemId) {
          const updated = { ...item, [field]: value };
          const qty = Number(updated.quantity) || 0;
          const rate = Number(updated.rate) || 0;
          updated.amount = Number((qty * rate).toFixed(2));
          updated.discount = 0;
          return updated;
        }
        return item;
      });
      return { ...r, items: updatedItems };
    }));
  };

  const handleAddMilestone = () => {
    const newMs: PaymentMilestone = {
      id: String(Date.now()),
      name: `Milestone ${paymentMilestones.length + 1}`,
      percentage: 10,
      stage: `Stage ${paymentMilestones.length + 1}`,
      stageRef: `Stage ${paymentMilestones.length + 1}`
    };
    setPaymentMilestones([...paymentMilestones, newMs]);
  };

  const handleDeleteMilestone = (id: string) => {
    if (paymentMilestones.length <= 1) return;
    setPaymentMilestones(paymentMilestones.filter((m) => m.id !== id));
  };

  const handleMilestoneChange = (id: string, field: keyof PaymentMilestone, value: any) => {
    setPaymentMilestones(paymentMilestones.map((m) => m.id === id ? {
      ...m,
      [field]: value,
      ...(field === 'stage' ? { stageRef: value } : {}),
      ...(field === 'stageRef' ? { stage: value } : {})
    } : m));
  };

  // CHANGE 25: Digital Quotation Acceptance Handler
  const handleAcceptQuotation = async () => {
    const timestamp = new Date().toLocaleString('en-IN');
    setIsSaving(true);
    setSaveSuccessMsg('Accepting & Saving Quotation...');
    setInvoice((prev) => ({
      ...prev,
      status: 'Accepted',
      acceptedAt: timestamp,
      isLocked: true
    }));

    try {
      const activeTitle = customTitle.trim() || (quotationType === 'MATERIAL' ? 'MATERIALS & SERVICES QUOTATION' : invoice.project.name || `${invoice.client.name} Interior Quotation`);
      const clientSnapshotData = {
        quotationType,
        customTitle: activeTitle,
        paymentType,
        previousPayments: Number(previousPayments) || 0,
        currentPayment: Number(currentPayment) || 0,
        showSignature,
        enableRoundOff,
        showHsnColumn,
        advancePaid: Number(currentPayment) || 0,
        advanceDate,
        advanceReceiptRef,
        compliance,
        dispatchDetails,
        taxRate: Number(gstRate) || 0,
        warrantyInfo,
        supportContact,
        paymentMilestones,
        rooms: isRoomWiseMode && rooms && rooms.length > 0 ? rooms : undefined,
        clientName: invoice.client.name,
        phone: invoice.client.phone,
        email: invoice.client.email,
        address: invoice.client.address,
        gstin: invoice.client.gstin,
        location: invoice.client.location,
        requirement: invoice.client.requirement,
        projectTitle: invoice.project.name,
        siteAddress: invoice.project.address,
        designer: invoice.project.designer,
        salesExecutive: invoice.project.salesExecutive,
        stage: invoice.project.stage,
        propertyType: invoice.project.type,
        company: invoice.company,
        bank: invoice.bank
      };

      let resolvedLeadId = (quotationType === 'LEAD' || quotationType === 'MATERIAL') ? (selectedLeadId || invoice.leadId || leadId || undefined) : undefined;
      const targetProjectId = quotationType === 'PROJECT' ? (selectedProjectId || invoice.projectId || projectId || undefined) : (invoice.projectId || undefined);

      if (!resolvedLeadId && !targetProjectId && (invoice.client.phone || invoice.client.name)) {
        const cleanPhone = (invoice.client.phone || '').replace(/\D/g, '');
        const existingLead = leadsList.find((l) =>
          (cleanPhone && l.phone && l.phone.replace(/\D/g, '').includes(cleanPhone.slice(-10))) ||
          (invoice.client.name && l.clientName && l.clientName.toLowerCase().trim() === invoice.client.name.toLowerCase().trim())
        );
        if (existingLead) {
          resolvedLeadId = existingLead.id;
          setSelectedLeadId(existingLead.id);
        } else if (invoice.client.name && invoice.client.phone) {
          try {
            if (quotationType === 'MATERIAL') {
              const createLeadRes = await fetch('/api/v1/material-leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customerName: invoice.client.name.trim(),
                  primaryContact: invoice.client.phone.trim(),
                  email: invoice.client.email?.trim() || null,
                  location: invoice.client.location?.trim() || invoice.client.address?.trim() || 'General Location',
                  sourceKey: 'DIRECT',
                  notes: invoice.client.requirement?.trim() || activeTitle,
                })
              });
              const createLeadJson = await createLeadRes.json();
              if (createLeadJson.success && createLeadJson.data) {
                resolvedLeadId = createLeadJson.data.id;
                setSelectedLeadId(createLeadJson.data.id);
                setLeadsList((prev) => [createLeadJson.data, ...prev]);
              }
            } else {
              const createLeadRes = await fetch('/api/v1/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clientName: invoice.client.name.trim(),
                  phone: invoice.client.phone.trim(),
                  email: invoice.client.email?.trim() || null,
                  location: invoice.client.location?.trim() || invoice.client.address?.trim() || null,
                  propertyTypeKey: 'APARTMENT_INTERIOR',
                  requirement: invoice.client.requirement?.trim() || activeTitle,
                  budget: totals.grandTotal || undefined,
                  sourceKey: 'DIRECT'
                })
              });
              const createLeadJson = await createLeadRes.json();
              if (createLeadJson.success && createLeadJson.data) {
                resolvedLeadId = createLeadJson.data.id;
                setSelectedLeadId(createLeadJson.data.id);
                setLeadsList((prev) => [createLeadJson.data, ...prev]);
              }
            }
          } catch (createErr) {
            console.warn('Could not auto-create lead for quotation:', createErr);
          }
        }
      }

      const payload = {
        title: activeTitle,
        customTitle: activeTitle,
        quotationType,
        status: 'APPROVED',
        paymentType,
        previousPayments: Number(previousPayments) || 0,
        currentPayment: Number(currentPayment) || 0,
        showSignature,
        overallDiscount: Number(overallDiscount) || 0,
        discountValue: Number(overallDiscount) || 0,
        discountType: overallDiscount > 0 ? discountType : undefined,
        taxRate: Number(gstRate) || 0,
        advancePaid: Number(currentPayment) || 0,
        leadId: resolvedLeadId,
        projectId: targetProjectId,
        clientId: invoice.clientId || undefined,
        notes: invoice.notes,
        termsAndConditions: terms.join('\n'),
        clientSnapshot: JSON.stringify(clientSnapshotData),
        items: isRoomWiseMode && rooms && rooms.length > 0
          ? rooms.flatMap((r) => {
            const rName = r.roomName || r.name || 'ROOM';
            const rFinish = r.finishSpec || r.finish || '';
            return r.items.map((item, idx) => ({
              room: rName.toUpperCase().replace(/\s+/g, '_'),
              category: 'MODULAR_WOODWORK',
              itemType: 'CUSTOM' as const,
              itemDescription: item.description.split('\n')[0] || rName,
              specifications: [
                rFinish ? `Finish: ${rFinish}` : '',
                r.inclusions && r.inclusions.length > 0 ? `Inclusions: ${r.inclusions.join(', ')}` : '',
                r.exclusions && r.exclusions.length > 0 ? `Exclusions: ${r.exclusions.join(', ')}` : '',
                item.description.split('\n').slice(1).join('\n')
              ].filter(Boolean).join('\n') || null,
              quantity: Number(item.quantity) || 1,
              unitKey: (item.unit || 'NOS') as any,
              unitRate: Number(item.rate) || 0,
              discountAmount: 0,
              sortOrder: idx + 1
            }));
          })
          : (invoice.items || []).map((item, idx) => ({
            room: quotationType === 'MATERIAL' ? 'MATERIALS' : 'LIVING_ROOM',
            category: quotationType === 'MATERIAL' ? 'MATERIAL_SUPPLY' : 'MODULAR_WOODWORK',
            itemType: 'CUSTOM' as const,
            itemDescription: item.description.split('\n')[0] || 'Material Item',
            specifications: item.description.split('\n').slice(1).join('\n') || null,
            quantity: Number(item.quantity) || 1,
            unitKey: (item.unit || 'NOS') as any,
            unitRate: Number(item.rate) || 0,
            discountAmount: 0,
            sortOrder: idx + 1
          }))
      };

      let activeQuoteId = quotationId;
      if (quotationId) {
        await fetch(`/api/v1/quotations/${quotationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        await fetch(`/api/v1/quotations/${quotationId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: `Digitally accepted on ${timestamp}` })
        }).catch(() => null);
      } else {
        const res = await fetch('/api/v1/quotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success && json.data) {
          activeQuoteId = json.data.id;
        }
      }

      // If linked to a lead, handle lead progression and payment recording
      const isInvoiceOrConfirmation = invoice.mode === 'Tax Invoice' || customTitle.toUpperCase().includes('INVOICE') || customTitle.toUpperCase().includes('CONFIRMATION');

      if (activeQuoteId && isInvoiceOrConfirmation) {
        // 1. Create official GST Invoice & record Client Payment linked in database
        try {
          await fetch('/api/v1/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quotationId: activeQuoteId,
              paymentType: paymentType || 'Booking Confirmation Fee',
              amountPaid: Number(currentPayment) || totals.grandTotal || 0,
              paymentDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString() : new Date().toISOString(),
              paymentMode: paymentType === 'Advance Payment' ? 'UPI' : paymentType || 'UPI',
              invoiceNo: invoice.invoiceNumber,
              transactionReference: advanceReceiptRef || undefined,
              paymentNotes: invoice.notes || 'Verified & Accepted via Quotation Studio',
              allowOverpayment: true,
            })
          });
        } catch (invErr) {
          console.warn('Could not create backend GST invoice directly, falling back:', invErr);
        }

        if (resolvedLeadId) {
          if (quotationType === 'MATERIAL') {
            await fetch(`/api/v1/material-leads/${resolvedLeadId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'QUOTATION_SENT' })
            }).catch(() => null);
          } else {
            await fetch(`/api/v1/leads/${resolvedLeadId}/status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'QUOTATION_SENT' })
            }).catch(() => null);
          }
        }

        setSaveSuccessMsg(`Invoice Accepted & Official GST Invoice Attached!`);
      } else if (resolvedLeadId) {
        if (quotationType === 'MATERIAL') {
          await fetch(`/api/v1/material-leads/${resolvedLeadId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'QUOTATION_SENT' })
          }).catch(() => null);
        } else {
          await fetch(`/api/v1/leads/${resolvedLeadId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'QUOTATION_SENT' })
          }).catch(() => null);
        }

        setSaveSuccessMsg(`Quotation Accepted! You can continue editing or mark Lead as Won in Negotiation.`);
      } else {
        setSaveSuccessMsg(`Document Accepted & Saved!`);
      }

      setTimeout(() => {
        setSaveSuccessMsg('');
        onSaveComplete?.();
      }, 1000);
    } catch (e) {
      console.error('Approval error:', e);
      setSaveSuccessMsg('Document accepted.');
      setTimeout(() => onSaveComplete?.(), 1000);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Quotation Handler (Unified Dynamic Save)
  const handleSaveQuotation = async () => {
    if (isOverpaid) {
      alert(`Overpayment validation error: Current payment of ₹${(Number(currentPayment) || 0).toLocaleString('en-IN')} exceeds the remaining balance of ₹${maxAllowablePayment.toLocaleString('en-IN')}. Please enter an amount equal to or less than the balance.`);
      return;
    }
    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      const activeTitle = customTitle.trim() || (quotationType === 'MATERIAL' ? 'MATERIALS & SERVICES QUOTATION' : invoice.project.name || `${invoice.client.name} Interior Quotation`);
      const clientSnapshotData = {
        quotationType,
        customTitle: activeTitle,
        paymentType,
        previousPayments: Number(previousPayments) || 0,
        currentPayment: Number(currentPayment) || 0,
        showSignature,
        enableRoundOff,
        showHsnColumn,
        advancePaid: Number(currentPayment) || 0,
        advanceDate,
        advanceReceiptRef,
        compliance,
        taxRate: Number(gstRate) || 0,
        warrantyInfo,
        supportContact,
        paymentMilestones,
        rooms: isRoomWiseMode && rooms && rooms.length > 0 ? rooms : undefined,
        clientName: invoice.client.name,
        phone: invoice.client.phone,
        email: invoice.client.email,
        address: invoice.client.address,
        gstin: invoice.client.gstin,
        location: invoice.client.location,
        requirement: invoice.client.requirement,
        projectTitle: invoice.project.name,
        siteAddress: invoice.project.address,
        designer: invoice.project.designer,
        salesExecutive: invoice.project.salesExecutive,
        stage: invoice.project.stage,
        propertyType: invoice.project.type,
        company: invoice.company,
        bank: invoice.bank
      };

      let resolvedLeadId = (quotationType === 'LEAD' || quotationType === 'MATERIAL') ? (selectedLeadId || invoice.leadId || leadId || undefined) : undefined;
      const targetProjectId = quotationType === 'PROJECT' ? (selectedProjectId || invoice.projectId || projectId || undefined) : (invoice.projectId || undefined);

      if (!resolvedLeadId && !targetProjectId && (invoice.client.phone || invoice.client.name)) {
        const cleanPhone = (invoice.client.phone || '').replace(/\D/g, '');
        const existingLead = leadsList.find((l) =>
          (cleanPhone && l.phone && l.phone.replace(/\D/g, '').includes(cleanPhone.slice(-10))) ||
          (invoice.client.name && l.clientName && l.clientName.toLowerCase().trim() === invoice.client.name.toLowerCase().trim())
        );
        if (existingLead) {
          resolvedLeadId = existingLead.id;
          setSelectedLeadId(existingLead.id);
        } else if (invoice.client.name && invoice.client.phone) {
          try {
            if (quotationType === 'MATERIAL') {
              const createLeadRes = await fetch('/api/v1/material-leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customerName: invoice.client.name.trim(),
                  primaryContact: invoice.client.phone.trim(),
                  email: invoice.client.email?.trim() || null,
                  location: invoice.client.location?.trim() || invoice.client.address?.trim() || 'General Location',
                  sourceKey: 'DIRECT',
                  notes: invoice.client.requirement?.trim() || activeTitle,
                })
              });
              const createLeadJson = await createLeadRes.json();
              if (createLeadJson.success && createLeadJson.data) {
                resolvedLeadId = createLeadJson.data.id;
                setSelectedLeadId(createLeadJson.data.id);
                setLeadsList((prev) => [createLeadJson.data, ...prev]);
              }
            } else {
              const createLeadRes = await fetch('/api/v1/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clientName: invoice.client.name.trim(),
                  phone: invoice.client.phone.trim(),
                  email: invoice.client.email?.trim() || null,
                  location: invoice.client.location?.trim() || invoice.client.address?.trim() || null,
                  propertyTypeKey: 'APARTMENT_INTERIOR',
                  requirement: invoice.client.requirement?.trim() || activeTitle,
                  budget: totals.grandTotal || undefined,
                  sourceKey: 'DIRECT'
                })
              });
              const createLeadJson = await createLeadRes.json();
              if (createLeadJson.success && createLeadJson.data) {
                resolvedLeadId = createLeadJson.data.id;
                setSelectedLeadId(createLeadJson.data.id);
                setLeadsList((prev) => [createLeadJson.data, ...prev]);
              }
            }
          } catch (createErr) {
            console.warn('Could not auto-create lead for quotation:', createErr);
          }
        }
      }

      const payload = {
        title: activeTitle,
        customTitle: activeTitle,
        quotationType,
        paymentType,
        previousPayments: Number(previousPayments) || 0,
        currentPayment: Number(currentPayment) || 0,
        showSignature,
        overallDiscount: Number(overallDiscount) || 0,
        discountValue: Number(overallDiscount) || 0,
        discountType: overallDiscount > 0 ? discountType : undefined,
        taxRate: Number(gstRate) || 0,
        advancePaid: Number(currentPayment) || 0,
        leadId: resolvedLeadId,
        projectId: targetProjectId,
        clientId: invoice.clientId || undefined,
        notes: invoice.notes,
        termsAndConditions: terms.join('\n'),
        clientSnapshot: JSON.stringify(clientSnapshotData),
        items: isRoomWiseMode && rooms && rooms.length > 0
          ? rooms.flatMap((r) => {
            const rName = r.roomName || r.name || 'ROOM';
            const rFinish = r.finishSpec || r.finish || '';
            return r.items.map((item, idx) => ({
              room: rName.toUpperCase().replace(/\s+/g, '_'),
              category: 'MODULAR_WOODWORK',
              itemType: 'CUSTOM' as const,
              itemDescription: item.description.split('\n')[0] || rName,
              specifications: [
                rFinish ? `Finish: ${rFinish}` : '',
                r.inclusions && r.inclusions.length > 0 ? `Inclusions: ${r.inclusions.join(', ')}` : '',
                r.exclusions && r.exclusions.length > 0 ? `Exclusions: ${r.exclusions.join(', ')}` : '',
                item.description.split('\n').slice(1).join('\n')
              ].filter(Boolean).join('\n') || null,
              quantity: Number(item.quantity) || 1,
              unitKey: (item.unit || 'NOS') as any,
              unitRate: Number(item.rate) || 0,
              discountAmount: 0,
              sortOrder: idx + 1
            }));
          })
          : (invoice.items || []).map((item, idx) => ({
            room: quotationType === 'MATERIAL' ? 'MATERIALS' : 'LIVING_ROOM',
            category: quotationType === 'MATERIAL' ? 'MATERIAL_SUPPLY' : 'MODULAR_WOODWORK',
            itemType: 'CUSTOM' as const,
            itemDescription: item.description.split('\n')[0] || 'Material Item',
            specifications: item.description.split('\n').slice(1).join('\n') || null,
            quantity: Number(item.quantity) || 1,
            unitKey: (item.unit || 'NOS') as any,
            unitRate: Number(item.rate) || 0,
            discountAmount: 0,
            sortOrder: idx + 1
          }))
      };

      if (quotationId) {
        const res = await fetch(`/api/v1/quotations/${quotationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          const q = json.data;
          setSaveSuccessMsg('Quotation saved successfully!');
          setTimeout(() => setSaveSuccessMsg(''), 3500);
          setSavedQuoteData({
            id: q?.id || quotationId,
            referenceNo: q?.referenceNo || invoice.invoiceNumber,
            title: activeTitle,
            clientName: invoice.client.name,
            totalAmount: totals.grandTotal,
            quotationType
          });
          setIsSuccessModalOpen(true);
          if (resolvedLeadId) {
            if (quotationType === 'MATERIAL') {
              await fetch(`/api/v1/material-leads/${resolvedLeadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'QUOTATION_SENT' })
              }).catch(() => null);
            } else {
              await fetch(`/api/v1/leads/${resolvedLeadId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'QUOTATION_SENT' })
              }).catch(() => null);
            }
          }
          onSaveComplete?.();
        } else {
          alert(json.error?.message || 'Failed to save quotation');
        }
      } else {
        const res = await fetch('/api/v1/quotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          const q = json.data;
          setSaveSuccessMsg('Quotation generated successfully!');
          setTimeout(() => setSaveSuccessMsg(''), 3500);
          if (q?.referenceNo) {
            setInvoice((prev) => ({
              ...prev,
              invoiceNumber: q.referenceNo
            }));
          }
          setSavedQuoteData({
            id: q?.id || '1',
            referenceNo: q?.referenceNo || invoice.invoiceNumber,
            title: activeTitle,
            clientName: invoice.client.name,
            totalAmount: totals.grandTotal,
            quotationType
          });
          setIsSuccessModalOpen(true);
          if (resolvedLeadId) {
            if (quotationType === 'MATERIAL') {
              await fetch(`/api/v1/material-leads/${resolvedLeadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'QUOTATION_SENT' })
              }).catch(() => null);
            } else {
              await fetch(`/api/v1/leads/${resolvedLeadId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'QUOTATION_SENT' })
              }).catch(() => null);
            }
          }
          onSaveComplete?.();
        } else {
          alert(json.error?.message || 'Failed to create quotation');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error saving quotation');
    } finally {
      setIsSaving(false);
    }
  };

  // --- RESPONSIVE PDF DOCUMENT PREVIEW SCALER & DYNAMIC HEIGHT TRACKER ---
  const [paperFormat, setPaperFormat] = useState<'a4' | 'a3' | 'a5' | 'letter' | 'legal'>('a4');
  const [paperOrientation, setPaperOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [previewZoomMode, setPreviewZoomMode] = useState<'fit-page' | 'fit-width' | '100%' | '75%' | '50%' | 'custom'>('fit-page');
  const [documentScale, setDocumentScale] = useState<number>(0.85);
  const [canvasHeight, setCanvasHeight] = useState<number>(1160);

  // Ensure preview panel always scrolls to the very top when opening document
  useEffect(() => {
    if (previewPanelRef.current) {
      previewPanelRef.current.scrollTop = 0;
    }
  }, [quotationId, invoice.invoiceNumber, invoice.mode]);

  const getCanvasDimensions = () => {
    if (paperFormat === 'a3') {
      return paperOrientation === 'landscape'
        ? { width: 1640, minHeight: 1160, baseWidth: 1640 }
        : { width: 1160, minHeight: 1640, baseWidth: 1160 };
    }
    if (paperFormat === 'a5') {
      return paperOrientation === 'landscape'
        ? { width: 820, minHeight: 580, baseWidth: 820 }
        : { width: 580, minHeight: 820, baseWidth: 580 };
    }
    if (paperFormat === 'letter') {
      return paperOrientation === 'landscape'
        ? { width: 1056, minHeight: 816, baseWidth: 1056 }
        : { width: 816, minHeight: 1056, baseWidth: 816 };
    }
    if (paperFormat === 'legal') {
      return paperOrientation === 'landscape'
        ? { width: 1344, minHeight: 816, baseWidth: 1344 }
        : { width: 816, minHeight: 1344, baseWidth: 816 };
    }
    // Default A4 (Exact ISO 216: 210mm × 297mm)
    return paperOrientation === 'landscape'
      ? { width: 1123, minHeight: 794, baseWidth: 1123 }
      : { width: 794, minHeight: 1123, baseWidth: 794 };
  };

  // Dynamic @page style synchronization for window.print and Ctrl+P
  useEffect(() => {
    let styleTag = document.getElementById('quotation-print-page-size-style') as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'quotation-print-page-size-style';
      document.head.appendChild(styleTag);
    }
    const sizeStr = `${paperFormat.toUpperCase()} ${paperOrientation}`;
    styleTag.innerHTML = `
      @media print {
        @page {
          size: ${sizeStr} !important;
          margin: 0 !important;
        }
      }
    `;
  }, [paperFormat, paperOrientation]);

  useEffect(() => {
    const handleResize = () => {
      if (previewPanelRef.current) {
        const containerWidth = previewPanelRef.current.clientWidth - 40;
        const containerHeight = previewPanelRef.current.clientHeight - 130;
        const dims = getCanvasDimensions();
        const targetBaseWidth = dims.baseWidth;
        const targetMinHeight = dims.minHeight;

        if (previewZoomMode === '100%') {
          setDocumentScale(1);
        } else if (previewZoomMode === '75%') {
          setDocumentScale(0.75);
        } else if (previewZoomMode === '50%') {
          setDocumentScale(0.5);
        } else if (previewZoomMode === 'fit-page') {
          const effectiveDocHeight = Math.max(targetMinHeight, canvasHeight);
          const scaleW = containerWidth > 0 ? containerWidth / targetBaseWidth : 0.85;
          const scaleH = containerHeight > 0 ? containerHeight / effectiveDocHeight : 0.85;
          const fitScale = Math.min(scaleW, scaleH);
          setDocumentScale(Math.max(0.35, Math.min(1.1, Number(fitScale.toFixed(2)))));
        } else if (previewZoomMode === 'fit-width') {
          if (containerWidth < targetBaseWidth && containerWidth > 0) {
            setDocumentScale(Math.max(0.35, Number((containerWidth / targetBaseWidth).toFixed(2))));
          } else {
            setDocumentScale(1);
          }
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [paperFormat, paperOrientation, previewZoomMode, canvasHeight]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const updateCanvasHeight = () => {
      if (canvasRef.current) {
        const h = canvasRef.current.scrollHeight || canvasRef.current.offsetHeight || 1160;
        setCanvasHeight(h);
      }
    };

    updateCanvasHeight();
    const observer = new ResizeObserver(() => {
      updateCanvasHeight();
    });
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [invoice, terms, showSignature, customTitle, paymentType, currentPayment, paperFormat, paperOrientation]);

  // Modals state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTargetItemId, setAiTargetItemId] = useState<string | null>(null);
  const [aiTargetItemName, setAiTargetItemName] = useState<string>('');

  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    document: true,
    company: false,
    client: true,
    items: true,
    payment: false,
    milestones: false,
    terms: false,
    warranty: false
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [driveModalOpen, setDriveModalOpen] = useState(false);

  // --- AUTO CALCULATE ITEM AMOUNTS ---
  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoice((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          const qty = Number(updated.quantity) || 0;
          const rate = Number(updated.rate) || 0;
          updated.amount = Number((qty * rate).toFixed(2));
          updated.discount = 0;
          return updated;
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });
  };

  // --- ADD / DELETE ITEMS ---
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: String(Date.now()),
      description: quotationType === 'MATERIAL'
        ? 'IS:710 Marine Grade BWP Plywood (18mm, 8x4 ft)\nWaterproof, borer & termite resistant core'
        : 'Custom Woodwork Panel\nDetails to be generated...',
      hsn: quotationType === 'MATERIAL' ? '4412' : '9403',
      quantity: 1,
      unit: quotationType === 'MATERIAL' ? 'Sheets' : 'Unit',
      rate: quotationType === 'MATERIAL' ? 2850 : 45000,
      discount: 0,
      gst: 0,
      amount: quotationType === 'MATERIAL' ? 2850 : 45000
    };
    setInvoice((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleAddMaterialPreset = (preset: typeof MATERIAL_PRESETS[0]) => {
    const qty = preset.quantity || 1;
    const rate = preset.rate || 0;

    const newItem: InvoiceItem = {
      id: String(Date.now() + Math.floor(Math.random() * 1000)),
      description: `${preset.name}\n${preset.description}`,
      hsn: preset.hsn,
      quantity: qty,
      unit: preset.unit,
      rate,
      discount: 0,
      gst: 0,
      amount: Number((qty * rate).toFixed(2))
    };

    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleAddMultipleItems = () => {
    if (quotationType === 'MATERIAL') {
      const batch: InvoiceItem[] = [
        {
          id: String(Date.now() + 1),
          description: 'IS:710 Marine Grade Plywood (18mm, 8x4 ft)\nCalibrated core, waterproof',
          hsn: '4412',
          quantity: 12,
          unit: 'Sheets',
          rate: 2850,
          discount: 0,
          gst: 0,
          amount: 34200
        },
        {
          id: String(Date.now() + 2),
          description: '1mm High-Gloss Anti-Fingerprint Laminate (8x4 ft)\nDecorative surface for cabinetry shutters',
          hsn: '3920',
          quantity: 8,
          unit: 'Sheets',
          rate: 1950,
          discount: 0,
          gst: 0,
          amount: 15600
        },
        {
          id: String(Date.now() + 3),
          description: 'Blum Tandembox Soft-Close Runners (500mm)\nHeavy duty 30kg capacity runners',
          hsn: '8302',
          quantity: 6,
          unit: 'Sets',
          rate: 3400,
          discount: 0,
          gst: 0,
          amount: 20400
        }
      ];
      setInvoice((prev) => ({ ...prev, items: [...prev.items, ...batch] }));
      return;
    }

    const batch: InvoiceItem[] = [
      {
        id: String(Date.now() + 1),
        description: 'Living Room TV Unit\nFluted panel back wall with indirect LED\nBottom storage console\nPU finish',
        hsn: '9403',
        quantity: 1,
        unit: 'Unit',
        rate: 65000,
        discount: 0,
        gst: 0,
        amount: 65000
      },
      {
        id: String(Date.now() + 2),
        description: 'Master Bedroom Vanity Mirror & Dresser\nLED backlit vanity mirror\nDrawers with velvet organizer\nSoft close Blum runners',
        hsn: '9403',
        quantity: 1,
        unit: 'Unit',
        rate: 38000,
        discount: 0,
        gst: 0,
        amount: 38000
      }
    ];
    setInvoice((prev) => ({ ...prev, items: [...prev.items, ...batch] }));
  };

  const handleDeleteItem = (id: string) => {
    setInvoice((prev) => {
      if (prev.items.length === 1) return prev;
      const updated = prev.items.filter((item) => item.id !== id);
      return { ...prev, items: updated };
    });
  };

  // --- GENERATE SMART VALUES ---
  const handleRegenerateInvoiceNumber = () => {
    const randomCount = Math.floor(Math.random() * 80) + 12;
    const prefix = quotationType === 'MATERIAL' ? 'MAT' : quotationType === 'PROJECT' ? 'PRJ' : 'Q';
    const num = `${prefix}-2026-${String(randomCount).padStart(4, '0')}`;
    setInvoice({ ...invoice, invoiceNumber: num });
  };

  const handleAutofillGst = (type: 'company' | 'client') => {
    const randomGst = generateGSTIN('36');
    if (type === 'company') {
      setInvoice({
        ...invoice,
        company: { ...invoice.company, gstin: randomGst }
      });
    } else {
      setInvoice({
        ...invoice,
        client: { ...invoice.client, gstin: randomGst }
      });
    }
  };

  // --- DYNAMIC CRM SELECTION HANDLERS ---
  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    const found = leadsList.find((l) => l.id === leadId);
    if (found) {
      const assignedReq = found.requirement || (quotationType === 'MATERIAL' ? 'MATERIALS REQUIRED' : found.propertyTypeKey || '');
      setInvoice((prev) => ({
        ...prev,
        leadId: found.id,
        client: {
          ...prev.client,
          name: found.clientName || prev.client.name,
          phone: found.phone || prev.client.phone,
          email: found.email || prev.client.email || '',
          address: found.location || prev.client.address || '',
          location: found.location || '',
          requirement: assignedReq
        }
      }));
    }
  };

  const handleSelectProject = async (projId: string) => {
    setSelectedProjectId(projId);
    if (!projId) return;

    // 1. Immediately apply from cached projectsList
    const found = projectsList.find((p) => p.id === projId);
    if (found) {
      setInvoice((prev) => ({
        ...prev,
        projectId: found.id,
        clientId: (found as any).clientId || found.client?.id || prev.clientId,
        client: {
          ...prev.client,
          name: found.client?.fullName || prev.client.name,
          phone: found.client?.phone || prev.client.phone || '',
          email: found.client?.email || prev.client.email || '',
          address: found.siteAddress || found.client?.address || prev.client.address || '',
          gstin: found.client?.gstin || prev.client.gstin || ''
        },
        project: {
          ...prev.project,
          name: found.title || prev.project.name,
          address: found.siteAddress || prev.project.address || '',
          stage: found.stage || prev.project.stage || 'Execution'
        }
      }));
    }

    // 2. Fetch full project details from API to ensure complete client info
    try {
      const res = await fetch(`/api/v1/projects/${projId}`);
      const json = await res.json();
      if (json.success && json.data) {
        const p = json.data.project || json.data;
        setInvoice((prev) => ({
          ...prev,
          projectId: p.id,
          clientId: p.clientId || p.client?.id || prev.clientId,
          client: {
            ...prev.client,
            name: p.client?.fullName || prev.client.name,
            phone: p.client?.phone || prev.client.phone || '',
            email: p.client?.email || prev.client.email || '',
            address: p.siteAddress || p.client?.address || prev.client.address || '',
            gstin: p.client?.gstin || prev.client.gstin || ''
          },
          project: {
            ...prev.project,
            name: p.title || prev.project.name,
            address: p.siteAddress || prev.project.address || '',
            stage: p.stage || prev.project.stage || 'Execution',
            expectedCompletion: p.targetCompletionDate ? formatDate(new Date(p.targetCompletionDate)) : prev.project.expectedCompletion
          }
        }));
      }
    } catch (err) {
      console.warn('Error fetching full project details for selector:', err);
    }
  };

  // --- TERMS AND CONDITIONS HANDLERS ---
  const handleAddTerm = () => {
    if (!newTermText.trim()) return;
    setTerms([...terms, newTermText.trim()]);
    setNewTermText('');
  };

  const handleEditTerm = (index: number, value: string) => {
    const updated = [...terms];
    updated[index] = value;
    setTerms(updated);
  };

  const handleDeleteTerm = (index: number) => {
    if (terms.length <= 1) return;
    const updated = terms.filter((_, i) => i !== index);
    setTerms(updated);
  };

  const handleMoveTerm = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === terms.length - 1) return;
    const updated = [...terms];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setTerms(updated);
  };

  const handleResetTerms = () => {
    setTerms([...DEFAULT_TERMS]);
  };

  // --- QR CODE GENERATOR ---
  useEffect(() => {
    if (!invoice.bank.upiId) return;
    const payeeName = encodeURIComponent(invoice.company.name);
    const upiLink = `upi://pay?pa=${invoice.bank.upiId}&pn=${payeeName}&am=${totals.grandTotal}&cu=INR&tn=Espacio_Inv_${invoice.invoiceNumber}`;

    QRCode.toDataURL(upiLink, {
      width: 120,
      margin: 1,
      color: {
        dark: '#6A4A2D',
        light: '#FFFFFF'
      }
    })
      .then((url) => {
        setQrCodeUrl(url);
      })
      .catch((err) => {
        console.error('QR code generation error:', err);
      });
  }, [invoice.bank.upiId, totals.grandTotal, invoice.company.name, invoice.invoiceNumber]);

  // --- TRIGGER AI MODAL FOR SPECIFIC ITEM ---
  const triggerAiAssistant = (id: string, currentDesc: string) => {
    const firstLine = currentDesc.split('\n')[0] || '';
    setAiTargetItemId(id);
    setAiTargetItemName(firstLine);
    setAiModalOpen(true);
  };

  const handleApplyAiDescription = (description: string) => {
    if (!aiTargetItemId) return;
    const updatedItems = invoice.items.map((item) => {
      if (item.id === aiTargetItemId) {
        return { ...item, description };
      }
      return item;
    });
    setInvoice({ ...invoice, items: updatedItems });
    setAiTargetItemId(null);
  };

  // --- PRINT & EXPORTS ---
  const handlePrint = () => {
    let styleTag = document.getElementById('quotation-print-page-size-style') as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'quotation-print-page-size-style';
      document.head.appendChild(styleTag);
    }
    const sizeStr = `${paperFormat.toUpperCase()} ${paperOrientation}`;
    styleTag.innerHTML = `
      @page {
        size: ${sizeStr} !important;
        margin: 0 !important;
      }
      @media print {
        @page {
          size: ${sizeStr} !important;
          margin: 0 !important;
        }
      }
    `;

    // Suppress browser default title header
    const originalTitle = document.title;
    document.title = ' ';

    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };
    window.addEventListener('afterprint', restoreTitle);

    window.print();

    // Fallback restoration
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  const handleDownloadPdf = async () => {
    setIsPdfLoading(true);
    try {
      const pdfResult = await generatePdfBlob();
      if (pdfResult) {
        const url = URL.createObjectURL(pdfResult.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = pdfResult.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        window.print();
      }
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleExportExcel = () => {
    let csv = `Item,HSN,Quantity,Unit,Rate,Total\n`;
    const exportItems = isRoomWiseMode && rooms && rooms.length > 0
      ? rooms.flatMap((r) => r.items)
      : (invoice.items || []);
    exportItems.forEach((item) => {
      const desc = `"${item.description.replace(/"/g, '""')}"`;
      csv += `${desc},${item.hsn},${item.quantity},${item.unit},${item.rate},${item.amount}\n`;
    });
    csv += `\nSubtotal,,,,,${totals.subtotal}\n`;
    if (totals.discountTotal > 0) {
      csv += `Special Discount (${discountType === 'PERCENTAGE' ? `${overallDiscount}%` : 'Fixed'}),,,,,-${totals.discountTotal}\n`;
    }
    csv += `Taxable Value,,,,,${totals.taxableAmount}\n`;
    if (gstRate > 0) {
      csv += `CGST (${(gstRate / 2).toFixed(1).replace(/\.0$/, '')}%),,,,,${totals.cgst}\n`;
      csv += `SGST (${(gstRate / 2).toFixed(1).replace(/\.0$/, '')}%),,,,,${totals.sgst}\n`;
      if (totals.igst > 0) {
        csv += `IGST (${gstRate}%),,,,,${totals.igst}\n`;
      }
    } else {
      csv += `GST (0% / Exempted),,,,,0.00\n`;
    }
    if (enableRoundOff && totals.roundOff !== 0) {
      csv += `Round Off Adjustment,,,,,${totals.roundOff}\n`;
    }
    csv += `Grand Total,,,,,${totals.grandTotal}\n`;
    csv += `Advance Paid,,,,,${invoice.advancePaid}\n`;
    csv += `Balance Due,,,,,${totals.balanceDue}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${(customTitle || invoice.mode).replace(/\s+/g, '_')}_${invoice.invoiceNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDateChange = (newDate: string) => {
    setInvoice({
      ...invoice,
      invoiceDate: newDate,
      dueDate: addDays(newDate, 30)
    });
  };

  const handleTermsChange = (newTerms: string) => {
    let days = 30;
    const match = newTerms.match(/(\d+)\s*Days?/i);
    if (match) {
      days = parseInt(match[1], 10);
    } else if (newTerms.toLowerCase().includes('immediate')) {
      days = 0;
    }

    setInvoice({
      ...invoice,
      paymentTerms: newTerms,
      dueDate: days >= 0 ? addDays(invoice.invoiceDate, days) : invoice.dueDate
    });
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInvoice({
            ...invoice,
            bank: {
              ...invoice.bank,
              customQrUrl: event.target.result as string
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearCustomQr = () => {
    setInvoice({
      ...invoice,
      bank: {
        ...invoice.bank,
        customQrUrl: undefined
      }
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInvoice({
            ...invoice,
            company: {
              ...invoice.company,
              logoUrl: event.target.result as string
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearCustomLogo = () => {
    setInvoice({
      ...invoice,
      company: {
        ...invoice.company,
        logoUrl: '/brand/espacio-logo.png'
      }
    });
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInvoice({
            ...invoice,
            company: {
              ...invoice.company,
              signatureUrl: event.target.result as string
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearCustomSignature = () => {
    setInvoice({
      ...invoice,
      company: {
        ...invoice.company,
        signatureUrl: undefined
      }
    });
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInvoice({
            ...invoice,
            company: {
              ...invoice.company,
              stampUrl: event.target.result as string
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearCustomStamp = () => {
    setInvoice({
      ...invoice,
      company: {
        ...invoice.company,
        stampUrl: undefined
      }
    });
  };

  // Render Document Title dynamically for Preview
  const displayDocumentTitle = (customTitle && customTitle.trim()) ? customTitle.trim() : invoice.mode.toUpperCase();

  // --- FINALIZED & READ-ONLY LOCKING CHECK ---
  const isTaxInvoiceDocument = invoice.mode === 'Tax Invoice' || invoice.mode === 'Bill' || invoice.mode === 'Receipt';
  const isFinalizedOrLocked = Boolean(
    readOnly ||
    isGeneratedInvoiceView ||
    (isTaxInvoiceDocument
      ? (invoice.status !== 'Draft' && (invoice.status === 'Paid' || (invoice.status as string) === 'PAID' || (invoice.status as string) === 'ISSUED' || (invoice.status as string) === 'APPROVED'))
      : Boolean(conversionEligibility?.isLocked || (invoice as any).isLocked)) ||
    (typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('readOnly') === 'true' || new URLSearchParams(window.location.search).get('locked') === 'true'))
  );

  if (isLoadingRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-12 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading document from database...</p>
        <p className="text-xs text-slate-400 mt-1">Fetching verified financial and item records</p>
      </div>
    );
  }

  if (recordError) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 text-center bg-white rounded-xl border border-red-200 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">!</div>
        <h3 className="text-base font-bold text-slate-900 mb-2">{recordError}</h3>
        <p className="text-sm text-slate-500 mb-6">The requested document could not be retrieved from the database.</p>
        <button
          type="button"
          onClick={() => onBack ? onBack() : window.history.back()}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 transition-colors"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Read-Only / Finalized Notice Banner for Invoices */}
      {isFinalizedOrLocked && (invoice.mode === 'Tax Invoice' || invoice.mode === 'Bill' || invoice.mode === 'Receipt' || isGeneratedInvoiceView) && (
        <div className="bg-slate-900 text-slate-100 px-5 py-2.5 text-xs flex items-center justify-between border-b border-slate-800 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="bg-emerald-500 text-slate-950 font-extrabold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wide">
              🔒 Official {invoice.mode || 'Tax Invoice'}
            </span>
            <span className="font-medium text-slate-200">
              Official Tax Invoice record ({invoice.invoiceNumber}). Document is verified, finalized &amp; locked.
            </span>
          </div>
          <div className="font-mono font-bold text-emerald-400 text-sm">
            Invoice Total: ₹{totals.grandTotal.toLocaleString('en-IN')}
          </div>
        </div>
      )}

      {/* Read-Only / Finalized Notice Banner for Quotations */}
      {isFinalizedOrLocked && !isGeneratedInvoiceView && invoice.mode !== 'Tax Invoice' && invoice.mode !== 'Bill' && invoice.mode !== 'Receipt' && (
        <div className="bg-emerald-950 text-emerald-100 px-5 py-2.5 text-xs flex items-center justify-between border-b border-emerald-800 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="bg-emerald-500 text-slate-950 font-extrabold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wide">
              🔒 Finalized Record
            </span>
            <span className="font-medium text-emerald-200">
              This quotation is finalized &amp; locked for the project. Amounts, items, and terms are in read-only mode.
            </span>
          </div>
          <div className="font-mono font-bold text-emerald-300 text-sm">
            Finalized Value: ₹{totals.grandTotal.toLocaleString('en-IN')}
          </div>
        </div>
      )}

      {/* 1. APP TOP ACTIONS BAR */}
      <header className="app-actions-header">
        {/* Left: Brand section */}
        <div className="brand-section">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="studio-back-btn"
              title="Back to Quotations Registry"
            >
              <ArrowLeft size={14} />
            </button>
          ) : null}
          <div className="brand-logo">E</div>
          <div className="brand-info">
            <h1 className="brand-name">ESPACIO</h1>
            <div className="brand-tagline">Timeless Interiors</div>
          </div>
        </div>

        {/* Center: Quotation Type Switcher (Strict Two Active Types) */}
        {!isFinalizedOrLocked && !isTaxInvoiceDocument && (
          <div className="quotation-type-switcher">
            <button
              type="button"
              className={`quotation-type-pill ${quotationType === 'LEAD' ? 'active' : ''}`}
              onClick={() => {
                setQuotationType('LEAD');
                if (!customTitle || customTitle === 'PROJECT QUOTATION' || customTitle === 'MATERIAL QUOTATION' || customTitle === 'MATERIALS & SERVICES QUOTATION') {
                  setCustomTitle('QUOTATION');
                }
                setInvoice((prev) => ({
                  ...prev,
                  quotationType: 'LEAD',
                  customTitle: 'QUOTATION'
                }));
              }}
              title="Lead Quotation — Complete Interiors"
            >
              <User size={12} />
              <span>Complete Interiors</span>
            </button>
            <button
              type="button"
              className={`quotation-type-pill ${quotationType === 'MATERIAL' ? 'active' : ''}`}
              onClick={() => {
                setQuotationType('MATERIAL');
                const nextTitle = 'MATERIALS & SERVICES QUOTATION';
                if (!customTitle || customTitle === 'QUOTATION' || customTitle === 'PROJECT QUOTATION') {
                  setCustomTitle(nextTitle);
                }
                setInvoice((prev) => ({
                  ...prev,
                  quotationType: 'MATERIAL',
                  customTitle: nextTitle,
                  items: (!prev.items || prev.items.length === 0 || prev.items === INITIAL_ITEMS)
                    ? INITIAL_MATERIAL_ITEMS
                    : prev.items
                }));
              }}
              title="Materials & Services Quotation — Standalone"
            >
              <Package size={12} />
              <span>Materials & Services</span>
            </button>
          </div>
        )}

        {/* Right: Action Tools, Invoice Conversion & Custom Signature Toggle */}
        <div className="actions-group">
          {/* Conversion & Locking Actions (Quotations Only) */}
          {!isTaxInvoiceDocument && conversionEligibility?.isAlreadyConverted ? (
            <a
              href={`/finance/invoices?search=${encodeURIComponent(conversionEligibility.existingInvoice?.invoiceNo || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-header-action"
              style={{ backgroundColor: '#ECFDF5', borderColor: '#10B981', color: '#065F46', fontWeight: 600 }}
              title="View Generated Tax Invoice in Finance Module"
            >
              <FileCheck size={14} className="text-emerald-600" />
              <span>Converted: {conversionEligibility.existingInvoice?.invoiceNo} ↗</span>
            </a>
          ) : !isTaxInvoiceDocument && conversionEligibility?.canConvert ? (
            <button
              type="button"
              className="btn btn-primary btn-header-action"
              style={{ backgroundColor: '#059669', borderColor: '#047857', color: '#FFFFFF', fontWeight: 700 }}
              onClick={handleConvertToInvoice}
              disabled={isConverting}
              title="Convert this Accepted Quotation into an Official Tax Invoice / Bill"
            >
              {isConverting ? (
                <>
                  <Loader2 size={14} className="spinner" />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <FileCheck size={14} />
                  <span>Convert to Invoice</span>
                </>
              )}
            </button>
          ) : !isTaxInvoiceDocument && conversionEligibility?.isLocked ? (
            <span
              className="px-2.5 py-1 rounded text-2xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1"
              title="Quotation is locked (Lead Won + Confirmation Fee Paid + Accepted)"
            >
              🔒 Locked
            </span>
          ) : null}

          {/* Custom Signature / Stamp Toggle Header Widget */}
          <div
            className={`signature-toggle-container ${showSignature ? 'is-active' : ''}`}
            title="Toggle authorized signature and stamp visibility on document"
            onClick={() => setShowSignature(!showSignature)}
          >
            <FileCheck size={13} className="signature-toggle-icon" />
            <span className="signature-toggle-label">Stamp</span>
            <div className="signature-toggle-switch">
              <input
                type="checkbox"
                checked={showSignature}
                onChange={(e) => setShowSignature(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="signature-toggle-slider" />
            </div>
          </div>

          {saveSuccessMsg ? (
            <div className="save-toast-msg">
              <Check size={13} />
              <span>{saveSuccessMsg}</span>
            </div>
          ) : null}

          {/* Finalized Status Badge */}
          {isFinalizedOrLocked && (
            <span
              className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5"
              title="Record has been finalized and locked"
            >
              🔒 {invoice.mode === 'Tax Invoice' ? 'Official Invoice' : 'Finalized'}: ₹{totals.grandTotal.toLocaleString('en-IN')}
            </span>
          )}

          {/* Generate Tax Invoice Button (When creating/generating a Tax Invoice) */}
          {!isFinalizedOrLocked && (invoice.mode === 'Tax Invoice' || invoice.mode === 'Bill' || invoice.mode === 'Receipt') && (
            <button
              type="button"
              className="btn btn-primary btn-save"
              style={{ backgroundColor: '#059669', borderColor: '#047857', fontWeight: 700 }}
              onClick={handleAcceptQuotation}
              disabled={isSaving}
              title="Generate & Save Tax Invoice to Database"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="spinner" />
                  <span>Generating Invoice...</span>
                </>
              ) : (
                <>
                  <FileCheck size={14} />
                  <span>Generate Tax Invoice</span>
                </>
              )}
            </button>
          )}

          {/* Digital Acceptance Button - Quotation only (Not shown when locked or already generated invoice) */}
          {!isFinalizedOrLocked && invoice.mode !== 'Tax Invoice' && invoice.mode !== 'Bill' && invoice.mode !== 'Receipt' && invoice.status !== 'Accepted' && (
            <button
              type="button"
              className="btn btn-secondary btn-header-action"
              style={{ borderColor: '#10B981', color: '#047857', fontWeight: 600 }}
              onClick={handleAcceptQuotation}
              title="Digitally accept and lock quotation"
            >
              <CheckCircle2 size={14} />
              <span>Accept Quotation</span>
            </button>
          )}

          {/* Quotation to Invoice Conversion Button (Quotations only) */}
          {!isFinalizedOrLocked && (invoice.mode === 'Quotation' || invoice.mode === 'Estimate') && (
            <button
              type="button"
              className="btn btn-secondary btn-header-action"
              style={{ borderColor: '#C89B3C', color: '#92400E', fontWeight: 600 }}
              onClick={handleConvertToInvoice}
              title="Convert this quotation to an Invoice without re-entering data"
            >
              <FileSpreadsheet size={14} />
              <span>Convert to Invoice</span>
            </button>
          )}

          {/* Save Quote Button (Editable Quotations only) */}
          {!isFinalizedOrLocked && invoice.mode !== 'Tax Invoice' && invoice.mode !== 'Bill' && invoice.mode !== 'Receipt' && (
            <button
              className="btn btn-primary btn-save"
              onClick={handleSaveQuotation}
              disabled={isSaving}
              title="Save Quotation to Database"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Quote</span>
                </>
              )}
            </button>
          )}

          {/* Print Button - Available for both Invoice and Quotation */}
          <button className="btn btn-secondary btn-header-action" onClick={handlePrint} title="Print Document">
            <Printer size={14} />
            <span>Print</span>
          </button>

          {/* PDF Download Button - Available for both Invoice and Quotation */}
          <button className="btn btn-secondary btn-header-action" onClick={handleDownloadPdf} disabled={isPdfLoading} title="Download Official PDF Document">
            {isPdfLoading ? (
              <>
                <Loader2 size={14} className="spinner" />
                <span>Compiling...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>PDF</span>
              </>
            )}
          </button>

          {/* WhatsApp Button - Available for both Invoice and Quotation */}
          <button
            type="button"
            className="btn btn-whatsapp btn-header-action"
            onClick={handleSendWhatsApp}
            title="Send Document Summary & PDF via WhatsApp"
          >
            <MessageCircle size={14} />
            <span>WhatsApp</span>
          </button>

          {/* Record Payment Button (Editable Quotations only) */}
          {!isFinalizedOrLocked && invoice.mode !== 'Tax Invoice' && invoice.mode !== 'Bill' && invoice.mode !== 'Receipt' && (
            <button
              type="button"
              className="btn btn-primary btn-header-action"
              style={{ backgroundColor: '#10B981', color: '#FFFFFF', borderColor: '#059669' }}
              onClick={() => setIsRecordPaymentModalOpen(true)}
              title="Record Client Payment towards this Quotation"
            >
              <CreditCard size={14} />
              <span>Record Payment</span>
            </button>
          )}
        </div>

      </header>

      <div className={`workspace-area ${isFinalizedOrLocked ? 'is-invoice-view' : ''}`}>
        {/* 2. LEFT EDITOR PANEL - Hidden when finalized, locked, or viewing generated invoice */}
        {!isFinalizedOrLocked && (
          <aside className="editor-panel">
            {/* Dashboard Summary Card Widget */}
            <div className="dashboard-widget-card">
              <div className="dashboard-widget-title-row">
                <span className="dashboard-widget-title">
                  {quotationType === 'LEAD' ? 'Lead Estimation Studio' : quotationType === 'PROJECT' ? 'Project Commercial Studio' : 'Material Supply Studio'}
                </span>
                <span className={`status-pill status-${invoice.status.toLowerCase()}`}>
                  {invoice.status}
                </span>
              </div>

              <div className="dashboard-stats-row">
                <div className="dashboard-stat-box">
                  <span className="dashboard-stat-lbl">Invoiced (Total)</span>
                  <span className="dashboard-stat-val" style={{ color: 'var(--color-primary-gold)' }}>
                    ₹{totals.grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="dashboard-stat-box">
                  <span className="dashboard-stat-lbl">{quotationType === 'MATERIAL' ? 'Total Paid' : 'Deposited (Adv)'}</span>
                  <span className="dashboard-stat-val" style={{ color: 'var(--color-success)' }}>
                    ₹{totalPaid.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="dashboard-stat-box">
                  <span className="dashboard-stat-lbl">Remaining Due</span>
                  <span className="dashboard-stat-val" style={{ color: 'white' }}>
                    ₹{remainingBalance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="dashboard-preset-loader-row">
                {quotationType === 'MATERIAL' ? (
                  <>
                    <button
                      className="dashboard-preset-btn"
                      type="button"
                      onClick={() => {
                        setInvoice((prev) => ({
                          ...prev,
                          items: INITIAL_MATERIAL_ITEMS
                        }));
                      }}
                    >
                      Load Plywood & Veneer Preset
                    </button>
                    <button
                      className="dashboard-preset-btn"
                      type="button"
                      onClick={() => {
                        setInvoice((prev) => ({
                          ...prev,
                          items: [
                            {
                              id: 'm1',
                              description: 'Hafele Matrix Box Drawer Runner System\nSoft-close, 500mm depth, Anthracite finish',
                              hsn: '8302',
                              quantity: 12,
                              unit: 'Sets',
                              rate: 3200,
                              discount: 10,
                              gst: 18,
                              amount: 34560
                            },
                            {
                              id: 'm2',
                              description: 'High Gloss Acrylic Laminate Sheets (1mm)\nAnti-scratch, UV resistant, Champagne Gold finish',
                              hsn: '3920',
                              quantity: 8,
                              unit: 'Sheets',
                              rate: 4200,
                              discount: 5,
                              gst: 18,
                              amount: 31920
                            }
                          ]
                        }));
                      }}
                    >
                      Load Hardware & Acrylic Preset
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="dashboard-preset-btn"
                      type="button"
                      onClick={() => {
                        setInvoice((prev) => ({
                          ...prev,
                          client: CLIENT_PRESETS[0],
                          project: PROJECT_PRESETS[0]
                        }));
                      }}
                    >
                      Load Villa Preset
                    </button>
                    <button
                      className="dashboard-preset-btn"
                      type="button"
                      onClick={() => {
                        setInvoice((prev) => ({
                          ...prev,
                          client: CLIENT_PRESETS[1],
                          project: PROJECT_PRESETS[1]
                        }));
                      }}
                    >
                      Load Corporate Preset
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Section 1: Document Settings */}
            <div className={`collapsible-section ${openSections.document ? 'open' : ''}`}>
              <button className="collapsible-header" type="button" onClick={() => toggleSection('document')}>
                <span className="collapsible-header-title">
                  <FileText size={16} />
                  1. Document Settings
                </span>
                <ChevronDown size={16} className="collapsible-chevron" />
              </button>
              {openSections.document && (
                <div className="collapsible-content">
                  <div className="collapsible-content-wrapper">
                    {/* Manual Document Title Input */}
                    <div className="input-group">
                      <span className="input-label" style={{ fontWeight: 600, color: 'var(--color-secondary-brown)' }}>
                        Main Document Title (Manually Editable)
                      </span>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. TAX INVOICE, QUOTATION, ESTIMATE, or any custom title"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                      />
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                        Enter any custom title. It will appear directly at the top of the generated document without automatic forcing.
                      </span>
                    </div>

                    <div className="form-grid">
                      <div className="input-group">
                        <span className="input-label">Document Type</span>
                        <select
                          className="input-field"
                          value={invoice.mode}
                          onChange={(e) => {
                            const newMode = e.target.value as InvoiceMode;
                            setInvoice({ ...invoice, mode: newMode });
                            if (!customTitle || customTitle === invoice.mode.toUpperCase()) {
                              setCustomTitle(newMode.toUpperCase());
                            }
                          }}
                        >
                          <option value="Quotation">Quotation</option>
                          <option value="Tax Invoice">Invoice</option>
                          <option value="Bill">Bill</option>
                          <option value="Estimate">Estimate</option>
                          <option value="Proforma Invoice">Proforma Invoice</option>
                          <option value="Cash Bill">Cash Bill</option>
                          <option value="Purchase Invoice">Purchase Invoice</option>
                          <option value="Credit Note">Credit Note</option>
                          <option value="Debit Note">Debit Note</option>
                          <option value="Receipt">Receipt</option>
                        </select>
                      </div>

                      <div className="input-group">
                        <span className="input-label">
                          {invoice.mode === 'Quotation' || invoice.mode === 'Estimate'
                            ? 'Quotation No'
                            : invoice.mode === 'Bill' || invoice.mode === 'Cash Bill'
                              ? 'Bill No'
                              : 'Invoice No'}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            className="input-field"
                            value={invoice.invoiceNumber}
                            onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
                          />
                          <button
                            className="btn-icon"
                            type="button"
                            title="Auto Generate"
                            onClick={handleRegenerateInvoiceNumber}
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="input-group">
                        <span className="input-label">Payment Status</span>
                        <select
                          className="input-field"
                          value={invoice.status}
                          onChange={(e) => setInvoice({ ...invoice, status: e.target.value as any })}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Sent">Sent</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Partially Paid">Partially Paid</option>
                          <option value="Paid">Paid</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div className="input-group">
                        <span className="input-label">Payment Terms (Manual / Preset)</span>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. 30 Days Net, 50% Advance"
                          list="payment-terms-presets-list"
                          value={invoice.paymentTerms}
                          onChange={(e) => handleTermsChange(e.target.value)}
                        />
                        <datalist id="payment-terms-presets-list">
                          <option value="15 Days Net">15 Days Net</option>
                          <option value="30 Days Net">30 Days Net</option>
                          <option value="45 Days Net">45 Days Net</option>
                          <option value="Immediate Pay">Immediate Pay</option>
                          <option value="50% Advance, 50% on Handover">50% Advance, 50% on Handover</option>
                          <option value="100% Advance">100% Advance</option>
                        </datalist>
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="input-group">
                        <span className="input-label">Document Date</span>
                        <input
                          type="date"
                          className="input-field"
                          value={invoice.invoiceDate}
                          onChange={(e) => handleDateChange(e.target.value)}
                        />
                      </div>

                      <div className="input-group">
                        <span className="input-label">
                          {invoice.mode === 'Quotation' || invoice.mode === 'Estimate' ? 'Valid Till' : 'Due Date'}
                        </span>
                        <input
                          type="date"
                          className="input-field"
                          value={invoice.dueDate}
                          onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Advance Record Details for Invoices */}
                    {(invoice.mode === 'Tax Invoice' || invoice.mode === 'Bill' || invoice.mode === 'Receipt') && (
                      <div style={{ marginTop: '8px', padding: '10px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-secondary-brown)', display: 'block', marginBottom: '8px' }}>
                          Advance Payment & Quotation Reference (Invoice Stage)
                        </span>
                        <div className="input-group" style={{ marginBottom: '8px' }}>
                          <span className="input-label">Quotation Reference (Original Quote & Version)</span>
                          <input
                            type="text"
                            placeholder="e.g. Q-2026-001 v2"
                            className="input-field"
                            value={invoice.quotationReference || ''}
                            onChange={(e) => setInvoice((prev) => ({ ...prev, quotationReference: e.target.value }))}
                          />
                        </div>
                        <div className="form-grid">
                          <div className="input-group">
                            <span className="input-label">Advance Date</span>
                            <input
                              type="date"
                              className="input-field"
                              value={advanceDate}
                              onChange={(e) => {
                                setAdvanceDate(e.target.value);
                                setInvoice((prev) => ({ ...prev, advanceDate: e.target.value }));
                              }}
                            />
                          </div>
                          <div className="input-group">
                            <span className="input-label">Receipt Reference</span>
                            <input
                              type="text"
                              placeholder="e.g. REC-2026-001"
                              className="input-field"
                              value={advanceReceiptRef}
                              onChange={(e) => {
                                setAdvanceReceiptRef(e.target.value);
                                setInvoice((prev) => ({ ...prev, advanceReceiptRef: e.target.value }));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Company & Brand Profile & Optional Compliance */}
            <div className={`collapsible-section ${openSections.company ? 'open' : ''}`}>
              <button className="collapsible-header" type="button" onClick={() => toggleSection('company')}>
                <span className="collapsible-header-title">
                  <Building size={16} />
                  2. Company & Brand Profile
                </span>
                <ChevronDown size={16} className="collapsible-chevron" />
              </button>
              {openSections.company && (
                <div className="collapsible-content">
                  <div className="collapsible-content-wrapper">
                    <div className="input-group">
                      <span className="input-label">Company Name</span>
                      <input
                        type="text"
                        className="input-field"
                        value={invoice.company.name}
                        onChange={(e) => setInvoice({ ...invoice, company: { ...invoice.company, name: e.target.value } })}
                      />
                    </div>

                    <div className="input-group">
                      <span className="input-label">Company Address</span>
                      <input
                        type="text"
                        className="input-field"
                        value={invoice.company.address}
                        onChange={(e) => setInvoice({ ...invoice, company: { ...invoice.company, address: e.target.value } })}
                      />
                    </div>

                    <div className="form-grid">
                      <div className="input-group">
                        <span className="input-label">GSTIN (Telangana)</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            className="input-field"
                            value={invoice.company.gstin}
                            onChange={(e) => setInvoice({ ...invoice, company: { ...invoice.company, gstin: e.target.value } })}
                          />
                          <button
                            className="btn-icon"
                            type="button"
                            title="Generate GST"
                            onClick={() => handleAutofillGst('company')}
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="input-group">
                        <span className="input-label">Phone</span>
                        <input
                          type="text"
                          className="input-field"
                          value={invoice.company.phone}
                          onChange={(e) => setInvoice({ ...invoice, company: { ...invoice.company, phone: e.target.value } })}
                        />
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="input-group">
                        <span className="input-label">Email</span>
                        <input
                          type="email"
                          className="input-field"
                          value={invoice.company.email}
                          onChange={(e) => setInvoice({ ...invoice, company: { ...invoice.company, email: e.target.value } })}
                        />
                      </div>

                      <div className="input-group">
                        <span className="input-label">Website</span>
                        <input
                          type="text"
                          className="input-field"
                          value={invoice.company.website}
                          onChange={(e) => setInvoice({ ...invoice, company: { ...invoice.company, website: e.target.value } })}
                        />
                      </div>
                    </div>

                    {/* Optional Compliance Section */}
                    <div style={{ marginTop: '10px', padding: '10px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-secondary-brown)', display: 'block', marginBottom: '8px' }}>
                        Optional Statutory & Compliance Details
                      </span>
                      <div className="form-grid">
                        <div className="input-group">
                          <span className="input-label">Place of Supply</span>
                          <input
                            type="text"
                            placeholder="e.g. 36 - Telangana"
                            className="input-field"
                            value={compliance.placeOfSupply || ''}
                            onChange={(e) => {
                              const updated = { ...compliance, placeOfSupply: e.target.value };
                              setCompliance(updated);
                              setInvoice((prev) => ({ ...prev, compliance: updated }));
                            }}
                          />
                        </div>
                        <div className="input-group">
                          <span className="input-label">Your Company PAN</span>
                          <input
                            type="text"
                            placeholder="e.g. AAAAE1234F"
                            className="input-field"
                            value={compliance.companyPan || ''}
                            onChange={(e) => {
                              const updated = { ...compliance, companyPan: e.target.value };
                              setCompliance(updated);
                              setInvoice((prev) => ({ ...prev, compliance: updated }));
                            }}
                          />
                        </div>
                      </div>
                      <div className="form-grid">
                        <div className="input-group">
                          <span className="input-label">Client PAN</span>
                          <input
                            type="text"
                            placeholder="e.g. ABCDE1234F (Optional)"
                            className="input-field"
                            value={compliance.clientPan || ''}
                            onChange={(e) => {
                              const updated = { ...compliance, clientPan: e.target.value };
                              setCompliance(updated);
                              setInvoice((prev) => ({ ...prev, compliance: updated }));
                            }}
                          />
                        </div>
                        <div className="input-group">
                          <span className="input-label">TDS Deduction (%)</span>
                          <input
                            type="number"
                            placeholder="0"
                            min="0"
                            max="100"
                            step="any"
                            className="input-field"
                            value={compliance.tdsDeduction || 0}
                            onChange={(e) => {
                              const updated = { ...compliance, tdsDeduction: Number(e.target.value) || 0 };
                              setCompliance(updated);
                              setInvoice((prev) => ({ ...prev, compliance: updated }));
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Official Company Seal & Stamp Toggle — Full Width Compact Row */}
                    <div style={{ marginTop: '8px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: '#F8FAFC',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          width: '100%',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <img
                            src="/stamp.png"
                            alt="Espacio Official Seal"
                            style={{ width: '30px', height: '30px', objectFit: 'contain', flexShrink: 0 }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap' }}>
                                Official Company Seal
                              </span>
                              <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 600, background: '#ECFDF5', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                Aziz Nagar
                              </span>
                            </div>
                            <span style={{ fontSize: '0.65rem', color: '#64748B', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {showSignature ? 'Placed on Authorized Signatory line' : 'Turned OFF for manual physical signing'}
                            </span>

                          </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', margin: 0, flexShrink: 0 }}>
                          <input
                            type="checkbox"
                            checked={showSignature}
                            onChange={(e) => setShowSignature(e.target.checked)}
                            style={{ accentColor: '#10B981', cursor: 'pointer', width: '17px', height: '17px' }}
                            title="Toggle Seal on Document"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Client & Project Info (Dynamic per Quotation Type) */}
            <div className={`collapsible-section ${openSections.client ? 'open' : ''}`}>
              <button className="collapsible-header" type="button" onClick={() => toggleSection('client')}>
                <span className="collapsible-header-title">
                  <User size={16} />
                  3. {quotationType === 'LEAD' ? 'Lead & Client Info' : quotationType === 'PROJECT' ? 'Client & Project Info' : 'Material Buyer / Lead Info'}
                </span>
                <ChevronDown size={16} className="collapsible-chevron" />
              </button>
              {openSections.client && (
                <div className="collapsible-content">
                  <div className="collapsible-content-wrapper">
                    {/* Dynamic Lead Selector & Search Engine for Lead and Material Quotations */}
                    {(quotationType === 'LEAD' || quotationType === 'MATERIAL') && (
                      <div style={{ marginBottom: '12px' }}>
                        {selectedLeadId ? (
                          /* Active Linked Lead State */
                          <div className="linked-lead-card">
                            <div className="linked-lead-info">
                              <div className="linked-lead-badge-row">
                                <span className="linked-lead-badge">
                                  {leadsList.find((l) => l.id === selectedLeadId)?.referenceNo || 'CONNECTED LEAD'}
                                </span>
                                <span className="linked-lead-status">
                                  <CheckCircle2 size={10} style={{ display: 'inline', marginRight: '3px' }} />
                                  Connected
                                </span>
                                {quotationType === 'MATERIAL' && (
                                  <span className="lead-result-badge-material">
                                    Materials Required
                                  </span>
                                )}
                              </div>
                              <div className="linked-lead-name">{invoice.client.name || 'Direct Lead'}</div>
                              <div className="linked-lead-meta">
                                <span>📞 {invoice.client.phone || 'No phone'}</span>
                                {invoice.client.email && <span>✉️ {invoice.client.email}</span>}
                                {invoice.client.location && <span>📍 {invoice.client.location}</span>}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn-change-lead"
                              onClick={() => {
                                setSelectedLeadId('');
                                setLeadSearchQuery('');
                              }}
                              title="Search or switch to another lead"
                            >
                              Change Lead
                            </button>
                          </div>
                        ) : (
                          /* Search or Register Lead */
                          <div className="lead-search-container">
                            <span className="input-label" style={{ fontWeight: 600, color: 'var(--color-secondary-brown)', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{quotationType === 'MATERIAL' ? 'Search & Connect Lead / Buyer' : 'Search & Connect CRM Lead'}</span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--color-primary-gold)', fontWeight: 'bold' }}>
                                {quotationType === 'MATERIAL' ? 'Prioritizes Materials Required' : 'Auto-Prefill'}
                              </span>
                            </span>

                            <div className="lead-search-bar">
                              <Search size={14} className="lead-search-icon" />
                              <input
                                type="text"
                                className="lead-search-input"
                                placeholder={quotationType === 'MATERIAL' ? 'Search by Lead ID (e.g. L-2026-0001), Name, Phone, Email, Location...' : 'Search by Lead ID (e.g. L-2026-0001), Name, Phone, or Email...'}
                                value={leadSearchQuery}
                                onChange={(e) => setLeadSearchQuery(e.target.value)}
                              />
                              {leadSearchQuery && (
                                <button
                                  type="button"
                                  className="lead-search-clear"
                                  onClick={() => setLeadSearchQuery('')}
                                  title="Clear Search"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>

                            {/* Search Matches List */}
                            {filteredLeads.length > 0 ? (
                              <div className="lead-search-results">
                                {filteredLeads.slice(0, 8).map((lead) => {
                                  const reqText = `${lead.requirement || ''} ${lead.propertyTypeKey || ''}`.toLowerCase();
                                  const isMaterialReq = reqText.includes('material');

                                  return (
                                    <div
                                      key={lead.id}
                                      className="lead-result-item"
                                      onClick={() => {
                                        handleSelectLead(lead.id);
                                        setLeadSearchQuery('');
                                      }}
                                      title={`Select ${lead.clientName}`}
                                    >
                                      <div className="lead-result-left">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span className="lead-result-id">{lead.referenceNo}</span>
                                          {isMaterialReq && (
                                            <span className="lead-result-badge-material">Materials Required</span>
                                          )}
                                        </div>
                                        <span className="lead-result-name">{lead.clientName}</span>
                                      </div>
                                      <div className="lead-result-right">
                                        <span className="lead-result-phone">{lead.phone}</span>
                                        {lead.location && <span className="lead-result-loc">📍 {lead.location}</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              /* Lead Not Found Block */
                              <div className="lead-not-found-box">
                                <div className="lead-not-found-text">
                                  <UserX size={18} className="lead-not-found-icon" />
                                  <div>
                                    <strong>Lead Not Found</strong>
                                    <p>No existing CRM lead matched &quot;{leadSearchQuery}&quot;.</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-add-person"
                                  onClick={() => {
                                    setAddPersonForm({
                                      clientName: isNaN(Number(leadSearchQuery)) ? leadSearchQuery : '',
                                      phone: !isNaN(Number(leadSearchQuery)) ? leadSearchQuery : '',
                                      email: leadSearchQuery.includes('@') ? leadSearchQuery : '',
                                      location: '',
                                      propertyTypeKey: quotationType === 'MATERIAL' ? 'MODULAR_KITCHEN' : 'APARTMENT_INTERIOR',
                                      requirement: quotationType === 'MATERIAL' ? 'MATERIALS REQUIRED' : '',
                                      budget: '',
                                      sourceKey: 'DIRECT'
                                    });
                                    setIsAddPersonModalOpen(true);
                                  }}
                                >
                                  <UserPlus size={13} />
                                  <span>+ Add Person Manually</span>
                                </button>
                              </div>
                            )}

                            <div className="lead-manual-trigger-row">
                              <span style={{ color: 'var(--color-text-muted)' }}>Need to register a new buyer / lead?</span>
                              <button
                                type="button"
                                className="btn-link-gold"
                                onClick={() => {
                                  setAddPersonForm({
                                    clientName: '',
                                    phone: '',
                                    email: '',
                                    location: '',
                                    propertyTypeKey: quotationType === 'MATERIAL' ? 'MODULAR_KITCHEN' : 'APARTMENT_INTERIOR',
                                    requirement: quotationType === 'MATERIAL' ? 'MATERIALS REQUIRED' : '',
                                    budget: '',
                                    sourceKey: 'DIRECT'
                                  });
                                  setIsAddPersonModalOpen(true);
                                }}
                              >
                                + Add Person Manually
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dynamic Project Selector for Project Quotations */}
                    {quotationType === 'PROJECT' && (
                      <div className="input-group" style={{ background: 'var(--color-primary-gold-light)', padding: '10px', borderRadius: 'var(--border-radius-input)' }}>
                        <span className="input-label" style={{ fontWeight: 600, color: 'var(--color-secondary-brown)' }}>
                          Select Active Project (Quick Autofill)
                        </span>
                        <select
                          className="input-field"
                          value={selectedProjectId}
                          onChange={(e) => handleSelectProject(e.target.value)}
                        >
                          <option value="">-- Choose Existing Project or Enter Manually --</option>
                          {projectsList.map((proj) => (
                            <option key={proj.id} value={proj.id}>
                              {proj.referenceNo} — {proj.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Client Profile Block */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ fontSize: '0.78rem', color: 'var(--color-primary-gold)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--color-border-beige-light)', paddingBottom: '4px', fontWeight: 700 }}>
                        {quotationType === 'MATERIAL' ? 'Consignee / Buyer Details' : 'Client Profile (Bill To)'}
                      </h4>

                      <div className="form-grid">
                        <div className="input-group">
                          <span className="input-label">{quotationType === 'MATERIAL' ? 'Buyer / Client Name (To)' : 'Client Name'}</span>
                          <input
                            type="text"
                            placeholder="e.g. Akshay Kumar"
                            className="input-field"
                            value={invoice.client.name}
                            onChange={(e) => setInvoice({ ...invoice, client: { ...invoice.client, name: e.target.value } })}
                          />
                        </div>

                        <div className="input-group">
                          <span className="input-label">Phone Number</span>
                          <input
                            type="text"
                            placeholder="e.g. 7396840700"
                            className="input-field"
                            value={invoice.client.phone}
                            onChange={(e) => setInvoice({ ...invoice, client: { ...invoice.client, phone: e.target.value } })}
                          />
                        </div>
                      </div>

                      <div className="form-grid">
                        <div className="input-group">
                          <span className="input-label">Email Address</span>
                          <input
                            type="email"
                            placeholder="e.g. client@example.com"
                            className="input-field"
                            value={invoice.client.email}
                            onChange={(e) => setInvoice({ ...invoice, client: { ...invoice.client, email: e.target.value } })}
                          />
                        </div>

                        <div className="input-group">
                          <span className="input-label">Client GSTIN</span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="text"
                              placeholder="Optional for B2C"
                              className="input-field"
                              value={invoice.client.gstin}
                              onChange={(e) => setInvoice({ ...invoice, client: { ...invoice.client, gstin: e.target.value } })}
                            />
                            <button
                              className="btn-icon"
                              type="button"
                              title="Generate GST"
                              onClick={() => handleAutofillGst('client')}
                            >
                              <RefreshCw size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="form-grid">
                        <div className="input-group">
                          <span className="input-label">
                            {quotationType === 'MATERIAL' ? 'Location / Consignee Address' : 'Billing / Site Location'}
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. Aziz Nagar, Hyderabad"
                            className="input-field"
                            value={invoice.client.location || invoice.client.address || ''}
                            onChange={(e) => setInvoice({
                              ...invoice,
                              client: {
                                ...invoice.client,
                                address: e.target.value,
                                location: e.target.value
                              }
                            })}
                          />
                        </div>

                        <div className="input-group">
                          <span className="input-label">Client PAN (Optional)</span>
                          <input
                            type="text"
                            placeholder="e.g. ABCDE1234F"
                            className="input-field"
                            value={compliance.clientPan || ''}
                            onChange={(e) => setCompliance({ ...compliance, clientPan: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dispatch & Supply Terms Block (Shown for Material Quotations) */}
                    {quotationType === 'MATERIAL' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                        <h4 style={{ fontSize: '0.78rem', color: 'var(--color-primary-gold)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--color-border-beige-light)', paddingBottom: '4px', fontWeight: 700 }}>
                          Dispatch & Supply Terms
                        </h4>

                        <div className="form-grid">
                          <div className="input-group">
                            <span className="input-label">Supply Type</span>
                            <input
                              type="text"
                              placeholder="e.g. Material & Hardware Supply"
                              className="input-field"
                              value={dispatchDetails.supplyType || ''}
                              onChange={(e) => setDispatchDetails({ ...dispatchDetails, supplyType: e.target.value })}
                            />
                          </div>

                          <div className="input-group">
                            <span className="input-label">Dispatch / Origin Location</span>
                            <input
                              type="text"
                              placeholder="e.g. Ex-Warehouse Hyderabad"
                              className="input-field"
                              value={dispatchDetails.dispatchFrom || ''}
                              onChange={(e) => setDispatchDetails({ ...dispatchDetails, dispatchFrom: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-grid">
                          <div className="input-group">
                            <span className="input-label">Freight / Tax Terms</span>
                            <input
                              type="text"
                              placeholder="e.g. Inclusive of statutory GST"
                              className="input-field"
                              value={dispatchDetails.freightTerms || ''}
                              onChange={(e) => setDispatchDetails({ ...dispatchDetails, freightTerms: e.target.value })}
                            />
                          </div>

                          <div className="input-group">
                            <span className="input-label">Place of Supply</span>
                            <input
                              type="text"
                              placeholder="e.g. 36 - Telangana"
                              className="input-field"
                              value={dispatchDetails.placeOfSupply || compliance.placeOfSupply || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDispatchDetails({ ...dispatchDetails, placeOfSupply: val });
                                setCompliance({ ...compliance, placeOfSupply: val });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Project Details Block (Shown ONLY for Project Quotations) */}
                    {quotationType === 'PROJECT' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                        <h4 style={{ fontSize: '0.78rem', color: 'var(--color-primary-gold)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--color-border-beige-light)', paddingBottom: '4px', fontWeight: 700 }}>
                          Project Execution Details
                        </h4>

                        <div className="form-grid">
                          <div className="input-group">
                            <span className="input-label">Project Name</span>
                            <input
                              type="text"
                              className="input-field"
                              value={invoice.project.name}
                              onChange={(e) => setInvoice({ ...invoice, project: { ...invoice.project, name: e.target.value } })}
                            />
                          </div>

                          <div className="input-group">
                            <span className="input-label">Site Location</span>
                            <input
                              type="text"
                              className="input-field"
                              value={invoice.project.address}
                              onChange={(e) => setInvoice({ ...invoice, project: { ...invoice.project, address: e.target.value } })}
                            />
                          </div>
                        </div>

                        <div className="form-grid">
                          <div className="input-group">
                            <span className="input-label">Lead Designer</span>
                            <input
                              type="text"
                              className="input-field"
                              value={invoice.project.designer}
                              onChange={(e) => setInvoice({ ...invoice, project: { ...invoice.project, designer: e.target.value } })}
                            />
                          </div>

                          <div className="input-group">
                            <span className="input-label">Project Type</span>
                            <input
                              type="text"
                              className="input-field"
                              value={invoice.project.type}
                              onChange={(e) => setInvoice({ ...invoice, project: { ...invoice.project, type: e.target.value } })}
                            />
                          </div>
                        </div>

                        <div className="form-grid">
                          <div className="input-group">
                            <span className="input-label">Project Stage</span>
                            <input
                              type="text"
                              className="input-field"
                              value={invoice.project.stage}
                              onChange={(e) => setInvoice({ ...invoice, project: { ...invoice.project, stage: e.target.value } })}
                            />
                          </div>

                          <div className="input-group">
                            <span className="input-label">Place of Supply</span>
                            <input
                              type="text"
                              placeholder="e.g. 36 - Telangana"
                              className="input-field"
                              value={compliance.placeOfSupply || ''}
                              onChange={(e) => setCompliance({ ...compliance, placeOfSupply: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lead Scope Details Block (Shown for Lead Quotations) */}
                    {quotationType === 'LEAD' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                        <h4 style={{ fontSize: '0.78rem', color: 'var(--color-primary-gold)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--color-border-beige-light)', paddingBottom: '4px', fontWeight: 700 }}>
                          Lead Scope & Location
                        </h4>

                        <div className="form-grid">
                          <div className="input-group">
                            <span className="input-label">Property Location / Area</span>
                            <input
                              type="text"
                              className="input-field"
                              value={invoice.client.location || invoice.project.address}
                              onChange={(e) => setInvoice({
                                ...invoice,
                                client: { ...invoice.client, location: e.target.value },
                                project: { ...invoice.project, address: e.target.value }
                              })}
                            />
                          </div>

                          <div className="input-group">
                            <span className="input-label">Requirement Summary</span>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="e.g. 3BHK Premium Interior Design"
                              value={invoice.client.requirement || invoice.project.name}
                              onChange={(e) => setInvoice({
                                ...invoice,
                                client: { ...invoice.client, requirement: e.target.value },
                                project: { ...invoice.project, name: e.target.value }
                              })}
                            />
                          </div>
                        </div>

                        <div className="form-grid">
                          <div className="input-group">
                            <span className="input-label">Project / Property Type</span>
                            <input
                              type="text"
                              placeholder="e.g. Residential Interior / Villa"
                              className="input-field"
                              value={invoice.project.type || ''}
                              onChange={(e) => setInvoice({ ...invoice, project: { ...invoice.project, type: e.target.value } })}
                            />
                          </div>

                          <div className="input-group">
                            <span className="input-label">Estimated Timeline</span>
                            <input
                              type="text"
                              placeholder="e.g. 45 - 60 Days"
                              className="input-field"
                              value={invoice.estimatedTimeline || ''}
                              onChange={(e) => setInvoice({ ...invoice, estimatedTimeline: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-grid">
                          <div className="input-group">
                            <span className="input-label">Place of Supply</span>
                            <input
                              type="text"
                              placeholder="e.g. 36 - Telangana"
                              className="input-field"
                              value={compliance.placeOfSupply || ''}
                              onChange={(e) => setCompliance({ ...compliance, placeOfSupply: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Specifications & Line Items */}
            <div className={`collapsible-section ${openSections.items ? 'open' : ''}`}>
              <button className="collapsible-header" type="button" onClick={() => toggleSection('items')}>
                <span className="collapsible-header-title">
                  <FolderOpen size={16} />
                  {quotationType === 'MATERIAL' ? '4. Material Specifications & Line Items' : quotationType === 'LEAD' ? '4. Room-Wise Design Specifications' : '4. Design Specifications (Line Items)'}
                </span>
                <ChevronDown size={16} className="collapsible-chevron" />
              </button>
              {openSections.items && (
                <div className="collapsible-content">
                  <div className="collapsible-content-wrapper">
                    {/* Quick Material Presets Bar */}
                    {quotationType === 'MATERIAL' && (
                      <div className="material-presets-bar">
                        <span className="material-presets-title">Quick Add Material:</span>
                        {MATERIAL_PRESETS.map((p) => (
                          <button
                            key={p.name}
                            type="button"
                            className="material-preset-chip"
                            onClick={() => handleAddMaterialPreset(p)}
                          >
                            + {p.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* ROOM-WISE EDITOR FOR LEAD QUOTATION */}
                    {quotationType === 'LEAD' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.78rem', color: '#5A4A3C', fontWeight: 600, flex: 1 }}>
                            Organize quotation into user-defined room sections with finish specs & scope:
                          </span>
                          <button
                            className="btn btn-primary"
                            type="button"
                            style={{
                              padding: '6px 14px',
                              fontSize: '0.78rem',
                              borderRadius: '6px',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              flexShrink: 0
                            }}
                            onClick={handleAddRoom}
                          >
                            <Plus size={14} /> Add Room Section
                          </button>
                        </div>

                        {rooms.map((room, rIdx) => {
                          const roomSubtotal = getRoomSubtotal(room);
                          return (
                            <div
                              key={room.id}
                              style={{
                                border: '1px solid #DFD7CA',
                                borderRadius: '8px',
                                padding: '14px',
                                background: '#FAF8F5',
                                boxShadow: '0 1px 3px rgba(78, 51, 27, 0.03)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-secondary-brown)', whiteSpace: 'nowrap' }}>
                                    Room #{rIdx + 1}:
                                  </span>
                                  <input
                                    type="text"
                                    className="input-field"
                                    style={{ fontWeight: 700, fontSize: '0.82rem', flex: 1, padding: '6px 10px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #D6CEBE' }}
                                    value={room.roomName}
                                    placeholder="e.g. Modular Kitchen, Master Bedroom, Wardrobe"
                                    onChange={(e) => handleRoomChange(room.id, 'roomName', e.target.value)}
                                  />
                                </div>
                                <button
                                  className="btn-icon"
                                  type="button"
                                  style={{ borderColor: '#FECDD3', color: '#E11D48', background: '#FFF1F2', width: '30px', height: '30px', borderRadius: '6px', flexShrink: 0 }}
                                  onClick={() => handleDeleteRoom(room.id)}
                                  disabled={rooms.length === 1}
                                  title="Delete Room"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                              {/* Finish Specification */}
                              <div className="input-group">
                                <span className="input-label" style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6A5644' }}>Finish Specification (Optional)</span>
                                <input
                                  type="text"
                                  className="input-field"
                                  style={{ fontSize: '0.78rem', padding: '6px 10px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #D6CEBE' }}
                                  placeholder="e.g. Marine Ply IS:710 + 1mm Merino Gloss Laminate + Blum Hardware"
                                  value={room.finishSpec || ''}
                                  onChange={(e) => handleRoomChange(room.id, 'finishSpec', e.target.value)}
                                />
                              </div>

                              {/* Inclusions & Exclusions */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div className="input-group">
                                  <span className="input-label" style={{ fontSize: '0.72rem', fontWeight: 600, color: '#15803D' }}>✓ Inclusions (comma or newline separated)</span>
                                  <textarea
                                    rows={2}
                                    className="input-field"
                                    style={{ fontSize: '0.78rem', padding: '7px 10px', width: '100%', minHeight: '52px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #D6CEBE', lineHeight: '1.45' }}
                                    placeholder="Base unit, Top unit, Blum soft-close runners..."
                                    value={room.inclusions ? room.inclusions.join('\n') : ''}
                                    onChange={(e) => handleRoomInclusionsChange(room.id, e.target.value)}
                                  />
                                </div>
                                <div className="input-group">
                                  <span className="input-label" style={{ fontSize: '0.72rem', fontWeight: 600, color: '#B91C1C' }}>✕ Exclusions (comma or newline separated)</span>
                                  <textarea
                                    rows={2}
                                    className="input-field"
                                    style={{ fontSize: '0.78rem', padding: '7px 10px', width: '100%', minHeight: '52px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #D6CEBE', lineHeight: '1.45' }}
                                    placeholder="Appliances, Countertop quartz, Civil tiling..."
                                    value={room.exclusions ? room.exclusions.join('\n') : ''}
                                    onChange={(e) => handleRoomExclusionsChange(room.id, e.target.value)}
                                  />
                                </div>
                              </div>

                              {/* Room Sub-Items */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EADBCA', paddingBottom: '4px' }}>
                                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-secondary-brown)' }}>
                                    Sub-Items in {room.roomName || 'this room'}:
                                  </span>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    onClick={() => handleAddRoomItem(room.id)}
                                  >
                                    <Plus size={12} /> Add Item to Room
                                  </button>
                                </div>

                                {room.items.map((item, itemIdx) => (
                                  <div
                                    key={item.id}
                                    style={{
                                      background: '#FFFFFF',
                                      border: '1px solid #E2D9CB',
                                      borderRadius: '7px',
                                      padding: '10px',
                                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '8px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#78716C', minWidth: '16px', paddingTop: '6px' }}>
                                        {itemIdx + 1}.
                                      </span>
                                      <textarea
                                        rows={2}
                                        className="input-field"
                                        style={{ flex: 1, fontSize: '0.78rem', padding: '6px 8px', minHeight: '50px', lineHeight: '1.4', borderRadius: '6px', border: '1px solid #D6CEBE' }}
                                        placeholder="Item description (First line: title, subsequent lines: bullets)..."
                                        value={item.description}
                                        onChange={(e) => handleRoomItemChange(room.id, item.id, 'description', e.target.value)}
                                      />
                                      <button
                                        className="btn-icon"
                                        type="button"
                                        style={{ borderColor: '#FECDD3', color: '#E11D48', background: '#FFF1F2', width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0, marginTop: '2px' }}
                                        onClick={() => handleDeleteRoomItem(room.id, item.id)}
                                        disabled={room.items.length === 1}
                                        title="Delete Item"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>

                                    <div className="form-grid-4" style={{ gap: '6px' }}>
                                      <div className="input-group">
                                        <span className="input-label" style={{ fontSize: '0.67rem', fontWeight: 600 }}>HSN (Opt)</span>
                                        <input
                                          type="text"
                                          className="input-field"
                                          style={{ padding: '5px 6px', fontSize: '0.74rem', textAlign: 'center', borderRadius: '4px', border: '1px solid #D6CEBE' }}
                                          value={item.hsn}
                                          onChange={(e) => handleRoomItemChange(room.id, item.id, 'hsn', e.target.value)}
                                        />
                                      </div>
                                      <div className="input-group">
                                        <span className="input-label" style={{ fontSize: '0.67rem', fontWeight: 600 }}>Qty</span>
                                        <input
                                          type="number"
                                          className="input-field"
                                          style={{ padding: '5px 6px', fontSize: '0.74rem', textAlign: 'center', borderRadius: '4px', border: '1px solid #D6CEBE' }}
                                          value={item.quantity}
                                          onChange={(e) => handleRoomItemChange(room.id, item.id, 'quantity', Number(e.target.value))}
                                        />
                                      </div>
                                      <div className="input-group">
                                        <span className="input-label" style={{ fontSize: '0.67rem', fontWeight: 600 }}>Unit</span>
                                        <input
                                          type="text"
                                          className="input-field"
                                          style={{ padding: '5px 6px', fontSize: '0.74rem', textAlign: 'center', borderRadius: '4px', border: '1px solid #D6CEBE' }}
                                          value={item.unit}
                                          onChange={(e) => handleRoomItemChange(room.id, item.id, 'unit', e.target.value)}
                                        />
                                      </div>
                                      <div className="input-group">
                                        <span className="input-label" style={{ fontSize: '0.67rem', fontWeight: 600 }}>Rate (₹)</span>
                                        <input
                                          type="number"
                                          className="input-field"
                                          style={{ padding: '5px 6px', fontSize: '0.74rem', textAlign: 'right', borderRadius: '4px', border: '1px solid #D6CEBE' }}
                                          value={item.rate}
                                          onChange={(e) => handleRoomItemChange(room.id, item.id, 'rate', Number(e.target.value))}
                                        />
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid #F5EFE6' }}>
                                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-secondary-brown)', fontVariantNumeric: 'tabular-nums' }}>
                                        Item Total: ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Room Subtotal Bar */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed #D6CEBE' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-secondary-brown)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  {room.roomName || 'Room'} Subtotal:
                                </span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-secondary-brown)', fontVariantNumeric: 'tabular-nums' }}>
                                  ₹{roomSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* FLAT ITEMS LIST FOR MATERIAL / OTHER QUOTATIONS */
                      <>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1 }} onClick={handleAddItem}>
                            <Plus size={14} /> {quotationType === 'MATERIAL' ? 'Add Material' : 'Add Item'}
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1 }} onClick={handleAddMultipleItems}>
                            <Plus size={14} /> {quotationType === 'MATERIAL' ? 'Add Multiple Materials' : 'Add Multiple Items'}
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {invoice.items.map((item, idx) => (
                            <div className="item-editor-row" key={item.id}>
                              <div className="item-editor-row-top">
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-secondary-brown)', minWidth: '24px' }}>
                                  #{idx + 1}
                                </span>

                                <textarea
                                  rows={3}
                                  placeholder={quotationType === 'MATERIAL' ? 'Material name, grade, brand, thickness, specs...' : 'Item title and specifications...'}
                                  className="input-field"
                                  style={{ flex: 1, resize: 'none', fontSize: '0.8rem', padding: '8px' }}
                                  value={item.description}
                                  onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                />
                              </div>

                              <div className="form-grid-4">
                                <div className="input-group">
                                  <span className="input-label">HSN</span>
                                  <input
                                    type="text"
                                    className="input-field"
                                    style={{ padding: '6px 8px', fontSize: '0.8rem' }}
                                    value={item.hsn}
                                    onChange={(e) => handleItemChange(item.id, 'hsn', e.target.value)}
                                  />
                                </div>

                                <div className="input-group">
                                  <span className="input-label">Quantity</span>
                                  <input
                                    type="number"
                                    className="input-field"
                                    style={{ padding: '6px 8px', fontSize: '0.8rem' }}
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                                  />
                                </div>

                                <div className="input-group">
                                  <span className="input-label">Unit</span>
                                  <input
                                    type="text"
                                    className="input-field"
                                    style={{ padding: '6px 8px', fontSize: '0.8rem' }}
                                    placeholder="e.g. Nos, Unit, Sqft"
                                    list={`unit-presets-list-${item.id}`}
                                    value={item.unit}
                                    onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                  />
                                  <datalist id={`unit-presets-list-${item.id}`}>
                                    <option value="Nos" />
                                    <option value="Unit" />
                                    <option value="Sqft" />
                                    <option value="Rft" />
                                    <option value="Sheets" />
                                    <option value="Sets" />
                                    <option value="Pcs" />
                                    <option value="Boxes" />
                                    <option value="Bags" />
                                    <option value="Litres" />
                                    <option value="Kg" />
                                    <option value="Mtr" />
                                    <option value="Lumpsum" />
                                    <option value="Sqmt" />
                                  </datalist>
                                </div>

                                <div className="input-group">
                                  <span className="input-label">Rate (₹)</span>
                                  <input
                                    type="number"
                                    className="input-field"
                                    style={{ padding: '6px 8px', fontSize: '0.8rem' }}
                                    value={item.rate}
                                    onChange={(e) => handleItemChange(item.id, 'rate', Number(e.target.value))}
                                  />
                                </div>
                              </div>

                              <div className="item-editor-actions">
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-secondary-brown)' }}>
                                  Item Total: ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>

                                <button
                                  className="btn-icon"
                                  type="button"
                                  style={{ borderColor: 'var(--color-cancelled-border)', color: 'var(--color-cancelled)', width: '28px', height: '28px' }}
                                  onClick={() => handleDeleteItem(item.id)}
                                  disabled={invoice.items.length === 1}
                                  title="Delete Line Item"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 5: Payment Engine, Round Off & Banking */}
            <div className={`collapsible-section ${openSections.payment ? 'open' : ''}`}>
              <button className="collapsible-header" type="button" onClick={() => toggleSection('payment')}>
                <span className="collapsible-header-title">
                  <CreditCard size={16} />
                  5. Payment Engine & Calculations
                </span>
                <ChevronDown size={16} className="collapsible-chevron" />
              </button>
              {openSections.payment && (
                <div className="collapsible-content">
                  <div className="collapsible-content-wrapper">
                    {/* Calculation & Display Toggles (Round Off & HSN) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E293B' }}>Round Off Calculation</span>
                          <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>
                            Round Off: {enableRoundOff ? 'ON (applied before Grand Total)' : 'OFF (exact decimal total)'}
                          </span>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={enableRoundOff}
                            onChange={(e) => {
                              setEnableRoundOff(e.target.checked);
                              setInvoice((prev) => ({ ...prev, enableRoundOff: e.target.checked }));
                            }}
                            style={{ accentColor: '#10B981', width: '17px', height: '17px' }}
                          />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{enableRoundOff ? 'ON' : 'OFF'}</span>
                        </label>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #E2E8F0' }}>
                        <div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E293B' }}>Show HSN Column on Document</span>
                          <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>
                            {showHsnColumn ? 'HSN column visible on table' : 'HSN column hidden from quotation'}
                          </span>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={showHsnColumn}
                            onChange={(e) => {
                              setShowHsnColumn(e.target.checked);
                              setInvoice((prev) => ({ ...prev, showHsnColumn: e.target.checked }));
                            }}
                            style={{ accentColor: '#10B981', width: '17px', height: '17px' }}
                          />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{showHsnColumn ? 'ON' : 'OFF'}</span>
                        </label>
                      </div>
                    </div>

                    {/* Dynamic Multi-Milestone Payment Engine Box */}
                    <div className="payment-engine-box">
                      <div className="input-group" style={{ margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span className="input-label" style={{ fontWeight: 700, color: 'var(--color-secondary-brown)', margin: 0, fontSize: '0.82rem' }}>
                            Payment Milestone Stage
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                            Shown below title on quote
                          </span>
                        </div>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. Booking Confirmation Fee, 1st Installment, 2nd Installment"
                          list="milestone-suggestions"
                          value={paymentType}
                          onChange={(e) => {
                            setPaymentType(e.target.value);
                            setInvoice((prev) => ({ ...prev, paymentType: e.target.value }));
                          }}
                          style={{ fontSize: '0.82rem', fontWeight: 600, background: '#FFFFFF' }}
                        />
                        <datalist id="milestone-suggestions">
                          <option value="Advance Payment" />
                          <option value="Partial Payment" />
                          <option value="Final Payment" />
                          <option value="50% Advance Booking" />
                          <option value="Material Supply Advance" />
                          <option value="Handover & Final Settlement" />
                        </datalist>

                        {/* Quick Milestone Tag Buttons */}
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {['Booking Confirmation Fee', '1st Installment (Booking Advance)', '2nd Installment (Woodwork)', 'Handover Balance'].map((t) => {
                            const isActive = paymentType === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  setPaymentType(t);
                                  setInvoice((prev) => ({ ...prev, paymentType: t }));
                                }}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  borderRadius: '5px',
                                  border: isActive ? '1px solid var(--color-secondary-brown)' : '1px solid var(--color-border-beige)',
                                  background: isActive ? 'var(--color-secondary-brown)' : '#FFFFFF',
                                  color: isActive ? '#FFFFFF' : 'var(--color-secondary-brown)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 1. Admin Option: Overall Quotation Discount Control */}
                      <div style={{
                        background: '#FAF8F5',
                        border: overallDiscount > 0 ? '1.5px solid var(--color-secondary-brown)' : '1px solid #E5DEC9',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        marginTop: '12px',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-secondary-brown)', display: 'block' }}>
                              Special Quotation Discount
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                              {overallDiscount > 0 ? 'Deducted from subtotal before tax' : 'Optional — Only deducted if enabled by Admin'}
                            </span>
                          </div>
                          {/* Admin Enable / Disable Toggle */}
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={overallDiscount > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setOverallDiscount(discountType === 'PERCENTAGE' ? 5 : 25000);
                                } else {
                                  setOverallDiscount(0);
                                }
                              }}
                              style={{ accentColor: '#10B981', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: overallDiscount > 0 ? '#059669' : '#64748B' }}>
                              {overallDiscount > 0 ? 'APPLIED' : 'NONE'}
                            </span>
                          </label>
                        </div>

                        {overallDiscount > 0 ? (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingTop: '6px', borderTop: '1px solid #EFEAE1' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6A5644' }}>Discount Type:</span>
                              {/* Type Toggle: % or ₹ */}
                              <div style={{ display: 'flex', background: '#EAE4D9', borderRadius: '5px', padding: '2px' }}>
                                <button
                                  type="button"
                                  onClick={() => setDiscountType('PERCENTAGE')}
                                  style={{
                                    padding: '2px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    borderRadius: '4px',
                                    border: 'none',
                                    background: discountType === 'PERCENTAGE' ? 'var(--color-secondary-brown)' : 'transparent',
                                    color: discountType === 'PERCENTAGE' ? '#FFFFFF' : 'var(--color-secondary-brown)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  % Percentage
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDiscountType('FIXED')}
                                  style={{
                                    padding: '2px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    borderRadius: '4px',
                                    border: 'none',
                                    background: discountType === 'FIXED' ? 'var(--color-secondary-brown)' : 'transparent',
                                    color: discountType === 'FIXED' ? '#FFFFFF' : 'var(--color-secondary-brown)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  ₹ Fixed Amount
                                </button>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                  type="number"
                                  min="0"
                                  max={discountType === 'PERCENTAGE' ? 100 : undefined}
                                  step="any"
                                  className="input-field"
                                  placeholder={discountType === 'PERCENTAGE' ? 'e.g. 5, 8, 10' : 'e.g. 25000, 50000'}
                                  value={overallDiscount || ''}
                                  onChange={(e) => {
                                    const val = Math.max(0, Number(e.target.value) || 0);
                                    setOverallDiscount(discountType === 'PERCENTAGE' ? Math.min(100, val) : val);
                                  }}
                                  style={{ fontSize: '0.85rem', fontWeight: 600, paddingRight: '28px', background: '#FFFFFF' }}
                                />
                                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                                  {discountType === 'PERCENTAGE' ? '%' : '₹'}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => setOverallDiscount(0)}
                                className="btn-icon"
                                style={{ borderColor: 'var(--color-border-beige)', color: 'var(--color-cancelled)', height: '34px', width: '34px', flexShrink: 0 }}
                                title="Remove Discount"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            {/* Quick Preset Buttons */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Presets:</span>
                              {discountType === 'PERCENTAGE' ? (
                                [3, 5, 8, 10, 12, 15].map((pct) => (
                                  <button
                                    key={pct}
                                    type="button"
                                    onClick={() => setOverallDiscount(pct)}
                                    style={{
                                      padding: '2px 7px',
                                      fontSize: '0.68rem',
                                      fontWeight: 600,
                                      borderRadius: '4px',
                                      border: overallDiscount === pct ? '1px solid var(--color-secondary-brown)' : '1px solid #D6CEBE',
                                      background: overallDiscount === pct ? 'var(--color-secondary-brown)' : '#FFFFFF',
                                      color: overallDiscount === pct ? '#FFFFFF' : 'var(--color-secondary-brown)',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {pct}%
                                  </button>
                                ))
                              ) : (
                                [10000, 25000, 50000, 100000].map((amt) => (
                                  <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setOverallDiscount(amt)}
                                    style={{
                                      padding: '2px 7px',
                                      fontSize: '0.68rem',
                                      fontWeight: 600,
                                      borderRadius: '4px',
                                      border: overallDiscount === amt ? '1px solid var(--color-secondary-brown)' : '1px solid #D6CEBE',
                                      background: overallDiscount === amt ? 'var(--color-secondary-brown)' : '#FFFFFF',
                                      color: overallDiscount === amt ? '#FFFFFF' : 'var(--color-secondary-brown)',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    ₹{amt >= 100000 ? `${amt / 100000}L` : `${amt / 1000}k`}
                                  </button>
                                ))
                              )}
                            </div>

                            {/* Live Discount Deduction Info */}
                            {totals.discountTotal > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #D6CEBE' }}>
                                <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 600 }}>
                                  Total Discount Deducted:
                                </span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', fontFamily: 'monospace' }}>
                                  -₹{totals.discountTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ padding: '6px 8px', background: '#F1F5F9', borderRadius: '6px', fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>✓ No discount applied. Subtotal will be billed in full without deductions.</span>
                          </div>
                        )}
                      </div>

                      {/* 2. Admin Option: Manual GST Rate Control (Applied to Total Calculation) */}
                      <div style={{
                        background: '#FAF8F5',
                        border: gstRate > 0 ? '1.5px solid var(--color-secondary-brown)' : '1px solid #E5DEC9',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        marginTop: '12px',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-secondary-brown)', display: 'block' }}>
                              GST / Tax Engine
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                              {gstRate > 0 ? `Applied at ${gstRate}% on taxable amount` : 'Optional — Only added if enabled by Admin'}
                            </span>
                          </div>
                          {/* Admin Enable / Disable Toggle */}
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={gstRate > 0}
                              onChange={(e) => {
                                setGstRate(e.target.checked ? 18 : 0);
                              }}
                              style={{ accentColor: '#10B981', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: gstRate > 0 ? '#059669' : '#64748B' }}>
                              {gstRate > 0 ? `${gstRate}% GST` : '0% (EXEMPTED)'}
                            </span>
                          </label>
                        </div>

                        {gstRate > 0 ? (
                          <>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="any"
                                  className="input-field"
                                  placeholder="e.g. 5, 12, 18, 28"
                                  value={gstRate !== undefined ? gstRate : ''}
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                                    setGstRate(val);
                                  }}
                                  style={{ fontSize: '0.85rem', fontWeight: 600, paddingRight: '28px', background: '#FFFFFF' }}
                                />
                                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                                  %
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => setGstRate(0)}
                                className="btn-icon"
                                style={{ borderColor: 'var(--color-border-beige)', color: 'var(--color-cancelled)', height: '34px', width: '34px', flexShrink: 0 }}
                                title="Set GST to 0% (Exempted / Nil)"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            {/* Quick GST Preset Buttons */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Presets:</span>
                              {[
                                { label: '5%', val: 5 },
                                { label: '12%', val: 12 },
                                { label: '18% (Standard)', val: 18 },
                                { label: '28%', val: 28 }
                              ].map((preset) => (
                                <button
                                  key={preset.val}
                                  type="button"
                                  onClick={() => setGstRate(preset.val)}
                                  style={{
                                    padding: '2px 8px',
                                    fontSize: '0.68rem',
                                    fontWeight: 600,
                                    borderRadius: '4px',
                                    border: gstRate === preset.val ? '1px solid var(--color-secondary-brown)' : '1px solid #D6CEBE',
                                    background: gstRate === preset.val ? 'var(--color-secondary-brown)' : '#FFFFFF',
                                    color: gstRate === preset.val ? '#FFFFFF' : 'var(--color-secondary-brown)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>

                            {/* Live Tax Breakdown Info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #D6CEBE', fontSize: '0.72rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                                <span>Taxable Value (Subtotal - Disc):</span>
                                <span style={{ fontWeight: 600, fontFamily: 'monospace', color: '#1E293B' }}>
                                  ₹{totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                                <span>CGST ({(gstRate / 2).toFixed(1).replace(/\.0$/, '')}%):</span>
                                <span style={{ fontWeight: 600, fontFamily: 'monospace', color: '#1E293B' }}>
                                  ₹{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                                <span>SGST ({(gstRate / 2).toFixed(1).replace(/\.0$/, '')}%):</span>
                                <span style={{ fontWeight: 600, fontFamily: 'monospace', color: '#1E293B' }}>
                                  ₹{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-secondary-brown)', fontWeight: 700, paddingTop: '2px' }}>
                                <span>Total GST ({gstRate}%):</span>
                                <span style={{ fontFamily: 'monospace' }}>
                                  +₹{(totals.cgst + totals.sgst + totals.igst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div style={{ padding: '6px 8px', background: '#F1F5F9', borderRadius: '6px', fontSize: '0.72rem', color: '#15803D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>✓ GST Disabled (0% / Exempted) — No tax will be added to the final amount.</span>
                          </div>
                        )}
                      </div>

                      <div className="form-grid" style={{ marginTop: '12px' }}>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span className="input-label" style={{ fontWeight: 600, margin: 0 }}>
                              Payment Title / Milestone Name (Column Header)
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--color-primary-gold)', fontWeight: 600 }}>
                              ✎ Fully Editable
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <select
                              className="input-field"
                              style={{ flex: '0 0 45%', fontSize: '0.78rem' }}
                              value={STUDIO_INSTALLMENT_PRESETS.includes(paymentType) ? paymentType : 'Custom'}
                              onChange={(e) => {
                                if (e.target.value !== 'Custom') {
                                  setPaymentType(e.target.value);
                                  setInvoice((prev) => ({ ...prev, paymentType: e.target.value }));
                                } else {
                                  setPaymentType('');
                                  setInvoice((prev) => ({ ...prev, paymentType: '' }));
                                }
                              }}
                            >
                              {STUDIO_INSTALLMENT_PRESETS.map((preset) => (
                                <option key={preset} value={preset}>
                                  {preset}
                                </option>
                              ))}
                              <option value="Custom">Custom Milestone Title...</option>
                            </select>
                            <input
                              type="text"
                              className="input-field"
                              style={{ flex: '1', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-secondary-brown)' }}
                              placeholder="Type custom milestone title here..."
                              value={paymentType}
                              onChange={(e) => {
                                setPaymentType(e.target.value);
                                setInvoice((prev) => ({ ...prev, paymentType: e.target.value }));
                              }}
                              autoFocus={!STUDIO_INSTALLMENT_PRESETS.includes(paymentType)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-grid" style={{ marginTop: '8px' }}>
                        <div className="input-group">
                          <span className="input-label" style={{ fontWeight: 600 }}>
                            Previous Payments Recorded (₹) <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>(Internal Audit)</span>
                          </span>
                          <input
                            type="number"
                            className="input-field"
                            placeholder="0"
                            value={previousPayments}
                            onChange={(e) => setPreviousPayments(Math.max(0, Number(e.target.value) || 0))}
                          />
                          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                            Cumulative past collections. Kept private for Super Admin internal tracking.
                          </span>
                        </div>

                        <div className="input-group">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <span className="input-label" style={{ fontWeight: 600, margin: 0, fontSize: '0.74rem' }}>
                              {paymentType || 'Current Payment'} (₹)
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                              Editable Title ✎
                            </span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            className={`input-field ${isOverpaid ? 'input-error' : ''}`}
                            placeholder="0"
                            value={currentPayment}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setCurrentPayment(val);
                              setInvoice((prev) => ({ ...prev, advancePaid: val }));
                            }}
                          />
                          <span style={{ fontSize: '0.68rem', color: isOverpaid ? 'var(--color-cancelled)' : 'var(--color-text-muted)' }}>
                            Max allowable: ₹{maxAllowablePayment.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {isOverpaid && (
                        <div className="overpayment-alert">
                          <strong>⚠️ Overpayment Warning:</strong> Payment of ₹{Number(currentPayment).toLocaleString('en-IN')} exceeds allowable balance of ₹{maxAllowablePayment.toLocaleString('en-IN')}. Please reduce the amount.
                        </div>
                      )}

                      {/* Grand Total Hero Banner */}
                      <div className="payment-hero-amount-card">
                        <div className="payment-hero-amount-info">
                          <span className="payment-hero-amount-lbl">
                            {quotationType === 'MATERIAL' ? 'Total Material Quotation Amount' : 'Total Quotation Final Amount'}
                          </span>
                          <span className="payment-hero-amount-val">
                            ₹{totals.grandTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className="payment-hero-badge">
                          Incl. GST
                        </span>
                      </div>

                      {/* Confirmation Fee & Downside Remaining Balance Metric Breakdown */}
                      <div className="payment-breakdown-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="payment-metric-box">
                          <span className="payment-metric-lbl">{paymentType || 'Confirmation Fee'}</span>
                          <span className="payment-metric-val" style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                            ₹{(Number(currentPayment) || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="payment-metric-box" style={{ background: remainingBalance === 0 ? 'rgba(16, 185, 129, 0.08)' : undefined }}>
                          <span className="payment-metric-lbl">Remaining Balance Due</span>
                          <span className="payment-metric-val" style={{ color: remainingBalance === 0 ? 'var(--color-success)' : 'var(--color-secondary-brown)', fontWeight: 800 }}>
                            ₹{remainingBalance.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Collection Status Row */}
                      <div className="payment-status-row">
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-secondary-brown)' }}>
                          Status:
                        </span>
                        <span className={`status-pill status-${paymentStatus.toLowerCase().replace(/\s+/g, '')}`}>
                          {paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="form-grid" style={{ marginTop: '16px' }}>
                      <div className="input-group">
                        <span className="input-label">UPI Merchant ID</span>
                        <input
                          type="text"
                          placeholder="e.g. business@okbank"
                          className="input-field"
                          value={invoice.bank.upiId}
                          onChange={(e) => setInvoice({ ...invoice, bank: { ...invoice.bank, upiId: e.target.value } })}
                        />
                      </div>

                      <div className="input-group">
                        <span className="input-label">Bank Name</span>
                        <input
                          type="text"
                          className="input-field"
                          value={invoice.bank.bankName}
                          onChange={(e) => setInvoice({ ...invoice, bank: { ...invoice.bank, bankName: e.target.value } })}
                        />
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="input-group">
                        <span className="input-label">Account Holder Name</span>
                        <input
                          type="text"
                          className="input-field"
                          value={invoice.bank.accountHolder}
                          onChange={(e) => setInvoice({ ...invoice, bank: { ...invoice.bank, accountHolder: e.target.value } })}
                        />
                      </div>

                      <div className="input-group">
                        <span className="input-label">Account Number</span>
                        <input
                          type="text"
                          className="input-field"
                          value={invoice.bank.accountNumber}
                          onChange={(e) => setInvoice({ ...invoice, bank: { ...invoice.bank, accountNumber: e.target.value } })}
                        />
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="input-group">
                        <span className="input-label">IFSC Code</span>
                        <input
                          type="text"
                          className="input-field"
                          value={invoice.bank.ifsc}
                          onChange={(e) => setInvoice({ ...invoice, bank: { ...invoice.bank, ifsc: e.target.value } })}
                        />
                      </div>

                      <div className="input-group">
                        <span className="input-label">Branch</span>
                        <input
                          type="text"
                          className="input-field"
                          value={invoice.bank.branch}
                          onChange={(e) => setInvoice({ ...invoice, bank: { ...invoice.bank, branch: e.target.value } })}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <span className="input-label" style={{ fontWeight: 600, color: 'var(--color-secondary-brown)' }}>
                        Custom Payment QR Code
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrUpload}
                          className="input-field"
                          style={{ fontSize: '0.75rem', padding: '6px 8px' }}
                        />
                        {invoice.bank.customQrUrl && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleClearCustomQr}
                            style={{ padding: '6px 10px', fontSize: '0.72rem', borderColor: 'var(--color-cancelled-border)', color: 'var(--color-cancelled)', whiteSpace: 'nowrap' }}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 6: Milestone-Based Payment Schedule */}
            <div className={`collapsible-section ${openSections.milestones ? 'open' : ''}`}>
              <button className="collapsible-header" type="button" onClick={() => toggleSection('milestones')}>
                <span className="collapsible-header-title">
                  <Calendar size={16} />
                  6. Milestone-Based Payment Schedule
                </span>
                <ChevronDown size={16} className="collapsible-chevron" />
              </button>
              {openSections.milestones && (
                <div className="collapsible-content">
                  <div className="collapsible-content-wrapper">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Define project milestones, percentage/amounts and reference stages:
                      </span>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        onClick={handleAddMilestone}
                      >
                        <Plus size={13} /> + Add Milestone
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {paymentMilestones.map((m) => (
                        <div
                          key={m.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1.2fr 0.8fr 1.2fr auto',
                            gap: '6px',
                            alignItems: 'center',
                            background: '#F8FAFC',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0'
                          }}
                        >
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Milestone Name"
                            style={{ fontSize: '0.75rem', padding: '4px 6px' }}
                            value={m.name}
                            onChange={(e) => handleMilestoneChange(m.id, 'name', e.target.value)}
                          />
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Amount / %"
                            style={{ fontSize: '0.75rem', padding: '4px 6px' }}
                            value={m.percentage !== undefined ? `${m.percentage}%` : m.amount ? `₹${m.amount}` : ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              handleMilestoneChange(m.id, 'percentage', Number(val) || 0);
                            }}
                          />
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Stage / Reference"
                            style={{ fontSize: '0.75rem', padding: '4px 6px' }}
                            value={m.stage || ''}
                            onChange={(e) => handleMilestoneChange(m.id, 'stage', e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-icon"
                            style={{ borderColor: 'var(--color-cancelled-border)', color: 'var(--color-cancelled)', width: '26px', height: '26px' }}
                            onClick={() => handleDeleteMilestone(m.id)}
                            disabled={paymentMilestones.length <= 1}
                            title="Delete Milestone"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 7: Standard Terms & Conditions */}
            <div className={`collapsible-section ${openSections.terms ? 'open' : ''}`}>
              <button className="collapsible-header" type="button" onClick={() => toggleSection('terms')}>
                <span className="collapsible-header-title">
                  <FileCheck size={16} />
                  7. Standard Terms & Conditions
                </span>
                <ChevronDown size={16} className="collapsible-chevron" />
              </button>
              {openSections.terms && (
                <div className="collapsible-content">
                  <div className="collapsible-content-wrapper">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Add, edit, delete, or reorder numbered terms:
                      </span>
                      <button
                        type="button"
                        onClick={handleResetTerms}
                        style={{ fontSize: '0.7rem', color: 'var(--color-primary-gold)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Reset Defaults
                      </button>
                    </div>

                    {/* Add New Term Input */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Type a new term and click Add..."
                        value={newTermText}
                        onChange={(e) => setNewTermText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTerm();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                        onClick={handleAddTerm}
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>

                    {/* List of Numbered Editable Terms */}
                    <div className="editable-terms-list">
                      {terms.map((term, idx) => (
                        <div className="editable-term-row" key={idx}>
                          <span className="editable-term-num">{idx + 1}.</span>
                          <input
                            type="text"
                            className="editable-term-input"
                            value={term}
                            onChange={(e) => handleEditTerm(idx, e.target.value)}
                          />
                          <div className="editable-term-actions">
                            <button
                              type="button"
                              className="editable-term-btn"
                              title="Move Up"
                              disabled={idx === 0}
                              onClick={() => handleMoveTerm(idx, 'up')}
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              type="button"
                              className="editable-term-btn"
                              title="Move Down"
                              disabled={idx === terms.length - 1}
                              onClick={() => handleMoveTerm(idx, 'down')}
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button
                              type="button"
                              className="editable-term-btn editable-term-delete-btn"
                              title="Delete Term"
                              disabled={terms.length <= 1}
                              onClick={() => handleDeleteTerm(idx)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Optional Estimated Timeline (CHANGE 23) */}
                    <div className="input-group" style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
                      <span className="input-label">Estimated Timeline (Optional)</span>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. 8–10 weeks from design approval"
                        value={invoice.estimatedTimeline || ''}
                        onChange={(e) => setInvoice((prev) => ({ ...prev, estimatedTimeline: e.target.value }))}
                        style={{ fontSize: '0.8rem' }}
                      />
                    </div>

                    {/* Notes for Project-Specific Remarks (CHANGE 21) */}
                    <div className="input-group" style={{ marginTop: '8px' }}>
                      <span className="input-label">Notes (Project-Specific Remarks)</span>
                      <textarea
                        rows={2}
                        className="input-field"
                        placeholder="Project-specific remarks and notes..."
                        value={invoice.notes}
                        onChange={(e) => setInvoice((prev) => ({ ...prev, notes: e.target.value }))}
                        style={{ resize: 'vertical', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 8: Warranty & Support Information */}
            <div className={`collapsible-section ${openSections.warranty ? 'open' : ''}`}>
              <button className="collapsible-header" type="button" onClick={() => toggleSection('warranty')}>
                <span className="collapsible-header-title">
                  <Shield size={16} />
                  8. Warranty & Post-Project Support
                </span>
                <ChevronDown size={16} className="collapsible-chevron" />
              </button>
              {openSections.warranty && (
                <div className="collapsible-content">
                  <div className="collapsible-content-wrapper">
                    <div className="input-group">
                      <span className="input-label">Warranty Information</span>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. 5-Year Structural & Hardware Warranty as per Espacio SLA"
                        value={warrantyInfo}
                        onChange={(e) => {
                          setWarrantyInfo(e.target.value);
                          setInvoice((prev) => ({ ...prev, warrantyInfo: e.target.value }));
                        }}
                      />
                    </div>

                    <div className="input-group">
                      <span className="input-label">Support Contact Details</span>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. support@theespacio.in | +91 90000 80000"
                        value={supportContact}
                        onChange={(e) => {
                          setSupportContact(e.target.value);
                          setInvoice((prev) => ({ ...prev, supportContact: e.target.value }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* 3. RIGHT PREVIEW PANEL */}
        <main className="preview-panel" ref={previewPanelRef}>
          <div className="preview-container">
            {/* Quick Actions Bar directly above preview */}
            <div className="preview-actions-toolbar" style={{ flexWrap: 'wrap', gap: '8px' }}>
              {/* Paper Format & Orientation Selector */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F5EFE6', padding: '3px 8px', borderRadius: '6px', border: '1px solid #DFD5C4' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-secondary-brown)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Paper:
                </span>
                <select
                  value={paperFormat}
                  onChange={(e) => setPaperFormat(e.target.value as any)}
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    padding: '3px 6px',
                    borderRadius: '4px',
                    border: '1px solid #D6CBBA',
                    background: '#FFFFFF',
                    color: 'var(--color-secondary-brown)',
                    cursor: 'pointer'
                  }}
                  title="Select Paper Size (A4, A3, A5, Letter, Legal)"
                >
                  <option value="a4">A4 (210 × 297 mm)</option>
                  <option value="a3">A3 (297 × 420 mm)</option>
                  <option value="a5">A5 (148 × 210 mm)</option>
                  <option value="letter">Letter (8.5 × 11 in)</option>
                  <option value="legal">Legal (8.5 × 14 in)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setPaperOrientation((prev) => prev === 'portrait' ? 'landscape' : 'portrait')}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #D6CBBA',
                    background: paperOrientation === 'landscape' ? 'var(--color-secondary-brown)' : '#FFFFFF',
                    color: paperOrientation === 'landscape' ? '#FFFFFF' : 'var(--color-secondary-brown)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Toggle Portrait / Landscape Orientation"
                >
                  {paperOrientation === 'portrait' ? '↕ Portrait' : '↔ Landscape'}
                </button>
              </div>

              <button className="preview-action-btn" type="button" onClick={handlePrint}>
                <Printer size={15} />
                Print
              </button>

              <button className="preview-action-btn" type="button" onClick={handleDownloadPdf} disabled={isPdfLoading}>
                {isPdfLoading ? (
                  <>
                    <Loader2 size={15} className="spinner" style={{ animation: 'rotate 1s linear infinite' }} />
                    Compiling...
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    Download PDF
                  </>
                )}
              </button>

              <button className="preview-action-btn" type="button" onClick={handleExportExcel}>
                <FileSpreadsheet size={15} />
                Excel
              </button>

              <button className="preview-action-btn" type="button" onClick={() => setEmailModalOpen(true)}>
                <Mail size={15} />
                Email
              </button>

              <button className="preview-action-btn" type="button" onClick={() => setWhatsappModalOpen(true)}>
                <MessageSquare size={15} />
                WhatsApp
              </button>

              <button className="preview-action-btn preview-action-btn-primary" type="button" onClick={() => setDriveModalOpen(true)}>
                <Cloud size={15} />
                Sync to Drive
              </button>
            </div>

            {/* Visual Indicator of Mode & Multi-Page Count */}
            {(() => {
              const currentCanvasDims = getCanvasDimensions();
              const pageMinHeight = currentCanvasDims.minHeight;
              const totalPages = Math.max(1, Math.ceil((canvasHeight - 20) / pageMinHeight));
              const effectiveCanvasMinHeight = totalPages * pageMinHeight;

              return (
                <>
                  <div className="invoice-mode-badge-indicator" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Live Preview • {quotationType} View • {displayDocumentTitle}</span>
                      <span className="invoice-page-count-badge">
                        <FileText size={13} />
                        {totalPages} {totalPages === 1 ? 'Page' : 'Pages'} ({paperFormat.toUpperCase()} {paperOrientation.toUpperCase()})
                      </span>
                    </div>

                    {/* Full Page Appearance & Zoom Controller */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '3px 6px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                      <button
                        type="button"
                        onClick={() => setPreviewZoomMode('fit-page')}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          background: previewZoomMode === 'fit-page' ? '#6A4A2D' : 'transparent',
                          color: previewZoomMode === 'fit-page' ? '#FFFFFF' : '#475569'
                        }}
                        title="Fit Full Page in View (Entire Document Visible)"
                      >
                        Fit Page
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewZoomMode('fit-width')}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          background: previewZoomMode === 'fit-width' ? '#6A4A2D' : 'transparent',
                          color: previewZoomMode === 'fit-width' ? '#FFFFFF' : '#475569'
                        }}
                        title="Fit Document Width"
                      >
                        Fit Width
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewZoomMode('100%')}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          background: previewZoomMode === '100%' ? '#6A4A2D' : 'transparent',
                          color: previewZoomMode === '100%' ? '#FFFFFF' : '#475569'
                        }}
                        title="Actual Size (100%)"
                      >
                        100%
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '4px', borderLeft: '1px solid #CBD5E1', paddingLeft: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const newScale = Math.max(0.35, documentScale - 0.1);
                            setDocumentScale(Number(newScale.toFixed(2)));
                            setPreviewZoomMode('custom');
                          }}
                          style={{
                            padding: '2px 6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            borderRadius: '3px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            cursor: 'pointer'
                          }}
                          title="Zoom Out"
                        >
                          -
                        </button>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', minWidth: '38px', textAlign: 'center' }}>
                          {Math.round(documentScale * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newScale = Math.min(1.5, documentScale + 0.1);
                            setDocumentScale(Number(newScale.toFixed(2)));
                            setPreviewZoomMode('custom');
                          }}
                          style={{
                            padding: '2px 6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            borderRadius: '3px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            cursor: 'pointer'
                          }}
                          title="Zoom In"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Scaler Wrapper for proportional document preview on mobile / large formats */}
                  <div
                    className="invoice-a4-scaler"
                    style={documentScale < 1 ? {
                      width: `${Math.floor(currentCanvasDims.baseWidth * documentScale)}px`
                    } : undefined}
                  >
                    {/* Single continuous multi-page luxury quotation document canvas */}
                    <div
                      ref={canvasRef}
                      id="invoice-print-area"
                      className={`invoice-a4-canvas anim-fade-in canvas-format-${paperFormat} canvas-orientation-${paperOrientation}`}
                      style={documentScale < 1 ? ({
                        '--doc-scale': documentScale,
                        zoom: documentScale
                      } as React.CSSProperties) : undefined}
                    >
                      {/* TOP HEADER SECTION */}
                      <div className="invoice-header-row">
                        {/* Top Left: Logo & Company Address */}
                        <div className="company-info-block">
                          {invoice.company.logoUrl ? (
                            <img
                              src={invoice.company.logoUrl}
                              alt="Espacio Logo"
                              style={{
                                maxHeight: '72px',
                                maxWidth: '220px',
                                objectFit: 'contain',
                                objectPosition: 'left center',
                                marginBottom: '4px',
                                display: 'block',
                                alignSelf: 'flex-start'
                              }}
                            />
                          ) : (
                            <div className="company-logo-preview">
                              E<span>SPACIO</span>
                            </div>
                          )}
                          <div className="company-details-text">
                            <p style={{ fontWeight: 600, color: 'var(--color-secondary-brown)', margin: 0 }}>{invoice.company.name}</p>
                            <p style={{ marginTop: '2px', margin: 0 }}>{invoice.company.address}</p>
                            <p style={{ marginTop: '3px', margin: 0 }}><strong>GSTIN:</strong> {invoice.company.gstin}</p>
                            <p style={{ margin: 0 }}><strong>Tel:</strong> {invoice.company.phone} | <strong>Email:</strong> {invoice.company.email}</p>
                            <p style={{ margin: 0 }}><strong>Web:</strong> {invoice.company.website}</p>
                          </div>
                        </div>

                        {/* Top Center: Elegant Title Heading (From Manual Title Input) */}
                        <div className="invoice-title-block">
                          <span className="invoice-title-text">{displayDocumentTitle}</span>
                          {paymentType && (
                            <div className="invoice-title-subtitle">
                              {paymentType}
                            </div>
                          )}
                          <span className="invoice-subtitle-text" style={{ marginTop: '2px' }}>Luxury Interior Design Studio</span>
                          <div className="invoice-header-divider" />
                        </div>

                        {/* Top Right: Status Card */}
                        <div className="meta-info-card">
                          <div className="meta-info-row">
                            <span className="meta-info-label">
                              {invoice.mode === 'Quotation' || invoice.mode === 'Estimate'
                                ? 'Quotation No'
                                : invoice.mode === 'Bill' || invoice.mode === 'Cash Bill'
                                  ? 'Bill No'
                                  : 'Invoice No'}
                            </span>
                            <span className="meta-info-val">{invoice.invoiceNumber}</span>
                          </div>
                          {/* Quotation Reference & Version on Invoices (CHANGE 27) */}
                          {invoice.quotationReference && (invoice.mode === 'Tax Invoice' || invoice.mode === 'Bill' || invoice.mode === 'Proforma Invoice') && (
                            <div className="meta-info-row">
                              <span className="meta-info-label">Quote Ref</span>
                              <span className="meta-info-val" style={{ color: 'var(--color-secondary-brown)', fontWeight: 700 }}>
                                {invoice.quotationReference}
                              </span>
                            </div>
                          )}
                          <div className="meta-info-row">
                            <span className="meta-info-label">Date</span>
                            <span className="meta-info-val">{invoice.invoiceDate}</span>
                          </div>
                          <div className="meta-info-row">
                            <span className="meta-info-label">
                              {invoice.mode === 'Quotation' || invoice.mode === 'Estimate' ? 'Valid Till' : 'Due Date'}
                            </span>
                            <span className="meta-info-val">{invoice.dueDate}</span>
                          </div>
                          <div className="meta-info-row">
                            <span className="meta-info-label">Terms</span>
                            <span className="meta-info-val">{invoice.paymentTerms}</span>
                          </div>
                          <div className="meta-info-row" style={{ alignItems: 'center', marginTop: '4px' }}>
                            <span className="meta-info-label">Status</span>
                            <span className={`status-pill status-${invoice.status.toLowerCase().replace(/\s+/g, '')}`}>
                              {invoice.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* DYNAMIC CLIENT & PROJECT INFORMATION CARDS */}
                      <div className="info-cards-row">
                        {/* Client Card */}
                        <div className="premium-info-card">
                          <div className="card-title-badge">
                            <User size={13} />
                            <span>{quotationType === 'MATERIAL' ? 'Consignee / Buyer' : 'Bill To'}</span>
                          </div>
                          <div className="info-details-list">
                            <div className="info-details-row">
                              <span className="info-details-lbl">To</span>
                              <span className="info-details-val" style={{ color: 'var(--color-secondary-brown)', fontWeight: 700 }}>
                                {invoice.client.name || '—'}
                              </span>
                            </div>
                            <div className="info-details-row">
                              <span className="info-details-lbl">Location</span>
                              <span className="info-details-val">{invoice.client.location || invoice.client.address || '—'}</span>
                            </div>
                            <div className="info-details-row">
                              <span className="info-details-lbl">Phone</span>
                              <span className="info-details-val">{invoice.client.phone || '—'}</span>
                            </div>
                            <div className="info-details-row">
                              <span className="info-details-lbl">Email</span>
                              <span className="info-details-val">{invoice.client.email || '—'}</span>
                            </div>
                            {invoice.client.gstin && (
                              <div className="info-details-row">
                                <span className="info-details-lbl">GSTIN</span>
                                <span className="info-details-val">{invoice.client.gstin}</span>
                              </div>
                            )}
                            {compliance.clientPan && (
                              <div className="info-details-row">
                                <span className="info-details-lbl">Client PAN</span>
                                <span className="info-details-val">{compliance.clientPan}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Secondary Card (Dynamic per Quotation Type) */}
                        {quotationType === 'PROJECT' && (
                          <div className="premium-info-card">
                            <div className="card-title-badge">
                              <FolderOpen size={13} />
                              <span>Project Details</span>
                            </div>
                            <div className="info-details-list">
                              <div className="info-details-row">
                                <span className="info-details-lbl">Project</span>
                                <span className="info-details-val" style={{ color: 'var(--color-secondary-brown)', fontWeight: 700 }}>
                                  {invoice.project.name || '—'}
                                </span>
                              </div>
                              <div className="info-details-row">
                                <span className="info-details-lbl">Site Location</span>
                                <span className="info-details-val">{invoice.project.address || '—'}</span>
                              </div>
                              <div className="info-details-row">
                                <span className="info-details-lbl">Designer</span>
                                <span className="info-details-val">{invoice.project.designer || '—'}</span>
                              </div>
                              <div className="info-details-row">
                                <span className="info-details-lbl">Type / Stage</span>
                                <span className="info-details-val">{invoice.project.type || 'Residential'} | {invoice.project.stage || 'Execution'}</span>
                              </div>
                              {(compliance.placeOfSupply || dispatchDetails.placeOfSupply) && (
                                <div className="info-details-row">
                                  <span className="info-details-lbl">Place of Supply</span>
                                  <span className="info-details-val">{dispatchDetails.placeOfSupply || compliance.placeOfSupply}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {quotationType === 'LEAD' && (
                          <div className="premium-info-card">
                            <div className="card-title-badge">
                              <FolderOpen size={13} />
                              <span>Requirement & Location</span>
                            </div>
                            <div className="info-details-list">
                              <div className="info-details-row">
                                <span className="info-details-lbl">Scope</span>
                                <span className="info-details-val" style={{ color: 'var(--color-secondary-brown)', fontWeight: 700 }}>
                                  {invoice.client.requirement || invoice.project.name || 'Complete Interior Design'}
                                </span>
                              </div>
                              <div className="info-details-row">
                                <span className="info-details-lbl">Location</span>
                                <span className="info-details-val">{invoice.client.location || invoice.client.address || '—'}</span>
                              </div>
                              <div className="info-details-row">
                                <span className="info-details-lbl">Type</span>
                                <span className="info-details-val">{invoice.project.type || 'Residential Interior'}</span>
                              </div>
                              <div className="info-details-row">
                                <span className="info-details-lbl">Validity</span>
                                <span className="info-details-val">30 Days from issue</span>
                              </div>
                              {invoice.estimatedTimeline && (
                                <div className="info-details-row">
                                  <span className="info-details-lbl">Est. Timeline</span>
                                  <span className="info-details-val">{invoice.estimatedTimeline}</span>
                                </div>
                              )}
                              {(compliance.placeOfSupply || dispatchDetails.placeOfSupply) && (
                                <div className="info-details-row">
                                  <span className="info-details-lbl">Place of Supply</span>
                                  <span className="info-details-val">{dispatchDetails.placeOfSupply || compliance.placeOfSupply}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {quotationType === 'MATERIAL' && (
                          <div className="premium-info-card">
                            <div className="card-title-badge">
                              <Package size={13} />
                              <span>Dispatch & Supply Terms</span>
                            </div>
                            <div className="info-details-list">
                              <div className="info-details-row">
                                <span className="info-details-lbl">Supply Type</span>
                                <span className="info-details-val" style={{ color: 'var(--color-secondary-brown)', fontWeight: 700 }}>
                                  {dispatchDetails.supplyType || 'Material & Hardware Supply'}
                                </span>
                              </div>
                              <div className="info-details-row">
                                <span className="info-details-lbl">Dispatch</span>
                                <span className="info-details-val">{dispatchDetails.dispatchFrom || 'Ex-Warehouse Hyderabad'}</span>
                              </div>
                              <div className="info-details-row">
                                <span className="info-details-lbl">Freight / Tax</span>
                                <span className="info-details-val">{dispatchDetails.freightTerms || 'Inclusive of statutory GST'}</span>
                              </div>
                              {(compliance.placeOfSupply || dispatchDetails.placeOfSupply) && (
                                <div className="info-details-row">
                                  <span className="info-details-lbl">Place of Supply</span>
                                  <span className="info-details-val">{dispatchDetails.placeOfSupply || compliance.placeOfSupply}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* COMPLETE INTERIORS (ROOM-WISE) VS MATERIALS LINE ITEMS TABLE */}
                      {isRoomWiseMode ? (
                        <div className="room-sections-preview-list" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {rooms.map((room, rIdx) => {
                            const roomSubtotal = getRoomSubtotal(room);
                            const rawInclusions = room.inclusions
                              ? (Array.isArray(room.inclusions) ? room.inclusions.flatMap((s: any) => typeof s === 'string' ? s.split('\n') : [String(s)]) : String(room.inclusions).split('\n')).filter((s: string) => s.trim().length > 0)
                              : [];
                            const rawExclusions = room.exclusions
                              ? (Array.isArray(room.exclusions) ? room.exclusions.flatMap((s: any) => typeof s === 'string' ? s.split('\n') : [String(s)]) : String(room.exclusions).split('\n')).filter((s: string) => s.trim().length > 0)
                              : [];
                            const hasSpecsOrScope = Boolean((room.finishSpec || room.finish) || rawInclusions.length > 0 || rawExclusions.length > 0);
                            const finishText = room.finishSpec || room.finish || '';

                            return (
                              <div
                                key={room.id || rIdx}
                                className="room-preview-card"
                                style={{
                                  border: '1px solid #DFD5C4',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  background: '#FAF6EE',
                                  boxShadow: '0 2px 6px rgba(78, 51, 27, 0.04)'
                                }}
                              >
                                {/* Top Header Bar (Espresso Brown with Room Title & Finish Pill) */}
                                <div
                                  style={{
                                    background: '#5C4332',
                                    color: '#FFFFFF',
                                    padding: '10px 16px 8px 16px'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                    <span
                                      style={{
                                        fontFamily: "var(--font-heading, 'Playfair Display', serif)",
                                        fontSize: '0.92rem',
                                        letterSpacing: '1.4px',
                                        fontWeight: 600,
                                        color: '#FFFFFF',
                                        textTransform: 'uppercase'
                                      }}
                                    >
                                      {(room.roomName || room.name || `Room ${rIdx + 1}`).toUpperCase()}
                                    </span>
                                    {finishText && (
                                      <div
                                        style={{
                                          fontSize: '0.67rem',
                                          color: '#EDE3D2',
                                          border: '1px solid rgba(255, 255, 255, 0.22)',
                                          background: 'rgba(0, 0, 0, 0.22)',
                                          padding: '2px 10px',
                                          borderRadius: '4px',
                                          letterSpacing: '0.2px',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        Finish: {finishText}
                                      </div>
                                    )}
                                  </div>

                                  {/* Table Column Headers Bar */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      marginTop: '10px',
                                      paddingTop: '6px',
                                      borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      letterSpacing: '0.8px',
                                      color: '#E0D0BE',
                                      textTransform: 'uppercase'
                                    }}
                                  >
                                    <div style={{ width: showHsnColumn ? '45%' : '54%' }}>ITEM &amp; DESIGN SPECIFICATIONS</div>
                                    {showHsnColumn && <div style={{ width: '9%', textAlign: 'center' }}>HSN</div>}
                                    <div style={{ width: '8%', textAlign: 'center' }}>QTY</div>
                                    <div style={{ width: '10%', textAlign: 'center' }}>UNIT</div>
                                    <div style={{ width: '14%', textAlign: 'right' }}>RATE (₹)</div>
                                    <div style={{ width: '14%', textAlign: 'right' }}>TOTAL (₹)</div>
                                  </div>
                                </div>

                                {/* Room Sub-Items Rows */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  {room.items.map((item, itemIdx) => {
                                    const descriptionLines = (item.description || '').split('\n');
                                    const title = descriptionLines[0] || (item as any).name || 'Work Item';
                                    const bullets = descriptionLines.slice(1).filter((b: string) => b.trim().length > 0);
                                    const itemAmount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);

                                    return (
                                      <div
                                        key={item.id || itemIdx}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          padding: '12px 16px',
                                          borderBottom: '1px solid #EDE4D4',
                                          background: itemIdx % 2 === 0 ? '#FAF6EE' : '#FAF6EE'
                                        }}
                                      >
                                        <div style={{ width: showHsnColumn ? '45%' : '54%' }}>
                                          <div style={{ fontWeight: 700, color: '#3E2B1D', fontSize: '0.83rem' }}>{title}</div>
                                          {bullets.length > 0 && (
                                            <div style={{ marginTop: '3px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                              {bullets.map((b: string, i: number) => (
                                                <div key={i} style={{ fontSize: '0.73rem', color: '#6B5F52', lineHeight: '1.4', display: 'flex', gap: '5px' }}>
                                                  <span style={{ color: 'var(--color-primary-gold)', flexShrink: 0 }}>•</span>
                                                  <span>{b}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>

                                        {showHsnColumn && (
                                          <div style={{ width: '9%', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.76rem', color: '#6B5F52' }}>
                                            {item.hsn || '9403'}
                                          </div>
                                        )}

                                        <div style={{ width: '8%', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#4A3C31' }}>
                                          {item.quantity}
                                        </div>

                                        <div style={{ width: '10%', textAlign: 'center', fontSize: '0.76rem', color: '#6B5F52' }}>
                                          {item.unit || 'Lot'}
                                        </div>

                                        <div style={{ width: '14%', textAlign: 'right', fontSize: '0.8rem', fontFamily: 'monospace', color: '#5A4C3F' }}>
                                          {Number(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </div>

                                        <div style={{ width: '14%', textAlign: 'right', fontSize: '0.84rem', fontFamily: 'monospace', fontWeight: 700, color: '#6A4A2D' }}>
                                          {itemAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Inclusions & Exclusions Section (2 Columns with vertical divider) */}
                                {(rawInclusions.length > 0 || rawExclusions.length > 0) && (
                                  <div
                                    style={{
                                      padding: '14px 16px',
                                      background: '#FAF6EE',
                                      borderBottom: '1px solid #E5DAC4',
                                      display: 'grid',
                                      gridTemplateColumns: rawInclusions.length > 0 && rawExclusions.length > 0 ? '1fr 1fr' : '1fr',
                                      gap: '20px'
                                    }}
                                  >
                                    {/* Inclusions Column */}
                                    {rawInclusions.length > 0 && (
                                      <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1B7A43', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                                          INCLUSIONS
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                          {rawInclusions.map((inc: string, i: number) => (
                                            <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '0.73rem', color: '#4A3C31', lineHeight: '1.4' }}>
                                              <span style={{ color: '#1B7A43', fontWeight: 700, flexShrink: 0 }}>✓</span>
                                              <span>{inc}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Exclusions Column */}
                                    {rawExclusions.length > 0 && (
                                      <div style={rawInclusions.length > 0 ? { borderLeft: '1px solid #E2D7C2', paddingLeft: '20px' } : undefined}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#C0392B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                                          EXCLUSIONS
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                          {rawExclusions.map((exc: string, i: number) => (
                                            <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '0.73rem', color: '#4A3C31', lineHeight: '1.4' }}>
                                              <span style={{ color: '#C0392B', fontWeight: 700, flexShrink: 0 }}>✕</span>
                                              <span>{exc}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Bottom Room Footer Row (Room Title + Subtotal) */}
                                <div
                                  style={{
                                    padding: '12px 16px',
                                    background: '#FAF6EE',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <span
                                    style={{
                                      fontFamily: "var(--font-heading, 'Playfair Display', serif)",
                                      fontSize: '0.88rem',
                                      letterSpacing: '1.4px',
                                      fontWeight: 600,
                                      color: '#433022',
                                      textTransform: 'uppercase'
                                    }}
                                  >
                                    {(room.roomName || room.name || `Room ${rIdx + 1}`).toUpperCase()}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '1.15rem',
                                      fontWeight: 800,
                                      color: '#2E1F14',
                                      fontVariantNumeric: 'tabular-nums',
                                      fontFamily: 'monospace'
                                    }}
                                  >
                                    ₹{roomSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* FLAT MATERIALS & SERVICES TABLE (LUXURY ESPACIO CARD) */
                        <div
                          className="luxury-table-card"
                          style={{
                            marginTop: '16px',
                            border: '1px solid #DFD5C4',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#FAF6EE',
                            boxShadow: '0 2px 6px rgba(78, 51, 27, 0.04)'
                          }}
                        >
                          {/* Top Header Bar (Espresso Brown Header) */}
                          <div
                            style={{
                              background: '#5C4332',
                              color: '#FFFFFF',
                              padding: '10px 16px 8px 16px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                              <span
                                style={{
                                  fontFamily: "var(--font-heading, 'Playfair Display', serif)",
                                  fontSize: '0.92rem',
                                  letterSpacing: '1.4px',
                                  fontWeight: 600,
                                  color: '#FFFFFF',
                                  textTransform: 'uppercase'
                                }}
                              >
                                {quotationType === 'MATERIAL' ? 'MATERIALS & HARDWARE SPECIFICATIONS' : 'DESIGN SPECIFICATIONS & WORK ITEMS'}
                              </span>
                              <div
                                style={{
                                  fontSize: '0.67rem',
                                  color: '#EDE3D2',
                                  border: '1px solid rgba(255, 255, 255, 0.22)',
                                  background: 'rgba(0, 0, 0, 0.22)',
                                  padding: '2px 10px',
                                  borderRadius: '4px',
                                  letterSpacing: '0.2px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {((invoice.items && invoice.items.length) || (activeItems && activeItems.length) || 0)} Line Items
                              </div>
                            </div>

                            {/* Table Column Headers Bar */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginTop: '10px',
                                paddingTop: '6px',
                                borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                letterSpacing: '0.8px',
                                color: '#E0D0BE',
                                textTransform: 'uppercase'
                              }}
                            >
                              <div style={{ width: '5%', textAlign: 'center' }}>S.NO</div>
                              <div style={{ width: showHsnColumn ? '45%' : '53%' }}>MATERIAL / ITEM DESCRIPTION</div>
                              {showHsnColumn && <div style={{ width: '8%', textAlign: 'center' }}>HSN</div>}
                              <div style={{ width: '8%', textAlign: 'center' }}>QTY</div>
                              <div style={{ width: '10%', textAlign: 'center' }}>UNIT</div>
                              <div style={{ width: '14%', textAlign: 'right' }}>RATE (₹)</div>
                              <div style={{ width: '15%', textAlign: 'right' }}>AMOUNT (₹)</div>
                            </div>
                          </div>

                          {/* Material Line Items Rows */}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {((invoice.items && invoice.items.length > 0)
                              ? invoice.items
                              : (activeItems && activeItems.length > 0)
                                ? activeItems
                                : INITIAL_MATERIAL_ITEMS
                            ).map((item, idx) => {
                              const descriptionLines = (item.description || '').split('\n');
                              const title = descriptionLines[0] || (item as any).name || (quotationType === 'MATERIAL' ? 'Material Item' : 'Service Item');
                              const bullets = descriptionLines.slice(1).filter((b: string) => b.trim().length > 0);
                              const qty = Number(item.quantity) || 1;
                              const rate = Number(item.rate) || 0;
                              const itemAmount = (Number(item.amount) || Number((qty * rate).toFixed(2)) || 0);

                              return (
                                <div
                                  key={item.id || idx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #EDE4D4',
                                    background: idx % 2 === 0 ? '#FAF6EE' : '#FDFBF7'
                                  }}
                                >
                                  <div style={{ width: '5%', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.76rem', fontWeight: 700, paddingTop: '1px' }}>
                                    {idx + 1}
                                  </div>

                                  <div style={{ width: showHsnColumn ? '45%' : '53%' }}>
                                    <div style={{ fontWeight: 700, color: '#3E2B1D', fontSize: '0.83rem', lineHeight: '1.35' }}>
                                      {title}
                                    </div>
                                    {bullets.length > 0 && (
                                      <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                        {bullets.map((b: string, i: number) => (
                                          <div key={i} style={{ fontSize: '0.73rem', color: '#6B5F52', lineHeight: '1.4', display: 'flex', gap: '5px' }}>
                                            <span style={{ color: 'var(--color-primary-gold)', flexShrink: 0 }}>•</span>
                                            <span>{b}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {showHsnColumn && (
                                    <div style={{ width: '8%', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.76rem', color: '#6B5F52', paddingTop: '1px' }}>
                                      {item.hsn || (quotationType === 'MATERIAL' ? '4412' : '9403')}
                                    </div>
                                  )}

                                  <div style={{ width: '8%', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#4A3C31', paddingTop: '1px' }}>
                                    {qty}
                                  </div>

                                  <div style={{ width: '10%', textAlign: 'center', fontSize: '0.76rem', color: '#6B5F52', paddingTop: '1px' }}>
                                    {item.unit || (quotationType === 'MATERIAL' ? 'Sheets' : 'Unit')}
                                  </div>

                                  <div style={{ width: '14%', textAlign: 'right', fontSize: '0.8rem', fontFamily: 'monospace', color: '#5A4C3F', paddingTop: '1px' }}>
                                    {rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </div>

                                  <div style={{ width: '15%', textAlign: 'right', fontSize: '0.84rem', fontFamily: 'monospace', fontWeight: 700, color: '#6A4A2D', paddingTop: '1px' }}>
                                    {itemAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* MILESTONE-BASED PAYMENT SCHEDULE */}
                      {paymentMilestones && paymentMilestones.length > 0 && (
                        <div
                          className="milestones-card"
                          style={{
                            marginTop: '16px',
                            marginBottom: '16px',
                            background: '#FFFFFF',
                            border: '1px solid #E8E0D0',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 1px 4px rgba(78, 51, 27, 0.03)'
                          }}
                        >
                          <div
                            className="milestones-header"
                            style={{
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              color: '#3E2B1D',
                              background: '#FAF6EE',
                              borderBottom: '1px solid #E8E0D0',
                              padding: '10px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}
                          >
                            <span>Payment Schedule (Milestone-Based)</span>
                            <span style={{ fontSize: '0.72rem', color: '#8C7E72', textTransform: 'none', fontWeight: 500 }}>
                              {paymentMilestones.length} {paymentMilestones.length === 1 ? 'Stage' : 'Stages'}
                            </span>
                          </div>
                          <table className="milestones-table" style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#FDFBF7', borderBottom: '1px solid #EDE6D8', textAlign: 'left' }}>
                                <th style={{ padding: '8px 14px', fontWeight: 700, color: '#6A4A2D', width: '38%' }}>Milestone</th>
                                <th style={{ padding: '8px 14px', fontWeight: 700, color: '#6A4A2D', width: '22%' }}>Amount / %</th>
                                <th style={{ padding: '8px 14px', fontWeight: 700, color: '#6A4A2D', width: '40%' }}>Payment Stage / Reference</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paymentMilestones.map((m, mIdx) => (
                                <tr
                                  key={m.id || mIdx}
                                  style={{
                                    borderBottom: mIdx === paymentMilestones.length - 1 ? 'none' : '1px solid #F3EDE2',
                                    background: mIdx % 2 === 1 ? '#FCFAF6' : '#FFFFFF'
                                  }}
                                >
                                  <td style={{ padding: '8px 14px', fontWeight: 600, color: '#3E2B1D' }}>
                                    {m.name || `Milestone ${mIdx + 1}`}
                                  </td>
                                  <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#6A4A2D' }}>
                                    {m.percentage !== undefined && m.percentage !== null
                                      ? `${m.percentage}%`
                                      : m.amount
                                      ? `₹${Number(m.amount).toLocaleString('en-IN')}`
                                      : '—'}
                                  </td>
                                  <td style={{ padding: '8px 14px', color: '#6B5F52', fontSize: '0.75rem' }}>
                                    {m.stage || m.stageRef || 'As per project schedule'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* LOWER ROW: BANKING AND TOTALS */}
                      <div className="lower-sections-container">
                        {/* Left Side: Banking QR & Terms */}
                        <div className="lower-left-column">
                          {/* Banking Details Card — RESTRICTED TO INVOICES & ADVANCE REQUESTS (CHANGE 24) */}
                          {(invoice.mode === 'Tax Invoice' || invoice.mode === 'Bill' || invoice.mode === 'Proforma Invoice' || invoice.mode === 'Cash Bill' || invoice.mode === 'Receipt' || paymentType?.toLowerCase().includes('advance')) && (
                            <div className="payment-banking-card">
                              <div className="qr-section">
                                <div className="qr-code-canvas-container">
                                  {invoice.bank.customQrUrl ? (
                                    <img src={invoice.bank.customQrUrl} alt="Custom Payment QR Code" style={{ width: '90px', height: '90px', objectFit: 'contain' }} />
                                  ) : qrCodeUrl ? (
                                    <img src={qrCodeUrl} alt="UPI Payment QR Code" style={{ width: '90px', height: '90px' }} />
                                  ) : (
                                    <div style={{ width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Loader2 className="spinner" style={{ animation: 'rotate 1s linear infinite' }} />
                                    </div>
                                  )}
                                </div>
                                <span className="qr-scan-text">Scan to Pay</span>
                              </div>

                              <div className="bank-info-section">
                                <h4 className="bank-info-title">
                                  <Building size={12} />
                                  Banking Details
                                </h4>
                                <div className="bank-info-grid">
                                  <span className="bank-info-lbl">Bank</span>
                                  <span className="bank-info-val">{invoice.bank.bankName}</span>

                                  <span className="bank-info-lbl">Holder</span>
                                  <span className="bank-info-val">{invoice.bank.accountHolder}</span>

                                  <span className="bank-info-lbl">Account</span>
                                  <span className="bank-info-val">{invoice.bank.accountNumber}</span>

                                  <span className="bank-info-lbl">IFSC Code</span>
                                  <span className="bank-info-val" style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                                    {invoice.bank.ifsc}
                                  </span>

                                  <span className="bank-info-lbl">Branch</span>
                                  <span className="bank-info-val">{invoice.bank.branch}</span>

                                  <span className="bank-info-lbl">UPI ID</span>
                                  <span className="bank-info-val" style={{ color: 'var(--color-primary-gold)', fontWeight: 600 }}>
                                    {invoice.bank.upiId}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Notes Card */}
                          <div
                            style={{
                              background: '#FAF6EE',
                              border: '1px solid #DFD5C4',
                              borderRadius: '16px',
                              padding: '16px 20px',
                              boxShadow: '0 1px 4px rgba(78, 51, 27, 0.02)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                color: '#6A4A2D',
                                textTransform: 'uppercase',
                                letterSpacing: '0.8px'
                              }}
                            >
                              NOTES
                            </span>
                            <p
                              style={{
                                margin: 0,
                                fontSize: '0.82rem',
                                color: '#645A50',
                                lineHeight: '1.45'
                              }}
                            >
                              {invoice.notes || 'Thank you for choosing Espacio Interiors. We appreciate your trust. We look forward to creating timeless interiors.'}
                            </p>
                          </div>

                          {/* Remaining Balance Card */}
                          <div
                            style={{
                              background: '#FAF4E8',
                              border: '1.5px dashed #D6B98D',
                              borderRadius: '14px',
                              padding: '16px 20px',
                              boxShadow: '0 1px 4px rgba(78, 51, 27, 0.02)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  color: '#6A4A2D',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.8px'
                                }}
                              >
                                REMAINING BALANCE
                              </span>
                              <span
                                style={{
                                  fontSize: '0.64rem',
                                  fontWeight: 700,
                                  background: '#5C4332',
                                  color: '#FFFFFF',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  letterSpacing: '0.4px',
                                  textTransform: 'uppercase'
                                }}
                              >
                                BALANCE DUE
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: '1.35rem',
                                fontWeight: 800,
                                fontFamily: 'monospace',
                                color: '#2E1F14',
                                marginTop: '4px',
                                lineHeight: 1.2
                              }}
                            >
                              ₹{remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            <div
                              style={{
                                fontSize: '0.84rem',
                                fontStyle: 'italic',
                                fontFamily: "var(--font-heading, 'Playfair Display', serif)",
                                color: '#6A5A4C',
                                marginTop: '2px',
                                lineHeight: 1.35
                              }}
                            >
                              {remainingBalanceWords}
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Totals Summary & Words */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '310px', flexShrink: 0 }}>
                          {/* Luxury Quotation Summary Card */}
                          <div
                            style={{
                              background: '#FAF6EE',
                              border: '1.5px solid #DFD2BE',
                              borderTop: '3.5px solid #C89B3C',
                              borderRadius: '16px',
                              padding: '16px 20px',
                              boxShadow: '0 2px 8px rgba(78, 51, 27, 0.04)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}
                          >
                            {/* Card Title */}
                            <div
                              style={{
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                color: '#6A4A2D',
                                textTransform: 'uppercase',
                                letterSpacing: '0.8px',
                                marginBottom: '6px'
                              }}
                            >
                              QUOTATION SUMMARY
                            </div>

                            {/* Room by Room Breakdown (for Complete Interiors) */}
                            {isRoomWiseMode && (
                              <>
                                {rooms.map((room, rIdx) => {
                                  const roomSub = getRoomSubtotal(room);
                                  return (
                                    <div
                                      key={room.id || rIdx}
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '0.78rem',
                                        color: '#3E2B1D',
                                        padding: '2px 0'
                                      }}
                                    >
                                      <span style={{ fontWeight: 500 }}>{room.roomName || room.name || `Room ${rIdx + 1}`}</span>
                                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                        ₹{roomSub.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  );
                                })}

                                {/* Dashed Separator */}
                                <div style={{ borderTop: '1px dashed #D6CEBE', margin: '4px 0 2px 0' }} />
                              </>
                            )}

                            {/* Subtotal */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: '#4A3C31',
                                padding: '2px 0'
                              }}
                            >
                              <span>Subtotal</span>
                              <span style={{ fontFamily: 'monospace' }}>
                                ₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            {/* Discount Total */}
                            {totals.discountTotal > 0 && (
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.78rem',
                                  color: '#C0392B',
                                  padding: '1px 0'
                                }}
                              >
                                <span>Discount {discountType === 'PERCENTAGE' ? `(${overallDiscount}%)` : ''}</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                  -₹{totals.discountTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}

                            {/* GST Breakdown if active */}
                            {gstRate > 0 && (
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.78rem',
                                  color: '#6A5644',
                                  padding: '1px 0'
                                }}
                              >
                                <span>GST ({gstRate}%)</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                  +₹{(totals.cgst + totals.sgst + totals.igst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}

                            {/* Solid Divider */}
                            <div style={{ borderTop: '1.5px solid #D6CEBE', margin: '6px 0' }} />

                            {/* Grand Total Row */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '2px 0'
                              }}
                            >
                              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#5C4332' }}>Grand Total</span>
                              <span
                                style={{
                                  fontSize: '1.15rem',
                                  fontWeight: 800,
                                  color: '#B58728',
                                  fontFamily: 'monospace',
                                  letterSpacing: '0.2px'
                                }}
                              >
                                ₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            {/* Confirmation Fee / Advance Payment */}
                            {(Number(currentPayment) || Number(invoice.advancePaid) || 0) > 0 && (
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  color: '#5A4A3C',
                                  paddingTop: '4px'
                                }}
                              >
                                <span>{paymentType && paymentType !== 'UPI' && paymentType !== 'CASH' && paymentType !== 'BANK_TRANSFER' && paymentType !== 'CHEQUE' && paymentType !== 'CREDIT_CARD' ? paymentType : 'Confirmation Fee'}</span>
                                <span style={{ fontFamily: 'monospace', color: '#4A3C31' }}>
                                  -₹{(Number(currentPayment) || Number(invoice.advancePaid) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}

                            {/* Previous Realized Payments if any */}
                            {previousPayments > 0 && (
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.78rem',
                                  color: '#5A4A3C',
                                  paddingTop: '2px'
                                }}
                              >
                                <span>Previous Payments</span>
                                <span style={{ fontFamily: 'monospace', color: '#4A3C31' }}>
                                  -₹{previousPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Amount in Words Card */}
                          <div
                            style={{
                              background: '#F5EFE4',
                              border: '1px solid #E5DAC4',
                              borderRadius: '14px',
                              padding: '12px 18px',
                              boxShadow: '0 1px 3px rgba(78, 51, 27, 0.02)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px'
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: '#8C7E6E',
                                textTransform: 'uppercase',
                                letterSpacing: '0.8px'
                              }}
                            >
                              AMOUNT IN WORDS
                            </div>
                            <div
                              style={{
                                fontFamily: "var(--font-heading, 'Playfair Display', serif)",
                                fontStyle: 'italic',
                                fontSize: '0.88rem',
                                color: '#5A4A3C',
                                lineHeight: 1.35
                              }}
                            >
                              {amountWords}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* LOWER TERMS AND SIGNATURE FOOTER */}
                      <div className="invoice-footer-container">
                        {/* Dynamic Terms Section (Numbered list reflecting Super Admin edits) */}
                        <div className="terms-section">
                          <span className="terms-title">Standard Terms & Conditions</span>
                          <ol className="terms-list">
                            {terms.map((term, i) => (
                              <li key={i}>{term}</li>
                            ))}
                          </ol>
                        </div>

                        {/* Warranty & Support Contact (Replacing Repetitive Marketing Boxes) */}
                        <div className="footer-features-row">
                          <div className="footer-feature-card">
                            <span className="footer-feature-title">Warranty Coverage:</span>
                            <span className="footer-feature-desc">{warrantyInfo}</span>
                          </div>
                          <div className="footer-feature-card">
                            <span className="footer-feature-title">Post-Project Support:</span>
                            <span className="footer-feature-desc">{supportContact}</span>
                          </div>
                        </div>

                        {/* Bottom Row: Message & Signature */}
                        <div className="footer-bottom-row">
                          <div className="thank-you-sign">
                            <span className="thank-you-headline">Thank you for trusting Espacio.</span>
                            <span className="thank-you-subline">DESIGNING SPACES, DEFINING LIFESTYLES</span>
                          </div>

                          {/* Authorized Signature & Stamp Section (Stamp placed directly on the signature line) */}
                          <div className="authorized-signature-container" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                            {/* Authorized Signatory Line & Label with Stamp Overlaid on the Line */}
                            <div className="authorized-signature-block" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '160px' }}>
                              <div
                                className="signature-placeholder"
                                style={{
                                  minHeight: '75px',
                                  width: '160px',
                                  position: 'relative',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderBottom: '1px solid var(--color-secondary-brown, #6A4A2D)'
                                }}
                              >
                                {/* Official Company Stamp Placed on the Line */}
                                {showSignature ? (
                                  <div
                                    className="official-stamp-block"
                                    style={{
                                      position: 'absolute',
                                      bottom: '-12px',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      pointerEvents: 'none',
                                    }}
                                  >
                                    <img
                                      src="/stamp.png"
                                      alt="Official Espacio Seal"
                                      style={{
                                        maxHeight: '88px',
                                        maxWidth: '88px',
                                        objectFit: 'contain',
                                        opacity: 0.95,
                                        display: 'block',
                                      }}
                                    />
                                  </div>
                                ) : null}
                              </div>
                              <span
                                className="signature-label"
                                style={{
                                  textAlign: 'center',
                                  width: '100%',
                                  display: 'block',
                                  marginTop: '6px',
                                  fontFamily: 'var(--font-accent, inherit)',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  color: 'var(--color-secondary-brown, #6A4A2D)',
                                  letterSpacing: '0.5px'
                                }}
                              >
                                Authorized Signatory
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </>
              );
            })()}
          </div>
        </main>
      </div>

      {/* --- FLOATING MODALS --- */}
      <AiDescriptionModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        itemName={aiTargetItemName}
        onApply={handleApplyAiDescription}
      />

      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        invoiceNumber={invoice.invoiceNumber}
        clientName={invoice.client.name}
        clientEmail={invoice.client.email}
        grandTotal={totals.grandTotal}
      />

      <WhatsAppModal
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        invoiceNumber={invoice.invoiceNumber}
        clientName={invoice.client.name}
        clientPhone={invoice.client.phone}
        grandTotal={totals.grandTotal}
        documentTitle={displayDocumentTitle}
        paymentType={paymentType}
        currentPayment={Number(currentPayment) || 0}
        remainingBalance={remainingBalance}
        onSentSuccess={(withSignature, phone) => {
          setSaveSuccessMsg(`Quotation sent via WhatsApp to ${phone} (${withSignature ? 'with signature' : 'without signature'})`);
          setTimeout(() => setSaveSuccessMsg(''), 4000);
        }}
      />

      <GoogleDriveModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        invoiceNumber={invoice.invoiceNumber}
      />

      {/* --- POST-GENERATION SUCCESS ACTION MODAL --- */}
      {isSuccessModalOpen && savedQuoteData && (
        <div className="modal-luxury-overlay" onClick={() => setIsSuccessModalOpen(false)}>
          <div className="modal-luxury-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-luxury-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div />
              <button
                type="button"
                className="modal-luxury-close"
                onClick={() => setIsSuccessModalOpen(false)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-luxury-body" style={{ paddingTop: 0 }}>
              <div className="success-modal-hero">
                <div className="success-icon-badge">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="success-title">Quotation Generated Successfully</h3>
                <p className="success-subtitle">
                  Document <strong>{savedQuoteData.referenceNo}</strong> is saved centrally in Quotation Management and linked to the {savedQuoteData.quotationType === 'PROJECT' ? 'Project' : 'Lead'} profile.
                </p>
              </div>

              <div className="generation-meta-box">
                <div className="generation-meta-item">
                  <span className="generation-meta-lbl">Quotation ID</span>
                  <span className="generation-meta-val" style={{ fontFamily: 'var(--font-mono)' }}>{savedQuoteData.referenceNo}</span>
                </div>
                <div className="generation-meta-item">
                  <span className="generation-meta-lbl">Type</span>
                  <span className="generation-meta-val">{savedQuoteData.quotationType} QUOTATION</span>
                </div>
                <div className="generation-meta-item">
                  <span className="generation-meta-lbl">Client / Buyer</span>
                  <span className="generation-meta-val">{savedQuoteData.clientName}</span>
                </div>
                <div className="generation-meta-item">
                  <span className="generation-meta-lbl">Final Amount</span>
                  <span className="generation-meta-val" style={{ color: 'var(--color-primary-gold)' }}>₹{savedQuoteData.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="generation-actions-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-action-large btn-action-large-print"
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    setTimeout(() => handlePrint(), 250);
                  }}
                >
                  <Printer size={16} />
                  <span>1. Print</span>
                </button>

                <button
                  type="button"
                  className="btn-action-large btn-action-large-whatsapp"
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    setWhatsappModalOpen(true);
                  }}
                >
                  <MessageSquare size={16} />
                  <span>2. WhatsApp</span>
                </button>

                <button
                  type="button"
                  className="btn-action-large btn-action-large-payment"
                  style={{
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    borderColor: '#059669',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px 8px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    setIsRecordPaymentModalOpen(true);
                  }}
                >
                  <CreditCard size={18} />
                  <span>3. Record Payment</span>
                </button>
              </div>
            </div>

            <div className="modal-luxury-footer" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  if (onSaveComplete) onSaveComplete();
                }}
              >
                Continue in Studio / View Quotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- RECORD CLIENT PAYMENT MODAL (METHOD 1: FROM QUOTATION) --- */}
      <RecordPaymentModal
        isOpen={isRecordPaymentModalOpen}
        onClose={() => setIsRecordPaymentModalOpen(false)}
        onSuccess={() => {
          setSaveSuccessMsg('Payment recorded successfully!');
          setTimeout(() => setSaveSuccessMsg(''), 4000);
        }}
        initialQuotationId={savedQuoteData?.id || quotationId || invoice.id}
        initialQuotationRef={savedQuoteData?.referenceNo || invoice.invoiceNumber}
        initialQuotationTitle={customTitle || invoice.project.name}
        initialAmount={
          totals.grandTotal - (Number(previousPayments) || 0) > 0
            ? totals.grandTotal - (Number(previousPayments) || 0)
            : totals.grandTotal
        }
        initialProjectId={selectedProjectId || invoice.projectId}
        initialLeadId={selectedLeadId || invoice.leadId}
        initialClientId={invoice.clientId}
        initialPaymentType={paymentType}
      />

      {/* --- ADD PERSON MANUALLY / AUTO-CREATE LEAD MODAL --- */}
      {isAddPersonModalOpen && (
        <div className="modal-luxury-overlay" onClick={() => setIsAddPersonModalOpen(false)}>
          <div className="modal-luxury-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-luxury-header">
              <h3>
                <UserPlus size={18} style={{ color: 'var(--color-primary-gold)' }} />
                <span>Register New Lead &amp; Connect Quotation</span>
              </h3>
              <button
                type="button"
                className="modal-luxury-close"
                onClick={() => setIsAddPersonModalOpen(false)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateManualPerson}>
              <div className="modal-luxury-body">
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  This will register a new lead in <strong>Lead Management</strong>, generate a unique Lead ID (<code>L-2026-XXXX</code>), and automatically prefill this quotation.
                </p>

                <div className="form-grid">
                  <div className="input-group">
                    <span className="input-label">
                      Client / Contact Name <span style={{ color: 'var(--color-cancelled)' }}>*</span>
                    </span>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Ramesh Varma"
                      required
                      value={addPersonForm.clientName}
                      onChange={(e) => setAddPersonForm({ ...addPersonForm, clientName: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <span className="input-label">
                      Phone Number <span style={{ color: 'var(--color-cancelled)' }}>*</span>
                    </span>
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="e.g. +91 98855 12345"
                      required
                      value={addPersonForm.phone}
                      onChange={(e) => setAddPersonForm({ ...addPersonForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="input-group">
                    <span className="input-label">Email Address</span>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="e.g. ramesh@gmail.com"
                      value={addPersonForm.email}
                      onChange={(e) => setAddPersonForm({ ...addPersonForm, email: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <span className="input-label">Location / City</span>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Jubilee Hills, Hyderabad"
                      value={addPersonForm.location}
                      onChange={(e) => setAddPersonForm({ ...addPersonForm, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="input-group">
                    <span className="input-label">Property Type</span>
                    <select
                      className="input-field"
                      value={addPersonForm.propertyTypeKey}
                      onChange={(e) => setAddPersonForm({ ...addPersonForm, propertyTypeKey: e.target.value })}
                    >
                      <option value="APARTMENT_INTERIOR">Apartment Interior (2BHK / 3BHK)</option>
                      <option value="VILLA_INTERIOR">Luxury Villa / Row House</option>
                      <option value="COMMERCIAL_FITOUT">Commercial / Office Fitout</option>
                      <option value="PENTHOUSE">Penthouse / Duplex</option>
                      <option value="MODULAR_KITCHEN">Modular Kitchen &amp; Storage</option>
                      <option value="OTHER">Other Custom Interior</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <span className="input-label">Lead Source</span>
                    <select
                      className="input-field"
                      value={addPersonForm.sourceKey}
                      onChange={(e) => setAddPersonForm({ ...addPersonForm, sourceKey: e.target.value })}
                    >
                      <option value="DIRECT">Direct Studio Walk-in</option>
                      <option value="WEBSITE">Website Inquiry</option>
                      <option value="PHONE">Phone Inquiry</option>
                      <option value="REFERRAL">Client Referral</option>
                      <option value="ARCHITECT">Architect / Designer Referral</option>
                      <option value="SOCIAL">Instagram / Social Media</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="input-group">
                    <span className="input-label">Estimated Budget (₹)</span>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="e.g. 1500000"
                      value={addPersonForm.budget}
                      onChange={(e) => setAddPersonForm({ ...addPersonForm, budget: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <span className="input-label">Interior Requirements</span>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Full Villa woodwork, Italian kitchen &amp; false ceiling"
                      value={addPersonForm.requirement}
                      onChange={(e) => setAddPersonForm({ ...addPersonForm, requirement: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-luxury-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddPersonModalOpen(false)}
                  disabled={isCreatingLead}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreatingLead}
                  style={{ minWidth: '180px' }}
                >
                  {isCreatingLead ? (
                    <>
                      <Loader2 size={14} className="spinner" />
                      <span>Creating Lead...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>Create Lead &amp; Connect</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuotationGeneratorStudio;
