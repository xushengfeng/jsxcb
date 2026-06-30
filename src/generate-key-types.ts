import type { KeyType } from "./types.js";

export function generateKeyTypes(types: KeyType[], name: string = "complete"): string {
  const lines: string[] = [];

  lines.push(`xkb_types "${name}" {`);

  for (const type of types) {
    lines.push(`    type "${type.name}" {`);

    for (let i = 0; i < type.levelNames.length; i++) {
      lines.push(`        level_name[Level${i + 1}]= "${type.levelNames[i].name}";`);
    }

    if (type.modifiers.length > 0) {
      lines.push(`        modifiers= ${type.modifiers.join("+")};`);
    } else {
      lines.push(`        modifiers= none;`);
    }

    for (const entry of type.map) {
      const mods = entry.modifiers.length > 0 ? entry.modifiers.join("+") : "none";
      lines.push(`        map[${mods}]= Level${entry.level};`);
    }

    if (type.preserve && type.preserve.length > 0) {
      lines.push(`        preserve = ${type.preserve.join("+")};`);
    }

    lines.push(`    };`);
  }

  lines.push(`};`);
  return lines.join("\n");
}
