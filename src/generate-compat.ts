import type { InterpretDef, IndicatorDef, ModifierMap } from "./types.js";

function formatAction(action: {
  type: string;
  modifiers?: string[];
  flags?: string;
  group?: number;
}): string {
  const parts: string[] = [];

  if (action.modifiers && action.modifiers.length > 0) {
    parts.push(`modifiers=${action.modifiers.join("+")}`);
  }
  if (action.flags) {
    parts.push(`flags=${action.flags}`);
  }
  if (action.group !== undefined) {
    parts.push(`group=${action.group}`);
  }

  if (parts.length === 0) {
    return `${action.type}();`;
  }
  return `${action.type}(${parts.join(", ")});`;
}

export function generateCompat(
  name: string,
  options: {
    interprets?: InterpretDef[];
    indicators?: IndicatorDef[];
    modifierMap?: ModifierMap[];
  } = {},
): string {
  const lines: string[] = [];

  lines.push(`xkb_compat "${name}" {`);

  if (options.interprets) {
    for (const interp of options.interprets) {
      lines.push(`    interpret ${interp.name} {`);
      lines.push(`        modifiers = ${interp.modifiers.join("+")};`);
      if (interp.action) {
        lines.push(`        action = ${formatAction(interp.action)}`);
      }
      if (interp.symbols) {
        lines.push(`        symbols[Group1] = [ ${interp.symbols.join(", ")} ]`);
      }
      if (interp.led) {
        lines.push(`        flags[Indicator] = ${interp.led.flags};`);
        lines.push(`        virtualModifier = ${interp.name};`);
      }
      lines.push(`    };`);
      lines.push("");
    }
  }

  if (options.indicators) {
    for (const ind of options.indicators) {
      if (ind.modifier && ind.modifiers) {
        lines.push(`    indicator "${ind.name}" {`);
        lines.push(`        modifiers = ${ind.modifiers.join("+")};`);
        lines.push(`        groups = 0x00000000;`);
        lines.push(`        controls = 0x00000000;`);
        lines.push(`    };`);
      } else if (ind.controls) {
        lines.push(`    indicator "${ind.name}" {`);
        lines.push(`        modifiers = ${ind.modifiers?.join("+") ?? "None"};`);
        lines.push(`        groups = 0x00000000;`);
        lines.push(`        controls = ${ind.controls};`);
        lines.push(`    };`);
      } else {
        lines.push(`    indicator "${ind.name}" {`);
        if (ind.modifiers) {
          lines.push(`        modifiers = ${ind.modifiers.join("+")};`);
        }
        if (ind.group) {
          lines.push(`        groups = ${ind.group};`);
        }
        lines.push(`    };`);
      }
      lines.push("");
    }
  }

  if (options.modifierMap) {
    for (const modmap of options.modifierMap) {
      lines.push(`    modifier_map ${modmap.modifier} { ${modmap.key} };`);
    }
  }

  lines.push(`};`);
  return lines.join("\n");
}
