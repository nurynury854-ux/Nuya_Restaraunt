"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Check, Upload, UtensilsCrossed, ListPlus, CheckCircle2 } from "lucide-react";
import type { SerializedMenuCategory, SerializedMenuItem } from "@/lib/types";
import { usePolling } from "@/lib/hooks/usePolling";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, FieldWrapper } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { ModifierGroupsEditor } from "@/components/admin/menu/ModifierGroupsEditor";
import type { Dictionary } from "@/lib/i18n/getDictionary";

interface EditingItem {
  id: string;
  name: string;
  price: string;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
}

const POLL_INTERVAL_MS = 10000;

async function uploadImage(file: File, uploadFailedMessage: string): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("kind", "items");
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? uploadFailedMessage);
  return data.url as string;
}

export function MenuManager({
  initialCategories,
}: {
  initialCategories: SerializedMenuCategory[];
}) {
  const router = useRouter();
  const { dict } = useDictionary();
  const t = dict.adminMenu;
  const [categories, setCategories] = useState(initialCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialCategories[0]?.id ?? ""
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [newItem, setNewItem] = useState({ name: "", price: "", description: "", imageUrl: "" });
  const [busy, setBusy] = useState(false);
  const [uploadingNew, setUploadingNew] = useState(false);
  const [uploadingEdit, setUploadingEdit] = useState(false);
  const [expandedModifiersId, setExpandedModifiersId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const busyRef = useRef(false);
  useEffect(() => {
    busyRef.current =
      busy || uploadingNew || uploadingEdit || !!editingItem || addingCategory || !!expandedModifiersId;
  });

  function refresh() {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data: { categories: (SerializedMenuCategory & { _count: { items: number } })[] }) => {
        // Keep existing item lists for categories we already have items loaded
        // for; the categories endpoint alone doesn't include item bodies.
        return fetch("/api/menu")
          .then((res) => res.json())
          .then((menuData: { items: (SerializedMenuItem & { categoryId: string })[] }) => {
            const byCategory = new Map<string, SerializedMenuCategory>();
            for (const cat of data.categories) {
              byCategory.set(cat.id, { id: cat.id, name: cat.name, sortOrder: cat.sortOrder, items: [] });
            }
            for (const item of menuData.items) {
              byCategory.get(item.categoryId)?.items.push(item);
            }
            setCategories(
              Array.from(byCategory.values())
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((c) => ({ ...c, items: c.items.sort((a, b) => a.sortOrder - b.sortOrder) }))
            );
          });
      })
      .catch(() => null);
  }

  // Pick up menu edits made from another tab/device, but never while this
  // admin has something mid-edit locally.
  usePolling(() => {
    if (!busyRef.current) refresh();
  }, POLL_INTERVAL_MS);

  const selectedCategory =
    categories.find((c) => c.id === selectedCategoryId) ?? categories[0];

  async function createCategory() {
    if (!newCategoryName.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim(), sortOrder: categories.length }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.createCategoryError);
        return;
      }
      setNewCategoryName("");
      setAddingCategory(false);
      setSelectedCategoryId(data.category.id);
      router.refresh();
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm(t.deleteCategoryConfirm)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.deleteCategoryError);
        return;
      }
      if (selectedCategoryId === id) setSelectedCategoryId("");
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function createItem() {
    if (!newItem.name.trim() || !selectedCategory) return;
    if (uploadingNew) {
      setError(t.photoUploadingWait);
      return;
    }
    const price = Number(newItem.price);
    if (Number.isNaN(price) || price < 0) {
      setError(t.invalidPrice);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategory.id,
          name: newItem.name.trim(),
          price,
          description: newItem.description.trim() || undefined,
          imageUrl: newItem.imageUrl || undefined,
          sortOrder: selectedCategory.items.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.createItemError);
        return;
      }
      setNewItem({ name: "", price: "", description: "", imageUrl: "" });
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleNewItemImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingNew(true);
    setError("");
    try {
      const url = await uploadImage(file, t.uploadFailed);
      setNewItem((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.uploadFailed);
    } finally {
      setUploadingNew(false);
      e.target.value = "";
    }
  }

  function startEdit(item: SerializedMenuItem) {
    setEditingItem({
      id: item.id,
      name: item.name,
      price: String(item.price),
      description: item.description ?? "",
      imageUrl: item.imageUrl ?? "",
      isAvailable: item.isAvailable,
    });
  }

  async function handleEditItemImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;
    setUploadingEdit(true);
    setError("");
    try {
      const url = await uploadImage(file, t.uploadFailed);
      setEditingItem((prev) => (prev ? { ...prev, imageUrl: url } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.uploadFailed);
    } finally {
      setUploadingEdit(false);
      e.target.value = "";
    }
  }

  async function saveEdit() {
    if (!editingItem) return;
    if (uploadingEdit) {
      setError(t.photoUploadingWait);
      return;
    }
    const price = Number(editingItem.price);
    if (Number.isNaN(price) || price < 0) {
      setError(t.invalidPrice);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/menu/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingItem.name.trim(),
          price,
          description: editingItem.description.trim() || null,
          imageUrl: editingItem.imageUrl || null,
          isAvailable: editingItem.isAvailable,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.updateItemError);
        return;
      }
      setEditingItem(null);
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm(t.deleteItemConfirm)) return;
    setBusy(true);
    setError("");
    try {
      await fetch(`/api/menu/${id}`, { method: "DELETE" });
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggleAvailable(item: SerializedMenuItem) {
    setBusy(true);
    try {
      await fetch(`/api/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="rounded-xl bg-danger-500/10 px-4 py-2.5 text-sm text-danger-600">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <div key={cat.id} className="group relative">
            <button
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategoryId === cat.id
                  ? "bg-brand-500 text-white"
                  : "bg-white text-ink-600 border border-ink-100 hover:border-brand-300"
              }`}
            >
              {cat.name}
              <span className="text-xs opacity-70">({cat.items.length})</span>
            </button>
            <button
              onClick={() => deleteCategory(cat.id)}
              className="absolute -right-1 -top-1 hidden size-5 cursor-pointer items-center justify-center rounded-full bg-danger-500 text-white group-hover:flex"
              aria-label={t.deleteCategoryAria}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}

        {addingCategory ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              placeholder={t.categoryNamePlaceholder}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createCategory()}
              // Plain <input>, not the shared <Input> — its baked-in h-11
              // beats an h-9 override passed via className (Tailwind
              // resolves same-specificity utility conflicts by order in the
              // compiled stylesheet, not by class-attribute order).
              className="h-9 w-32 rounded-xl border border-ink-100 bg-cream-50 px-3.5 text-sm text-ink-900 outline-none placeholder:text-ink-300 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-200"
            />
            <button
              onClick={createCategory}
              disabled={busy}
              className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-brand-500 text-white"
            >
              <Check className="size-4" />
            </button>
            <button
              onClick={() => setAddingCategory(false)}
              className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-ink-100 text-ink-500"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingCategory(true)}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-ink-300 px-4 py-2 text-sm text-ink-500 hover:border-brand-400 hover:text-brand-600"
          >
            <Plus className="size-3.5" />
            {t.newCategory}
          </button>
        )}
      </div>

      {selectedCategory && (
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="font-semibold text-ink-900">
            {formatMessage(t.itemsHeading, { name: selectedCategory.name })}
          </h2>

          {selectedCategory.items.length === 0 && (
            <p className="py-4 text-center text-sm text-ink-400">{t.noItemsYet}</p>
          )}

          <ul className="flex flex-col gap-2.5">
            {selectedCategory.items.map((item) => (
              <li key={item.id} className="rounded-xl border border-ink-100 bg-cream-50 p-3.5">
                {editingItem?.id === item.id ? (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex gap-3">
                      <ImagePicker
                        imageUrl={editingItem.imageUrl}
                        uploading={uploadingEdit}
                        onChange={handleEditItemImage}
                        t={t}
                      />
                      <div className="flex flex-1 flex-col gap-2.5">
                        <div className="flex gap-2.5">
                          <Input
                            className="flex-1"
                            value={editingItem.name}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, name: e.target.value })
                            }
                          />
                          <Input
                            className="w-24"
                            type="number"
                            value={editingItem.price}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, price: e.target.value })
                            }
                          />
                        </div>
                        <Textarea
                          placeholder={t.descriptionOptional}
                          value={editingItem.description}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, description: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-ink-600">
                        <input
                          type="checkbox"
                          checked={editingItem.isAvailable}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, isAvailable: e.target.checked })
                          }
                        />
                        {t.available}
                      </label>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>
                          {t.cancel}
                        </Button>
                        <Button size="sm" loading={busy} disabled={uploadingEdit} onClick={saveEdit}>
                          {t.save}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="size-12 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-300">
                          <UtensilsCrossed className="size-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-ink-900">{item.name}</p>
                          {!item.isAvailable && <Badge tone="danger">{t.unavailable}</Badge>}
                        </div>
                        {item.description && (
                          <p className="truncate text-xs text-ink-500">{item.description}</p>
                        )}
                        <p className="text-sm font-semibold text-brand-600">${item.price}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <ToggleSwitch
                        checked={item.isAvailable}
                        disabled={busy}
                        onChange={() => toggleAvailable(item)}
                      />
                      <button
                        onClick={() =>
                          setExpandedModifiersId(expandedModifiersId === item.id ? null : item.id)
                        }
                        className={`relative flex size-8 cursor-pointer items-center justify-center rounded-lg hover:bg-ink-100 ${
                          expandedModifiersId === item.id ? "bg-ink-100 text-brand-600" : "text-ink-500"
                        }`}
                        aria-label={t.manageOptionsAria}
                      >
                        <ListPlus className="size-3.5" />
                        {item.modifierGroups.length > 0 && (
                          <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-brand-500 text-[9px] font-semibold text-white">
                            {item.modifierGroups.length}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => startEdit(item)}
                        className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-danger-500 hover:bg-danger-500/10"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )}
                {expandedModifiersId === item.id && editingItem?.id !== item.id && (
                  <ModifierGroupsEditor item={item} onChange={refresh} />
                )}
              </li>
            ))}
          </ul>

          <div className="mt-2 flex flex-col gap-3 rounded-xl border border-dashed border-ink-200 p-3.5">
            <p className="text-sm font-medium text-ink-700">{t.addItem}</p>
            <div className="flex gap-3">
              <ImagePicker
                imageUrl={newItem.imageUrl}
                uploading={uploadingNew}
                onChange={handleNewItemImage}
                t={t}
              />
              <div className="flex flex-1 flex-col gap-2.5">
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <FieldWrapper label={t.name} required>
                    <Input
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                  </FieldWrapper>
                  <FieldWrapper label={t.price} required>
                    <Input
                      type="number"
                      className="sm:w-28"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    />
                  </FieldWrapper>
                </div>
                <FieldWrapper label={t.descriptionOptional}>
                  <Input
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  />
                </FieldWrapper>
              </div>
            </div>
            <Button
              size="sm"
              loading={busy}
              disabled={uploadingNew}
              onClick={createItem}
              className="self-start"
            >
              <Plus className="size-4" />
              {t.addItem}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function ImagePicker({
  imageUrl,
  uploading,
  onChange,
  t,
}: {
  imageUrl: string;
  uploading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  t: Dictionary["adminMenu"];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-ink-200 bg-white text-ink-300 hover:border-brand-400 hover:text-brand-500"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={onChange}
          className="hidden"
        />
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <Upload className="size-5" />
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs text-ink-500">
            {t.uploading}
          </div>
        )}
        {imageUrl && !uploading && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-success-500 text-white shadow-soft">
            <CheckCircle2 className="size-3.5" />
          </span>
        )}
      </button>
      <p className="w-16 text-center text-[10px] leading-tight text-ink-400">{t.fileHint}</p>
    </div>
  );
}
