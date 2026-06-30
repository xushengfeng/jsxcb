# myde-xcb

[English](README.md) | [中文](README.zh-CN.md)

纯 TypeScript 库，用于生成 XKB 键盘布局文本格式文件。

生成与 `xkbcomp` 及 X11/XKB 系统兼容的 XKB 键盘映射文本。无原生依赖，无需系统命令。

## 安装

```bash
npm install myde-xcb
# 或
pnpm add myde-xcb
```

## 快速开始

```ts
import { buildXkb } from "myde-xcb";

const xkb = buildXkb({
    symbols: {
        name: "my-layout",
        keys: [
            { key: "AE01", type: "TWO_LEVEL", symbols: [["1", "exclam"]] },
            { key: "AD01", type: "ALPHABETIC", symbols: [["q", "Q"]] },
            { key: "SPCE", type: "ONE_LEVEL", symbols: [["space"]] },
        ],
        modifierMap: [
            { key: "<LCTL>", modifier: "Control" },
            { key: "<LALT>", modifier: "Mod1" },
        ],
    },
});

console.log(xkb);
// 输出完整的 xkb_keymap { ... } 文本块
```

## API

### `buildXkb(options?)`

生成完整的 XKB 键盘映射文本。

```ts
const xkb = buildXkb();
// 使用默认设置返回完整的 US QWERTY 键盘映射
```

#### 选项

| 选项       | 类型     | 说明                        |
| ---------- | -------- | --------------------------- |
| `keycodes` | `object` | 按键码定义（evdev 映射）    |
| `keyTypes` | `object` | 按键类型定义（修饰键行为）  |
| `compat`   | `object` | 兼容性段落（解释器/指示灯） |
| `symbols`  | `object` | 按键符号和修饰键映射        |

##### `keycodes`

```ts
{
  name?: string;        // 段落名称（默认："evdev"）
  min?: number;         // 最小按键码
  max?: number;         // 最大按键码
  keys?: KeyDef[];      // 按键定义
  aliases?: { alias: string; original: string }[];
}
```

##### `symbols`

```ts
{
  name?: string;        // 段落名称（默认："pc"）
  keys?: KeySymbol[];   // 按键符号映射
  modifierMap?: ModifierMap[];
}
```

##### `keyTypes`

```ts
{
  name?: string;        // 段落名称（默认："complete"）
  types?: KeyType[];    // 按键类型定义
}
```

##### `compat`

```ts
{
  name?: string;        // 段落名称（默认："complete"）
  interprets?: InterpretDef[];
  indicators?: IndicatorDef[];
  modifierMap?: ModifierMap[];
}
```

### 独立生成器

如需更细粒度控制，可使用独立的段落生成器：

```ts
import { generateKeycodes, generateKeyTypes, generateCompat, generateSymbols } from "jsxcb";
```

#### `generateKeycodes(keys, name?, min?, max?)`

```ts
const keycodes = generateKeycodes(
    [
        { name: "ESC", code: 9 },
        { name: "AE01", code: 10 },
    ],
    "my-keycodes",
);
```

#### `generateKeyTypes(types, name?)`

```ts
import { COMMON_KEY_TYPES } from "jsxcb";

const types = generateKeyTypes(COMMON_KEY_TYPES, "complete");
```

#### `generateCompat(name, options?)`

```ts
const compat = generateCompat("my-compat", {
    modifierMap: [{ key: "<LCTL>", modifier: "Control" }],
});
```

#### `generateSymbols(name, options)`

```ts
const symbols = generateSymbols("my-symbols", {
    keys: [
        { key: "ESC", type: "ONE_LEVEL", symbols: [["Escape"]] },
        { key: "AE01", type: "TWO_LEVEL", symbols: [["1", "exclam"]] },
    ],
    modifierMap: [{ key: "<LCTL>", modifier: "Control" }],
});
```

## 类型定义

