/**
 * Minimal {placeholder} interpolation for dictionary strings that need a
 * value substituted in — e.g. formatMessage(dict.x.y, { count: 3 }). Not
 * full ICU (no plural rules): English strings that need a plural "s" carry
 * their own {plural} placeholder resolved by the caller (Chinese doesn't
 * inflect for number, so its translations simply don't reference it).
 */
export function formatMessage(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}
