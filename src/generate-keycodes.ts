import type { KeyDef } from "./types.js";

export function generateKeycodes(
  keys: KeyDef[],
  name: string = "evdev",
  min?: number,
  max?: number,
): string {
  const sorted = [...keys].sort((a, b) => a.code - b.code);
  const lines: string[] = [];

  const actualMin = min ?? Math.min(...sorted.map((k) => k.code));
  const actualMax = max ?? Math.max(...sorted.map((k) => k.code));

  lines.push(`xkb_keycodes "${name}" {`);
  lines.push(`    minimum = ${actualMin};`);
  lines.push(`    maximum = ${actualMax};`);

  for (const key of sorted) {
    lines.push(`     <${key.name}> = ${key.code};`);
  }

  if (sorted.some((k) => k.aliases && k.aliases.length > 0)) {
    lines.push("");
    for (const key of sorted) {
      if (key.aliases) {
        for (const alias of key.aliases) {
          lines.push(`    alias <${alias}> = <${key.name}>;`);
        }
      }
    }
  }

  lines.push("};");
  return lines.join("\n");
}
