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
  X
} from 'lucide-react';
import type {
  Invoice,
  InvoiceItem,
  InvoiceMode,
  QuotationType,
  ClientInfo,
  ProjectDetails,
  BankDetails,
  CompanyDetails
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
const DEFAULT_COMPANY: CompanyDetails = {
  name: 'Espacio Interiors',
  address: 'Sleek Heights, Floor 4, Jubilee Hills, Road No. 36, Hyderabad, TS - 500033',
  gstin: '36AAAAE1234F1Z9',
  phone: '+91 90000 80000',
  email: 'accounts@espacio.in',
  website: 'www.espaciointeriors.com',
  logoUrl: '/logo.jpg'
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
  'Payment due within specified period.',
  'Materials remain company property until 100% payment receipt.',
  'Warranty applicable as per service level agreement.',
  'GST and statutory levies included where applicable.',
  'Jurisdiction: Courts of Hyderabad, Telangana.'
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
    discount: 5,
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
    discount: 8,
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
    discount: 5,
    gst: 18,
    amount: 38367.72
  },
  {
    id: '2',
    description: '1mm High-Gloss Anti-Fingerprint Laminate (8x4 ft)\nDecorative surface for cabinetry shutters',
    hsn: '3920',
    quantity: 8,
    unit: 'Sheets',
    rate: 1950,
    discount: 0,
    gst: 18,
    amount: 18408
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
    gst: 18,
    amount: 200600
  },
  {
    id: '2',
    description: 'Wardrobe\nSoft close shutters\nLoft storage\nInternal organizers\nMirror panel\nPremium handles',
    hsn: '9403',
    quantity: 1,
    unit: 'Unit',
    rate: 72830.51,
    discount: 0,
    gst: 18,
    amount: 85939.99
  }
];

export interface QuotationStudioProps {
  quotationId?: string;
  leadId?: string;
  initialQuotationType?: QuotationType;
  initialInvoice?: Partial<Invoice>;
  onSaveComplete?: () => void;
  onBack?: () => void;
}

