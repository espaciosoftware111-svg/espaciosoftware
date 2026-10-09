"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Kanban,
  Calendar as CalendarIcon,
  User,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Folder,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";

interface TaskItem {
  id: string;
  referenceNo: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  type: string;
  assignee?: { id: string; fullName: string; email: string } | null;
  createdBy?: { id: string; fullName: string } | null;
  project?: { id: string; referenceNo: string; title: string } | null;
  client?: { id: string; referenceNo: string; fullName: string } | null;
  dueAt?: string | null;
  checklists?: { id: string; title: string; isCompleted: boolean }[];
  createdAt: string;
}

export default function TaskMasterListPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Create Task Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("NORMAL");
  const [newType, setNewType] = useState("GENERAL");
  const [newDueAt, setNewDueAt] = useState("");
  const [newChecklist, setNewChecklist] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Task Detail Modal
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/api/v1/tasks?limit=50`;
      if (statusFilter !== "ALL") url += `&status=${statusFilter}`;
      if (priorityFilter !== "ALL") url += `&priority=${priorityFilter}`;
      if (typeFilter !== "ALL") url += `&type=${typeFilter}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setTasks(json.data.tasks || []);
      }
    } catch {
      // Quiet handling
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, typeFilter, searchQuery]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const checklistItems = newChecklist
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim() || undefined,
          priority: newPriority,
          type: newType,
          dueAt: newDueAt ? new Date(newDueAt).toISOString() : undefined,
          checklists: checklistItems,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsCreateModalOpen(false);
        setNewTitle("");
        setNewDesc("");
        setNewDueAt("");
        setNewChecklist("");
        fetchTasks();
      }
    } catch {
      // Quiet handling
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, nextStatus: string) => {
    try {
      await fetch(`/api/v1/tasks/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: nextStatus as any } : t))
      );
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask((prev) => (prev ? { ...prev, status: nextStatus as any } : null));
      }
    } catch {
      // Quiet handling
    }
  };

  const toggleChecklistItem = async (checklistId: string) => {
    try {
      await fetch(`/api/v1/tasks/placeholder/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklistId }),
      });
      fetchTasks();
    } catch {
      // Quiet handling
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-700 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> URGENT
          </span>
        );
      case "HIGH":
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-800 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> HIGH
          </span>
        );
      case "LOW":
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600">
            LOW
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-700">
            NORMAL
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">COMPLETED</span>;
      case "IN_PROGRESS":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800">IN PROGRESS</span>;
      case "BLOCKED":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800">BLOCKED</span>;
      case "CANCELLED":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-500">CANCELLED</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700">TO DO</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
              <CheckSquare className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-[#262421] tracking-tight">Work & Task Management</h1>
          </div>
          <p className="text-xs text-[#77716A] mt-1 ml-10">
            Centralized task engine for tracking, assigning, and executing work across all ERP modules
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs py-1.5 h-8.5 bg-[#242321] text-[#FAF8F5] hover:bg-[#383633] border border-[#242321] font-bold shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create Task
          </Button>
        </div>
      </div>

      {/* 2. Sub-view Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-[#EAE5DD] px-1 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-6">
          <Link
            href="/tasks"
            prefetch={true}
            className="py-3 px-1 text-xs font-bold whitespace-nowrap transition-all border-b-2 border-[#B99558] text-[#242321] flex items-center gap-2"
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#89652D]" /> Master Task List
          </Link>

          <Link
            href="/tasks/my-work"
            prefetch={true}
            className="py-3 px-1 text-xs font-medium whitespace-nowrap transition-all border-b-2 border-transparent text-[#77736C] hover:text-[#242321] hover:border-[#DCD5C9] flex items-center gap-2"
          >
            <User className="w-3.5 h-3.5 text-[#77716A]" /> My Work & Today View
          </Link>

          <Link
            href="/tasks/board"
            prefetch={true}
            className="py-3 px-1 text-xs font-medium whitespace-nowrap transition-all border-b-2 border-transparent text-[#77736C] hover:text-[#242321] hover:border-[#DCD5C9] flex items-center gap-2"
          >
            <Kanban className="w-3.5 h-3.5 text-[#77716A]" /> Kanban Task Board
          </Link>

          <Link
            href="/calendar"
            prefetch={true}
            className="py-3 px-1 text-xs font-medium whitespace-nowrap transition-all border-b-2 border-transparent text-[#77736C] hover:text-[#242321] hover:border-[#DCD5C9] flex items-center gap-2"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-[#77716A]" /> Calendar Workspace
          </Link>
        </div>

        <button
          onClick={fetchTasks}
          className="p-1.5 text-[#77716A] hover:text-[#262421] rounded-md hover:bg-[#F3EEE5] transition-colors mb-1 cursor-pointer"
          title="Refresh tasks"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-2.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-[#77716A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by TSK reference, title, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-9 pr-8 text-xs bg-transparent border-none text-[#262421] placeholder-[#77716A] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <FilterSelect
            label="Status"
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val || "ALL")}
            options={[
              { value: "TODO", label: "To Do" },
              { value: "IN_PROGRESS", label: "In Progress" },
              { value: "BLOCKED", label: "Blocked" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
            variant="beige"
            size="sm"
          />

          <FilterSelect
            label="Priority"
            placeholder="All Priorities"
            value={priorityFilter}
            onChange={(val) => setPriorityFilter(val || "ALL")}
            options={[
              { value: "URGENT", label: "Urgent" },
              { value: "HIGH", label: "High" },
              { value: "NORMAL", label: "Normal" },
              { value: "LOW", label: "Low" },
            ]}
            variant="beige"
            size="sm"
          />

          <FilterSelect
            label="Type"
            placeholder="All Types"
            value={typeFilter}
            onChange={(val) => setTypeFilter(val || "ALL")}
            options={[
              { value: "GENERAL", label: "General" },
              { value: "PROJECT", label: "Project" },
              { value: "FOLLOW_UP", label: "Follow-up" },
              { value: "APPROVAL", label: "Approval" },
              { value: "PROCUREMENT", label: "Procurement" },
              { value: "FINANCE", label: "Finance" },
              { value: "INVENTORY", label: "Inventory" },
            ]}
            variant="beige"
            size="sm"
          />
        </div>
      </div>

      {/* 4. Task Master Table */}
      <div className="w-full bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E8E2D8] bg-transparent text-[#77716A] text-[11px] font-bold uppercase tracking-wider select-none">
                <th className="py-3.5 px-4 font-bold">Reference</th>
                <th className="py-3.5 px-4 font-bold">Task Title</th>
                <th className="py-3.5 px-4 font-bold">Priority</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold">Assignee</th>
                <th className="py-3.5 px-4 font-bold">Project / Client</th>
                <th className="py-3.5 px-4 font-bold">Due Date</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#77716A]">
                    Loading task records...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#77716A]">
                    No tasks match the active filters.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const completedChecklists = (task.checklists || []).filter((c) => c.isCompleted).length;
                  const totalChecklists = (task.checklists || []).length;

                  return (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="hover:bg-[#FAF7F2] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#262421]">
                        {task.referenceNo}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-semibold text-[#262421] block truncate">{task.title}</span>
                        {totalChecklists > 0 && (
                          <span className="text-[10px] text-[#77716A] mt-0.5 block">
                            Checklist: {completedChecklists}/{totalChecklists} done
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">{getPriorityBadge(task.priority)}</td>
                      <td className="py-3.5 px-4">{getStatusBadge(task.status)}</td>
                      <td className="py-3.5 px-4 text-[#262421] font-medium">
                        {task.assignee ? task.assignee.fullName : <span className="text-[#77716A] font-normal">Unassigned</span>}
                      </td>
                      <td className="py-3.5 px-4 text-[#77716A]">
                        {task.project ? (
                          <span className="font-medium text-[#89652D] flex items-center gap-1">
                            <Folder className="w-3 h-3" /> {task.project.referenceNo}
                          </span>
                        ) : task.client ? (
                          <span className="text-[#262421]">{task.client.fullName}</span>
                        ) : (
                          <span className="text-[#77716A]">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#77716A] font-mono text-[11px]">
                        {task.dueAt ? formatDate(task.dueAt) : <span className="text-[#77716A]/70">No due date</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#262421] hover:bg-[#F3EEE5] bg-[#FFFEFC] border border-[#E8E2D8] rounded-md transition-colors shadow-2xs"
                        >
                          View Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TASK MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs">
          <div className="bg-offwhite rounded-xl shadow-2xl border border-walnut/20 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-walnut/15 flex items-center justify-between bg-cream/70">
              <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-gold" /> Create New Work Task
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-walnut hover:text-charcoal rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-walnut mb-1">
                  Task Title <span className="text-semantic-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspect living room false ceiling framing"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-walnut/20 bg-cream/40 rounded-lg text-charcoal focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-walnut mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide scope, location notes, or specifications..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-walnut/20 bg-cream/40 rounded-lg text-charcoal focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-walnut mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-walnut/20 rounded-lg bg-cream/40 text-charcoal font-semibold focus:outline-none focus:border-gold"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-walnut mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-walnut/20 rounded-lg bg-cream/40 text-charcoal font-semibold focus:outline-none focus:border-gold"
                  >
                    <option value="GENERAL">General</option>
                    <option value="PROJECT">Project</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                    <option value="APPROVAL">Approval</option>
                    <option value="PROCUREMENT">Procurement</option>
                    <option value="FINANCE">Finance</option>
                    <option value="INVENTORY">Inventory</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-walnut mb-1">Due Date</label>
                  <input
                    type="datetime-local"
                    value={newDueAt}
                    onChange={(e) => setNewDueAt(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-walnut/20 bg-cream/40 rounded-lg text-charcoal focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-walnut mb-1">
                  Checklist Items (One per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Verify measurements&#10;Take site photos&#10;Obtain client signature"
                  value={newChecklist}
                  onChange={(e) => setNewChecklist(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-walnut/20 bg-cream/40 rounded-lg text-charcoal focus:outline-none focus:border-gold font-mono"
                />
              </div>

              <div className="pt-3 border-t border-walnut/15 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-walnut hover:bg-cream rounded-lg transition-colors border border-walnut/20 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-charcoal bg-gold hover:bg-gold-hover rounded-lg shadow-gold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAIL MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                  {selectedTask.referenceNo}
                </span>
                {getStatusBadge(selectedTask.status)}
                {getPriorityBadge(selectedTask.priority)}
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedTask.title}</h2>
                {selectedTask.description && (
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedTask.description}
                  </p>
                )}
              </div>

              {/* Status Transition Control */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700">Change Status:</span>
                {["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED"].map((st) => (
                  <button
                    key={st}
                    disabled={selectedTask.status === st}
                    onClick={() => handleStatusChange(selectedTask.id, st)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      selectedTask.status === st
                        ? "bg-slate-900 text-white font-semibold cursor-default"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </button>
                ))}
              </div>

              {/* Checklists */}
              {selectedTask.checklists && selectedTask.checklists.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900">Checklist Progress</h4>
                  <div className="space-y-1.5">
                    {selectedTask.checklists.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => toggleChecklistItem(c.id)}
                        className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 p-1.5 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={c.isCompleted}
                          readOnly
                          className="w-3.5 h-3.5 text-emerald-600 rounded"
                        />
                        <span className={c.isCompleted ? "line-through text-slate-400" : "font-medium"}>
                          {c.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Created {formatDate(selectedTask.createdAt)}</span>
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
