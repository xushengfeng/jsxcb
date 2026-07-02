import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
	buildXkb,
	generateKeycodes,
	generateKeyTypes,
	generateSymbols,
} from "../src/index.js";
import {
	EVDEV_KEYCODES,
	US_LAYOUT,
	COMMON_KEY_TYPES,
} from "../src/defaults.js";

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

describe("xkbcomp integration", () => {
	it.skipIf(!HAS_XKBCOMP)(
		"validates default buildXkb() output with xkbcomp",
		() => {
			const xkb = buildXkb();
			const { ok, output } = runXkbcomp(xkb);
			expect(ok).toBe(true);
			expect(output).not.toContain("error");
		},
	);

	it.skipIf(!HAS_XKBCOMP)(
		"validates default output contains expected sections",
		() => {
			const xkb = buildXkb();
			expect(xkb).toContain("xkb_keycodes");
			expect(xkb).toContain("xkb_types");
			expect(xkb).toContain("xkb_compat");
			expect(xkb).toContain("xkb_symbols");
			const { ok } = runXkbcomp(xkb);
			expect(ok).toBe(true);
		},
	);

	it.skipIf(!HAS_XKBCOMP)("validates keycodes section in context", () => {
		const keycodes = generateKeycodes(EVDEV_KEYCODES.slice(0, 5), "evdev");
		const keymap = `xkb_keymap {
${keycodes}
xkb_types "min" { type "ONE_LEVEL" { level_name[Level1]= "Any"; modifiers= none; }; };
xkb_compat "min" {};
xkb_symbols "min" { key <ESC> { [ Escape ] }; };
};`;
		const { ok } = runXkbcomp(keymap);
		expect(ok).toBe(true);
	});

	it.skipIf(!HAS_XKBCOMP)("validates key types section in context", () => {
		const types = generateKeyTypes(COMMON_KEY_TYPES, "complete");
		const keymap = `xkb_keymap {
xkb_keycodes "min" { minimum = 9; maximum = 9; <ESC> = 9; };
${types}
xkb_compat "min" {};
xkb_symbols "min" { key <ESC> { [ Escape ] }; };
};`;
		const { ok } = runXkbcomp(keymap);
		expect(ok).toBe(true);
	});

	it.skipIf(!HAS_XKBCOMP)("validates symbols section in context", () => {
		const keys = Object.entries(US_LAYOUT)
			.slice(0, 20)
			.map(([key, syms]) => ({ key, symbols: syms }));
		const symbols = generateSymbols("us", { keys });
		const keycodes = generateKeycodes(EVDEV_KEYCODES.slice(0, 20), "evdev");
		const keymap = `xkb_keymap {
${keycodes}
xkb_types "min" {
    type "ONE_LEVEL" { level_name[Level1]= "Any"; modifiers= none; };
    type "TWO_LEVEL" { level_name[Level1]= "Base"; level_name[Level2]= "Shift"; modifiers= Shift; map[Shift]= Level2; };
    type "ALPHABETIC" { level_name[Level1]= "Base"; level_name[Level2]= "Shift"; modifiers= Shift+Lock; map[Shift]= Level2; map[Lock]= Level2; map[Shift+Lock]= Level1; };
};
xkb_compat "min" {};
${symbols}
};`;
		const { ok } = runXkbcomp(keymap);
		expect(ok).toBe(true);
	});

	it.skipIf(!HAS_XKBCOMP)("validates custom layout with xkbcomp", () => {
		const customXkb = buildXkb({
			keycodes: {
				name: "custom",
				keys: [
					{ name: "ESC", code: 9 },
					{ name: "AE01", code: 10 },
					{ name: "AD01", code: 24 },
					{ name: "SPCE", code: 65 },
					{ name: "LCTL", code: 37 },
					{ name: "LALT", code: 64 },
				],
			},
			symbols: {
				name: "custom",
				keys: [
					{ key: "ESC", type: "ONE_LEVEL", symbols: [["Escape"]] },
					{ key: "AE01", type: "TWO_LEVEL", symbols: [["1", "exclam"]] },
					{ key: "AD01", type: "ALPHABETIC", symbols: [["q", "Q"]] },
					{ key: "SPCE", type: "ONE_LEVEL", symbols: [["space"]] },
					{ key: "LCTL", type: "ONE_LEVEL", symbols: [["Control_L"]] },
					{ key: "LALT", type: "ONE_LEVEL", symbols: [["Alt_L"]] },
				],
				modifierMap: [
					{ key: "<LCTL>", modifier: "Control" },
					{ key: "<LALT>", modifier: "Mod1" },
				],
			},
		});

		const tmpFile = join(tmpdir(), `jsxcb-custom-${Date.now()}.xkb`);
		const outFile = join(tmpdir(), `jsxcb-custom-${Date.now()}.xkm`);

		try {
			writeFileSync(tmpFile, customXkb, "utf-8");
			execSync(`xkbcomp -w 0 "${tmpFile}" "${outFile}" 2>&1`);
			expect(existsSync(outFile)).toBe(true);
		} finally {
			if (existsSync(tmpFile)) unlinkSync(tmpFile);
			if (existsSync(outFile)) unlinkSync(outFile);
		}
	});
});
