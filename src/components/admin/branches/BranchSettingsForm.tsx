"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import type { SerializedBranch } from "@/lib/types";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { ImageCropModal } from "@/components/admin/ImageCropModal";

// Matches the ~4:1 shape of the customer-facing branch card banner (a fixed
// height strip whose width varies with viewport) — cropping to this ratio up
// front means the stored image already fits without further positioning.
const BANNER_ASPECT = 4;
const BANNER_OUTPUT_WIDTH = 1200;
const BANNER_OUTPUT_HEIGHT = BANNER_OUTPUT_WIDTH / BANNER_ASPECT;

export function BranchSettingsForm({ branch }: { branch: SerializedBranch }) {
  const router = useRouter();
  const { dict } = useDictionary();
  const t = dict.adminSettings.branchSettings;
  const [draft, setDraft] = useState(branch);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update(patch: Partial<SerializedBranch>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function handleBannerFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  }

  function closeCropModal() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  async function handleCropConfirm(blob: Blob) {
    setUploadingBanner(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", new File([blob], "banner.jpg", { type: "image/jpeg" }));
      form.append("kind", "banner");
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.uploadFailed);
        return;
      }
      update({ bannerImageUrl: data.url });
      closeCropModal();
    } finally {
      setUploadingBanner(false);
    }
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          address: draft.address,
          phone: draft.phone,
          hours: draft.hours,
          bannerImageUrl: draft.bannerImageUrl,
          isActive: draft.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.saveError);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex max-w-lg flex-col gap-3.5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink-900">{branch.name}</h2>
        <div className="flex items-center gap-2">
          <Badge tone={draft.isActive ? "success" : "danger"}>
            {draft.isActive ? t.active : t.disabled}
          </Badge>
          <button
            onClick={() => update({ isActive: !draft.isActive })}
            className="cursor-pointer rounded-lg border border-ink-100 px-2.5 py-1 text-xs font-medium text-ink-500 hover:bg-ink-100"
          >
            {draft.isActive ? t.disable : t.enable}
          </button>
        </div>
      </div>

      <p className="text-xs text-ink-400">{t.disableHint}</p>

      <FieldWrapper label={t.locationName}>
        <Input value={draft.name} onChange={(e) => update({ name: e.target.value })} />
      </FieldWrapper>
      <FieldWrapper label={t.address}>
        <Input value={draft.address} onChange={(e) => update({ address: e.target.value })} />
      </FieldWrapper>
      <FieldWrapper label={t.phone}>
        <Input value={draft.phone} onChange={(e) => update({ phone: e.target.value })} />
      </FieldWrapper>
      <FieldWrapper label={t.hours}>
        <Input value={draft.hours} onChange={(e) => update({ hours: e.target.value })} />
      </FieldWrapper>

      <FieldWrapper label={t.bannerImage} hint={t.bannerImageHint}>
        <div className="flex flex-col gap-2.5">
          {draft.bannerImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.bannerImageUrl}
              alt={t.bannerImage}
              className="h-20 w-full rounded-xl border border-ink-100 object-cover"
            />
          ) : (
            <div className="flex h-20 w-full items-center justify-center rounded-xl border border-dashed border-ink-200 text-ink-300">
              <Upload className="size-5" />
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleBannerFileChange}
              className="hidden"
              id="branch-banner-upload"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {draft.bannerImageUrl ? t.replaceBannerImage : t.uploadBannerImage}
            </Button>
            {draft.bannerImageUrl && (
              <button
                type="button"
                onClick={() => update({ bannerImageUrl: null })}
                className="cursor-pointer text-xs font-medium text-ink-500 hover:text-danger-600"
              >
                {t.removeBannerImage}
              </button>
            )}
          </div>
        </div>
      </FieldWrapper>

      {error && <p className="text-xs text-danger-500">{error}</p>}

      <Button size="sm" loading={busy} onClick={save} className="self-start">
        {t.saveChanges}
      </Button>

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={BANNER_ASPECT}
          outputWidth={BANNER_OUTPUT_WIDTH}
          outputHeight={BANNER_OUTPUT_HEIGHT}
          title={t.cropTitle}
          hint={t.cropHint}
          cancelLabel={t.cropCancel}
          confirmLabel={t.cropConfirm}
          busy={uploadingBanner}
          error={error}
          onCancel={closeCropModal}
          onConfirm={handleCropConfirm}
        />
      )}
    </Card>
  );
}
