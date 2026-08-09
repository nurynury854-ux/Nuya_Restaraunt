"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import { Card } from "@/components/ui/Card";

export interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  done: boolean;
  href: string;
}

export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const { dict } = useDictionary();
  const t = dict.adminDashboard.onboarding;
  const [collapsed, setCollapsed] = useState(false);
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Card className="flex flex-col gap-3 border border-brand-200 bg-brand-50/50 p-5">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex cursor-pointer items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
            <Sparkles className="size-4" />
          </span>
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-ink-900">
              {t.title}
            </h2>
            <p className="text-sm text-ink-500">
              {formatMessage(t.progress, { done: doneCount, total: steps.length })}
            </p>
          </div>
        </div>
        {collapsed ? (
          <ChevronDown className="size-5 shrink-0 text-ink-400" />
        ) : (
          <ChevronUp className="size-5 shrink-0 text-ink-400" />
        )}
      </button>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      {!collapsed && (
        <div className="flex flex-col gap-2">
          {steps.map((step) => (
            <Link
              key={step.key}
              href={step.href}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                step.done
                  ? "border-transparent bg-white/60"
                  : "border-ink-100 bg-white hover:border-brand-300 hover:bg-brand-50/60"
              }`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                  step.done ? "bg-success-500 text-white" : "border-2 border-ink-200 bg-white"
                }`}
              >
                {step.done && <Check className="size-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${step.done ? "text-ink-400 line-through" : "text-ink-900"}`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-ink-400">{step.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
