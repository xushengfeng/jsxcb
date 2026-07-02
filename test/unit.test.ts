import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
	buildXkb,
	generateKeycodes,
	generateKeyTypes,
	generateCompat,
	generateSymbols,
} from "../src/index.js";
import { EVDEV_KEYCODES, COMMON_KEY_TYPES } from "../src/defaults.js";

const HAS_XKBCOMP = (() => {
	try {
		execSync("which xkbcomp", { stdio: "pipe" });
		return true;
	} catch {
		return false;
	}
})();

function runXkbcomp(input: string): { ok: boolean; output: string } {
	const tmpFile = join(
		tmpdir(),
		`jsxcb-test-${Date.now()}-${Math.random().toString(36).slice(2)}.xkb`,
	);
	const outFile = join(
		tmpdir(),
		`jsxcb-test-${Date.now()}-${Math.random().toString(36).slice(2)}.xkm`,
	);
	try {
		writeFileSync(tmpFile, input, "utf-8");
		const output = execSync(`xkbcomp -w 0 "${tmpFile}" "${outFile}" 2>&1`, {
			encoding: "utf-8",
		});
		return { ok: true, output };
	} catch (e: any) {
		return { ok: false, output: e.stdout ?? e.message };
	} finally {
		if (existsSync(tmpFile)) unlinkSync(tmpFile);
		if (existsSync(outFile)) unlinkSync(outFile);
	}
}

describe("generateKeycodes", () => {
	it("generates valid keycodes section", () => {
		const result = generateKeycodes(EVDEV_KEYCODES.slice(0, 5), "test");
		expect(result).toContain('xkb_keycodes "test"');
		expect(result).toContain("minimum =");
		expect(result).toContain("maximum =");
		expect(result).toContain("<ESC> = 9;");
		expect(result).toContain("<AE01> = 10;");
		expect(result).toContain("};");
	});

	it("sorts keys by code", () => {
		const keys = [
			{ name: "B", code: 20 },
			{ name: "A", code: 10 },
			{ name: "C", code: 30 },
		];
		const result = generateKeycodes(keys, "sort-test");
		const lines = result.split("\n");
		const keyLines = lines.filter(
			(l) =>
				l.includes(" = ") &&
				l.includes(";") &&
				!l.includes("minimum") &&
				!l.includes("maximum"),
		);
		expect(keyLines[0]).toContain("<A> = 10");
		expect(keyLines[1]).toContain("<B> = 20");
		expect(keyLines[2]).toContain("<C> = 30");
	});

	it("generates aliases", () => {
		const keys = [
			{ name: "A", code: 10, aliases: ["ALIAS_A"] },
			{ name: "B", code: 20 },
		];
		const result = generateKeycodes(keys, "alias-test");
		expect(result).toContain("alias <ALIAS_A> = <A>;");
	});
});

describe("generateKeyTypes", () => {
	it("generates ONE_LEVEL type", () => {
		const types = [COMMON_KEY_TYPES[0]];
		const result = generateKeyTypes(types, "test");
		expect(result).toContain('xkb_types "test"');
		expect(result).toContain('type "ONE_LEVEL"');
		expect(result).toContain('level_name[Level1]= "Any"');
	});

	it("generates TWO_LEVEL type with modifier map", () => {
		const types = [COMMON_KEY_TYPES[1]];
		const result = generateKeyTypes(types, "test");
		expect(result).toContain('type "TWO_LEVEL"');
		expect(result).toContain("modifiers= Shift;");
		expect(result).toContain("map[Shift]= Level2;");
	});

	it("generates multiple types", () => {
		const result = generateKeyTypes(COMMON_KEY_TYPES, "test");
		expect(result).toContain('type "ONE_LEVEL"');
		expect(result).toContain('type "TWO_LEVEL"');
		expect(result).toContain('type "ALPHABETIC"');
		expect(result).toContain('type "FOUR_LEVEL"');
	});
});

describe("generateCompat", () => {
	it("generates empty compat section", () => {
		const result = generateCompat("test");
		expect(result).toContain('xkb_compat "test"');
		expect(result).toContain("};");
	});

	it("generates compat with modifier map", () => {
		const result = generateCompat("test", {
			modifierMap: [
				{ key: "<LCTL>", modifier: "Control" },
				{ key: "<LALT>", modifier: "Mod1" },
			],
		});
		expect(result).toContain("modifier_map Control { <LCTL> };");
		expect(result).toContain("modifier_map Mod1 { <LALT> };");
	});
});

describe("generateSymbols", () => {
	it("generates valid symbols section", () => {
		const result = generateSymbols("test", {
			keys: [
				{ key: "ESC", symbols: [["Escape"]] },
				{ key: "AE01", symbols: [["1", "exclam"]] },
			],
		});
		expect(result).toContain('xkb_symbols "test"');
		expect(result).toContain("key <ESC>");
		expect(result).toContain("key <ESC> { [ Escape ] };");
		expect(result).toContain("key <AE01> { [ 1, exclam ] };");
	});

	it("generates symbols with type", () => {
		const result = generateSymbols("test", {
			keys: [{ key: "ESC", type: "ONE_LEVEL", symbols: [["Escape"]] }],
		});
		expect(result).toContain('type= "ONE_LEVEL",');
	});

	it("generates symbols with modifier map", () => {
		const result = generateSymbols("test", {
			keys: [{ key: "LCTL", symbols: [["Control_L"]] }],
			modifierMap: [{ key: "<LCTL>", modifier: "Control" }],
		});
		expect(result).toContain("modifier_map Control { <LCTL> };");
	});
});

describe("buildXkb", () => {
	it("generates complete XKB keymap", () => {
		const result = buildXkb();
		expect(result).toContain("xkb_keymap {");
		expect(result).toContain('xkb_keycodes "evdev"');
		expect(result).toContain('xkb_types "complete"');
		expect(result).toContain('xkb_compat "complete"');
		expect(result).toContain('xkb_symbols "pc"');
		expect(result).toContain("};");
	});

	it("uses custom names", () => {
		const result = buildXkb({
			keycodes: { name: "custom-keycodes" },
			keyTypes: { name: "custom-types" },
			compat: { name: "custom-compat" },
			symbols: { name: "custom-symbols" },
		});
		expect(result).toContain('xkb_keycodes "custom-keycodes"');
		expect(result).toContain('xkb_types "custom-types"');
		expect(result).toContain('xkb_compat "custom-compat"');
		expect(result).toContain('xkb_symbols "custom-symbols"');
	});

	it("includes modifier map in symbols", () => {
		const result = buildXkb();
		expect(result).toContain("modifier_map Control { <LCTL> };");
		expect(result).toContain("modifier_map Mod1 { <LALT> };");
		expect(result).toContain("modifier_map Mod4 { <LMTA> };");
	});

	it.skipIf(!HAS_XKBCOMP)("validates default output with xkbcomp", () => {
		const result = buildXkb();
		const { ok, output } = runXkbcomp(result);
		expect(ok).toBe(true);
		expect(output).not.toContain("error");
	});

	it.skipIf(!HAS_XKBCOMP)("validates custom output with xkbcomp", () => {
		const result = buildXkb({
			keycodes: { name: "custom", keys: [{ name: "ESC", code: 9 }] },
			symbols: {
				name: "custom",
				keys: [{ key: "ESC", symbols: [["Escape"]] }],
			},
		});
		const { ok } = runXkbcomp(result);
		expect(ok).toBe(true);
	});
});
