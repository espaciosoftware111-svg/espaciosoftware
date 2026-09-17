"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Printer,
  Receipt,
  Layers,
  Phone,
  Package,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ExpenseDetailsModalProps {
  expenseId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  onOpenProject?: (projectId: string) => void;
  onOpenLead?: (leadId: string) => void;
}

export const ExpenseDetailsModal: React.FC<ExpenseDetailsModalProps> = ({
  expenseId,
  isOpen,
  onClose,
  onUpdate,
  onOpenProject,
  onOpenLead,
}) => {
  const router = useRouter();
  const [expense, setExpense] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleOpenLead = (leadId: string) => {
    onClose();
    if (onOpenLead) {
      onOpenLead(leadId);
    } else {
      router.push(`/leads?id=${leadId}`);
    }
  };

  const handleOpenProject = (projectId: string) => {
    onClose();
    if (onOpenProject) {
      onOpenProject(projectId);
    } else {
      router.push(`/projects?id=${projectId}`);
    }
  };

  useEffect(() => {
    if (isOpen && expenseId) {
      fetchExpenseDetails();
    } else {
      setExpense(null);
    }
  }, [isOpen, expenseId]);

  const fetchExpenseDetails = async () => {
    if (!expenseId) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/expenses/${expenseId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load expense details");
      }
      setExpense(json.data);
    } catch (err: any) {
      setError(err.message || "Network error loading expense details");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !expenseId) return null;

  const statusVariant =
    expense?.status === "APPROVED" || expense?.status === "PAID"
      ? "completed"
      : expense?.status === "SUBMITTED" || expense?.status === "DRAFT"
      ? "pending"
      : "danger";

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs select-none">
      <div className="bg-[#FCFBF9] rounded-2xl shadow-2xl border border-walnut/20 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-cream/70 border-b border-walnut/15 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold/15 text-charcoal border border-gold/30 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-charcoal">Expense Voucher</h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-white text-walnut rounded border border-walnut/20">
                  {expense?.referenceNo || "EXP-..."}
                </span>
              </div>
              <p className="text-[11px] text-walnut mt-0.5">Authoritative outgoing financial record</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {expense?.status && (
              <Badge variant={statusVariant}>
                {expense.status === "SUBMITTED" ? "Pending Approval" : expense.status.replace(/_/g, " ")}
              </Badge>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-walnut hover:text-charcoal hover:bg-walnut/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-walnut space-y-2">
              <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading expense record...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : expense ? (
            <>
              {/* Top Highlight: Amount & Category */}
              <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-walnut uppercase tracking-wider block">
                    Expense Amount
                  </span>
                  <div className="text-2xl font-bold text-rose-700 font-mono mt-0.5">
                    {formatCurrency(expense.amount)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-walnut uppercase tracking-wider block">
                    Category
                  </span>
                  <span className="inline-block mt-1 px-3 py-1 bg-cream/60 border border-walnut/20 rounded-lg text-xs font-bold text-charcoal">
                    {(expense.categoryKey || "GENERAL").replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Linked Material Requirement Person / Lead Info */}
              {expense.lead ? (
                <div className="p-4 bg-white rounded-xl border border-gold/30 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gold" /> Material Requirement Person / Lead
                    </span>
                    <button
                      onClick={() => handleOpenLead(expense.lead.id)}
                      className="text-xs font-bold text-gold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Open Lead Workspace ↗
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-walnut/70 text-[11px]">Person / Lead Name</div>
                      <div className="font-bold text-charcoal mt-0.5">
                        {expense.lead.clientName || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-walnut/70 text-[11px]">Lead ID</div>
                      <div className="font-bold text-charcoal mt-0.5 font-mono">
                        {expense.lead.referenceNo || expense.lead.id}
                      </div>
                    </div>
                    <div>
                      <div className="text-walnut/70 text-[11px]">Phone Number</div>
                      <div className="font-bold text-charcoal mt-0.5 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-walnut/70" />
                        {expense.lead.phone || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-walnut/70 text-[11px]">Material Requirement Details</div>
                      <div className="font-semibold text-charcoal mt-0.5 truncate">
                        {expense.lead.requirement || "Materials Required"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : expense.project ? (
                /* Linked Project Information */
                <div className="p-4 bg-white rounded-xl border border-gold/30 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gold" /> Linked Project
                    </span>
                    <button
                      onClick={() => handleOpenProject(expense.project.id)}
                      className="text-xs font-bold text-gold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Open Project Workspace ↗
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-walnut/70 text-[11px]">Project ID & Name</div>
                      <div className="font-bold text-charcoal mt-0.5 font-mono">
                        {expense.project.referenceNo} — <span className="font-sans font-semibold">{expense.project.title}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-walnut/70 text-[11px]">Project Contract Budget</div>
                      <div className="font-bold text-charcoal mt-0.5 font-mono">
                        {formatCurrency(expense.project.revisedBudget || expense.project.contractValue || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span>Classified as <strong>Business / Overhead Expense</strong>.</span>
                </div>
              )}

              {/* Linked Custodian / Assigned Employee (for Petty Cash advances or employee expenses) */}
              {expense.employee && (
                <div className="p-4 bg-white rounded-xl border border-gold/30 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gold" /> Custodian / Assigned Employee
                    </span>
                    <Link
                      href={`/finance/petty-cash?employeeId=${expense.employee.id}`}
                      onClick={onClose}
                      className="text-xs font-bold text-gold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      View Petty Cash Ledger ↗
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-walnut/70 text-[11px]">Employee Name</div>
                      <div className="font-bold text-charcoal mt-0.5">{expense.employee.fullName}</div>
                    </div>
                    <div>
                      <div className="text-walnut/70 text-[11px]">Employee ID</div>
                      <div className="font-bold text-charcoal mt-0.5 font-mono">{expense.employee.employeeNo || "EMP-..."}</div>
                    </div>
                    {expense.employee.department && (
                      <div>
                        <div className="text-walnut/70 text-[11px]">Department</div>
                        <div className="font-semibold text-charcoal mt-0.5">{expense.employee.department}</div>
                      </div>
                    )}
                    {expense.employee.designation && (
                      <div>
                        <div className="text-walnut/70 text-[11px]">Designation</div>
                        <div className="font-semibold text-charcoal mt-0.5">{expense.employee.designation}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Transaction Details Grid */}
              <div className="bg-white p-4 rounded-xl border border-walnut/20 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-gold" /> Transaction Details
                </h4>
                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <span className="text-walnut/70 text-[11px] block">Description / Purpose</span>
                    <span className="font-semibold text-charcoal block mt-0.5">{expense.description}</span>
                  </div>
                  <div>
                    <span className="text-walnut/70 text-[11px] block">Vendor / Payee</span>
                    <span className="font-semibold text-charcoal block mt-0.5">{expense.vendorName || "Direct Supplier / Contractor"}</span>
                  </div>
                  <div>
                    <span className="text-walnut/70 text-[11px] block">Payment Method</span>
                    <span className="font-semibold text-charcoal block mt-0.5 font-mono">
                      {(expense.paymentMethod || "BANK_TRANSFER").replace(/_/g, " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-walnut/70 text-[11px] block">Expense Date</span>
                    <span className="font-semibold text-charcoal block mt-0.5 font-mono">
                      {formatDate(expense.expenseDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-walnut/70 text-[11px] block">Invoice / Bill Reference</span>
                    <span className="font-mono text-xs font-semibold text-charcoal block mt-0.5">
                      {expense.referenceNoExternal || "None Provided"}
                    </span>
                  </div>
                  <div>
                    <span className="text-walnut/70 text-[11px] block">Financial Account</span>
                    <span className="font-semibold text-charcoal block mt-0.5">
                      {expense.financialAccount ? `${expense.financialAccount.name} (${expense.financialAccount.accountCode})` : "General Cash / Bank"}
                    </span>
                  </div>
                </div>

                {expense.notes && (
                  <div className="pt-2 border-t border-walnut/10 text-xs">
                    <span className="text-walnut/70 text-[11px] block font-semibold">Notes & Remarks:</span>
                    <p className="text-charcoal mt-0.5 bg-cream/30 p-2.5 rounded-lg border border-walnut/10 font-sans">
                      {expense.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Audit & Compliance Metadata */}
              <div className="p-3.5 bg-cream/40 rounded-xl border border-walnut/15 text-[11px] text-walnut space-y-1 font-mono">
                <div className="flex items-center justify-between">
                  <span>Record Created:</span>
                  <span className="text-charcoal font-semibold">{formatDate(expense.createdAt)}</span>
                </div>
                {expense.approvedAt && (
                  <div className="flex items-center justify-between">
                    <span>Approved Timestamp:</span>
                    <span className="text-emerald-700 font-semibold">{formatDate(expense.approvedAt)}</span>
                  </div>
                )}
                {expense.rejectionReason && (
                  <div className="flex items-center justify-between text-rose-700">
                    <span>Rejection Reason:</span>
                    <span className="font-semibold">{expense.rejectionReason}</span>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-cream/50 border-t border-walnut/15 flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="text-xs border-walnut/30 text-walnut hover:bg-cream"
          >
            <Printer className="w-3.5 h-3.5 mr-1" /> Print Voucher
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={onClose}
            className="text-xs bg-gold text-charcoal font-bold hover:bg-gold/90"
          >
            Close
          </Button>
        </div>

      </div>
    </div>
  );
};