export function QuotationGeneratorStudio({
  quotationId,
  leadId,
  initialQuotationType = 'LEAD',
  initialInvoice,
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
      : (initialInvoice?.advancePaid !== undefined ? initialInvoice.advancePaid : 20000)
  );

  // --- CRM DATA LINKING (Leads & Projects) ---
  const [leadsList, setLeadsList] = useState<Array<{ id: string; referenceNo: string; clientName: string; phone: string; email?: string; location?: string; propertyTypeKey?: string; requirement?: string }>>([]);
  const [projectsList, setProjectsList] = useState<Array<{ id: string; referenceNo: string; title: string; client?: { fullName: string; phone: string; email: string }; siteAddress?: string; stage?: string }>>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leadId || initialInvoice?.leadId || '');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialInvoice?.projectId || '');

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

  // --- INVOICE STATE ---
  const [invoice, setInvoice] = useState<Invoice>({
    id: '1',
    quotationType,
    customTitle: customTitle || (quotationType === 'MATERIAL' ? 'MATERIAL QUOTATION' : 'QUOTATION'),
    paymentType,
    previousPayments,
    currentPayment,
    showSignature,
    mode: 'Quotation',
    invoiceNumber: quotationType === 'MATERIAL' ? 'MAT-2026-0001' : quotationType === 'PROJECT' ? 'PRJ-2026-0001' : 'Q-2026-0001',
    invoiceDate: formatDate(new Date()),
    dueDate: addDays(formatDate(new Date()), 30),
    paymentTerms: '30 Days Net',
    status: 'Pending',
    company: DEFAULT_COMPANY,
    client: CLIENT_PRESETS[0],
    project: PROJECT_PRESETS[0],
    items: quotationType === 'MATERIAL' ? INITIAL_MATERIAL_ITEMS : INITIAL_ITEMS,
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

  // Fetch CRM Leads and Projects for Dynamic Quick-Linking
  useEffect(() => {
    const fetchCrmData = async () => {
      try {
        const [leadsRes, projRes] = await Promise.all([
          fetch('/api/v1/leads?limit=100').catch(() => null),
          fetch('/api/v1/projects?limit=100').catch(() => null)
        ]);
        if (leadsRes && leadsRes.ok) {
          const leadsJson = await leadsRes.json();
          if (leadsJson.success && leadsJson.data?.leads) {
            setLeadsList(leadsJson.data.leads);
          }
        }
        if (projRes && projRes.ok) {
          const projJson = await projRes.json();
          if (projJson.success && projJson.data?.projects) {
            setProjectsList(projJson.data.projects);
          }
        }
      } catch (err) {
        console.warn('Could not load CRM selector lists:', err);
      }
    };
    fetchCrmData();
  }, []);

  // Auto-fetch lead and prefill when leadId is provided (Method 1: From Lead Profile)
  useEffect(() => {
    if (!leadId) return;
    const loadLinkedLead = async () => {
      try {
        const res = await fetch(`/api/v1/leads/${leadId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const l = json.data.lead || json.data;
          setSelectedLeadId(l.id);
          const reqText = `${l.requirement || ''} ${l.propertyTypeKey || ''}`.toLowerCase();
          const isMaterialLead = reqText.includes('material') || initialQuotationType === 'MATERIAL';
          const targetType: QuotationType = isMaterialLead ? 'MATERIAL' : (initialQuotationType || 'LEAD');
          setQuotationType(targetType);
          if (targetType === 'MATERIAL') {
            setCustomTitle('MATERIAL QUOTATION');
          }
          setInvoice((prev) => ({
            ...prev,
            quotationType: targetType,
            customTitle: targetType === 'MATERIAL' ? 'MATERIAL QUOTATION' : prev.customTitle,
            leadId: l.id,
            items: targetType === 'MATERIAL' && prev.items === INITIAL_ITEMS ? INITIAL_MATERIAL_ITEMS : prev.items,
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
  }, [leadId, initialQuotationType]);

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

  // WhatsApp Share Handler
  const handleSendWhatsApp = () => {
    const rawPhone = invoice.client.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (!cleanPhone) {
      alert('Please enter a valid phone number for the client to send via WhatsApp.');
      return;
    }
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const docTitle = (customTitle && customTitle.trim()) ? customTitle.trim() : invoice.mode.toUpperCase();
    const totalPaidVal = (Number(previousPayments) || 0) + (Number(currentPayment) || 0);
    const balanceVal = Math.max(0, totals.grandTotal - totalPaidVal);
    const statusText = balanceVal === 0 ? 'Fully Paid' : totalPaidVal > 0 ? 'Partially Paid' : 'Pending';

    const message = `*ESPACIO — Timeless Interiors*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Document:* ${docTitle}\n` +
      `*Payment Stage:* ${paymentType}\n` +
      `*Quotation Ref:* ${invoice.invoiceNumber}\n` +
      `*Client / Buyer:* ${invoice.client.name}\n` +
      `*Grand Total / Final Amount:* ₹${totals.grandTotal.toLocaleString('en-IN')}\n` +
      `*Current Payment (${paymentType}):* ₹${(Number(currentPayment) || 0).toLocaleString('en-IN')}\n` +
      `*Remaining Balance Due:* ₹${balanceVal.toLocaleString('en-IN')}\n` +
      `*Payment Status:* ${statusText}\n` +
      `*Document Date:* ${invoice.invoiceDate}\n` +
      `*Validity:* ${invoice.dueDate}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Thank you for choosing Espacio Interiors. We look forward to delivering excellence!`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Auto-fetch quotation from API when quotationId is provided
  useEffect(() => {
    if (!quotationId) return;
    const loadQuote = async () => {
      try {
        const res = await fetch(`/api/v1/quotations/${quotationId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const q = json.data;
          const parsedMeta = q.snapshotMetadata || {};
          const loadedType: QuotationType = (q.quotationType || parsedMeta.quotationType || (q.project ? 'PROJECT' : 'LEAD')) as QuotationType;
          const loadedTitle: string = q.customTitle || parsedMeta.customTitle || q.title || 'QUOTATION';
          const loadedShowSig: boolean = parsedMeta.showSignature !== undefined ? parsedMeta.showSignature : true;
          const loadedAdvance: number = Number(q.advancePaid ?? (parsedMeta.advancePaid || (q.totalAmount ? Math.round(q.totalAmount * 0.35) : 0)));
          const loadedPaymentType: string = q.paymentType || parsedMeta.paymentType || 'Advance Payment';
          const loadedPrevPayments: number = Number(q.previousPayments ?? (parsedMeta.previousPayments || 0));
          const loadedCurrentPayment: number = Number(q.currentPayment ?? (parsedMeta.currentPayment !== undefined ? parsedMeta.currentPayment : loadedAdvance));

          setQuotationType(loadedType);
          setCustomTitle(loadedTitle);
          setShowSignature(loadedShowSig);
          setPaymentType(loadedPaymentType);
          setPreviousPayments(loadedPrevPayments);
          setCurrentPayment(loadedCurrentPayment);
          if (q.leadId) setSelectedLeadId(q.leadId);
          if (q.projectId) setSelectedProjectId(q.projectId);

          const loadedTerms = q.termsAndConditions
            ? q.termsAndConditions.split('\n').filter((t: string) => t.trim().length > 0)
            : DEFAULT_TERMS;
          setTerms(loadedTerms);

          setInvoice((prev) => ({
            ...prev,
            id: q.id,
            quotationType: loadedType,
            customTitle: loadedTitle,
            paymentType: loadedPaymentType,
            previousPayments: loadedPrevPayments,
            currentPayment: loadedCurrentPayment,
            showSignature: loadedShowSig,
            mode: 'Quotation',
            invoiceNumber: q.referenceNo || prev.invoiceNumber,
            invoiceDate: q.createdAt ? formatDate(new Date(q.createdAt)) : prev.invoiceDate,
            dueDate: q.validityDate ? formatDate(new Date(q.validityDate)) : addDays(formatDate(new Date()), 30),
            paymentTerms: '30 Days Net',
            status: q.status === 'APPROVED' ? 'Paid' : q.status === 'REJECTED' ? 'Cancelled' : 'Pending',
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
            items: q.items && q.items.length > 0 ? q.items.map((item: any, idx: number) => ({
              id: item.id || String(idx + 1),
              description: item.itemDescription + (item.specifications ? `\n${item.specifications}` : ''),
              hsn: item.hsn || (loadedType === 'MATERIAL' ? '4412' : '9403'),
              quantity: item.quantity || 1,
              unit: item.unitKey || (loadedType === 'MATERIAL' ? 'Sheets' : 'Unit'),
              rate: item.unitRate || 0,
              discount: item.discountAmount ? Number(((item.discountAmount / ((item.quantity || 1) * (item.unitRate || 1))) * 100).toFixed(1)) : 0,
              gst: q.taxRate || 18,
              amount: item.totalAmount || ((item.quantity || 1) * (item.unitRate || 0))
            })) : prev.items,
            advancePaid: loadedCurrentPayment,
            terms: loadedTerms,
            notes: q.notes || prev.notes
          }));
        }
      } catch (err) {
        console.error('Failed to load quotation for studio:', err);
      }
    };
    loadQuote();
  }, [quotationId]);

  // Sync terms to invoice
  useEffect(() => {
    setInvoice((prev) => ({ ...prev, terms }));
  }, [terms]);

  // Sync custom title, signature, payment engine values to invoice
  useEffect(() => {
    setInvoice((prev) => ({
      ...prev,
      customTitle,
      showSignature,
      quotationType,
      paymentType,
      previousPayments: Number(previousPayments) || 0,
      currentPayment: Number(currentPayment) || 0,
      advancePaid: Number(currentPayment) || 0
    }));
  }, [customTitle, showSignature, quotationType, paymentType, previousPayments, currentPayment]);

  // --- DERIVED FINANCIAL & PAYMENT ENGINE CALCULATIONS ---
  const totals = calculateTotals(invoice.items, invoice.advancePaid, true);
  const amountWords = amountToWords(totals.grandTotal);
  const totalPaid = (Number(previousPayments) || 0) + (Number(currentPayment) || 0);
  const remainingBalance = Math.max(0, totals.grandTotal - totalPaid);
  const maxAllowablePayment = Math.max(0, totals.grandTotal - (Number(previousPayments) || 0));
  const isOverpaid = (Number(currentPayment) || 0) > maxAllowablePayment;
  const paymentStatus = remainingBalance === 0 ? 'Fully Paid' : totalPaid > 0 ? 'Partially Paid' : 'Pending';

  // Save Quotation Handler (Unified Dynamic Save)
  const handleSaveQuotation = async () => {
    if (isOverpaid) {
      alert(`Overpayment validation error: Current payment of ₹${(Number(currentPayment) || 0).toLocaleString('en-IN')} exceeds the remaining balance of ₹${maxAllowablePayment.toLocaleString('en-IN')}. Please enter an amount equal to or less than the balance.`);
      return;
    }
    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      const activeTitle = customTitle.trim() || (quotationType === 'MATERIAL' ? 'MATERIAL QUOTATION' : invoice.project.name || `${invoice.client.name} Interior Quotation`);
      const clientSnapshotData = {
        quotationType,
        customTitle: activeTitle,
        paymentType,
        previousPayments: Number(previousPayments) || 0,
        currentPayment: Number(currentPayment) || 0,
        showSignature,
        advancePaid: Number(currentPayment) || 0,
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

      const payload = {
        title: activeTitle,
        customTitle: activeTitle,
        quotationType,
        paymentType,
        previousPayments: Number(previousPayments) || 0,
        currentPayment: Number(currentPayment) || 0,
        showSignature,
        advancePaid: Number(currentPayment) || 0,
        leadId: (quotationType === 'LEAD' || quotationType === 'MATERIAL') ? selectedLeadId || undefined : undefined,
        projectId: quotationType === 'PROJECT' ? selectedProjectId || undefined : undefined,
        notes: invoice.notes,
        termsAndConditions: terms.join('\n'),
        clientSnapshot: JSON.stringify(clientSnapshotData),
        items: invoice.items.map((item, idx) => ({
          room: quotationType === 'MATERIAL' ? 'MATERIALS' : 'LIVING_ROOM',
          category: quotationType === 'MATERIAL' ? 'MATERIAL_SUPPLY' : 'MODULAR_WOODWORK',
          itemType: 'CUSTOM' as const,
          itemDescription: item.description.split('\n')[0] || 'Material Item',
          specifications: item.description.split('\n').slice(1).join('\n') || null,
          quantity: Number(item.quantity) || 1,
          unitKey: 'NOS' as const,
          unitRate: Number(item.rate) || 0,
          discountAmount: Number(item.rate) * (Number(item.discount || 0) / 100) * Number(item.quantity || 1),
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
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [documentScale, setDocumentScale] = useState<number>(1);
  const [canvasHeight, setCanvasHeight] = useState<number>(1160);

  useEffect(() => {
    const handleResize = () => {
      if (previewPanelRef.current) {
        const containerWidth = previewPanelRef.current.clientWidth - 32;
        if (containerWidth < 820 && containerWidth > 0) {
          setDocumentScale(containerWidth / 820);
        } else {
          setDocumentScale(1);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  }, [invoice, terms, showSignature, customTitle, paymentType, currentPayment]);

  // Modals state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTargetItemId, setAiTargetItemId] = useState<string | null>(null);
  const [aiTargetItemName, setAiTargetItemName] = useState<string>('');

  // Accordion state (6 Standard Sections)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    document: true,
    company: false,
    client: true,
    items: true,
    payment: false,
    terms: false
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
    const updatedItems = invoice.items.map((item) => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        const sub = updated.quantity * updated.rate;
        const disc = sub * (updated.discount / 100);
        const taxable = sub - disc;
        const tax = taxable * (updated.gst / 100);
        updated.amount = Number((taxable + tax).toFixed(2));
        return updated;
      }
      return item;
    });
    setInvoice({ ...invoice, items: updatedItems });
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
      gst: 18,
      amount: quotationType === 'MATERIAL' ? 3363 : 53100
    };
    setInvoice({ ...invoice, items: [...invoice.items, newItem] });
  };

  const handleAddMaterialPreset = (preset: typeof MATERIAL_PRESETS[0]) => {
    const newItem: InvoiceItem = {
      id: String(Date.now() + Math.floor(Math.random() * 1000)),
      description: `${preset.name}\n${preset.description}`,
      hsn: preset.hsn,
      quantity: preset.quantity,
      unit: preset.unit,
      rate: preset.rate,
      discount: preset.discount,
      gst: preset.gst,
      amount: 0
    };
    const sub = newItem.quantity * newItem.rate;
    const disc = sub * (newItem.discount / 100);
    const taxable = sub - disc;
    const tax = taxable * (newItem.gst / 100);
    newItem.amount = Number((taxable + tax).toFixed(2));

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
          discount: 5,
          gst: 18,
          amount: 38367.72
        },
        {
          id: String(Date.now() + 2),
          description: '1mm High-Gloss Anti-Fingerprint Laminate (8x4 ft)\nDecorative surface for cabinetry shutters',
          hsn: '3920',
          quantity: 8,
          unit: 'Sheets',
          rate: 1950,
          discount: 0,
          gst: 18,
          amount: 18408
        },
        {
          id: String(Date.now() + 3),
          description: 'Blum Tandembox Soft-Close Runners (500mm)\nHeavy duty 30kg capacity runners',
          hsn: '8302',
          quantity: 6,
          unit: 'Sets',
          rate: 3400,
          discount: 5,
          gst: 18,
          amount: 22863.6
        }
      ];
      setInvoice({ ...invoice, items: [...invoice.items, ...batch] });
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
        gst: 18,
        amount: 76700
      },
      {
        id: String(Date.now() + 2),
        description: 'Master Bedroom Vanity Mirror & Dresser\nLED backlit vanity mirror\nDrawers with velvet organizer\nSoft close Blum runners',
        hsn: '9403',
        quantity: 1,
        unit: 'Unit',
        rate: 38000,
        discount: 0,
        gst: 18,
        amount: 44840
      }
    ];
    setInvoice({ ...invoice, items: [...invoice.items, ...batch] });
  };

  const handleDeleteItem = (id: string) => {
    if (invoice.items.length === 1) return;
    const updated = invoice.items.filter((item) => item.id !== id);
    setInvoice({ ...invoice, items: updated });
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

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    const found = projectsList.find((p) => p.id === projectId);
    if (found) {
      setInvoice((prev) => ({
        ...prev,
        projectId: found.id,
        client: {
          ...prev.client,
          name: found.client?.fullName || prev.client.name,
          phone: found.client?.phone || prev.client.phone,
          email: found.client?.email || prev.client.email,
          address: found.siteAddress || prev.client.address
        },
        project: {
          ...prev.project,
          name: found.title || prev.project.name,
          address: found.siteAddress || prev.project.address,
          stage: found.stage || prev.project.stage
        }
      }));
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
    window.print();
  };

  const loadHtml2Pdf = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).html2pdf) {
        resolve((window as any).html2pdf);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve((window as any).html2pdf);
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  };

  const handleDownloadPdf = async () => {
    setIsPdfLoading(true);
    try {
      const element = document.getElementById('invoice-print-area');
      if (!element) {
        window.print();
        setIsPdfLoading(false);
        return;
      }

      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.zoom = '1';
      clone.style.transform = 'none';
      clone.style.width = '820px';
      clone.style.minWidth = '820px';
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0px';
      document.body.appendChild(clone);

      const html2pdf = await loadHtml2Pdf();
      const filename = `${(customTitle || invoice.mode).replace(/\s+/g, '_')}_${invoice.invoiceNumber}.pdf`;

      const opt = {
        margin: [8, 8, 8, 8],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(clone).save();
      document.body.removeChild(clone);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleExportExcel = () => {
    let csv = `Item,HSN,Quantity,Unit,Rate,Discount %,GST %,Total\n`;
    invoice.items.forEach((item) => {
      const desc = `"${item.description.replace(/"/g, '""')}"`;
      csv += `${desc},${item.hsn},${item.quantity},${item.unit},${item.rate},${item.discount},${item.gst},${item.amount}\n`;
    });
    csv += `\nSubtotal,,,,,,,${totals.subtotal}\n`;
    csv += `Taxable Value,,,,,,,${totals.taxableAmount}\n`;
    csv += `CGST (9%),,,,,,,${totals.cgst}\n`;
    csv += `SGST (9%),,,,,,,${totals.sgst}\n`;
    csv += `Grand Total,,,,,,,${totals.grandTotal}\n`;
    csv += `Advance Paid,,,,,,,${invoice.advancePaid}\n`;
    csv += `Balance Due,,,,,,,${totals.balanceDue}\n`;

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
    if (newTerms === '15 Days Net') days = 15;
    if (newTerms === '45 Days Net') days = 45;
    if (newTerms === 'Immediate Pay') days = 0;

    setInvoice({
      ...invoice,
      paymentTerms: newTerms,
      dueDate: addDays(invoice.invoiceDate, days)
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
        logoUrl: '/logo.jpg'
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

  // Render Document Title dynamically for Preview
  const displayDocumentTitle = (customTitle && customTitle.trim()) ? customTitle.trim() : invoice.mode.toUpperCase();

  return (
    <div className="app-container">
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

        {/* Center: Quotation Type Switcher */}
        <div className="quotation-type-switcher">
          <button
            type="button"
            className={`quotation-type-pill ${quotationType === 'LEAD' ? 'active' : ''}`}
            onClick={() => {
              setQuotationType('LEAD');
              if (!customTitle || customTitle === 'PROJECT QUOTATION' || customTitle === 'MATERIAL QUOTATION') {
                setCustomTitle('QUOTATION');
              }
            }}
            title="Lead Estimation Quotation"
          >
            <User size={12} />
            <span>Lead Quote</span>
          </button>
          <button
            type="button"
            className={`quotation-type-pill ${quotationType === 'PROJECT' ? 'active' : ''}`}
            onClick={() => {
              setQuotationType('PROJECT');
              if (!customTitle || customTitle === 'QUOTATION' || customTitle === 'MATERIAL QUOTATION') {
                setCustomTitle('PROJECT QUOTATION');
              }
            }}
            title="Project Commercial Quotation"
          >
            <FolderOpen size={12} />
            <span>Project Quote</span>
          </button>
          <button
            type="button"
            className={`quotation-type-pill ${quotationType === 'MATERIAL' ? 'active' : ''}`}
            onClick={() => {
              setQuotationType('MATERIAL');
              if (!customTitle || customTitle === 'QUOTATION' || customTitle === 'PROJECT QUOTATION') {
                setCustomTitle('MATERIAL QUOTATION');
              }
            }}
            title="Material Supply Quotation"
          >
            <Package size={12} />
            <span>Material Quote</span>
          </button>
        </div>

        {/* Right: Action Tools & Custom Signature Toggle */}
        <div className="actions-group">
          {/* Custom Signature / Stamp Toggle Header Widget */}
          <div
            className={`signature-toggle-container ${showSignature ? 'is-active' : ''}`}
            title="Toggle authorized signature and stamp visibility on document"
            onClick={() => setShowSignature(!showSignature)}
          >
            <FileCheck size={13} className="signature-toggle-icon" />
            <span className="signature-toggle-label">Stamp / Sign</span>
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

          <button className="btn btn-secondary btn-header-action" onClick={handlePrint} title="Print Quotation">
            <Printer size={14} />
            <span>Print</span>
          </button>

          <button className="btn btn-secondary btn-header-action" onClick={handleDownloadPdf} disabled={isPdfLoading} title="Download PDF Document">
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

          <button
            type="button"
            className="btn btn-whatsapp btn-header-action"
            onClick={handleSendWhatsApp}
            title="Send Quotation Summary via WhatsApp"
          >
            <MessageCircle size={14} />
            <span>WhatsApp</span>
          </button>

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
        </div>
      </header>

      <div className="workspace-area">
        {/* 2. LEFT EDITOR PANEL */}
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
                      <span className="input-label">Document Type / Mode</span>
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
                        <option value="Tax Invoice">Tax Invoice</option>
                        <option value="Quotation">Quotation</option>
                        <option value="Estimate">Estimate</option>
                        <option value="Proforma Invoice">Proforma Invoice</option>
                        <option value="Bill">Bill</option>
                        <option value="Cash Bill">Cash Bill</option>
                        <option value="Purchase Invoice">Purchase Invoice</option>
                        <option value="Credit Note">Credit Note</option>
                        <option value="Debit Note">Debit Note</option>
                        <option value="Receipt">Receipt</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <span className="input-label">Document Number</span>
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
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <span className="input-label">Payment Terms</span>
                      <select
                        className="input-field"
                        value={invoice.paymentTerms}
                        onChange={(e) => handleTermsChange(e.target.value)}
                      >
                        <option value="15 Days Net">15 Days Net</option>
                        <option value="30 Days Net">30 Days Net</option>
                        <option value="45 Days Net">45 Days Net</option>
                        <option value="Immediate Pay">Immediate Pay</option>
                      </select>
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
                      <span className="input-label">Due Date</span>
                      <input
                        type="date"
                        className="input-field"
                        value={invoice.dueDate}
                        onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Company & Brand Profile */}
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

                  <div className="form-grid">
                    <div className="input-group">
                      <span className="input-label">Company Logo</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="input-field"
                          style={{ fontSize: '0.75rem', padding: '6px 8px' }}
                        />
                        {invoice.company.logoUrl !== '/logo.jpg' && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleClearCustomLogo}
                            style={{ padding: '6px 10px', fontSize: '0.72rem', borderColor: 'var(--color-cancelled-border)', color: 'var(--color-cancelled)', whiteSpace: 'nowrap' }}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="input-group">
                      <span className="input-label">Signature / Stamp</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          className="input-field"
                          style={{ fontSize: '0.75rem', padding: '6px 8px' }}
                        />
                        {invoice.company.signatureUrl && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleClearCustomSignature}
                            style={{ padding: '6px 10px', fontSize: '0.72rem', borderColor: 'var(--color-cancelled-border)', color: 'var(--color-cancelled)', whiteSpace: 'nowrap' }}
                          >
                            Clear
                          </button>
                        )}
                      </div>
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
                      {quotationType === 'MATERIAL' ? 'Buyer / Client Profile' : 'Client Profile'}
                    </h4>

                    <div className="form-grid">
                      <div className="input-group">
                        <span className="input-label">Client Name</span>
                        <input
                          type="text"
                          className="input-field"
                          value={invoice.client.name}
                          onChange={(e) => setInvoice({ ...invoice, client: { ...invoice.client, name: e.target.value } })}
                        />
                      </div>

                      <div className="input-group">
                        <span className="input-label">Phone</span>
                        <input
                          type="text"
                          className="input-field"
                          value={invoice.client.phone}
                          onChange={(e) => setInvoice({ ...invoice, client: { ...invoice.client, phone: e.target.value } })}
                        />
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="input-group">
                        <span className="input-label">Email</span>
                        <input
                          type="email"
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

                    <div className="input-group">
                      <span className="input-label">
                        {quotationType === 'MATERIAL' ? 'Delivery / Consignee Address' : 'Billing / Site Address'}
                      </span>
                      <input
                        type="text"
                        className="input-field"
                        value={invoice.client.address}
                        onChange={(e) => setInvoice({ ...invoice, client: { ...invoice.client, address: e.target.value } })}
                      />
                    </div>
                  </div>

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
                          <span className="input-label">Site Address</span>
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
                          <span className="input-label">Expected Completion</span>
                          <input
                            type="date"
                            className="input-field"
                            value={invoice.project.expectedCompletion}
                            onChange={(e) => setInvoice({ ...invoice, project: { ...invoice.project, expectedCompletion: e.target.value } })}
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
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Line Items */}
          <div className={`collapsible-section ${openSections.items ? 'open' : ''}`}>
            <button className="collapsible-header" type="button" onClick={() => toggleSection('items')}>
              <span className="collapsible-header-title">
                <FolderOpen size={16} />
                {quotationType === 'MATERIAL' ? '4. Material Specifications & Line Items' : '4. Design Specifications (Line Items)'}
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

                          <button
                            className="btn-icon"
                            type="button"
                            title="Generate Spec with AI"
                            onClick={() => triggerAiAssistant(item.id, item.description)}
                            style={{ background: 'var(--color-primary-gold-light)', borderColor: 'var(--color-primary-gold)', color: 'var(--color-secondary-brown)', flexShrink: 0 }}
                          >
                            <Sparkles size={14} />
                          </button>
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
                            <select
                              className="input-field"
                              style={{ padding: '6px 8px', fontSize: '0.8rem' }}
                              value={item.unit}
                              onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                            >
                              <option value="Sheets">Sheets</option>
                              <option value="Bags">Bags</option>
                              <option value="Litres">Litres</option>
                              <option value="Kg">Kg</option>
                              <option value="Pcs">Pcs</option>
                              <option value="Boxes">Boxes</option>
                              <option value="Sets">Sets</option>
                              <option value="Mtr">Mtr</option>
                              <option value="Sqft">Sqft</option>
                              <option value="Rft">Rft</option>
                              <option value="Nos">Nos</option>
                              <option value="Unit">Unit</option>
                              <option value="Lumpsum">Lumpsum</option>
                              <option value="Sqmt">Sqmt</option>
                            </select>
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
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span className="input-label" style={{ margin: 0 }}>Disc%:</span>
                              <input
                                type="number"
                                className="input-field"
                                style={{ width: '48px', padding: '4px 6px', fontSize: '0.78rem' }}
                                value={item.discount}
                                onChange={(e) => handleItemChange(item.id, 'discount', Number(e.target.value))}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span className="input-label" style={{ margin: 0 }}>GST:</span>
                              <select
                                className="input-field"
                                style={{ width: '60px', padding: '4px 6px', fontSize: '0.78rem' }}
                                value={item.gst}
                                onChange={(e) => handleItemChange(item.id, 'gst', Number(e.target.value))}
                              >
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                                <option value="12">12%</option>
                                <option value="5">5%</option>
                                <option value="0">0%</option>
                              </select>
                            </div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-secondary-brown)', marginLeft: '6px' }}>
                              ₹{item.amount.toLocaleString('en-IN')}
                            </span>
                          </div>

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
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Payment Engine & Banking Details */}
          <div className={`collapsible-section ${openSections.payment ? 'open' : ''}`}>
            <button className="collapsible-header" type="button" onClick={() => toggleSection('payment')}>
              <span className="collapsible-header-title">
                <CreditCard size={16} />
                5. Payment Engine & Banking Details
              </span>
              <ChevronDown size={16} className="collapsible-chevron" />
            </button>
            {openSections.payment && (
              <div className="collapsible-content">
                <div className="collapsible-content-wrapper">
                  {/* Dynamic Multi-Milestone Payment Engine Box */}
                  <div className="payment-engine-box">
                    <div className="payment-engine-header">
                      <span className="payment-engine-title">Payment Milestone Type</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        Displays directly under the main document title on client quote
                      </span>
                    </div>

                    <div className="payment-type-selector">
                      {['Advance Payment', 'Partial Payment', 'Final Payment'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={`payment-type-tab ${paymentType === t ? 'active' : ''}`}
                          onClick={() => setPaymentType(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <div className="form-grid" style={{ marginTop: '12px' }}>
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
                        <span className="input-label" style={{ fontWeight: 600 }}>
                          Current Payment (₹)
                        </span>
                        <input
                          type="number"
                          className={`input-field ${isOverpaid ? 'input-error' : ''}`}
                          placeholder="0"
                          value={currentPayment}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
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
                        <strong>⚠️ Overpayment Warning:</strong> Current payment of ₹{Number(currentPayment).toLocaleString('en-IN')} exceeds allowable balance of ₹{maxAllowablePayment.toLocaleString('en-IN')}. Please reduce the amount.
                      </div>
                    )}

                    <div className="payment-engine-stats-grid">
                      <div className="payment-stat-card">
                        <span className="payment-stat-lbl">Final Material Amount</span>
                        <span className="payment-stat-val">₹{totals.grandTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="payment-stat-card">
                        <span className="payment-stat-lbl">Previous Payments</span>
                        <span className="payment-stat-val" style={{ color: 'var(--color-primary-gold)' }}>₹{(Number(previousPayments) || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="payment-stat-card">
                        <span className="payment-stat-lbl">Current Payment</span>
                        <span className="payment-stat-val" style={{ color: 'var(--color-success)' }}>₹{(Number(currentPayment) || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="payment-stat-card">
                        <span className="payment-stat-lbl">Total Paid to Date</span>
                        <span className="payment-stat-val">₹{totalPaid.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="payment-stat-card">
                        <span className="payment-stat-lbl">Remaining Balance</span>
                        <span className="payment-stat-val" style={{ color: remainingBalance === 0 ? 'var(--color-success)' : 'var(--color-secondary-brown)', fontWeight: 700 }}>
                          ₹{remainingBalance.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="payment-stat-card">
                        <span className="payment-stat-lbl">Payment Status</span>
                        <span className="payment-stat-val" style={{ color: remainingBalance === 0 ? 'var(--color-success)' : 'var(--color-primary-gold)', fontWeight: 700 }}>
                          {paymentStatus}
                        </span>
                      </div>
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

          {/* Section 6: Standard Terms & Conditions (Fully Editable & Reorderable) */}
          <div className={`collapsible-section ${openSections.terms ? 'open' : ''}`}>
            <button className="collapsible-header" type="button" onClick={() => toggleSection('terms')}>
              <span className="collapsible-header-title">
                <FileCheck size={16} />
                6. Standard Terms & Conditions
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
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* 3. RIGHT PREVIEW PANEL */}
        <main className="preview-panel" ref={previewPanelRef}>
          <div className="preview-container">
            {/* Quick Actions Bar directly above preview */}
            <div className="preview-actions-toolbar">
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

            {/* Visual Indicator of Mode */}
            <div className="invoice-mode-badge-indicator">
              Live Preview • {quotationType} View • {displayDocumentTitle}
            </div>

            {/* Scaler Wrapper for proportional laptop document preview on mobile */}
            <div
              className="invoice-a4-scaler"
              style={documentScale < 1 ? {
                width: `${Math.floor(820 * documentScale)}px`,
                height: `${Math.ceil(canvasHeight * documentScale)}px`,
                overflow: 'hidden'
              } : undefined}
            >
              {/* Actual Print Canvas */}
              <div
                ref={canvasRef}
                className="invoice-a4-canvas anim-fade-in"
                id="invoice-print-area"
                style={documentScale < 1 ? ({
                  '--doc-scale': documentScale,
                  zoom: documentScale
                } as React.CSSProperties) : undefined}
              >
                <div>
                  {/* TOP HEADER SECTION */}
                  <div className="invoice-header-row">
                    {/* Top Left: Logo & Company Address */}
                    <div className="company-info-block">
                      {invoice.company.logoUrl ? (
                        <img
                          src={invoice.company.logoUrl}
                          alt="Espacio Logo"
                          style={{
                            maxHeight: '130px',
                            maxWidth: '240px',
                            objectFit: 'contain',
                            objectPosition: 'left center',
                            marginBottom: '8px',
                            display: 'block',
                            alignSelf: 'flex-start',
                            marginLeft: '-20px'
                          }}
                        />
                      ) : (
                        <div className="company-logo-preview">
                          E<span>SPACIO</span>
                        </div>
                      )}
                      <div className="company-details-text">
                        <p style={{ fontWeight: 600, color: 'var(--color-secondary-brown)' }}>{invoice.company.name}</p>
                        <p style={{ marginTop: '3px' }}>{invoice.company.address}</p>
                        <p style={{ marginTop: '6px' }}><strong>GSTIN:</strong> {invoice.company.gstin}</p>
                        <p><strong>Tel:</strong> {invoice.company.phone} | <strong>Email:</strong> {invoice.company.email}</p>
                        <p><strong>Web:</strong> {invoice.company.website}</p>
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
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-light)', letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '6px', fontWeight: 600 }}>
                        Thank you for your valued business
                      </span>
                    </div>

                    {/* Top Right: Status Card */}
                    <div className="meta-info-card">
                      <div className="meta-info-row">
                        <span className="meta-info-label">Number</span>
                        <span className="meta-info-val">{invoice.invoiceNumber}</span>
                      </div>
                      <div className="meta-info-row">
                        <span className="meta-info-label">Date</span>
                        <span className="meta-info-val">{invoice.invoiceDate}</span>
                      </div>
                      <div className="meta-info-row">
                        <span className="meta-info-label">Due Date</span>
                        <span className="meta-info-val">{invoice.dueDate}</span>
                      </div>
                      <div className="meta-info-row">
                        <span className="meta-info-label">Terms</span>
                        <span className="meta-info-val">{invoice.paymentTerms}</span>
                      </div>
                      <div className="meta-info-row" style={{ alignItems: 'center', marginTop: '4px' }}>
                        <span className="meta-info-label">Status</span>
                        <span className={`status-pill status-${invoice.status.toLowerCase()}`}>
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
                          <span className="info-details-lbl">Client</span>
                          <span className="info-details-val" style={{ color: 'var(--color-secondary-brown)', fontWeight: 700 }}>
                            {invoice.client.name}
                          </span>
                        </div>
                        <div className="info-details-row">
                          <span className="info-details-lbl">Address</span>
                          <span className="info-details-val">{invoice.client.address}</span>
                        </div>
                        <div className="info-details-row">
                          <span className="info-details-lbl">Phone</span>
                          <span className="info-details-val">{invoice.client.phone}</span>
                        </div>
                        <div className="info-details-row">
                          <span className="info-details-lbl">Email</span>
                          <span className="info-details-val">{invoice.client.email}</span>
                        </div>
                        {invoice.client.gstin && (
                          <div className="info-details-row">
                            <span className="info-details-lbl">GSTIN</span>
                            <span className="info-details-val">{invoice.client.gstin}</span>
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
                              {invoice.project.name}
                            </span>
                          </div>
                          <div className="info-details-row">
                            <span className="info-details-lbl">Site Address</span>
                            <span className="info-details-val">{invoice.project.address}</span>
                          </div>
                          <div className="info-details-row">
                            <span className="info-details-lbl">Designer</span>
                            <span className="info-details-val">{invoice.project.designer}</span>
                          </div>
                          <div className="info-details-row">
                            <span className="info-details-lbl">Type / Stage</span>
                            <span className="info-details-val">{invoice.project.type} | {invoice.project.stage}</span>
                          </div>
                          <div className="info-details-row">
                            <span className="info-details-lbl">Completion</span>
                            <span className="info-details-val">{invoice.project.expectedCompletion}</span>
                          </div>
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
                              {invoice.client.requirement || invoice.project.name}
                            </span>
                          </div>
                          <div className="info-details-row">
                            <span className="info-details-lbl">Location</span>
                            <span className="info-details-val">{invoice.client.location || invoice.client.address}</span>
                          </div>
                          <div className="info-details-row">
                            <span className="info-details-lbl">Type</span>
                            <span className="info-details-val">{invoice.project.type || 'Residential Interior'}</span>
                          </div>
                          <div className="info-details-row">
                            <span className="info-details-lbl">Validity</span>
                            <span className="info-details-val">30 Days from issue</span>
                          </div>
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
                              Material & Hardware Supply
                            </span>
                          </div>
                          <div className="info-details-row">
                            <span className="info-details-lbl">Dispatch</span>
                            <span className="info-details-val">Ex-Warehouse Hyderabad</span>
                          </div>
                          <div className="info-details-row">
                            <span className="info-details-lbl">Freight / Tax</span>
                            <span className="info-details-val">Inclusive of statutory GST</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* INVOICE TABLE */}
                  <div className="luxury-table-wrapper">
                    <table className="luxury-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40%' }}>Item & Design Specifications</th>
                          <th style={{ width: '10%' }}>HSN</th>
                          <th style={{ width: '10%', textAlign: 'center' }}>Qty</th>
                          <th style={{ width: '10%' }}>Unit</th>
                          <th style={{ width: '15%', textAlign: 'right' }}>Rate (₹)</th>
                          <th style={{ width: '10%', textAlign: 'right' }}>Disc %</th>
                          <th style={{ width: '10%', textAlign: 'right' }}>GST %</th>
                          <th style={{ width: '15%', textAlign: 'right' }}>Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item) => {
                          const descriptionLines = item.description.split('\n');
                          const title = descriptionLines[0] || 'Interior Work';
                          const bullets = descriptionLines.slice(1);

                          return (
                            <tr key={item.id}>
                              <td className="item-desc-cell">
                                <div className="item-desc-title">{title}</div>
                                {bullets.length > 0 && (
                                  <ul className="item-desc-bullets">
                                    {bullets.map((b, i) => (
                                      <li key={i}>{b}</li>
                                    ))}
                                  </ul>
                                )}
                              </td>
                              <td>{item.hsn}</td>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                              <td style={{ color: 'var(--color-text-muted)' }}>{item.unit}</td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                                {item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td style={{ textAlign: 'right', color: 'var(--color-primary-gold)', fontWeight: 600 }}>
                                {item.discount > 0 ? `${item.discount}%` : '—'}
                              </td>
                              <td style={{ textAlign: 'right' }}>{item.gst}%</td>
                              <td className="amount-cell amount-cell-right">
                                {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* LOWER ROW: BANKING AND TOTALS */}
                  <div className="lower-sections-container">
                    {/* Left Side: Banking QR & Terms */}
                    <div className="lower-left-column">
                      {/* Banking Details Card */}
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

                      {/* Notes Card */}
                      <div className="notes-card">
                        <span className="notes-title">Architectural & Execution Notes</span>
                        <p className="notes-content">{invoice.notes}</p>
                      </div>
                    </div>

                    {/* Right Side: Totals Summary & Words */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Totals Card */}
                      <div className="summary-card">
                        <div className="summary-row">
                          <span>Subtotal</span>
                          <span className="val">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {totals.discountTotal > 0 && (
                          <div className="summary-row" style={{ color: 'var(--color-cancelled)' }}>
                            <span>Discount Deducted</span>
                            <span className="val">-₹{totals.discountTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        <div className="summary-row" style={{ fontWeight: 600 }}>
                          <span>Taxable Value</span>
                          <span className="val">₹{totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="summary-row">
                          <span>CGST (9%)</span>
                          <span className="val">₹{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="summary-row">
                          <span>SGST (9%)</span>
                          <span className="val">₹{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {totals.roundOff !== 0 && (
                          <div className="summary-row">
                            <span>Round Off Adjustment</span>
                            <span className="val">₹{totals.roundOff > 0 ? `+${totals.roundOff}` : totals.roundOff}</span>
                          </div>
                        )}

                        <div className="summary-row grand-total-row">
                          <span>{quotationType === 'MATERIAL' ? 'Final Material Amount' : 'Grand Total'}</span>
                          <span className="val">₹{totals.grandTotal.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="summary-row">
                          <span>{paymentType === 'Advance Payment' ? 'Advance Payment Received' : 'Current Payment'}</span>
                          <span className="val" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                            -₹{(Number(currentPayment) || 0).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="summary-row balance-due-row">
                          <span>Remaining Balance</span>
                          <span className="val">₹{remainingBalance.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Words Card */}
                      <div className="words-card">
                        <div className="words-title">Amount in Words</div>
                        <div className="words-text">{amountWords}</div>
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

                    {/* Three Grid Feature Flags */}
                    <div className="footer-features-row">
                      <div className="footer-feature-card">
                        <span className="footer-feature-title">Quality Assured</span>
                        <span className="footer-feature-desc">Premium Materials | Luxury Finish</span>
                      </div>
                      <div className="footer-feature-card">
                        <span className="footer-feature-title">Custom Solutions</span>
                        <span className="footer-feature-desc">Tailor-made Interiors | Timely Delivery</span>
                      </div>
                      <div className="footer-feature-card">
                        <span className="footer-feature-title">Professional Execution</span>
                        <span className="footer-feature-desc">Timely Delivery | Professional Execution</span>
                      </div>
                    </div>

                    {/* Bottom Row: Message & Signature */}
                    <div className="footer-bottom-row">
                      <div className="thank-you-sign">
                        <span className="thank-you-headline">Thank you for trusting Espacio.</span>
                        <span className="thank-you-subline">Creating Timeless Spaces.</span>
                      </div>

                      {/* Authorized Signature Block (Conditioned by showSignature toggle) */}
                      <div className="authorized-signature-block">
                        <div className="signature-placeholder" style={{ minHeight: '50px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {showSignature ? (
                            invoice.company.signatureUrl ? (
                              <img
                                src={invoice.company.signatureUrl}
                                alt="Authorized Signature"
                                style={{
                                  maxHeight: '44px',
                                  maxWidth: '120px',
                                  objectFit: 'contain',
                                  zIndex: 2,
                                  position: 'relative'
                                }}
                              />
                            ) : (
                              <div className="signature-script">Espacio Studio</div>
                            )
                          ) : (
                            <div className="signature-empty-line">
                              <div className="signature-line-dash" />
                            </div>
                          )}
                        </div>
                        <span className="signature-label">Authorized Signature</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