```ts
interface KeyDef {
    name: string; // 按键名称，如 "ESC"、"AE01"
    code: number; // 按键码（evdev 编号）
    aliases?: string[]; // 别名，如 ["KP07"]
}

interface KeySymbol {
    key: string; // 按键名称
    type?: string; // 按键类型，如 "ONE_LEVEL"、"TWO_LEVEL"
    symbols: (string | number)[][]; // 各层级的符号列表
}

interface KeyType {
    name: string; // 类型名称
    levelNames: { name: string }[]; // 各层级名称
    modifiers: string[]; // 影响此类型的修饰键
    map: { modifiers: string[]; level: number }[]; // 修饰键到层级的映射
    preserve?: string[]; // 保留的修饰键
}

interface ModifierMap {
    key: string; // 按键名称
    modifier: string; // 修饰键名称
}

interface InterpretDef {
    name: string; // 解释器名称
    modifiers: string[]; // 修饰键
    action?: KeyAction; // 按键动作
    symbols?: string[]; // 符号
}

interface IndicatorDef {
    name: string; // 指示灯名称
    modifier?: string; // 修饰键
    modifiers?: string[]; // 修饰键列表
    group?: string; // 组
    controls?: string; // 控制
}
```

### 内置预设

库导出预定义数据：

| 导出               | 说明                                                |
| ------------------ | --------------------------------------------------- |
| `EVDEV_KEYCODES`   | 标准 evdev 按键码定义                               |
| `US_LAYOUT`        | US QWERTY 按键符号映射                              |
| `COMMON_KEY_TYPES` | 常用按键类型（ONE_LEVEL、TWO_LEVEL、ALPHABETIC 等） |

## 按键类型参考

| 类型                | 层数 | 修饰键行为               |
| ------------------- | ---- | ------------------------ |
| `ONE_LEVEL`         | 1    | 无修饰键                 |
| `TWO_LEVEL`         | 2    | Shift 切换到第 2 层      |
| `ALPHABETIC`        | 2    | Shift/Lock 切换到第 2 层 |
| `FOUR_LEVEL`        | 4    | Shift + AltGr (Mod5)     |
| `KEYPAD`            | 2    | NumLock (Mod2)           |
| `FOUR_LEVEL_KEYPAD` | 4    | NumLock + AltGr          |

## 与 xkbcomp 集成

生成的 XKB 文本完全兼容 `xkbcomp`：

```bash
# 将生成的文本编译为二进制键盘映射
echo "$XKB_TEXT" > /tmp/layout.xkb
xkbcomp /tmp/layout.xkb /tmp/layout.xkm

# 或直接应用到 X 服务器
xkbcomp /tmp/layout.xkb $DISPLAY
```

## 示例：自定义布局

```ts
import { buildXkb } from "jsxcb";

const dvorak = buildXkb({
    keycodes: { name: "dvorak" },
    symbols: {
        name: "dvorak",
        keys: [
            { key: "TLDE", type: "TWO_LEVEL", symbols: [["grave", "asciitilde"]] },
            { key: "AE01", type: "TWO_LEVEL", symbols: [["1", "exclam"]] },
            { key: "AE02", type: "TWO_LEVEL", symbols: [["2", "at"]] },
            // ... Dvorak 布局
            { key: "AD01", type: "ALPHABETIC", symbols: [["apostrophe", "quotedbl"]] },
            { key: "AD02", type: "ALPHABETIC", symbols: [["comma", "less"]] },
            { key: "AD03", type: "ALPHABETIC", symbols: [["period", "greater"]] },
            { key: "AD04", type: "ALPHABETIC", symbols: [["p", "P"]] },
            { key: "AD05", type: "ALPHABETIC", symbols: [["y", "Y"]] },
        ],
        modifierMap: [
            { key: "<LCTL>", modifier: "Control" },
            { key: "<RCTL>", modifier: "Control" },
            { key: "<LALT>", modifier: "Mod1" },
            { key: "<RALT>", modifier: "Mod1" },
        ],
    },
});
```

## 开发

```bash
# 安装依赖
pnpm install

# 运行测试
pnpm test

# 类型检查
pnpm typecheck

# 构建
pnpm build
```

## 许可证

[Apache-2.0](LICENSE)
