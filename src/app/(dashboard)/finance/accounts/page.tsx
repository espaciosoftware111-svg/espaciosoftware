"use client";

import React, { useState, useEffect } from "react";
import { Wallet, Plus, ArrowRightLeft, Building2, CheckCircle2 } from "lucide-react";
import { CreateAccountModal } from "@/components/finance/create-account-modal";
import { TransferFundsModal } from "@/components/finance/transfer-funds-modal";

export default function FinancialAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/finance/accounts");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalLiquid = accounts.reduce((acc, curr) => acc + (curr.currentBalance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#89652D]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#262421] tracking-tight">Financial Accounts & Cash Lockers</h1>
              <p className="text-xs text-[#77716A]">
                Authoritative operating accounts (HDFC Bank, Cash Locker, UPI) driving liquid position
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="px-3.5 py-2 bg-[#FFFEFC] border border-[#E8E2D8] hover:bg-[#F3EEE5] text-[#262421] text-xs font-semibold rounded-xl shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 text-[#89652D]" />
            <span>Transfer Funds</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-[#242321] hover:bg-[#383633] text-[#FAF8F5] text-xs font-bold rounded-xl shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Financial Account</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="p-5 rounded-2xl bg-[#242321] text-[#FAF8F5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-[#DFD4C3] uppercase tracking-wider">Total Liquid Operating Float</span>
          <div className="text-3xl font-bold text-[#FAF8F5] font-mono tabular-nums mt-1">
            ₹{totalLiquid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-[#DFD4C3]/80 mt-0.5">Across {accounts.length} active financial and cash channels</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#383633] border border-[#524E48] text-xs font-semibold text-[#DFD4C3]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#536B4E]" /> Reconciled with Ledger
          </span>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-[#77716A]">
            <div className="inline-block animate-spin w-5 h-5 border-2 border-[#89652D] border-t-transparent rounded-full mb-2"></div>
            <p>Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-[#77716A]">No financial accounts registered</div>
        ) : (
          accounts.map((a) => (
            <div key={a.id} className="bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl p-5 shadow-2xs space-y-4 hover:border-[#DFD4C3] transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F3EEE5] border border-[#E8E2D8] text-[#89652D] flex items-center justify-center font-bold">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#262421] text-sm">{a.name}</h3>
                    <span className="font-mono text-[10px] text-[#77716A] font-semibold">{a.accountCode}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#F3EEE5] text-[#77716A] border border-[#E8E2D8]">
                  {a.type}
                </span>
              </div>

              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] flex items-center justify-between">
                <span className="text-[#77716A] font-semibold uppercase text-[10px] tracking-wider">Current Balance</span>
                <span className="text-xl font-bold text-[#262421] font-mono tabular-nums">
                  ₹{a.currentBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {a.type === "BANK" && (
                <div className="text-[#77716A] text-xs border-t border-[#E8E2D8] pt-3 space-y-1 font-mono text-[11px]">
                  <div>Bank: <strong className="text-[#262421] font-sans">{a.bankName || "-"}</strong></div>
                  <div>A/C: <strong className="text-[#262421]">{a.accountNo || "-"}</strong></div>
                  <div>IFSC: <strong className="text-[#262421]">{a.ifscCode || "-"}</strong></div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchAccounts()}
      />

      <TransferFundsModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={() => fetchAccounts()}
        accounts={accounts}
      />
    </div>
  );
}
