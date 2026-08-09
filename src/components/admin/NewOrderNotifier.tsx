"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellOff, PartyPopper } from "lucide-react";
import { usePolling } from "@/lib/hooks/usePolling";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import type { SerializedOrder } from "@/lib/types";

const POLL_INTERVAL_MS = 5000;

function playBeep(ctx: AudioContext) {
  if (ctx.state === "suspended") ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.45);
}

export function NewOrderNotifier({ branchId }: { branchId: string }) {
  const { dict } = useDictionary();
  const t = dict.adminChrome.notifier;
  const [toasts, setToasts] = useState<SerializedOrder[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const soundOnRef = useRef(soundOn);
  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  // Order IDs we've already seen. `null` until the first poll establishes a
  // baseline, so existing pending orders on page load don't trigger alerts.
  const seenIdsRef = useRef<Set<string> | null>(null);

  usePolling(async () => {
    try {
      const res = await fetch(`/api/orders?branchId=${branchId}&bucket=pending`);
      if (!res.ok) return;
      const data: { orders: SerializedOrder[] } = await res.json();
      const orders = data.orders ?? [];

      if (seenIdsRef.current === null) {
        seenIdsRef.current = new Set(orders.map((o) => o.id));
        return;
      }

      const fresh = orders.filter((o) => !seenIdsRef.current!.has(o.id));
      if (fresh.length === 0) return;

      fresh.forEach((o) => seenIdsRef.current!.add(o.id));
      setToasts((prev) => [...fresh, ...prev].slice(0, 4));

      if (soundOnRef.current) {
        if (!audioCtxRef.current) {
          const Ctor =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          audioCtxRef.current = new Ctor();
        }
        playBeep(audioCtxRef.current);
      }

      fresh.forEach((order) => {
        setTimeout(() => {
          setToasts((prev) => prev.filter((o) => o.id !== order.id));
        }, 6000);
      });
    } catch {
      // ignore transient network errors
    }
  }, POLL_INTERVAL_MS);

  function toggleSound() {
    if (!audioCtxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new Ctor();
    }
    setSoundOn((s) => !s);
  }

  return (
    // Button and toasts share one positioned container (stacked via flex gap)
    // instead of two independently-offset `fixed` elements — those previously
    // drifted out of sync with each other and, at top-16, sat low enough to
    // overlap BranchNav's "Location Settings" link underneath. top-28 here
    // clears both AdminTopBar and BranchNav with margin to spare.
    <div className="fixed inset-x-3 top-28 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:w-80">
      <button
        onClick={toggleSound}
        className="flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-3 py-1.5 text-xs text-ink-500 shadow-soft transition-colors hover:border-brand-300"
      >
        {soundOn ? <Bell className="size-3.5 text-brand-500" /> : <BellOff className="size-3.5" />}
        {soundOn ? t.soundOn : t.soundOff}
      </button>

      <AnimatePresence>
        {toasts.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25 }}
            className="flex w-full items-start gap-3 rounded-2xl bg-ink-900 px-4 py-3.5 text-white shadow-lift"
          >
            <PartyPopper className="mt-0.5 size-5 shrink-0 text-gold-400" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{formatMessage(t.newOrder, { orderNo: order.orderNo })}</p>
              <p className="truncate text-xs text-white/70">
                {order.customerName} · ${order.totalAmount}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
