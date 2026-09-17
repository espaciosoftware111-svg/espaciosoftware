"use client";

import React, { useState, useEffect } from "react";

interface UserOption {
  id: string;
  fullName: string;
  email: string;
}

interface ProjectOption {
  id: string;
  referenceNo: string;
  title: string;
}

interface IssueAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedEmployeeId?: string;
}

export function IssueAdvanceModal({ isOpen, onClose, onSuccess, preselectedEmployeeId }: IssueAdvanceModalProps) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [employeeId, setEmployeeId] = useState(preselectedEmployeeId || "");
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeePhone, setNewEmployeePhone] = useState("");
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsersAndProjects();
      if (preselectedEmployeeId) {
        setEmployeeId(preselectedEmployeeId);
      }
      setNewEmployeeName("");
      setNewEmployeePhone("");
      setNewEmployeeEmail("");
      setError(null);
    }
  }, [isOpen, preselectedEmployeeId]);

  async function fetchUsersAndProjects() {
    try {
      const [uRes, pRes] = await Promise.all([
        fetch("/api/v1/users"),
        fetch("/api/v1/projects"),
      ]);

      if (uRes.ok) {
        const data = await uRes.json();
        const userList = data.data || [];
        setUsers(userList);
        if (!preselectedEmployeeId && userList.length > 0) {
          setEmployeeId(userList[0].id);
        }
      }

      if (pRes.ok) {
        const data = await pRes.json();
        setProjects(data.data || []);
      }
    } catch (e) {
      console.error("Failed to load users or projects", e);
    }
  }

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError("Please enter a valid positive advance amount.");
        setLoading(false);
        return;
      }

      let effectiveEmployeeId = employeeId;

      // Handle "OTHERS" manual new employee creation
      if (employeeId === "OTHERS") {
        if (!newEmployeeName.trim()) {
          setError("Please enter the new employee's full name.");
          setLoading(false);
          return;
        }

        const empRes = await fetch("/api/v1/petty-cash/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: newEmployeeName.trim(),
            phone: newEmployeePhone.trim() || undefined,
            email: newEmployeeEmail.trim() || undefined,
          }),
        });

        const empJson = await empRes.json();
        if (!empRes.ok || !empJson.success) {
          throw new Error(empJson.error?.message || "Failed to create new employee");
        }

        effectiveEmployeeId = empJson.data.id;
      }

      if (!effectiveEmployeeId) {
        setError("Please select an employee.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/v1/petty-cash/advances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: effectiveEmployeeId,
          amount: parsedAmount,
          purpose,
          projectId: projectId || undefined,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to issue employee advance");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-lg rounded-xl bg-offwhite border border-walnut/20 shadow-modal overflow-hidden">
        <div className="flex items-center justify-between border-b border-walnut/15 px-6 py-4 bg-cream/70">
          <div>
            <h2 className="text-base font-bold text-charcoal">Issue Employee Advance</h2>
            <p className="text-xs text-walnut">Disburse petty cash float for field execution</p>
          </div>
          <button
            onClick={onClose}
            className="text-walnut hover:text-charcoal cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-md border border-semantic-danger-border bg-semantic-danger-bg p-3 text-xs font-semibold text-semantic-danger">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">
              Select Employee *
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-md border border-walnut/20 bg-cream/40 p-2.5 text-xs text-charcoal font-semibold focus:border-gold focus:outline-none"
              required
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
              <option value="OTHERS">-- + Others / Add New Employee --</option>
            </select>
          </div>

          {employeeId === "OTHERS" && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2.5 animate-in fade-in duration-150">
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                New Employee Information
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-semibold text-charcoal mb-0.5">
                    Employee Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={newEmployeeName}
                    onChange={(e) => setNewEmployeeName(e.target.value)}
                    className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal focus:border-gold focus:outline-none"
                    required={employeeId === "OTHERS"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal mb-0.5">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={newEmployeePhone}
                      onChange={(e) => setNewEmployeePhone(e.target.value)}
                      className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal mb-0.5">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rajesh@company.com"
                      value={newEmployeeEmail}
                      onChange={(e) => setNewEmployeeEmail(e.target.value)}
                      className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">
                Advance Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-md border border-walnut/20 bg-cream/40 p-2.5 text-xs font-mono text-charcoal focus:border-gold focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">
                Settlement Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-walnut/20 bg-cream/40 p-2.5 text-xs text-charcoal focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">
              Purpose / Description *
            </label>
            <input
              type="text"
              placeholder="e.g. Site supervisor petty cash float"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full rounded-md border border-walnut/20 bg-cream/40 p-2.5 text-xs text-charcoal focus:border-gold focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">
              Link to Project (Optional)
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-md border border-walnut/20 bg-cream/40 p-2.5 text-xs text-charcoal font-semibold focus:border-gold focus:outline-none"
            >
              <option value="">-- No Specific Project (General Advance) --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.referenceNo} — {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-walnut uppercase tracking-wider mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="Additional approval details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-walnut/20 bg-cream/40 p-2.5 text-xs text-charcoal focus:border-gold focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-walnut/15">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-walnut/20 px-4 py-2 text-xs font-bold text-walnut hover:bg-cream cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-gold px-4 py-2 text-xs font-bold text-charcoal hover:bg-gold-hover shadow-gold disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Issuing..." : "Issue Advance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
