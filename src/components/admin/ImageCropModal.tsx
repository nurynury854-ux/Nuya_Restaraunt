"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { getCroppedImageBlob, type PixelCrop } from "@/lib/imageCrop";

export function ImageCropModal({
  imageSrc,
  aspect,
  outputWidth,
  outputHeight,
  title,
  hint,
  cancelLabel,
  confirmLabel,
  busy = false,
  error,
  onCancel,
  onConfirm,
}: {
  imageSrc: string;
  /** width / height of the crop area, e.g. 4 for a 4:1 banner strip. */
  aspect: number;
  outputWidth: number;
  outputHeight: number;
  title: string;
  hint: string;
  cancelLabel: string;
  confirmLabel: string;
  busy?: boolean;
  /** Shown inside the modal — it sits above everything else, so a parent-level error would be invisible. */
  error?: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void | Promise<void>;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    const blob = await getCroppedImageBlob(
      imageSrc,
      croppedAreaPixels,
      outputWidth,
      outputHeight
    );
    await onConfirm(blob);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-lg flex-col gap-3.5 rounded-2xl bg-white p-5 shadow-lift"
      >
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-ink-900">
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-ink-500">{hint}</p>
        </div>

        <div className="relative h-64 w-full overflow-hidden rounded-xl bg-ink-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-brand-500"
        />

        {error && <p className="text-xs text-danger-500">{error}</p>}

        <div className="flex justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button type="button" size="sm" loading={busy} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
