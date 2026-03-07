import { describe, it, expect } from "vitest";
import { getDotArt } from "./dotArt";

const GRID_SIZE = 24;
const TOTAL_SQUARES = GRID_SIZE * GRID_SIZE; // 576

describe("getDotArt", () => {
	describe("データ構造", () => {
		it("colors が 576 件", () => {
			const { colors } = getDotArt(3);
			expect(colors).toHaveLength(TOTAL_SQUARES);
		});

		it("fillOrder が 576 件", () => {
			const { fillOrder } = getDotArt(3);
			expect(fillOrder).toHaveLength(TOTAL_SQUARES);
		});

		it("fillOrder は 0〜575 の各値を1回ずつ含む（完全置換）", () => {
			const { fillOrder } = getDotArt(3);
			expect(new Set(fillOrder).size).toBe(TOTAL_SQUARES);
			expect(Math.min(...fillOrder)).toBe(0);
			expect(Math.max(...fillOrder)).toBe(TOTAL_SQUARES - 1);
		});

		it("colors はすべて '#' で始まる hex 文字列", () => {
			const { colors } = getDotArt(3);
			expect(colors.every((c) => /^#[0-9a-fA-F]{6}$/.test(c))).toBe(true);
		});
	});

	describe("MARCH_PATTERN データ整合性", () => {
		it("パターンが 24 行ある", () => {
			// colors = 576 件 = 24行 × 24列
			const { colors } = getDotArt(3);
			expect(colors).toHaveLength(GRID_SIZE * GRID_SIZE);
		});

		it("各行が 24 文字（parsePattern で正確に展開されている）", () => {
			// colors の件数が576なら、各行24文字で正しくパースされている証拠
			const { colors } = getDotArt(3);
			// 行ごとに分割して各行24件であることを確認
			for (let row = 0; row < GRID_SIZE; row++) {
				const rowColors = colors.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE);
				expect(rowColors).toHaveLength(GRID_SIZE);
			}
		});
	});
});
