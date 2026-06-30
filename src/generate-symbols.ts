import type { KeySymbol, ModifierMap } from "./types.js";

function formatKeySymbols(syms: (string | number)[]): string {
  const parts = syms.map((s) => {
    if (typeof s === "number") {
      return `0x${s.toString(16)}`;
    }
    return s;
  });
  return `[ ${parts.join(", ")} ]`;
}

export function generateSymbols(
  name: string,
  options: {
    keys: KeySymbol[];
    modifierMap?: ModifierMap[];
  },
): string {
  const lines: string[] = [];

  lines.push(`xkb_symbols "${name}" {`);

  for (const key of options.keys) {
    const hasMultipleLevels = key.symbols.length > 1;
    const hasType = !!key.type;

    if (!hasMultipleLevels && !hasType) {
      // Simple single-level key: key <ESC> { [ Escape ] };
      const syms = key.symbols[0];
      lines.push(`    key <${key.key}> { ${formatKeySymbols(syms)} };`);
    } else {
      // Complex key with type or multiple levels
      lines.push(`    key <${key.key}> {`);
      if (key.type) {
        lines.push(`        type= "${key.type}",`);
      }
      const symbolsStr = key.symbols.map((s) => formatKeySymbols(s)).join(", ");
      lines.push(`        symbols[Group1]= ${symbolsStr}`);
      lines.push(`    };`);
    }
  }

  if (options.modifierMap && options.modifierMap.length > 0) {
    lines.push("");
    for (const modmap of options.modifierMap) {
      lines.push(`    modifier_map ${modmap.modifier} { ${modmap.key} };`);
    }
  }

  lines.push(`};`);
  return lines.join("\n");
}
