"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { LeadFormModal } from "@/components/leads/lead-form-modal";
import { MaterialLeadFormModal } from "@/components/material-leads/material-lead-form-modal";
import {
  Layers,
  Home,
  Boxes,
  FileText,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  MapPin,
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
  const [selectedPipeline, setSelectedPipeline] = useState<"PIPELINE_1" | "PIPELINE_2">("PIPELINE_1");
  const [customProjectTitle, setCustomProjectTitle] = useState("");

  // Child Lead Form Modals
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [isMaterialLeadFormOpen, setIsMaterialLeadFormOpen] = useState(false);

  if (!project) return null;

  const clientName = project.client?.fullName || project.name || "Client";
  const clientPhone = project.client?.phone || "";
  const clientEmail = project.client?.email || "";
  const clientLocation = project.location || project.client?.address || "";
  const clientId = project.clientId || "";

  // Launch Pipeline 1: Complete Interiors Lead Intake
  const handleLaunchPipeline1 = () => {
    setIsLeadFormOpen(true);
  };

  // Launch Pipeline 2: Modular & Materials Lead Intake
  const handleLaunchPipeline2 = () => {
    setIsMaterialLeadFormOpen(true);
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !isLeadFormOpen && !isMaterialLeadFormOpen}
        onClose={onClose}
        title="Start Another Project"
        description={`Initiate a new project pipeline or modular order for ${clientName}`}
        maxWidth="2xl"
      >
        <div className="space-y-6 pt-1 select-none">
          {/* Client Profile Banner */}
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
              <strong className="text-slate-800">{project.referenceNo || project.name}</strong>
            </div>
          </div>

          {/* Optional Project / Order Note Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              New Project / Requirement Scope (Optional Note)
            </label>
            <input
              type="text"
              value={customProjectTitle}
              onChange={(e) => setCustomProjectTitle(e.target.value)}
              placeholder={`e.g. ${clientName} - New Villa Fitout or Kitchen Addition`}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Selecting a pipeline below will open the new lead intake form to capture site measurements, property location, and scope specifications from the beginning.
            </p>
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
                          Complete Turnkey Interiors
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
                    Starts a new turnkey interior lead. Asks for site address, property type, carpet area, space configurations, and budget.
                  </p>

                  {/* Workflow Preview */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 space-y-1.5 text-[11px]">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" /> Canonical Execution Flow:
                    </div>
                    <ul className="text-slate-500 space-y-1 pl-4 list-disc">
                      <li>1. Site Intake &amp; Measurement Capture</li>
                      <li>2. 2D Layouts, Moodboards &amp; 3D Visuals</li>
                      <li>3. Itemized Quotation &amp; Approval</li>
                      <li>4. Booking Confirmation Fee &amp; Site Fitout</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200">
                  <Button
                    onClick={handleLaunchPipeline1}
                    className="w-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-1.5 py-2 cursor-pointer shadow-xs"
                  >
                    <span>Open Pipeline 1 (Enter Site Details)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
                          Modular &amp; Materials Supply
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
                    Starts a modular orders / materials lead. Asks for delivery site location, required materials list, and supplier specs.
                  </p>

                  {/* Workflow Callout */}
                  <div className="p-2.5 bg-white rounded-lg border border-purple-200 space-y-2 text-[11px]">
                    <div className="font-bold text-purple-950 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-600" /> Modular Execution Flow:
                    </div>
                    <ul className="text-slate-500 space-y-1 pl-4 list-disc">
                      <li>1. Site Delivery Location &amp; Material Intake</li>
                      <li>2. Supplier Confirmation &amp; Quotation</li>
                      <li>3. Confirmation Invoice &amp; Dispatch</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200">
                  <Button
                    onClick={handleLaunchPipeline2}
                    className="w-full text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white flex items-center justify-center gap-1.5 py-2 cursor-pointer shadow-xs"
                  >
                    <span>Open Pipeline 2 (Enter Site Details)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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

      {/* Pipeline 1: Standard Complete Interiors Lead Form Modal */}
      {isLeadFormOpen && (
        <LeadFormModal
          isOpen={isLeadFormOpen}
          onClose={() => setIsLeadFormOpen(false)}
          initialLead={{
            clientName,
            phone: clientPhone,
            email: clientEmail,
            requirement: customProjectTitle.trim() || "Turnkey Interiors",
            requirementType: "Turnkey Interiors",
            propertyLocation: "",
            propertyType: "Apartment",
            source: "REFERRAL",
            notes: `New project pipeline initiated for existing client ${clientName} (Prior Project: ${project.referenceNo || project.name})${customProjectTitle.trim() ? ` - Scope: ${customProjectTitle.trim()}` : ""}`,
          }}
          onSuccess={(newLead: any) => {
            setIsLeadFormOpen(false);
            onClose();
            if (onSuccess) onSuccess();
            if (newLead?.id) {
              toast.success("New Pipeline Lead Created", `Opened Complete Interiors workspace for ${clientName}`);
              router.push(`/leads?id=${newLead.id}`);
            } else {
              router.push("/leads");
            }
          }}
        />
      )}

      {/* Pipeline 2: Standard Modular & Materials Lead Form Modal */}
      {isMaterialLeadFormOpen && (
        <MaterialLeadFormModal
          isOpen={isMaterialLeadFormOpen}
          onClose={() => setIsMaterialLeadFormOpen(false)}
          initialData={{
            customerName: clientName,
            primaryContact: clientPhone,
            email: clientEmail,
            location: "",
            source: "REFERRAL",
            notes: `New Modular & Materials order for existing client ${clientName} (Prior Project: ${project.referenceNo || project.name})${customProjectTitle.trim() ? ` - Scope: ${customProjectTitle.trim()}` : ""}`,
          }}
          onSuccess={(newLead: any) => {
            setIsMaterialLeadFormOpen(false);
            onClose();
            if (onSuccess) onSuccess();
            if (newLead?.id) {
              toast.success("New Modular Pipeline Created", `Opened Modular & Materials workspace for ${clientName}`);
              router.push(`/material-leads?id=${newLead.id}&tab=pipeline`);
            } else {
              router.push("/material-leads");
            }
          }}
        />
      )}
    </>
  );
};

