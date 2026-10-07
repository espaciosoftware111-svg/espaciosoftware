"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Sparkles,
  Layers,
  Home,
  Boxes,
  FileText,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  MapPin,
  Loader2
} from "lucide-react";

interface StartAnotherProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onSuccess?: () => void;
}

export const StartAnotherProjectModal: React.FC<StartAnotherProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSuccess,
}) => {
  const router = useRouter();
  const toast = useToast();
  const [selectedPipeline, setSelectedPipeline] = useState<"PIPELINE_1" | "PIPELINE_2">("PIPELINE_2");
  const [customProjectTitle, setCustomProjectTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!project) return null;

  const clientName = project.client?.fullName || project.name || "Client";
  const clientPhone = project.client?.phone || "";
  const clientEmail = project.client?.email || "";
  const clientLocation = project.location || project.client?.address || "";
  const clientId = project.clientId || "";

  // Pipeline 1 handler: Complete Interiors (Creates Lead and navigates to Lead Workspace)
  const handleLaunchPipeline1 = async () => {
    setIsSubmitting(true);
    const reqTitle = customProjectTitle.trim() || `New Complete Interiors Project for ${clientName}`;
    try {
      const res = await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          phone: clientPhone.trim() || "+91 90000 00000",
          email: clientEmail.trim() || null,
          location: clientLocation.trim() || null,
          propertyTypeKey: "APARTMENT_INTERIOR",
          requirement: reqTitle,
          sourceKey: "DIRECT",
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.id) {
        toast.success("Pipeline 1 Opened", `Created new Complete Interiors Lead for ${clientName}`);
        onClose();
        if (onSuccess) onSuccess();
        router.push(`/leads?id=${json.data.id}`);
      } else {
        toast.error("Failed to Create Lead", json.error?.message || "Could not initialize Complete Interiors Lead");
      }
    } catch (err: any) {
      toast.error("Connection Error", "Failed to start Pipeline 1");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pipeline 2 handler: Modular & Materials Order (Creates Material Lead and opens Workspace)
  const handleLaunchPipeline2 = async () => {
    setIsSubmitting(true);
    const reqTitle = customProjectTitle.trim() || `New Modular & Material Order for ${clientName}`;
    try {
      const res = await fetch("/api/v1/material-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: clientName.trim(),
          primaryContact: clientPhone.trim() || "+91 90000 00000",
          email: clientEmail.trim() || null,
          location: clientLocation.trim() || "General Location",
          requirement: reqTitle,
          notes: `Repeat order initiated from completed project #${project.referenceNo || project.name}`,
          sourceKey: "DIRECT",
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.id) {
        toast.success("Pipeline 2 Opened", `Created new Modular & Material Lead for ${clientName}`);
        onClose();
        if (onSuccess) onSuccess();
        router.push(`/material-leads?id=${json.data.id}&tab=pipeline`);
      } else {
        toast.error("Failed to Create Material Lead", json.error?.message || "Could not initialize Modular Lead");
      }
    } catch (err: any) {
      toast.error("Connection Error", "Failed to start Pipeline 2");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Quotation Generation for Pipeline 2 (Step 1)
  const handleDirectQuotationStep1 = () => {
    onClose();
    const query = new URLSearchParams({
      type: "MATERIAL",
      clientId: clientId,
      projectId: project.id,
      clientName: clientName,
      title: "MODULAR & MATERIALS QUOTATION",
    });
    router.push(`/quotations/new?${query.toString()}`);
  };

  // Direct Confirmation Fee for Pipeline 2 (Step 2)
  const handleDirectConfirmationFeeStep2 = () => {
    onClose();
    const query = new URLSearchParams({
      type: "MATERIAL",
      mode: "INVOICE",
      clientId: clientId,
      projectId: project.id,
      clientName: clientName,
      title: "BOOKING CONFIRMATION TAX INVOICE",
    });
    router.push(`/quotations/new?${query.toString()}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start Another Project"
      description={`Initiate a new project or modular order for ${clientName}`}
      maxWidth="2xl"
    >
      <div className="space-y-6 pt-1">
        {/* Client Profile Pill */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                {clientName}
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  Existing Client
                </span>
              </div>
              <div className="text-slate-500 flex items-center gap-3 mt-0.5">
                {clientPhone && <span>📞 {clientPhone}</span>}
                {clientLocation && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" /> {clientLocation}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <span className="block font-medium">Previous Project</span>
            <strong className="text-slate-800">{project.name}</strong>
          </div>
        </div>

        {/* Optional Project / Order Note Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            New Project / Order Title (Optional)
          </label>
          <input
            type="text"
            value={customProjectTitle}
            onChange={(e) => setCustomProjectTitle(e.target.value)}
            placeholder={`e.g. ${clientName} - Modular Kitchen Addition or Master Suite Fitout`}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Choose Pipeline Header */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-600" /> Choose Execution Pipeline:
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ------------------------------------------------------------- */}
            {/* PIPELINE 1: COMPLETE INTERIORS                                */}
            {/* ------------------------------------------------------------- */}
            <div
              onClick={() => setSelectedPipeline("PIPELINE_1")}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                selectedPipeline === "PIPELINE_1"
                  ? "border-emerald-500 bg-emerald-50/40 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">Pipeline 1</h5>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        Complete Interiors
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="pipelineSelection"
                    checked={selectedPipeline === "PIPELINE_1"}
                    onChange={() => setSelectedPipeline("PIPELINE_1")}
                    className="accent-emerald-600 w-4 h-4 mt-1"
                  />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Full-scope interior design, 2D/3D layouts, site measurements, client revisions, and full residential turnkey execution.
                </p>

                {/* Workflow Preview */}
                <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 space-y-1.5 text-[11px]">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Full Execution Stages:
                  </div>
                  <ul className="text-slate-500 space-y-1 pl-4 list-disc">
                    <li>1. Requirement Gathering &amp; Site Measurement</li>
                    <li>2. 2D Layouts, Moodboards &amp; 3D Visuals</li>
                    <li>3. Itemized Quotation &amp; Approval</li>
                    <li>4. Booking Confirmation Fee &amp; Site Fitout</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200">
                <Button
                  onClick={handleLaunchPipeline1}
                  disabled={isSubmitting}
                  className="w-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-1.5 py-2"
                >
                  {isSubmitting && selectedPipeline === "PIPELINE_1" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Opening Pipeline 1...</span>
                    </>
                  ) : (
                    <>
                      <span>Open Pipeline 1 (Complete Interiors)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PIPELINE 2: MODULAR & MATERIALS SUPPLY                        */}
            {/* ------------------------------------------------------------- */}
            <div
              onClick={() => setSelectedPipeline("PIPELINE_2")}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                selectedPipeline === "PIPELINE_2"
                  ? "border-purple-500 bg-purple-50/40 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                      <Boxes className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">Pipeline 2</h5>
                      <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                        Modular &amp; Materials
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="pipelineSelection"
                    checked={selectedPipeline === "PIPELINE_2"}
                    onChange={() => setSelectedPipeline("PIPELINE_2")}
                    className="accent-purple-600 w-4 h-4 mt-1"
                  />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Fast modular kitchens, wardrobes, and material orders with immediate 2-step onboarding:
                </p>

                {/* 2 Critical Steps Callout */}
                <div className="p-2.5 bg-white rounded-lg border border-purple-200 space-y-2 text-[11px]">
                  <div className="font-bold text-purple-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" /> 2 Rapid Onboarding Steps:
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between p-1.5 bg-purple-50 rounded border border-purple-100">
                      <span className="font-semibold text-purple-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-purple-600" /> Step 1: Quotation Generation
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDirectQuotationStep1();
                        }}
                        className="text-[10px] font-bold text-purple-700 hover:text-purple-900 underline hover:bg-purple-100 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        Generate Quote ↗
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-1.5 bg-emerald-50 rounded border border-emerald-100">
                      <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Step 2: Confirmation Fee
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDirectConfirmationFeeStep2();
                        }}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline hover:bg-emerald-100 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        Issue Invoice ↗
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200">
                <Button
                  onClick={handleLaunchPipeline2}
                  disabled={isSubmitting}
                  className="w-full text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white flex items-center justify-center gap-1.5 py-2"
                >
                  {isSubmitting && selectedPipeline === "PIPELINE_2" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Opening Pipeline 2...</span>
                    </>
                  ) : (
                    <>
                      <span>Open Pipeline 2 (Modular &amp; Materials)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};
