"use client";

import { useState } from "react";
import { Plus, Trash2, X, Check } from "lucide-react";
import type { SerializedMenuItem } from "@/lib/types";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

// Plain <input> throughout this file rather than the shared <Input> —
// <Input> bakes in h-11 (its default height) via a class string that a
// className="h-8 ..." override doesn't reliably win against: Tailwind
// resolves same-specificity utility conflicts by their order in the
// compiled stylesheet, not by class-attribute order, so h-11 can (and did)
// still win. Confirmed in the built CSS (h-11 declared after h-8).
const fieldClass =
  "rounded-lg border border-ink-100 bg-cream-50 px-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-300 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-200";

/**
 * Inline editor for one menu item's option groups (Size, Spice Level,
 * Add-ons, ...). Name/min/max fields are uncontrolled with onBlur saves —
 * a controlled input wired straight to a PATCH-per-keystroke would refetch
 * and re-render the whole menu tree on every character typed. The `key`
 * includes the server value so the input remounts (picking up the fresh
 * defaultValue) only once a save actually lands, never mid-typing.
 */
export function ModifierGroupsEditor({
  item,
  onChange,
}: {
  item: SerializedMenuItem;
  onChange: () => void;
}) {
  const { dict } = useDictionary();
  const t = dict.adminMenu.modifiers;
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [busy, setBusy] = useState(false);
  const [addingOptionFor, setAddingOptionFor] = useState<string | null>(null);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("0");

  async function createGroup() {
    if (!newGroupName.trim()) return;
    setBusy(true);
    try {
      await fetch(`/api/menu/${item.id}/modifier-groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim(), sortOrder: item.modifierGroups.length }),
      });
      setNewGroupName("");
      setAddingGroup(false);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function updateGroup(
    groupId: string,
    data: Partial<{ name: string; minSelect: number; maxSelect: number | null }>
  ) {
    setBusy(true);
    try {
      await fetch(`/api/modifier-groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function deleteGroup(groupId: string) {
    if (!confirm(t.deleteGroupConfirm)) return;
    setBusy(true);
    try {
      await fetch(`/api/modifier-groups/${groupId}`, { method: "DELETE" });
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function createOption(groupId: string) {
    if (!newOptionName.trim()) return;
    const priceDelta = Number(newOptionPrice) || 0;
    setBusy(true);
    try {
      await fetch(`/api/modifier-groups/${groupId}/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOptionName.trim(), priceDelta }),
      });
      setNewOptionName("");
      setNewOptionPrice("0");
      setAddingOptionFor(null);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function toggleOptionAvailable(optionId: string, isAvailable: boolean) {
    setBusy(true);
    try {
      await fetch(`/api/modifier-options/${optionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable }),
      });
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function deleteOption(optionId: string) {
    setBusy(true);
    try {
      await fetch(`/api/modifier-options/${optionId}`, { method: "DELETE" });
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-ink-100 pt-3">
      {item.modifierGroups.length === 0 && !addingGroup && (
        <p className="text-xs text-ink-400">{t.noGroupsYet}</p>
      )}

      {item.modifierGroups.map((group) => (
        <div key={group.id} className="rounded-lg border border-ink-100 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <input
              key={`${group.id}-${group.name}`}
              defaultValue={group.name}
              disabled={busy}
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (val && val !== group.name) updateGroup(group.id, { name: val });
              }}
              className="h-8 flex-1 rounded-lg border border-ink-100 bg-cream-50 px-2.5 text-sm font-medium text-ink-900 outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-200"
            />
            <button
              onClick={() => deleteGroup(group.id)}
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-danger-500 hover:bg-danger-500/10"
              aria-label={t.deleteGroupAria}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>

          <div className="mb-2 flex items-center gap-3 text-xs text-ink-500">
            <label className="flex items-center gap-1.5">
              {t.min}
              <input
                key={`${group.id}-min-${group.minSelect}`}
                type="number"
                min={0}
                disabled={busy}
                defaultValue={group.minSelect}
                onBlur={(e) => {
                  const val = Math.max(0, Number(e.target.value) || 0);
                  if (val !== group.minSelect) updateGroup(group.id, { minSelect: val });
                }}
                className="h-7 w-14 rounded-lg border border-ink-100 px-1.5"
              />
            </label>
            <label className="flex items-center gap-1.5">
              {t.max}
              <input
                key={`${group.id}-max-${group.maxSelect ?? "inf"}`}
                type="number"
                min={0}
                placeholder={t.noLimit}
                disabled={busy}
                defaultValue={group.maxSelect ?? ""}
                onBlur={(e) => {
                  const val = e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0);
                  if (val !== group.maxSelect) updateGroup(group.id, { maxSelect: val });
                }}
                className="h-7 w-20 rounded-lg border border-ink-100 px-1.5"
              />
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            {group.options.map((option) => (
              <div
                key={option.id}
                className="flex items-center gap-2 rounded-lg bg-cream-50 px-2.5 py-1.5 text-sm"
              >
                <span className="flex-1 truncate text-ink-800">{option.name}</span>
                <span className="text-xs text-ink-500">
                  {option.priceDelta > 0 ? "+" : ""}
                  {option.priceDelta}
                </span>
                <ToggleSwitch
                  checked={option.isAvailable}
                  disabled={busy}
                  onChange={() => toggleOptionAvailable(option.id, !option.isAvailable)}
                />
                <button
                  onClick={() => deleteOption(option.id)}
                  className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-400 hover:bg-danger-500/10 hover:text-danger-500"
                  aria-label={t.deleteOptionAria}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          {addingOptionFor === group.id ? (
            <div className="mt-2 flex items-center gap-1.5">
              <input
                autoFocus
                placeholder={t.optionNamePlaceholder}
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createOption(group.id)}
                className={`h-8 flex-1 ${fieldClass}`}
              />
              <input
                type="number"
                placeholder="+$"
                value={newOptionPrice}
                onChange={(e) => setNewOptionPrice(e.target.value)}
                className={`h-8 w-16 ${fieldClass}`}
              />
              <button
                onClick={() => createOption(group.id)}
                disabled={busy}
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-brand-500 text-white"
              >
                <Check className="size-4" />
              </button>
              <button
                onClick={() => setAddingOptionFor(null)}
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-ink-100 text-ink-500"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingOptionFor(group.id)}
              className="mt-2 flex cursor-pointer items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              <Plus className="size-3" />
              {t.addOption}
            </button>
          )}
        </div>
      ))}

      {addingGroup ? (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            placeholder={t.groupNamePlaceholder}
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createGroup()}
            className={`h-9 flex-1 ${fieldClass}`}
          />
          <button
            onClick={createGroup}
            disabled={busy}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-brand-500 text-white"
          >
            <Check className="size-4" />
          </button>
          <button
            onClick={() => setAddingGroup(false)}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-ink-100 text-ink-500"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingGroup(true)}
          className="flex cursor-pointer items-center gap-1.5 self-start rounded-full border border-dashed border-ink-300 px-3 py-1.5 text-xs text-ink-500 hover:border-brand-400 hover:text-brand-600"
        >
          <Plus className="size-3" />
          {t.addOptionGroup}
        </button>
      )}
    </div>
  );
}
