"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, CheckCircle2 } from "lucide-react";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input } from "@/components/ui/Field";

export function SmsSettingsForm({
  smsConfigured,
  smsUsername,
}: {
  smsConfigured: boolean;
  smsUsername: string | null;
}) {
  const router = useRouter();
  const { dict } = useDictionary();
  const t = dict.notifications.sms;

  const [username, setUsername] = useState(smsUsername ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function save() {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/tenant/sms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smsUsername: username, smsPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? t.saveError);
        return;
      }
      setPassword("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    if (!window.confirm(t.disconnectConfirm)) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/tenant/sms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smsUsername: null, smsPassword: null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? t.saveError);
        return;
      }
      setUsername("");
      setPassword("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    if (!smsConfigured) {
      setTestResult({ ok: false, message: t.test.needsSetup });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/tenant/sms/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestResult({ ok: false, message: data.error ?? t.test.error });
        return;
      }
      setTestResult({ ok: true, message: t.test.sent });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card className="flex max-w-lg flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
          <MessageSquare className="size-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-ink-900">{t.heading}</h2>
          <p className="mt-1 text-sm text-ink-500">{t.intro}</p>
          <p className="mt-1 text-xs text-ink-400">{t.howTo}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-ink-100 bg-cream-50 px-3.5 py-2.5 text-sm">
        {smsConfigured ? (
          <CheckCircle2 className="size-4 shrink-0 text-success-500" />
        ) : (
          <span className="size-4 shrink-0 rounded-full border border-ink-300" />
        )}
        <span className="text-ink-700">
          {smsConfigured
            ? formatMessage(t.status.configured, { username: smsUsername ?? "" })
            : t.status.notConfigured}
        </span>
      </div>

      <FieldWrapper label={t.username}>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
      </FieldWrapper>

      <FieldWrapper label={t.password} hint={t.passwordHint}>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder={smsConfigured ? "••••••••" : undefined}
        />
      </FieldWrapper>

      {saveError && <p className="text-xs text-danger-500">{saveError}</p>}

      <div className="flex items-center gap-2.5">
        <Button
          size="sm"
          loading={saving}
          disabled={!username.trim() || !password.trim()}
          onClick={save}
          className="self-start"
        >
          {t.save}
        </Button>
        {smsConfigured && (
          <button
            type="button"
            onClick={disconnect}
            disabled={saving}
            className="cursor-pointer text-xs font-medium text-ink-500 hover:text-danger-600 disabled:cursor-not-allowed"
          >
            {t.disconnect}
          </button>
        )}
      </div>

      <div className="border-t border-ink-100 pt-4">
        <p className="text-sm font-medium text-ink-700">{t.test.heading}</p>
        <p className="mt-0.5 text-xs text-ink-500">{t.test.hint}</p>
        <div className="mt-2.5 flex items-center gap-2.5">
          <Input
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder={t.test.phonePlaceholder}
            className="max-w-48"
          />
          <Button
            size="sm"
            variant="outline"
            loading={testing}
            disabled={!testPhone.trim()}
            onClick={sendTest}
          >
            {t.test.send}
          </Button>
        </div>
        {testResult && (
          <p className={`mt-2 text-xs ${testResult.ok ? "text-success-600" : "text-danger-500"}`}>
            {testResult.message}
          </p>
        )}
      </div>
    </Card>
  );
}
