"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  FileText,
  Send,
  Trophy,
  XCircle,
  ShoppingCart,
  Truck,
  PackageCheck,
  PhoneCall,
  PhoneOff,
  Boxes,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PipelineTrackerProps {
  currentStage: string;
  onAdvanceStage?: (newStage: string) => void;
  onOpenContactModal?: (status: "CONTACTED" | "NOT_CONTACTED") => void;
  onOpenPlaceOrderModal?: () => void;
  onOpenVendorResponseModal?: (response: "ACCEPTED" | "REJECTED") => void;
  onOpenNewVendorRequestModal?: () => void;
  hasRequirements?: boolean;
  hasQuotations?: boolean;
  hasOrders?: boolean;
  latestVendorRequestStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | null;
}

export const MaterialLeadPipelineTracker: React.FC<PipelineTrackerProps> = ({
  currentStage,
  onAdvanceStage,
  onOpenContactModal,
  onOpenPlaceOrderModal,
  onOpenVendorResponseModal,
  onOpenNewVendorRequestModal,
  hasRequirements = false,
  hasQuotations = false,
  hasOrders = false,
  latestVendorRequestStatus = null,
}) => {
  const normStage = (currentStage || "NEW").toUpperCase().replace(/\s+/g, "_");

  const isLost = normStage === "LOST" || normStage === "CANCELLED";
  const isNotContacted = normStage === "NOT_CONTACTED";
  const isVendorRejected = normStage === "VENDOR_REJECTED" || latestVendorRequestStatus === "REJECTED";

  // Standard happy path stages
  const standardStages = [
    { key: "NEW", label: "New Lead", icon: Clock },
    { key: "CONTACTED", label: "Contacted", icon: PhoneCall },
    { key: "MATERIAL_REQUIRED", label: "Materials Required", icon: Boxes },
    { key: "QUOTATION_GENERATED", label: "Quotation Generated", icon: FileText },
    { key: "QUOTATION_SENT", label: "Quotation Sent", icon: Send },
    { key: "WON", label: "Won", icon: Trophy },
    { key: "ORDER_PLACED", label: "Order Placed", icon: ShoppingCart },
    { key: "VENDOR_REQUEST", label: "Vendor Request", icon: Truck },
    { key: "ORDER_CONFIRMED", label: "Confirmed Order", icon: PackageCheck },
  ];

  // Determine stage index
  const getStageIndex = (stage: string) => {
    switch (stage) {
      case "NEW":
        return 0;
      case "NOT_CONTACTED":
        return 1;
      case "CONTACTED":
        return 1;
      case "MATERIAL_REQUIRED":
      case "REQUIREMENT_DISCUSSED":
        return 2;
      case "QUOTATION_IN_PROGRESS":
      case "QUOTATION_GENERATED":
        return 3;
      case "QUOTATION_SENT":
        return 4;
      case "WON":
        return 5;
      case "ORDER_PLACED":
        return 6;
      case "VENDOR_REQUEST":
      case "VENDOR_REJECTED":
      case "VENDOR_ACCEPTED":
        return 7;
      case "ORDER_CONFIRMED":
      case "MATERIALS_ORDER":
      case "ORDER_COMPLETED":
        return 8;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(normStage);

  return (
    <div className="bg-white rounded-xl border border-walnut/15 p-4 shadow-2xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-walnut/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
            Material Lead Pipeline
          </span>
          <Badge
            variant={
              isLost
                ? "danger"
                : isNotContacted || isVendorRejected
                ? "warning"
                : normStage === "ORDER_CONFIRMED" || normStage === "VENDOR_ACCEPTED"
                ? "success"
                : "pending"
            }
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            {normStage.replace(/_/g, " ")}
          </Badge>
        </div>

        {/* Dynamic Action Buttons for current stage */}
        <div className="flex flex-wrap items-center gap-1.5">
          {normStage === "NEW" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenContactModal?.("NOT_CONTACTED")}
                className="text-xs h-7 gap-1"
              >
                <PhoneOff className="w-3 h-3 text-amber-600" />
                Mark Not Contacted
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => onOpenContactModal?.("CONTACTED")}
                className="text-xs h-7 gap-1"
              >
                <PhoneCall className="w-3 h-3" />
                Mark Contacted
              </Button>
            </>
          )}

          {normStage === "NOT_CONTACTED" && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onOpenContactModal?.("CONTACTED")}
              className="text-xs h-7 gap-1"
            >
              <PhoneCall className="w-3 h-3" />
              Customer Contacted → Advance
            </Button>
          )}

          {normStage === "CONTACTED" && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onAdvanceStage?.("MATERIAL_REQUIRED")}
              className="text-xs h-7 gap-1"
            >
              <Boxes className="w-3 h-3" />
              Set Material Required
            </Button>
          )}

          {normStage === "MATERIAL_REQUIRED" && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onAdvanceStage?.("QUOTATION_GENERATED")}
              className="text-xs h-7 gap-1"
            >
              <FileText className="w-3 h-3" />
              Quotation Generated
            </Button>
          )}

          {normStage === "QUOTATION_GENERATED" && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onAdvanceStage?.("QUOTATION_SENT")}
              className="text-xs h-7 gap-1"
            >
              <Send className="w-3 h-3" />
              Mark Quotation Sent
            </Button>
          )}

          {normStage === "QUOTATION_SENT" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAdvanceStage?.("LOST")}
                className="text-xs h-7 gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <XCircle className="w-3 h-3" />
                Mark Lost
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => onAdvanceStage?.("WON")}
                className="text-xs h-7 gap-1"
              >
                <Trophy className="w-3 h-3" />
                Mark Won
              </Button>
            </>
          )}

          {normStage === "WON" && (
            <Button
              size="sm"
              variant="primary"
              onClick={onOpenPlaceOrderModal}
              className="text-xs h-7 gap-1.5 font-bold"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              + Place Material Order
            </Button>
          )}

          {(normStage === "ORDER_PLACED" || normStage === "VENDOR_REQUEST") && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenVendorResponseModal?.("REJECTED")}
                className="text-xs h-7 gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <XCircle className="w-3 h-3" />
                Vendor Rejects
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => onOpenVendorResponseModal?.("ACCEPTED")}
                className="text-xs h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
              >
                <CheckCircle2 className="w-3 h-3" />
                Vendor Accepts → Confirm
              </Button>
            </>
          )}

          {normStage === "VENDOR_REJECTED" && (
            <Button
              size="sm"
              variant="primary"
              onClick={onOpenNewVendorRequestModal}
              className="text-xs h-7 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Select Another Vendor
            </Button>
          )}

          {normStage === "VENDOR_ACCEPTED" && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onAdvanceStage?.("ORDER_CONFIRMED")}
              className="text-xs h-7 gap-1"
            >
              <PackageCheck className="w-3 h-3" />
              View in Materials Order
            </Button>
          )}
        </div>
      </div>

      {/* Visual Step Progression Bar */}
      <div className="overflow-x-auto py-1">
        <div className="flex items-center min-w-[680px] justify-between">
          {standardStages.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < currentIndex && !isLost;
            const isCurrent = idx === currentIndex && !isLost;
            const isPending = idx > currentIndex && !isLost;

            let stepBg = "bg-cream/60 border-walnut/20 text-walnut/60";
            let lineBg = "bg-walnut/15";

            if (isCompleted) {
              stepBg = "bg-emerald-50 border-emerald-500 text-emerald-600";
              lineBg = "bg-emerald-400";
            } else if (isCurrent) {
              stepBg = "bg-gold/15 border-gold text-charcoal ring-2 ring-gold/30";
              lineBg = "bg-walnut/20";
            }

            return (
              <React.Fragment key={stage.key}>
                <div className="flex flex-col items-center text-center group cursor-default">
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${stepBg}`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-semibold max-w-[70px] leading-tight ${
                      isCurrent
                        ? "text-charcoal font-bold"
                        : isCompleted
                        ? "text-emerald-800"
                        : "text-walnut/60"
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>

                {idx < standardStages.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1.5 transition-colors ${lineBg}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Special Branch Notice Banner */}
      {isLost && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            <strong>Lead Closed as Lost:</strong> This material lead has stopped progression. The
            complete customer, quotation, and requirements history remains preserved for
            reporting.
          </span>
        </div>
      )}

      {isNotContacted && (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <PhoneOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Customer Not Contacted:</strong> Follow-up required. Contact the customer
              and update status once reached.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenContactModal?.("CONTACTED")}
            className="text-[11px] h-6 bg-white border-amber-300"
          >
            Mark Contacted Now
          </Button>
        </div>
      )}

      {isVendorRejected && (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Vendor Request Rejected:</strong> The assigned vendor was unable to fulfill
              the order. Select another vendor to dispatch a new request.
            </span>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={onOpenNewVendorRequestModal}
            className="text-[11px] h-6"
          >
            + Re-Select Vendor
          </Button>
        </div>
      )}
    </div>
  );
};
