export interface KeyDef {
  name: string;
  code: number;
  aliases?: string[];
}

export interface KeyTypeLevel {
  name: string;
}

export interface KeyTypeMap {
  modifiers: string[];
  level: number;
}

export interface KeyType {
  name: string;
  levelNames: KeyTypeLevel[];
  modifiers: string[];
  map: KeyTypeMap[];
  preserve?: string[];
}

export interface KeySymbol {
  key: string;
  type?: string;
  symbols: (string | number)[][];
  actions?: KeyAction[];
}

export interface KeyAction {
  type: "SetMods" | "LatchMods" | "LockMods" | "SetGroup" | "LatchGroup" | "LockGroup" | "NoAction";
  modifiers?: string[];
  flags?: string;
  group?: number;
}

export interface ModifierMap {
  key: string;
  modifier: string;
}

export interface InterpretDef {
  name: string;
  modifiers: string[];
  action?: KeyAction;
  led?: { led: number; flags: string };
  symbols?: string[];
}

export interface IndicatorDef {
  name: string;
  modifier?: string;
  modifiers?: string[];
  group?: string;
  controls?: string;
}

export interface XkbKeymapOptions {
  keycodes?: KeyDef[];
  keyTypes?: KeyType[];
  compatibility?: {
    interprets?: InterpretDef[];
    indicators?: IndicatorDef[];
  };
  symbols?: {
    name?: string;
    keys?: KeySymbol[];
    modifierMap?: ModifierMap[];
  };
  minKeycode?: number;
  maxKeycode?: number;
}

export interface XkbKeymap {
  keycodes?: {
    name: string;
    min?: number;
    max?: number;
    keys: KeyDef[];
    aliases?: { alias: string; original: string }[];
    indicators?: { index: number; name: string }[];
  };
  types?: KeyType[];
  compat?: {
    name: string;
    interprets?: InterpretDef[];
    indicators?: IndicatorDef[];
    modifierMap?: ModifierMap[];
  };
  symbols?: {
    name: string;
    keys: KeySymbol[];
    modifierMap?: ModifierMap[];
  };
}
