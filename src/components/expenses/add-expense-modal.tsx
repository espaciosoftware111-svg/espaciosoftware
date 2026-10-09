"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { X, AlertTriangle, Building2, Plus, Receipt, User, Briefcase, ArrowRight, Info, Coins, CheckCircle2, Truck, ShoppingCart, DollarSign, Package } from "lucide-react";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProjectId?: string;
  initialProjectTitle?: string;
  initialLeadId?: string;
  initialLeadName?: string;
  initialLeadRequirement?: string;
  /** Pre-lock to BUSINESS type when opened via "+ Add Business Expense" */
  initialExpenseType?: "PROJECT" | "BUSINESS" | "MATERIAL" | "PERSONAL";
}

const getTodayLocalDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ─── Business Expense Categories ───────────────────────────────────────────
const BUSINESS_CATEGORIES = [
  { key: "OFFICE_RENT",      label: "Office Rent" },
  { key: "ELECTRICITY",      label: "Electricity & Utilities" },
  { key: "INTERNET",         label: "Internet & Telecom" },
  { key: "MARKETING",        label: "Marketing & Advertising" },
  { key: "SOFTWARE",         label: "Software & Subscriptions" },
  { key: "TRAVEL",           label: "Travel & Accommodation" },
  { key: "OFFICE_SUPPLIES",  label: "Office Supplies & Stationery" },
  { key: "MAINTENANCE",      label: "Maintenance & Repairs" },
  { key: "EQUIPMENT",        label: "Equipment & Machinery" },
  { key: "PETTY_CASH",       label: "Petty Cash Float (Issue Advance)" },
  { key: "SALARIES",         label: "Salaries & Wages" },
  { key: "INSURANCE",        label: "Insurance & Compliance" },
  { key: "LEGAL",            label: "Legal & Professional Fees" },
  { key: "OTHER_BUSINESS",   label: "Other Business Expense" },
];

// ─── Project / Material Default Categories ──────────────────────────────────
const PROJECT_CATEGORIES = [
  { key: "MATERIAL",         label: "Materials / Raw Stock" },
  { key: "TRANSPORT",        label: "Transport & Logistics" },
  { key: "LABOUR",           label: "Labour & Workmanship" },
  { key: "INSTALLATION",     label: "Installation & Fitting" },
  { key: "SUBCONTRACTOR",    label: "Subcontractor / Specialist" },
  { key: "SITE_EXPENSE",     label: "Site Tools & Consumables" },
  { key: "FUEL",             label: "Fuel & Travel" },
  { key: "OTHER",            label: "Other Miscellaneous" },
];

// ─── Assigned Project Subcontractors & Suppliers (Matching Project Workspace Directory) ───
export const PROJECT_PRIMARY_SUPPLIERS = [
  { id: "sup_century_ply", name: "Century Ply", category: "IS:710 Marine Plywood & Blockboards" },
  { id: "sup_greenlam", name: "Greenlam Laminates", category: "1mm High-Gloss & Suede Laminates" },
  { id: "sup_hafele", name: "Hafele Hardware", category: "Blum Hinges, Soft-Close Tandem Channels" },
];

export const PROJECT_TRADE_CONTRACTORS = [
  { id: "con_carcass", name: "Modular Carcass Fabricators", category: "Factory Modular Carcass & Joinery" },
  { id: "con_lam_press", name: "Laminate Pressing Team", category: "Laminate Pressing, Pasting & Post-Forming" },
];

export const ALL_ERP_PRIMARY_SUPPLIERS = [
  ...PROJECT_PRIMARY_SUPPLIERS,
  { id: "sup_saint_gobain", name: "Saint-Gobain Glass", category: "Toughened, Tinted & Fluted Glass, Mirrors" },
  { id: "sup_asian_paints", name: "Asian Paints Royale", category: "Luxury Emulsions, PU Wood Polish & Finishes" },
  { id: "sup_hettich", name: "Hettich Hardware", category: "InnoTech Drawers & Soft-Close Slides" },
  { id: "sup_ebco", name: "Ebco Hardware", category: "Architectural Fittings & Wardrobe Accessories" },
  { id: "sup_merino", name: "Merino Laminates", category: "Specialty, Compact & Matte Laminates" },
  { id: "sup_godrej", name: "Godrej Locks & Hardware", category: "Digital Locks & Architectural Hardware" },
];

export const ALL_ERP_TRADE_CONTRACTORS = [
  ...PROJECT_TRADE_CONTRACTORS,
  { id: "con_edge_band", name: "Edge Banding Unit", category: "PVC & Acrylic Edge Banding (1mm/2mm)" },
  { id: "con_carpentry", name: "Carpentry & Woodwork Crew", category: "Site Assembly, Solid Wood & Joinery" },
  { id: "con_electrical", name: "Electrical & Lighting Team", category: "Concealed Wiring, Profile LEDs & Fixtures" },
  { id: "con_plumbing", name: "Plumbing & Sanitary Works", category: "Plumbing Lines, CP Fittings & Sanitaryware" },
  { id: "con_painting", name: "Painting & Polishing Crew", category: "PU Polish, Wall Primer & Royale Emulsion" },
  { id: "con_false_ceiling", name: "False Ceiling & POP Crew", category: "Gypsum False Ceiling, Cove & Grid POP" },
  { id: "con_countertop", name: "Granite & Countertop Team", category: "Quartz, Granite & Marble Fabrication" },
];

