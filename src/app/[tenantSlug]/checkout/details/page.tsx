"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { TimeSlot } from "@/generated/prisma/client";
import { useCheckoutGuard } from "@/lib/hooks/useCheckoutGuard";
import { useOrderStore } from "@/lib/store/orderStore";
import { usePolling } from "@/lib/hooks/usePolling";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { OrderSummary } from "@/components/customer/checkout/OrderSummary";
import { FieldWrapper, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const SLOT_POLL_INTERVAL_MS = 8000;

export default function CheckoutDetailsPage() {
  const ready = useCheckoutGuard({ requireCart: true });
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { dict } = useDictionary();
  const t = dict.checkout.details;

  const branchId = useOrderStore((s) => s.branchId);
  const diningMethod = useOrderStore((s) => s.diningMethod);
  const customer = useOrderStore((s) => s.customer);
  const setCustomerField = useOrderStore((s) => s.setCustomerField);

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const needsSlot = diningMethod === "PICKUP" || diningMethod === "DELIVERY";
  const slotMethod = diningMethod === "DELIVERY" ? "DELIVERY" : "PICKUP";

  const refetchSlots = useCallback(() => {
    if (!needsSlot || !branchId) return;
    setLoadingSlots(true);
    fetch(`/api/timeslots?tenant=${tenantSlug}&branchId=${branchId}&method=${slotMethod}`)
      .then((res) => res.json())
      .then((data: { slots: TimeSlot[] }) => {
        const fresh = data.slots ?? [];
        setSlots(fresh);
        // If the slot the customer had selected disappeared (deactivated or
        // removed by the admin), clear it so they have to pick again. Read
        // the current value directly rather than through a selector so this
        // isn't sensitive to when this callback was created.
        const currentSlotId = useOrderStore.getState().customer.timeSlotId;
        if (currentSlotId && !fresh.some((s) => s.id === currentSlotId)) {
          setCustomerField("timeSlotId", "");
          setCustomerField("timeSlotLabel", "");
        }
      })
      .finally(() => setLoadingSlots(false));
  }, [needsSlot, branchId, slotMethod, tenantSlug, setCustomerField]);

  useEffect(() => {
    if (!ready) return;
    // Deferred so refetchSlots' setLoadingSlots(true) isn't synchronous
    // within the effect body.
    const id = setTimeout(refetchSlots, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, needsSlot, branchId, slotMethod]);

  // Keep the slot list live: if the admin adds/removes a slot for this branch
  // while the customer is on this screen, it reflects within a few seconds.
  usePolling(() => {
    if (ready && needsSlot) refetchSlots();
  }, SLOT_POLL_INTERVAL_MS);

  if (!ready) {
    return <div className="flex flex-1 items-center justify-center text-ink-400">{dict.common.loading}</div>;
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (diningMethod === "DINE_IN" && !customer.tableNumber.trim()) {
      next.tableNumber = t.tableNumberError;
    }
    if (needsSlot && !customer.timeSlotId) {
      next.timeSlotId = t.timeSlotError;
    }
    if (!customer.name.trim()) {
      next.name = t.nameError;
    }
    if (!customer.phone.trim() || customer.phone.trim().length < 8) {
      next.phone = t.phoneError;
    }
    if (diningMethod === "DELIVERY" && !customer.address.trim()) {
      next.address = t.deliveryAddressError;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleNext() {
    if (validate()) {
      router.push(`/${tenantSlug}/checkout/payment`);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <OrderSummary />

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-soft">
        <h2 className="font-semibold text-ink-900">
          {diningMethod === "DINE_IN" && t.dineInDetails}
          {diningMethod === "PICKUP" && t.pickupDetails}
          {diningMethod === "DELIVERY" && t.deliveryDetails}
        </h2>

        {diningMethod === "DINE_IN" && (
          <FieldWrapper label={t.tableNumber} required error={errors.tableNumber}>
            <Input
              placeholder={t.tableNumberPlaceholder}
              value={customer.tableNumber}
              onChange={(e) => setCustomerField("tableNumber", e.target.value)}
              error={!!errors.tableNumber}
            />
          </FieldWrapper>
        )}

        {needsSlot && (
          <FieldWrapper
            label={diningMethod === "DELIVERY" ? t.deliveryTime : t.pickupTime}
            required
            error={errors.timeSlotId}
            hint={loadingSlots ? t.loadingTimeSlots : undefined}
          >
            <Select
              value={customer.timeSlotId}
              onChange={(e) => {
                const id = e.target.value;
                setCustomerField("timeSlotId", id);
                setCustomerField(
                  "timeSlotLabel",
                  slots.find((s) => s.id === id)?.label ?? ""
                );
              }}
              error={!!errors.timeSlotId}
              disabled={loadingSlots}
            >
              <option value="">{t.selectTimeSlot}</option>
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.label}
                </option>
              ))}
            </Select>
            {!loadingSlots && slots.length === 0 && (
              <p className="text-xs text-danger-500">{t.noTimeSlots}</p>
            )}
          </FieldWrapper>
        )}

        <FieldWrapper label={t.name} required error={errors.name}>
          <Input
            placeholder={t.namePlaceholder}
            value={customer.name}
            onChange={(e) => setCustomerField("name", e.target.value)}
            error={!!errors.name}
          />
        </FieldWrapper>

        <FieldWrapper label={t.phone} required error={errors.phone}>
          <Input
            type="tel"
            placeholder={t.phonePlaceholder}
            value={customer.phone}
            onChange={(e) => setCustomerField("phone", e.target.value)}
            error={!!errors.phone}
          />
        </FieldWrapper>

        {diningMethod === "DELIVERY" && (
          <FieldWrapper label={t.deliveryAddress} required error={errors.address}>
            <Input
              placeholder={t.deliveryAddressPlaceholder}
              value={customer.address}
              onChange={(e) => setCustomerField("address", e.target.value)}
              error={!!errors.address}
            />
          </FieldWrapper>
        )}

        <FieldWrapper label={t.notes} hint={t.notesHint}>
          <Textarea
            placeholder={t.notesPlaceholder}
            value={customer.notes}
            onChange={(e) => setCustomerField("notes", e.target.value)}
          />
        </FieldWrapper>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={() => router.push(`/${tenantSlug}/menu`)}>
          {t.backToMenu}
        </Button>
        <Button fullWidth size="lg" onClick={handleNext}>
          {t.nextPayment}
        </Button>
      </div>
    </div>
  );
}
