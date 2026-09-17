"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/components/ui/toast";
import { X, AlertTriangle, Building2, Plus, Receipt, User, Briefcase, ArrowRight, Info, Coins, CheckCircle2 } from "lucide-react";

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

  // ─── Form fields ────────────────────────────────────────────────────────
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("");
  const [customCategoryLabel, setCustomCategoryLabel] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || "");
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeadId || "");
  const [vendorName, setVendorName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
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
      setSelectedProjectId(initialProjectId || "");
      setSelectedLeadId(initialLeadId || "");
      setVendorName("");
      setDescription("");
      setAmount("");
      setPaymentMethod("BANK_TRANSFER");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setReferenceNoExternal("");
      setNotes("");
      setError("");
      setPettyEmployeeId("");
      setPettyNewEmpName("");
      setPettyNewEmpPhone("");
      setPettyNewEmpEmail("");

      fetchPaymentMethods();
      if (!initialProjectId) fetchProjects();
      if (!initialLeadId) fetchLeads();
      fetchEmployees();
    }
  }, [isOpen]);

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
        "Expense Recorded Successfully",
        `${expenseType} expense of ₹${parseFloat(amount).toLocaleString("en-IN")} saved.`
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

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs select-none">
      <div className="bg-[#FCFBF9] rounded-2xl shadow-2xl border border-walnut/20 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">

        {/* Unsaved Changes Confirmation Banner */}
        {showDiscardPrompt && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 animate-in slide-in-from-top duration-150 z-20">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>You have entered expense data. Discard and close?</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowDiscardPrompt(false)}
                className="px-2.5 py-1 text-xs font-semibold bg-white border border-amber-300 rounded-md text-amber-900 hover:bg-amber-100/50 cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardPrompt(false);
                  onClose();
                }}
                className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-md cursor-pointer"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-4 bg-cream/70 border-b border-walnut/15 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              expenseType === "BUSINESS"
                ? "bg-violet-100 border border-violet-200"
                : "bg-gold/15 border border-gold/30"
            }`}>
              {expenseType === "BUSINESS"
                ? <Briefcase className="w-4 h-4 text-violet-600" />
                : <Receipt className="w-4 h-4 text-gold" />
              }
            </div>
            <div>
              <h3 className="text-base font-bold text-charcoal">{modalTitle}</h3>
              <p className="text-[11px] text-walnut mt-0.5">{modalSubtitle}</p>
            </div>
          </div>
          <button
            onClick={handleAttemptClose}
            className="p-1 rounded-lg text-walnut hover:text-charcoal hover:bg-walnut/10 transition-colors cursor-pointer"
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
              <label className="text-xs font-bold text-walnut uppercase tracking-wider">Classification *</label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-cream/50 rounded-xl border border-walnut/15">
                <button
                  type="button"
                  onClick={() => setExpenseType("PROJECT")}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    expenseType === "PROJECT"
                      ? "bg-gold text-charcoal shadow-2xs border border-gold/60"
                      : "text-walnut hover:text-charcoal hover:bg-cream"
                  }`}
                >
                  Project
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseType("MATERIAL")}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    expenseType === "MATERIAL" || expenseType === "PERSONAL"
                      ? "bg-gold text-charcoal shadow-2xs border border-gold/60"
                      : "text-walnut hover:text-charcoal hover:bg-cream"
                  }`}
                >
                  Material
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseType("BUSINESS")}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    expenseType === "BUSINESS"
                      ? "bg-violet-600 text-white shadow-2xs border border-violet-700"
                      : "text-walnut hover:text-charcoal hover:bg-cream"
                  }`}
                >
                  Business
                </button>
              </div>
            </div>
          )}

          {/* Business type locked badge */}
          {initialExpenseType === "BUSINESS" && (
            <div className="flex items-center gap-2 p-2.5 bg-violet-50 border border-violet-200 rounded-xl text-xs font-bold text-violet-800">
              <Briefcase className="w-4 h-4 text-violet-500 shrink-0" />
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
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-walnut uppercase tracking-wider">Category *</label>
              <select
                value={selectedCategoryKey}
                onChange={(e) => setSelectedCategoryKey(e.target.value)}
                className={`h-9 px-3 text-xs border rounded-xl font-semibold text-charcoal focus:outline-none transition-colors ${
                  expenseType === "BUSINESS"
                    ? "bg-violet-50 border-violet-200 focus:border-violet-400"
                    : "bg-white border-walnut/20 focus:border-gold"
                }`}
                required
              >
                {categoryList.map((cat) => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">
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
              <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">Custom Category Name *</label>
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
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Coins className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Petty Cash Allocation & Running Ledger Synchronization</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Money issued to an employee will record a canonical Business Expense, credit the employee&apos;s financial ledger, and update the Petty Cash balance in real-time.
                </p>
              </div>

              {/* Employee Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-walnut uppercase tracking-wider">
                  Select Employee / Float Custodian *
                </label>
                <select
                  value={pettyEmployeeId}
                  onChange={(e) => setPettyEmployeeId(e.target.value)}
                  className="h-9 px-3 text-xs bg-white border border-walnut/20 rounded-xl font-semibold text-charcoal focus:border-gold focus:outline-none"
                  required
                >
                  <option value="">Select Employee...</option>
                  <option value="OTHERS" className="font-bold text-amber-700 bg-amber-50">
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
                <div className="p-3 bg-cream/40 border border-walnut/20 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-walnut uppercase tracking-wider">
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

              {/* Vendor / Bill Ref */}
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
          <div className="flex justify-end gap-2 pt-3 border-t border-walnut/15">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAttemptClose}
              className="border-walnut/30 text-walnut hover:bg-cream"
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
              className={
                isPettyCash
                  ? "bg-amber-600 text-white font-bold hover:bg-amber-700"
                  : expenseType === "BUSINESS"
                  ? "bg-violet-600 text-white font-bold hover:bg-violet-700"
                  : "bg-gold text-charcoal font-bold hover:bg-gold/90"
              }
            >
              {isPettyCash ? (
                <>
                  <Coins className="w-3.5 h-3.5 mr-1" />
                  Record Petty Cash
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {expenseType === "BUSINESS" ? "Record Business Expense" : "Record Expense"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