interface LeadVendorSummary {
  vendorId?: string;
  vendorName: string;
  phone?: string;
  purchaseOrderId?: string;
  purchaseOrderRef?: string;
  totalOrderAmount: number;
  paidAmount: number;
  remainingDue: number;
  sourceType: "PURCHASE_ORDER" | "VENDOR_REQUEST" | "GLOBAL_VENDOR";
  lastOrderDate?: string;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProjectId,
  initialProjectTitle,
  initialLeadId,
  initialLeadName,
  initialLeadRequirement,
  initialExpenseType,
}) => {
  const toast = useToast();
  const deriveInitialType = () => {
    if (initialExpenseType) return initialExpenseType;
    if (initialLeadId) return "MATERIAL" as const;
    if (initialProjectId) return "PROJECT" as const;
    return "PROJECT" as const;
  };

  const [expenseType, setExpenseType] = useState<"PROJECT" | "BUSINESS" | "MATERIAL" | "PERSONAL">(
    deriveInitialType()
  );
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [allVendors, setAllVendors] = useState<any[]>([]);
  const [leadVendors, setLeadVendors] = useState<LeadVendorSummary[]>([]);
  const [projectVendors, setProjectVendors] = useState<LeadVendorSummary[]>([]);
  const [showAllGlobalVendors, setShowAllGlobalVendors] = useState(false);
  const [selectedVendorSelection, setSelectedVendorSelection] = useState<string>("");
  const [selectedVendorSummary, setSelectedVendorSummary] = useState<LeadVendorSummary | null>(null);

  // ─── Form fields ────────────────────────────────────────────────────────
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("");
  const [customCategoryLabel, setCustomCategoryLabel] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || "");
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeadId || "");
  const [vendorName, setVendorName] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [purchaseOrderId, setPurchaseOrderId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [expenseDate, setExpenseDate] = useState<string>(getTodayLocalDate());
  const [referenceNoExternal, setReferenceNoExternal] = useState("");
  const [notes, setNotes] = useState("");

  // ─── Petty Cash dedicated workflow state ──────────────────────────────
  const [employees, setEmployees] = useState<any[]>([]);
  const [pettyEmployeeId, setPettyEmployeeId] = useState("");
  const [pettyNewEmpName, setPettyNewEmpName] = useState("");
  const [pettyNewEmpPhone, setPettyNewEmpPhone] = useState("");
  const [pettyNewEmpEmail, setPettyNewEmpEmail] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);

  // ─── Reset form when modal opens ────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setShowDiscardPrompt(false);
      const type = deriveInitialType();
      setExpenseType(type);
      setSelectedCategoryKey(type === "BUSINESS" ? "OFFICE_RENT" : "MATERIAL");
      setCustomCategoryLabel("");
      const effProjectId = initialProjectId || "";
      setSelectedProjectId(effProjectId);
      const effLeadId = initialLeadId || "";
      setSelectedLeadId(effLeadId);
      setShowAllGlobalVendors(false);
      setVendorName("");
      setVendorId("");
      setPurchaseOrderId("");
      setSelectedVendorSelection("");
      setSelectedVendorSummary(null);
      setDescription("");
      setAmount("");
      setPaymentMethod("BANK_TRANSFER");
      setExpenseDate(getTodayLocalDate());
      setReferenceNoExternal("");
      setNotes("");
      setError("");
      setPettyEmployeeId("");
      setPettyNewEmpName("");
      setPettyNewEmpPhone("");
      setPettyNewEmpEmail("");

      fetchPaymentMethods();
      fetchVendors();
      if (!initialProjectId) fetchProjects();
      if (!initialLeadId) fetchLeads();
      fetchEmployees();

      if (effProjectId) {
        fetchProjectVendors(effProjectId);
      }
      if (effLeadId) {
        fetchLeadVendors(effLeadId);
      }
    }
  }, [isOpen]);

  // ─── Fetch project vendors whenever selectedProjectId changes ─────────
  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectVendors(selectedProjectId);
    } else {
      setProjectVendors([]);
    }
  }, [selectedProjectId]);

  // ─── Fetch lead vendors whenever selectedLeadId changes ────────────────
  useEffect(() => {
    if (selectedLeadId) {
      fetchLeadVendors(selectedLeadId);
    } else {
      setLeadVendors([]);
    }
  }, [selectedLeadId]);

  const fetchProjectVendors = async (projId: string) => {
    try {
      const res = await fetch(`/api/v1/projects/${projId}`);
      const json = await res.json();
      if (json.success && json.data) {
        const proj = json.data;
        const summaries: LeadVendorSummary[] = [];
        const projExpenses: any[] = proj.expenses || [];

        // 1. Ingest confirmed purchase orders for this project
        (proj.purchaseOrders || []).forEach((po: any) => {
          const vId = po.vendorId || po.vendor?.id;
          const vName = po.vendor?.name || po.vendorName || po.payee || "Project Supplier";
          const totalOrder = Number(po.grandTotal !== undefined ? po.grandTotal : po.totalAmount || 0);

          // Find expenses paid against this PO or this vendor
          const expPaidForPo = projExpenses
            .filter((e: any) =>
              (e.purchaseOrderId && e.purchaseOrderId === po.id) ||
              (!e.purchaseOrderId && e.vendorName && e.vendorName.trim().toLowerCase() === vName.trim().toLowerCase())
            )
            .filter((e: any) => e.status === "PAID" || e.status === "APPROVED" || !e.status)
            .reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);

          const vpPaid = (po.vendorPayments || [])
            .filter((p: any) => p.status !== "CANCELLED" && p.status !== "REVERSED")
            .reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);

          const paid = Math.max(vpPaid, expPaidForPo, Number(po.paidAmount || (po.status === "DELIVERED" || po.status === "PAID" ? totalOrder : 0)));
          const remainingDue = Math.max(0, totalOrder - paid);

          // Latest date between PO creation and any expense
          let latestDate = po.poDate || po.createdAt;
          projExpenses
            .filter((e: any) => (e.purchaseOrderId && e.purchaseOrderId === po.id) || (e.vendorName && e.vendorName.trim().toLowerCase() === vName.trim().toLowerCase()))
            .forEach((e: any) => {
              const d = e.expenseDate || e.createdAt;
              if (d && (!latestDate || new Date(d) > new Date(latestDate))) {
                latestDate = d;
              }
            });

          summaries.push({
            vendorId: vId,
            vendorName: vName,
            phone: po.vendor?.phone || po.vendorPhone,
            purchaseOrderId: po.id,
            purchaseOrderRef: po.referenceNo,
            totalOrderAmount: totalOrder,
            paidAmount: paid,
            remainingDue,
            sourceType: "PURCHASE_ORDER",
            lastOrderDate: latestDate,
          });
        });

        // 2. Ingest vendors from previous recorded project expenses who don't have a PO
        projExpenses.forEach((exp: any) => {
          const expVName = exp.vendorName || exp.payee;
          if (expVName && !summaries.some((s) => s.vendorName.trim().toLowerCase() === expVName.trim().toLowerCase())) {
            const expAmount = Number(exp.amount) || 0;
            const expPaid = (exp.status === "PAID" || exp.status === "APPROVED" || !exp.status) ? expAmount : 0;
            summaries.push({
              vendorId: exp.vendorId,
              vendorName: expVName,
              totalOrderAmount: expAmount,
              paidAmount: expPaid,
              remainingDue: Math.max(0, expAmount - expPaid),
              sourceType: "GLOBAL_VENDOR",
              lastOrderDate: exp.expenseDate || exp.createdAt,
            });
          }
        });

        // 3. If converted from a lead, ingest lead vendors as well
        if (proj.leadId) {
          try {
            const leadRes = await fetch(`/api/v1/material-leads/${proj.leadId}`);
            const leadJson = await leadRes.json();
            if (leadJson.success && leadJson.data) {
              const lead = leadJson.data.materialLead || leadJson.data;
              (lead.orders || []).forEach((lo: any) => {
                const vName = lo.vendor?.name || "Direct Supplier";
                if (!summaries.some((s) => (lo.id && s.purchaseOrderId === lo.id) || s.vendorName.trim().toLowerCase() === vName.trim().toLowerCase())) {
                  const totalOrder = Number(lo.grandTotal) || 0;
                  summaries.push({
                    vendorId: lo.vendorId || lo.vendor?.id,
                    vendorName: vName,
                    phone: lo.vendor?.phone,
                    purchaseOrderId: lo.id,
                    purchaseOrderRef: lo.referenceNo,
                    totalOrderAmount: totalOrder,
                    paidAmount: 0,
                    remainingDue: totalOrder,
                    sourceType: "PURCHASE_ORDER",
                    lastOrderDate: lo.poDate || lo.createdAt,
                  });
                }
              });
              if (lead.linkedVendor && !summaries.some((s) => s.vendorId === lead.linkedVendor.id)) {
                summaries.push({
                  vendorId: lead.linkedVendor.id,
                  vendorName: lead.linkedVendor.name,
                  phone: lead.linkedVendor.phone,
                  totalOrderAmount: 0,
                  paidAmount: 0,
                  remainingDue: 0,
                  sourceType: "GLOBAL_VENDOR",
                });
              }
            }
          } catch { /* quiet */ }
        }

        setProjectVendors(summaries);

        // Pre-select if single vendor linked to project
        if (summaries.length === 1) {
          const auto = summaries[0];
          const autoKey = auto.purchaseOrderId ? `po_${auto.purchaseOrderId}` : auto.vendorId ? `ven_${auto.vendorId}` : `name_${auto.vendorName}`;
          setSelectedVendorSelection(autoKey);
          setSelectedVendorSummary(auto);
          setVendorId(auto.vendorId || "");
          setPurchaseOrderId(auto.purchaseOrderId || "");
          setVendorName(auto.vendorName);
          if (auto.purchaseOrderRef) {
            setReferenceNoExternal(auto.purchaseOrderRef);
            setDescription(`Material Order Payment: ${auto.purchaseOrderRef} (${auto.vendorName})`);
          } else {
            setDescription(`Material supply payment for ${auto.vendorName}`);
          }
          if (auto.remainingDue > 0) {
            setAmount(String(auto.remainingDue));
          }
        }
      }
    } catch { /* quiet */ }
  };

  const fetchLeadVendors = async (leadId: string) => {
    try {
      let lead: any = null;
      try {
        const res = await fetch(`/api/v1/material-leads/${leadId}`);
        const json = await res.json();
        if (json.success && json.data) {
          lead = json.data.materialLead || json.data.lead || json.data;
        }
      } catch { /* quiet */ }

      if (!lead) {
        try {
          const res = await fetch(`/api/v1/leads/${leadId}`);
          const json = await res.json();
          if (json.success && json.data) {
            lead = json.data.lead || json.data;
          }
        } catch { /* quiet */ }
      }

      if (lead) {
        const summaries: LeadVendorSummary[] = [];
        const leadExpenses: any[] = lead.expenses || [];

        // 1. Ingest confirmed purchase orders / material orders
        (lead.orders || []).forEach((o: any) => {
          const vId = o.vendorId || o.vendor?.id;
          const vName = o.vendor?.name || o.vendorName || o.payee || "Direct Supplier";
          const totalOrder = Number(o.grandTotal !== undefined ? o.grandTotal : o.totalAmount || 0);

          const expPaidForPo = leadExpenses
            .filter((e: any) =>
              (e.purchaseOrderId && e.purchaseOrderId === o.id) ||
              (!e.purchaseOrderId && e.vendorName && e.vendorName.trim().toLowerCase() === vName.trim().toLowerCase())
            )
            .filter((e: any) => e.status === "PAID" || e.status === "APPROVED" || !e.status)
            .reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);

          const vpPaid = (o.vendorPayments || [])
            .filter((p: any) => p.status !== "CANCELLED" && p.status !== "REVERSED")
            .reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);

          const paid = Math.max(vpPaid, expPaidForPo, Number(o.paidAmount || (o.status === "DELIVERED" || o.status === "PAID" ? totalOrder : 0)));
          const remainingDue = Math.max(0, totalOrder - paid);

          let latestDate = o.poDate || o.createdAt;
          leadExpenses
            .filter((e: any) => (e.purchaseOrderId && e.purchaseOrderId === o.id) || (e.vendorName && e.vendorName.trim().toLowerCase() === vName.trim().toLowerCase()))
            .forEach((e: any) => {
              const d = e.expenseDate || e.createdAt;
              if (d && (!latestDate || new Date(d) > new Date(latestDate))) {
                latestDate = d;
              }
            });

          summaries.push({
            vendorId: vId,
            vendorName: vName,
            phone: o.vendor?.phone || o.vendorPhone,
            purchaseOrderId: o.id,
            purchaseOrderRef: o.referenceNo,
            totalOrderAmount: totalOrder,
            paidAmount: paid,
            remainingDue,
            sourceType: "PURCHASE_ORDER",
            lastOrderDate: latestDate,
          });
        });

        // 2. Ingest vendor requests / quotes requested
        (lead.vendorRequests || []).forEach((vr: any) => {
          const vName = vr.vendorName || vr.vendor?.name || "Assigned Supplier";
          const alreadyAdded = summaries.some(
            (s) => s.vendorName.trim().toLowerCase() === vName.trim().toLowerCase()
          );
          if (!alreadyAdded) {
            const finalAmt = Number(vr.finalAmount || vr.estimatedAmount || 0);
            summaries.push({
              vendorId: vr.vendorId || vr.vendor?.id,
              vendorName: vName,
              phone: vr.vendorPhone || vr.vendor?.phone,
              purchaseOrderId: undefined,
              purchaseOrderRef: undefined,
              totalOrderAmount: finalAmt,
              paidAmount: 0,
              remainingDue: finalAmt,
              sourceType: "VENDOR_REQUEST",
            });
          }
        });

        // 3. Ingest assigned / linked vendor on lead
        if (lead.linkedVendor && !summaries.some((s) => s.vendorId === lead.linkedVendor.id)) {
          summaries.push({
            vendorId: lead.linkedVendor.id,
            vendorName: lead.linkedVendor.name,
            phone: lead.linkedVendor.phone,
            totalOrderAmount: 0,
            paidAmount: 0,
            remainingDue: 0,
            sourceType: "GLOBAL_VENDOR",
          });
        }
        if (lead.vendor && !summaries.some((s) => s.vendorName.trim().toLowerCase() === (lead.vendor.name || "").trim().toLowerCase())) {
          summaries.push({
            vendorId: lead.vendor.id,
            vendorName: lead.vendor.name,
            phone: lead.vendor.phone,
            totalOrderAmount: 0,
            paidAmount: 0,
            remainingDue: 0,
            sourceType: "GLOBAL_VENDOR",
          });
        }

        // 4. Ingest past expenses recorded for this lead
        leadExpenses.forEach((exp: any) => {
          const expVName = exp.vendorName || exp.payee;
          if (expVName && !summaries.some((s) => s.vendorName.trim().toLowerCase() === expVName.trim().toLowerCase())) {
            const expAmount = Number(exp.amount) || 0;
            const expPaid = (exp.status === "PAID" || exp.status === "APPROVED" || !exp.status) ? expAmount : 0;
            summaries.push({
              vendorId: exp.vendorId,
              vendorName: expVName,
              totalOrderAmount: expAmount,
              paidAmount: expPaid,
              remainingDue: Math.max(0, expAmount - expPaid),
              sourceType: "GLOBAL_VENDOR",
              lastOrderDate: exp.expenseDate || exp.createdAt,
            });
          }
        });

        setLeadVendors(summaries);

        // If exactly 1 vendor exists for this lead, pre-select it
        if (summaries.length === 1) {
          const auto = summaries[0];
          const autoKey = auto.purchaseOrderId ? `po_${auto.purchaseOrderId}` : auto.vendorId ? `ven_${auto.vendorId}` : `name_${auto.vendorName}`;
          setSelectedVendorSelection(autoKey);
          setSelectedVendorSummary(auto);
          setVendorId(auto.vendorId || "");
          setPurchaseOrderId(auto.purchaseOrderId || "");
          setVendorName(auto.vendorName);
          if (auto.purchaseOrderRef) {
            setReferenceNoExternal(auto.purchaseOrderRef);
            setDescription(`Material Order Payment: ${auto.purchaseOrderRef} (${auto.vendorName})`);
          } else {
            setDescription(`Material supply payment for ${auto.vendorName}`);
          }
          if (auto.remainingDue > 0) {
            setAmount(String(auto.remainingDue));
          }
        }
      }
    } catch { /* quiet */ }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/v1/procurement/vendors?limit=100");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAllVendors(json.data);
      }
    } catch { /* quiet */ }
  };

  const handleVendorSelectionChange = (selectionValue: string) => {
    setSelectedVendorSelection(selectionValue);

    if (!selectionValue || selectionValue === "CUSTOM") {
      setSelectedVendorSummary(null);
      setVendorId("");
      setPurchaseOrderId("");
      if (selectionValue === "CUSTOM") {
        setVendorName("");
      }
      return;
    }

    // 1. Check if matched in projectVendors or leadVendors
    const allActiveLinkedVendors = [...projectVendors, ...leadVendors];
    const matchedLinkedVendor = allActiveLinkedVendors.find((lv) => {
      const key = lv.purchaseOrderId ? `po_${lv.purchaseOrderId}` : lv.vendorId ? `ven_${lv.vendorId}` : `name_${lv.vendorName}`;
      return key === selectionValue;
    });

    if (matchedLinkedVendor) {
      setSelectedVendorSummary(matchedLinkedVendor);
      setVendorId(matchedLinkedVendor.vendorId || "");
      setPurchaseOrderId(matchedLinkedVendor.purchaseOrderId || "");
      setVendorName(matchedLinkedVendor.vendorName);

      if (matchedLinkedVendor.purchaseOrderRef) {
        setReferenceNoExternal(matchedLinkedVendor.purchaseOrderRef);
        if (!description || description.startsWith("Material") || description.toLowerCase() === "vendor") {
          setDescription(`Material Order Payment: ${matchedLinkedVendor.purchaseOrderRef} (${matchedLinkedVendor.vendorName})`);
        }
      } else if (!description || description.startsWith("Material") || description.toLowerCase() === "vendor") {
        setDescription(`Material supply payment for ${matchedLinkedVendor.vendorName}`);
      }

      if (matchedLinkedVendor.remainingDue > 0 && (!amount || Number(amount) === 0)) {
        setAmount(String(matchedLinkedVendor.remainingDue));
      }
      return;
    }

    // 2. Check if matched in Preset Suppliers or Trade Contractors
    if (selectionValue.startsWith("preset_")) {
      const presetName = selectionValue.replace("preset_", "");
      const presetItem = [...ALL_ERP_PRIMARY_SUPPLIERS, ...ALL_ERP_TRADE_CONTRACTORS].find(
        (p) => p.name === presetName
      );
      if (presetItem) {
        const isTrade = ALL_ERP_TRADE_CONTRACTORS.some((c) => c.name === presetItem.name);
        const linkedMatch = allActiveLinkedVendors.find(
          (v) => (v.vendorId && v.vendorId === presetItem.id) || v.vendorName.trim().toLowerCase() === presetItem.name.trim().toLowerCase()
        );
        const summary: LeadVendorSummary = {
          vendorId: presetItem.id,
          vendorName: presetItem.name,
          purchaseOrderId: linkedMatch?.purchaseOrderId,
          purchaseOrderRef: linkedMatch?.purchaseOrderRef,
          totalOrderAmount: linkedMatch ? linkedMatch.totalOrderAmount : 0,
          paidAmount: linkedMatch ? linkedMatch.paidAmount : 0,
          remainingDue: linkedMatch ? linkedMatch.remainingDue : 0,
          sourceType: linkedMatch?.sourceType || "GLOBAL_VENDOR",
          lastOrderDate: linkedMatch?.lastOrderDate,
        };
        setSelectedVendorSummary(summary);
        setVendorName(presetItem.name);
        setVendorId(presetItem.id);
        setPurchaseOrderId(linkedMatch?.purchaseOrderId || "");
        if (linkedMatch?.purchaseOrderRef) {
          setReferenceNoExternal(linkedMatch.purchaseOrderRef);
        }
        if (!description || description.startsWith("Material") || description.toLowerCase() === "vendor" || description.startsWith("Trade contractor") || description.startsWith("Material supply")) {
          setDescription(isTrade ? `Trade contractor payment for ${presetItem.name}` : `Material supply payment for ${presetItem.name}`);
        }
        if (linkedMatch && linkedMatch.remainingDue > 0 && (!amount || Number(amount) === 0)) {
          setAmount(String(linkedMatch.remainingDue));
        }
        return;
      }
    }

    // 3. Check if matched in allVendors from database
    if (selectionValue.startsWith("all_")) {
      const gVenId = selectionValue.replace("all_", "");
      const gVen = allVendors.find((v) => v.id === gVenId);
      if (gVen) {
        const linkedMatch = allActiveLinkedVendors.find(
          (v) => (v.vendorId && v.vendorId === gVen.id) || v.vendorName.trim().toLowerCase() === gVen.name.trim().toLowerCase()
        );
        const summary: LeadVendorSummary = {
          vendorId: gVen.id,
          vendorName: gVen.name,
          phone: gVen.phone,
          purchaseOrderId: linkedMatch?.purchaseOrderId,
          purchaseOrderRef: linkedMatch?.purchaseOrderRef,
          totalOrderAmount: linkedMatch ? linkedMatch.totalOrderAmount : 0,
          paidAmount: linkedMatch ? linkedMatch.paidAmount : 0,
          remainingDue: linkedMatch ? linkedMatch.remainingDue : 0,
          sourceType: linkedMatch?.sourceType || "GLOBAL_VENDOR",
          lastOrderDate: linkedMatch?.lastOrderDate,
        };
        setSelectedVendorSummary(summary);
        setVendorId(gVen.id);
        setPurchaseOrderId(linkedMatch?.purchaseOrderId || "");
        setVendorName(gVen.name);
        if (linkedMatch?.purchaseOrderRef) {
          setReferenceNoExternal(linkedMatch.purchaseOrderRef);
        }
        if (!description || description.startsWith("Material") || description.startsWith("Trade contractor") || description.startsWith("Material supply")) {
          setDescription(`Material supply payment for ${gVen.name}`);
        }
        if (linkedMatch && linkedMatch.remainingDue > 0 && (!amount || Number(amount) === 0)) {
          setAmount(String(linkedMatch.remainingDue));
        }
      }
    }
  };

  // ─── Reset category when type changes ──────────────────────────────────
  useEffect(() => {
    if (expenseType === "BUSINESS") {
      setSelectedCategoryKey("OFFICE_RENT");
    } else {
      setSelectedCategoryKey("MATERIAL");
    }
  }, [expenseType]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/v1/petty-cash/employees");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEmployees(json.data);
      } else {
        const uRes = await fetch("/api/v1/users");
        const uJson = await uRes.json();
        if (uJson.success) setEmployees(uJson.data || []);
      }
    } catch { /* quiet */ }
  };

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch("/api/v1/config/payments");
      const json = await res.json();
      if (json.success && json.data.paymentMethods) {
        setPaymentMethods(json.data.paymentMethods);
      }
    } catch { /* quiet */ }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/v1/projects?limit=100");
      const json = await res.json();
      if (json.success) setProjects(json.data.projects || json.data || []);
    } catch { /* quiet */ }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/v1/leads?limit=100");
      const json = await res.json();
      if (json.success) setLeads(json.data.leads || json.data || []);
    } catch { /* quiet */ }
  };

  if (!isOpen) return null;

  // ─── Resolve effective category key (custom "other" support) ────────────
  const effectiveCategoryKey =
    selectedCategoryKey === "OTHER_BUSINESS" && customCategoryLabel.trim()
      ? customCategoryLabel.trim().toUpperCase().replace(/\s+/g, "_")
      : selectedCategoryKey;

  const isPettyCash = expenseType === "BUSINESS" && selectedCategoryKey === "PETTY_CASH";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ─── DEDICATED PETTY CASH WORKFLOW ──────────────────────────────────────
    if (isPettyCash) {
      const parsedAmount = parseFloat(amount);
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        setError("Please enter a valid Petty Cash float amount greater than 0.");
        return;
      }

      let effectiveEmployeeId = pettyEmployeeId;

      // Handle "OTHERS" manual new employee creation
      if (pettyEmployeeId === "OTHERS") {
        if (!pettyNewEmpName.trim()) {
          setError("Please enter the new employee's full name.");
          return;
        }

        setIsSubmitting(true);
        setError("");
        try {
          const empRes = await fetch("/api/v1/petty-cash/employees", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName: pettyNewEmpName.trim(),
              phone: pettyNewEmpPhone.trim() || undefined,
              email: pettyNewEmpEmail.trim() || undefined,
            }),
          });
          const empJson = await empRes.json();
          if (!empRes.ok || !empJson.success) {
            setError(empJson.error?.message || "Failed to create new employee.");
            setIsSubmitting(false);
            return;
          }
          effectiveEmployeeId = empJson.data.id;
        } catch {
          setError("Network error creating employee record.");
          setIsSubmitting(false);
          return;
        }
      }

      if (!effectiveEmployeeId) {
        setError("Please select an employee to receive the Petty Cash float.");
        return;
      }

      setIsSubmitting(true);
      setError("");

      try {
        const res = await fetch("/api/v1/petty-cash/advances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: effectiveEmployeeId,
            amount: parsedAmount,
            purpose: description.trim() || "Petty Cash Float Allocation",
            paymentMethod,
            date: expenseDate,
            notes: notes.trim() || undefined,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error?.message || "Failed to issue petty cash advance.");
          return;
        }

        toast.success(
          "Petty Cash Allocated Successfully",
          `Float advance of ₹${parsedAmount.toLocaleString("en-IN")} issued.`
        );
        onSuccess();
        onClose();
      } catch {
        setError("Network error recording petty cash advance.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ─── REGULAR EXPENSE WORKFLOW ───────────────────────────────────────────
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      setError("Please provide a valid description and amount greater than 0.");
      return;
    }
    if (expenseType === "PROJECT" && !selectedProjectId) {
      setError("Project selection is required for Project Expenses.");
      return;
    }
    if ((expenseType === "MATERIAL" || expenseType === "PERSONAL") && !selectedLeadId) {
      setError("Person / Lead selection is required for Material Expenses.");
      return;
    }
    if (!effectiveCategoryKey) {
      setError("Please select or enter an expense category.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const endpoint =
        expenseType === "MATERIAL" || expenseType === "PERSONAL"
          ? `/api/v1/leads/${selectedLeadId}/expenses`
          : "/api/v1/finance/expenses";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseType,
          categoryKey: effectiveCategoryKey,
          projectId: expenseType === "PROJECT" ? selectedProjectId : undefined,
          leadId:
            expenseType === "MATERIAL" || expenseType === "PERSONAL"
              ? selectedLeadId
              : undefined,
          vendorId: vendorId || undefined,
          purchaseOrderId: purchaseOrderId || undefined,
          vendorName: vendorName ? vendorName.trim() : undefined,
          description: description.trim(),
          amount: parseFloat(amount),
          paymentMethod,
          expenseDate,
          referenceNoExternal: referenceNoExternal ? referenceNoExternal.trim() : undefined,
          notes: notes ? notes.trim() : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to record expense.");
        return;
      }

      toast.success(
        "Expense & Payment Recorded Successfully",
        `${expenseType} expense of ₹${parseFloat(amount).toLocaleString("en-IN")} saved and synced across vendors, orders, and expenses.`
      );
      onSuccess();
      onClose();
    } catch {
      setError("Network error recording expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Category options depending on type ─────────────────────────────────
  const categoryList = expenseType === "BUSINESS" ? BUSINESS_CATEGORIES : PROJECT_CATEGORIES;

  // ─── Modal title ─────────────────────────────────────────────────────────
  const modalTitle =
    expenseType === "BUSINESS"
      ? "Record Business Expense"
      : initialLeadId
      ? "Record Material / Person Expense"
      : initialProjectId
      ? "Record Project Expense"
      : "Record Expense";

  const modalSubtitle =
    expenseType === "BUSINESS"
      ? "Company overhead — not linked to any project or lead"
      : initialLeadId
      ? `Linked to Person: ${initialLeadName || initialLeadId}`
      : initialProjectId
      ? `Linked to project: ${initialProjectTitle || initialProjectId}`
      : "Authoritative financial outgoing ledger entry";

  const hasUnsavedChanges = Boolean(amount.trim() || description.trim() || vendorName.trim());

  const handleAttemptClose = () => {
    if (hasUnsavedChanges) {
      setShowDiscardPrompt(true);
    } else {
      onClose();
    }
  };

  const isMaterialWorkflow =
    expenseType === "PROJECT" ||
    expenseType === "MATERIAL" ||
    expenseType === "PERSONAL" ||
    selectedCategoryKey === "MATERIAL" ||
    selectedCategoryKey === "SUBCONTRACTOR" ||
    selectedCategoryKey === "LABOUR" ||
    selectedCategoryKey === "INSTALLATION" ||
    selectedCategoryKey === "TRANSPORT" ||
    Boolean(selectedLeadId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#242321]/40 backdrop-blur-xs select-none">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#EAE5DD] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">

        {/* Unsaved Changes Confirmation Banner */}
        {showDiscardPrompt && (
          <div className="bg-[#FFFBEB] border-b border-[#FDE68A] px-6 py-2.5 flex items-center justify-between text-xs text-[#92400E] animate-in slide-in-from-top duration-150 z-20">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />
              <span>You have entered expense data. Discard and close?</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowDiscardPrompt(false)}
                className="px-2.5 py-1 text-xs font-semibold bg-[#FFFEFC] border border-[#FDE68A] rounded-md text-[#92400E] hover:bg-[#FEF3C7] cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardPrompt(false);
                  onClose();
                }}
                className="px-2.5 py-1 text-xs font-bold bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-md cursor-pointer"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-4.5 bg-[#FAF8F5] border-b border-[#EAE5DD] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#FFFEFC] border border-[#EAE5DD] shadow-2xs">
              {expenseType === "BUSINESS"
                ? <Briefcase className="w-4 h-4 text-[#77736C]" />
                : <Receipt className="w-4 h-4 text-[#B99558]" />
              }
            </div>
            <div>
              <h3 className="text-base font-bold text-[#242321] tracking-tight">{modalTitle}</h3>
              <p className="text-[11px] text-[#77736C] mt-0.5">{modalSubtitle}</p>
            </div>
          </div>
          <button
            onClick={handleAttemptClose}
            className="p-1.5 rounded-lg text-[#77736C] hover:text-[#242321] hover:bg-[#EAE5DD]/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* Classification Tabs (only when not locked) */}
          {!initialProjectId && !initialLeadId && !initialExpenseType && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#77736C]">Classification *</label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-[#F5F2EC] rounded-xl border border-[#EAE5DD]">
                <button
                  type="button"
                  onClick={() => setExpenseType("PROJECT")}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    expenseType === "PROJECT"
                      ? "bg-[#FFFEFC] text-[#242321] shadow-sm border border-[#EAE5DD]"
                      : "text-[#77736C] hover:text-[#242321] hover:bg-[#EEE5D6]"
                  }`}
                >
                  Project
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseType("MATERIAL")}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    expenseType === "MATERIAL" || expenseType === "PERSONAL"
                      ? "bg-[#FFFEFC] text-[#242321] shadow-sm border border-[#EAE5DD]"
                      : "text-[#77736C] hover:text-[#242321] hover:bg-[#EEE5D6]"
                  }`}
                >
                  Material
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseType("BUSINESS")}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    expenseType === "BUSINESS"
                      ? "bg-[#FFFEFC] text-[#242321] shadow-sm border border-[#EAE5DD]"
                      : "text-[#77736C] hover:text-[#242321] hover:bg-[#EEE5D6]"
                  }`}
                >
                  Business
                </button>
              </div>
            </div>
          )}

          {/* Business type locked badge */}
          {initialExpenseType === "BUSINESS" && (
            <div className="flex items-center gap-2 p-3 bg-[#F5F2EC] border border-[#EAE5DD] rounded-xl text-xs font-semibold text-[#242321]">
              <Briefcase className="w-4 h-4 text-[#B99558] shrink-0" />
              <span>Business / Company Overhead Expense</span>
            </div>
          )}

          {/* Associated Project */}
          {expenseType === "PROJECT" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-walnut uppercase tracking-wider">Associated Project *</label>
              {initialProjectId ? (
                <div className="p-2.5 bg-cream/40 border border-walnut/20 rounded-xl flex items-center gap-2 text-xs font-bold text-charcoal">
                  <Building2 className="w-4 h-4 text-gold shrink-0" />
                  <span className="truncate">{initialProjectTitle || initialProjectId}</span>
                </div>
              ) : (
                <SearchableSelect
                  placeholder="Search and select Project..."
                  options={projects.map((p) => ({
                    value: p.id,
                    label: `${p.referenceNo} — ${p.title}`,
                    subtext: p.client?.fullName ? `Client: ${p.client.fullName}` : undefined,
                  }))}
                  value={selectedProjectId}
                  onChange={(val) => setSelectedProjectId(val)}
                  allowOthers={false}
                  required
                />
              )}
            </div>
          )}

          {/* Associated Lead / Person */}
          {(expenseType === "MATERIAL" || expenseType === "PERSONAL") && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-walnut uppercase tracking-wider">Material Requirement Person / Lead *</label>
              {initialLeadId ? (
                <div className="p-2.5 bg-cream/40 border border-walnut/20 rounded-xl flex items-center gap-2 text-xs font-bold text-charcoal">
                  <User className="w-4 h-4 text-gold shrink-0" />
                  <span className="truncate">
                    {initialLeadName || initialLeadId}{" "}
                    {initialLeadRequirement ? `(${initialLeadRequirement})` : ""}
                  </span>
                </div>
              ) : (
                <SearchableSelect
                  placeholder="Search and select Material Requirement Person / Lead..."
                  options={leads.map((l) => ({
                    value: l.id,
                    label: `${l.referenceNo} — ${l.clientName}`,
                    subtext: l.phone ? `${l.phone}${l.requirement ? ` • ${l.requirement}` : ""}` : undefined,
                  }))}
                  value={selectedLeadId}
                  onChange={(val) => setSelectedLeadId(val)}
                  allowOthers={false}
                  required
                />
              )}
            </div>
          )}

          {/* Category & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#77736C]">Category *</label>
              <select
                value={selectedCategoryKey}
                onChange={(e) => setSelectedCategoryKey(e.target.value)}
                className="h-9 px-3 text-xs bg-[#FFFEFC] border border-[#EAE5DD] rounded-lg font-medium text-[#242321] focus:outline-none focus:border-[#B99558] focus:ring-1 focus:ring-[#B99558]/30 transition-colors"
                required
              >
                {categoryList.map((cat) => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#77736C] mb-1.5">
                {isPettyCash ? "Petty Cash Amount (₹) *" : "Amount (₹) *"}
              </label>
              <Input
                type="number"
                placeholder={isPettyCash ? "10000" : "25000"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Custom label for "Other Business" category */}
          {expenseType === "BUSINESS" && selectedCategoryKey === "OTHER_BUSINESS" && (
            <div>
              <label className="block text-xs font-semibold text-[#77736C] mb-1.5">Custom Category Name *</label>
              <Input
                placeholder="e.g. Awards Ceremony, Team Outing"
                value={customCategoryLabel}
                onChange={(e) => setCustomCategoryLabel(e.target.value)}
                required
              />
            </div>
          )}

          {/* ─── DEDICATED PETTY CASH WORKFLOW ─────────────────────────────── */}
          {isPettyCash ? (
            <div className="space-y-4 pt-1">
              <div className="p-3.5 bg-[#FAF3EB] border border-[#ECD9C6] rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#242321]">
                  <Coins className="w-4 h-4 text-[#C48436] shrink-0" />
                  <span>Petty Cash Allocation & Running Ledger Synchronization</span>
                </div>
                <p className="text-[11px] text-[#77736C] leading-relaxed">
                  Money issued to an employee will record a canonical Business Expense, credit the employee&apos;s financial ledger, and update the Petty Cash balance in real-time.
                </p>
              </div>

              {/* Employee Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#77736C]">
                  Select Employee / Float Custodian *
                </label>
                <select
                  value={pettyEmployeeId}
                  onChange={(e) => setPettyEmployeeId(e.target.value)}
                  className="h-9 px-3 text-xs bg-[#FFFEFC] border border-[#EAE5DD] rounded-lg font-medium text-[#242321] focus:border-[#B99558] focus:outline-none"
                  required
                >
                  <option value="">Select Employee...</option>
                  <option value="OTHERS" className="font-bold text-[#C48436] bg-[#FAF3EB]">
                    + Others / Add New Employee...
                  </option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name || emp.fullName} {emp.currentBalance !== undefined ? `(Current Float: ₹${emp.currentBalance.toLocaleString("en-IN")})` : emp.email ? `(${emp.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add New Employee Form (if OTHERS selected) */}
              {pettyEmployeeId === "OTHERS" && (
                <div className="p-3 bg-[#F8F6F1] border border-[#EAE5DD] rounded-xl space-y-3">
                  <div className="text-xs font-bold text-[#242321] uppercase tracking-wider">
                    Add New Employee Record
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-walnut uppercase mb-1">
                      Employee Full Name *
                    </label>
                    <Input
                      placeholder="e.g. Ramesh Kumar"
                      value={pettyNewEmpName}
                      onChange={(e) => setPettyNewEmpName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-walnut uppercase mb-1">
                        Phone Number
                      </label>
                      <Input
                        placeholder="e.g. 9876543210"
                        value={pettyNewEmpPhone}
                        onChange={(e) => setPettyNewEmpPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-walnut uppercase mb-1">
                        Email Address
                      </label>
                      <Input
                        placeholder="e.g. ramesh@espacio.in"
                        type="email"
                        value={pettyNewEmpEmail}
                        onChange={(e) => setPettyNewEmpEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Purpose / Float Description */}
              <div>
                <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">
                  Float Purpose / Description *
                </label>
                <Input
                  placeholder="e.g. Site minor purchases, office daily sundries"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Date & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">Issued Date *</label>
                  <Input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-walnut uppercase tracking-wider">Payment Mode *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-9 px-3 text-xs bg-white border border-walnut/20 rounded-xl font-semibold text-charcoal focus:border-gold focus:outline-none"
                    required
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CASH">Cash Disbursement</option>
                    <option value="CHEQUE">Company Cheque</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">
                  Allocation Notes & Instructions
                </label>
                <Input
                  placeholder="e.g. Approved by Director, to be settled monthly"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          ) : (
            /* Standard non-petty cash expense fields */
            <>
              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">
                  {expenseType === "BUSINESS" ? "Expense Description *" : "Description / Material Details *"}
                </label>
                <Input
                  placeholder={
                    expenseType === "BUSINESS"
                      ? "e.g. Monthly office rent for September 2026"
                      : "e.g. Teak Plywood 18mm, Transport from Warehouse"
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* ─── DYNAMIC VENDOR SELECTION & DOWNSIDE FINANCIAL CARD ─── */}
              {isMaterialWorkflow ? (
                <div className="space-y-3 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center justify-between">
                      <span>Select Supplier / Vendor *</span>
                      {selectedProjectId && projectVendors.length > 0 && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {projectVendors.length} Linked to Project
                        </span>
                      )}
                      {!selectedProjectId && selectedLeadId && leadVendors.length > 0 && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {leadVendors.length} Linked to Lead
                        </span>
                      )}
                    </label>

                    <select
                      value={selectedVendorSelection}
                      onChange={(e) => handleVendorSelectionChange(e.target.value)}
                      className="h-9 px-3 text-xs bg-white border border-walnut/20 rounded-xl font-semibold text-charcoal focus:border-gold focus:outline-none"
                    >
                      <option value="">Select Vendor / Supplier...</option>

                      {/* ─── SCENARIO A: A Project is selected -> Show ONLY vendors belonging to THIS project ─── */}
                      {selectedProjectId && projectVendors.length > 0 ? (
                        <optgroup label="🌟 Vendors & Orders for this Project">
                          {projectVendors.map((pv) => {
                            const key = pv.purchaseOrderId ? `po_${pv.purchaseOrderId}` : pv.vendorId ? `ven_${pv.vendorId}` : `name_${pv.vendorName}`;
                            const balText = pv.totalOrderAmount > 0 ? ` [Due: ₹${pv.remainingDue.toLocaleString("en-IN")}]` : "";
                            const poText = pv.purchaseOrderRef ? ` (${pv.purchaseOrderRef})` : "";
                            return (
                              <option key={key} value={key} className="font-bold text-charcoal">
                                {pv.vendorName}{poText}{balText}
                              </option>
                            );
                          })}
                        </optgroup>
                      ) : selectedProjectId ? (
                        /* If project has no POs yet, show registered ERP vendors */
                        allVendors.length > 0 && (
                          <optgroup label="🏢 Registered ERP Suppliers">
                            {allVendors.map((v) => (
                              <option key={v.id} value={`all_${v.id}`}>
                                {v.name} {v.categoryKey ? `(${v.categoryKey})` : ""}
                              </option>
                            ))}
                          </optgroup>
                        )
                      ) : selectedLeadId && leadVendors.length > 0 ? (
                        /* ─── SCENARIO B: A Lead is selected -> Show ONLY suppliers/vendors registered for THIS LEAD ─── */
                        <optgroup label="🌟 Registered Suppliers & Orders for this Lead">
                          {leadVendors.map((lv) => {
                            const key = lv.purchaseOrderId ? `po_${lv.purchaseOrderId}` : lv.vendorId ? `ven_${lv.vendorId}` : `name_${lv.vendorName}`;
                            const balText = lv.totalOrderAmount > 0 ? ` [Due: ₹${lv.remainingDue.toLocaleString("en-IN")}]` : "";
                            const poText = lv.purchaseOrderRef ? ` (${lv.purchaseOrderRef})` : "";
                            return (
                              <option key={key} value={key} className="font-bold text-charcoal">
                                {lv.vendorName}{poText}{balText}
                              </option>
                            );
                          })}
                        </optgroup>
                      ) : selectedLeadId ? (
                        /* If lead has no linked orders yet, show registered directory */
                        allVendors.length > 0 && (
                          <optgroup label="🏢 Registered ERP Suppliers">
                            {allVendors.map((v) => (
                              <option key={v.id} value={`all_${v.id}`}>
                                {v.name} {v.categoryKey ? `(${v.categoryKey})` : ""}
                              </option>
                            ))}
                          </optgroup>
                        )
                      ) : (
                        /* ─── SCENARIO C: General / Company Expense -> Show full ERP Directory ─── */
                        <>
                          <optgroup label="📦 Primary Material Suppliers">
                            {ALL_ERP_PRIMARY_SUPPLIERS.map((s) => (
                              <option key={s.id} value={`preset_${s.name}`}>
                                {s.name} — {s.category}
                              </option>
                            ))}
                          </optgroup>

                          <optgroup label="🔨 Active Trade Contractors">
                            {ALL_ERP_TRADE_CONTRACTORS.map((c) => (
                              <option key={c.id} value={`preset_${c.name}`}>
                                {c.name} — {c.category}
                              </option>
                            ))}
                          </optgroup>

                          {allVendors.filter(
                            (v) =>
                              !ALL_ERP_PRIMARY_SUPPLIERS.some((ps) => ps.name.toLowerCase() === (v.name || "").toLowerCase()) &&
                              !ALL_ERP_TRADE_CONTRACTORS.some((tc) => tc.name.toLowerCase() === (v.name || "").toLowerCase())
                          ).length > 0 && (
                            <optgroup label="🏢 Additional Registered ERP Suppliers">
                              {allVendors
                                .filter(
                                  (v) =>
                                    !ALL_ERP_PRIMARY_SUPPLIERS.some((ps) => ps.name.toLowerCase() === (v.name || "").toLowerCase()) &&
                                    !ALL_ERP_TRADE_CONTRACTORS.some((tc) => tc.name.toLowerCase() === (v.name || "").toLowerCase())
                                )
                                .map((v) => (
                                  <option key={v.id} value={`all_${v.id}`}>
                                    {v.name} {v.categoryKey ? `(${v.categoryKey})` : ""}
                                  </option>
                                ))}
                            </optgroup>
                          )}
                        </>
                      )}

                      <option value="CUSTOM" className="font-bold text-amber-700 bg-amber-50">
                        + Other / Custom Payee Name...
                      </option>
                    </select>
                  </div>

                  {/* Manual Vendor Name Input if CUSTOM selected */}
                  {selectedVendorSelection === "CUSTOM" && (
                    <div>
                      <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">
                        Custom Payee / Vendor Name *
                      </label>
                      <Input
                        placeholder="e.g. Local Plywood Shop / Transport Agency"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {/* DOWNSIDE VENDOR FINANCIAL SNAPSHOT & REMAINING AMOUNT CARD */}
                  {selectedVendorSummary && (
                    <div className="p-3.5 bg-gradient-to-br from-white to-amber-50/60 border border-amber-300 rounded-xl shadow-2xs space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                          <Truck className="w-4 h-4 text-amber-600" />
                          <span>Supplier Financial Snapshot: <strong>{selectedVendorSummary.vendorName}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {selectedVendorSummary.purchaseOrderRef && (
                            <span className="font-mono text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                              {selectedVendorSummary.purchaseOrderRef}
                            </span>
                          )}
                          {selectedVendorSummary.lastOrderDate && (
                            <span className="font-mono text-[10px] text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200" title="Latest Order Date">
                              {formatDate(selectedVendorSummary.lastOrderDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 3 KPI Values */}
                      <div className="grid grid-cols-3 gap-2 text-center bg-white p-2.5 rounded-lg border border-amber-200/70 shadow-2xs">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">
                            Total Order
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                            ₹{selectedVendorSummary.totalOrderAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-700 uppercase font-bold block">
                            Paid So Far
                          </span>
                          <span className="font-mono text-xs font-bold text-emerald-700 tabular-nums">
                            ₹{selectedVendorSummary.paidAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">
                            Remaining Due
                          </span>
                          <span className={`font-mono text-xs font-bold tabular-nums ${selectedVendorSummary.remainingDue > 0 ? "text-amber-800" : "text-emerald-700"}`}>
                            ₹{selectedVendorSummary.remainingDue.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Quick Auto-Fill Action */}
                      {selectedVendorSummary.remainingDue > 0 ? (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-amber-900">
                            Pending balance: <strong>₹{selectedVendorSummary.remainingDue.toLocaleString("en-IN")}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setAmount(String(selectedVendorSummary.remainingDue))}
                            className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-md shadow-2xs cursor-pointer flex items-center gap-1 transition-all"
                          >
                            <Coins className="w-3 h-3" />
                            Fill Remaining Balance (₹{selectedVendorSummary.remainingDue.toLocaleString("en-IN")})
                          </button>
                        </div>
                      ) : selectedVendorSummary.totalOrderAmount > 0 ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50/80 px-2 py-1 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>All previous purchase order dues are cleared for this vendor.</span>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Bill / Voucher Ref */}
                  <div>
                    <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">
                      Bill / Voucher / PO Reference
                    </label>
                    <Input
                      placeholder="INV-9901 / VOUCHER-012 / MAT-ORD-2026-0001"
                      value={referenceNoExternal}
                      onChange={(e) => setReferenceNoExternal(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                /* Non-material Payee Input */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">
                      {expenseType === "BUSINESS" ? "Payee / Vendor Name" : "Vendor / Payee Name"}
                    </label>
                    <Input
                      placeholder={expenseType === "BUSINESS" ? "e.g. DLF Properties, Google India" : "Century Ply / Hardware Supplier"}
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">
                      {expenseType === "BUSINESS" ? "Invoice / Transaction Ref" : "Bill / Voucher Ref"}
                    </label>
                    <Input
                      placeholder={expenseType === "BUSINESS" ? "INV-2026-09 / TXN123456" : "INV-9901 / VOUCHER-012"}
                      value={referenceNoExternal}
                      onChange={(e) => setReferenceNoExternal(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Date & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">Expense Date *</label>
                  <Input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-walnut uppercase tracking-wider">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-9 px-3 text-xs bg-white border border-walnut/20 rounded-xl font-semibold text-charcoal focus:border-gold focus:outline-none"
                    required
                  >
                    {paymentMethods.length > 0 ? (
                      paymentMethods.map((pm) => (
                        <option key={pm.key} value={pm.key}>{pm.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                        <option value="UPI">UPI / QR Code</option>
                        <option value="CASH">Cash Payment</option>
                        <option value="CHEQUE">Bank Cheque</option>
                        <option value="CREDIT_CARD">Company Credit Card</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">
                  {expenseType === "BUSINESS" ? "Internal Notes" : "Internal Notes / Material Notes"}
                </label>
                <Input
                  placeholder={
                    expenseType === "BUSINESS"
                      ? "Approval reference, cost center, budget code..."
                      : "Delivery challan, site verification, material inspection notes..."
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-[#EAE5DD]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAttemptClose}
              className="bg-[#FFFEFC] border-[#EAE5DD] text-[#77736C] hover:text-[#242321] hover:bg-[#F2ECE2]"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="bg-[#242321] text-[#FAF8F5] hover:bg-[#383633] font-semibold border border-[#242321] shadow-2xs"
            >
              {isPettyCash ? (
                <>
                  <Coins className="w-3.5 h-3.5 mr-1" />
                  Record Petty Cash
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {expenseType === "BUSINESS" ? "Record Business Expense" : "Record Expense & Payment"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

