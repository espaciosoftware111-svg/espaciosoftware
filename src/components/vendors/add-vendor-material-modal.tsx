"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface AddVendorMaterialModalProps {
  isOpen: boolean;
  vendorId: string | null;
  vendorName: string;
  initialMaterial?: {
    id: string;
    materialName: string;
    categoryKey: string;
    unitKey: string;
    referencePrice: number;
    notes?: string | null;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddVendorMaterialModal({
  isOpen,
  vendorId,
  vendorName,
  initialMaterial,
  onClose,
  onSuccess,
}: AddVendorMaterialModalProps) {
  const isEditing = !!initialMaterial;
  const [materialName, setMaterialName] = useState("");
  const [categoryKey, setCategoryKey] = useState("PLYWOOD");
  const [unitKey, setUnitKey] = useState("NOS");
  const [referencePrice, setReferencePrice] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialMaterial) {
        setMaterialName(initialMaterial.materialName);
        setCategoryKey(initialMaterial.categoryKey || "PLYWOOD");
        setUnitKey(initialMaterial.unitKey || "NOS");
        setReferencePrice(initialMaterial.referencePrice?.toString() || "");
        setNotes(initialMaterial.notes || "");
      } else {
        setMaterialName("");
        setCategoryKey("PLYWOOD");
        setUnitKey("NOS");
        setReferencePrice("");
        setNotes("");
      }
      setError("");
    }
  }, [isOpen, initialMaterial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!materialName.trim()) {
      setError("Please enter a material name");
      return;
    }

    const price = parseFloat(referencePrice);
    if (isNaN(price) || price < 0) {
      setError("Please enter a valid reference price");
      return;
    }

    if (!vendorId) {
      setError("Vendor ID is missing");
      return;
    }

    setLoading(true);
    try {
      if (isEditing && initialMaterial) {
        // Update existing material
        const res = await fetch(`/api/v1/procurement/vendors/${vendorId}/materials`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendorMaterialId: initialMaterial.id,
            referencePrice: price,
            unitKey,
            notes: notes.trim() || undefined,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error?.message || "Failed to update material");
          return;
        }
      } else {
        // Create new vendor material
        const res = await fetch(`/api/v1/procurement/vendors/${vendorId}/materials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materialName: materialName.trim(),
            categoryKey,
            unitKey,
            referencePrice: price,
            notes: notes.trim() || undefined,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error?.message || "Failed to add material");
          return;
        }
      }

      onSuccess();
      onClose();
    } catch {
      setError("Network error saving material. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Material & Reference Price" : `Add Material for ${vendorName}`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Important Rule Banner */}
        <div className="rounded border border-amber-200 bg-amber-50/60 p-2.5 text-[11px] text-amber-900 leading-relaxed">
          <strong>Reference Pricing Only:</strong> Vendor material prices are used strictly for reference estimation during material planning. Final order amounts are manually entered by the Super Admin after vendor acceptance.
        </div>

        {error && (
          <div className="p-2.5 bg-semantic-danger-bg text-semantic-danger border border-semantic-danger-border rounded text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-walnut uppercase mb-1">Material Name *</label>
          <input
            type="text"
            placeholder="e.g. 18mm Marine BWP Plywood / High Gloss Laminate"
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
            disabled={isEditing}
            className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal font-semibold focus:border-gold focus:outline-none disabled:bg-slate-100"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-walnut uppercase mb-1">Category</label>
            <select
              value={categoryKey}
              onChange={(e) => setCategoryKey(e.target.value)}
              disabled={isEditing}
              className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal font-semibold focus:border-gold focus:outline-none disabled:bg-slate-100"
            >
              <option value="PLYWOOD">Plywood</option>
              <option value="LAMINATE">Laminate</option>
              <option value="HARDWARE">Hardware & Fittings</option>
              <option value="PAINT">Paint & Finishes</option>
              <option value="ELECTRICAL">Electrical & Lighting</option>
              <option value="PLUMBING">Plumbing & Sanitary</option>
              <option value="GLASS">Glass & Mirrors</option>
              <option value="TILES">Tiles & Flooring</option>
              <option value="FABRIC">Fabric & Upholstery</option>
              <option value="GENERAL">General / Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-walnut uppercase mb-1">Base Unit</label>
            <select
              value={unitKey}
              onChange={(e) => setUnitKey(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal font-semibold focus:border-gold focus:outline-none"
            >
              <option value="NOS">Numbers (NOS)</option>
              <option value="SHEET">Sheet</option>
              <option value="SQFT">Sq. Feet (SQFT)</option>
              <option value="RFT">Running Feet (RFT)</option>
              <option value="KG">Kilogram (KG)</option>
              <option value="LITRE">Litre</option>
              <option value="BOX">Box</option>
              <option value="BUNDLE">Bundle</option>
              <option value="SET">Set / Pair</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-walnut uppercase mb-1">
            Reference Price (₹) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 2400"
            value={referencePrice}
            onChange={(e) => setReferencePrice(e.target.value)}
            className="w-full rounded border border-walnut/20 bg-white p-2 text-xs font-mono font-bold text-charcoal focus:border-gold focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-walnut uppercase mb-1">Specifications / Notes</label>
          <textarea
            rows={2}
            placeholder="Grade, thickness, brand or finishing notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal focus:border-gold focus:outline-none"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={loading}>
            {loading ? "Saving..." : isEditing ? "Update Material" : "+ Add Material"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
