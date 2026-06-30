import type {
  KeyDef,
  KeyType,
  KeySymbol,
  ModifierMap,
  InterpretDef,
  IndicatorDef,
} from "./types.js";
import { generateKeycodes } from "./generate-keycodes.js";
import { generateKeyTypes } from "./generate-key-types.js";
import { generateCompat } from "./generate-compat.js";
import { generateSymbols } from "./generate-symbols.js";
import {
  EVDEV_KEYCODES,
  US_LAYOUT,
  COMMON_KEY_TYPES,
} from "./defaults.js";

export interface XkbBuilderOptions {
  keycodes?: {
    name?: string;
    min?: number;
    max?: number;
    keys?: KeyDef[];
    aliases?: { alias: string; original: string }[];
  };
  keyTypes?: {
    name?: string;
    types?: KeyType[];
  };
  compat?: {
    name?: string;
    interprets?: InterpretDef[];
    indicators?: IndicatorDef[];
    modifierMap?: ModifierMap[];
  };
  symbols?: {
    name?: string;
    keys?: KeySymbol[];
    modifierMap?: ModifierMap[];
  };
}

export function buildXkb(options: XkbBuilderOptions = {}): string {
  const sections: string[] = [];

  sections.push("xkb_keymap {");

  // Keycodes
  const kcOpts = options.keycodes ?? {};
  const kcName = kcOpts.name ?? "evdev";
  const kcKeys = kcOpts.keys ?? EVDEV_KEYCODES;
  sections.push(generateKeycodes(kcKeys, kcName, kcOpts.min, kcOpts.max));

  // Key types
  const ktOpts = options.keyTypes ?? {};
  const ktName = ktOpts.name ?? "complete";
  const ktTypes = ktOpts.types ?? COMMON_KEY_TYPES;
  sections.push(generateKeyTypes(ktTypes, ktName));

  // Compat
  const cOpts = options.compat ?? {};
  const cName = cOpts.name ?? "complete";
  sections.push(generateCompat(cName, {
    interprets: cOpts.interprets,
    indicators: cOpts.indicators,
    modifierMap: cOpts.modifierMap,
  }));

  // Symbols
  const sOpts = options.symbols ?? {};
  const sName = sOpts.name ?? "pc";
  const sKeys = sOpts.keys ?? buildDefaultUSKeys();
  sections.push(generateSymbols(sName, {
    keys: sKeys,
    modifierMap: sOpts.modifierMap ?? buildDefaultModifierMap(),
  }));

  sections.push("};");
  return sections.join("\n\n");
}

function buildDefaultUSKeys(): KeySymbol[] {
  return Object.entries(US_LAYOUT).map(([key, syms]) => ({
    key,
    symbols: syms,
  }));
}

function buildDefaultModifierMap(): ModifierMap[] {
  return [
    { key: "<LCTL>", modifier: "Control" },
    { key: "<RCTL>", modifier: "Control" },
    { key: "<LALT>", modifier: "Mod1" },
    { key: "<RALT>", modifier: "Mod1" },
    { key: "<LMTA>", modifier: "Mod4" },
    { key: "<RMTA>", modifier: "Mod4" },
  ];
}
