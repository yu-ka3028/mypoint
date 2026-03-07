import { describe, it, expect } from "vitest";
import { calcPointCard, calcPreOpened, PTS_PER_SQUARE, TOTAL_SQUARES } from "./pointCard";

const YEAR = 2026;
const MONTH_MAR = 3; // 31日 → preOpened=0
const MONTH_FEB = 2; // 28日 → preOpened=16

describe("calcPreOpened", () => {
	it("3月（31日）はpreOpenedが0", () => {
		expect(calcPreOpened(YEAR, MONTH_MAR)).toBe(0);
	});

	it("2月平年（28日）はpreOpenedが16", () => {
		// maxFillable = floor(28 * 100 / 5) = 560, preOpened = 576 - 560 = 16
		expect(calcPreOpened(2025, MONTH_FEB)).toBe(16);
	});

	it("2月閏年（29日）はpreOpenedが0", () => {
		// maxFillable = floor(29 * 100 / 5) = 580 > 576, preOpened = 0
		expect(calcPreOpened(2024, MONTH_FEB)).toBe(0);
	});

	it("4月（30日）はpreOpenedが0", () => {
		// maxFillable = floor(30 * 100 / 5) = 600 > 576, preOpened = 0
		expect(calcPreOpened(YEAR, 4)).toBe(0);
	});
});

describe("calcPointCard", () => {
	describe("基本構造", () => {
		it("totalSquares が 576 になる", () => {
			const { totalSquares } = calcPointCard(0, [], YEAR, MONTH_MAR);
			expect(totalSquares).toBe(TOTAL_SQUARES);
		});

		it("squares が 576 件になる", () => {
			const { squares } = calcPointCard(0, [], YEAR, MONTH_MAR);
			expect(squares).toHaveLength(TOTAL_SQUARES);
		});
	});

	describe("3月（preOpened=0）", () => {
		it("0pt では何も埋まらない", () => {
			const { filledByPoints, squares } = calcPointCard(0, [], YEAR, MONTH_MAR);
			expect(filledByPoints).toBe(0);
			expect(squares.filter((s) => s.filled)).toHaveLength(0);
		});

		it(`${PTS_PER_SQUARE}pt で 1マス埋まる`, () => {
			const { filledByPoints } = calcPointCard(PTS_PER_SQUARE, [], YEAR, MONTH_MAR);
			expect(filledByPoints).toBe(1);
		});

		it("100pt で 20マス埋まる", () => {
			const { filledByPoints } = calcPointCard(100, [], YEAR, MONTH_MAR);
			expect(filledByPoints).toBe(20);
		});

		it("2880pt（5pt×576）で全マスが埋まる", () => {
			const { filledByPoints, squares } = calcPointCard(
				PTS_PER_SQUARE * TOTAL_SQUARES,
				[],
				YEAR,
				MONTH_MAR,
			);
			expect(filledByPoints).toBe(TOTAL_SQUARES);
			expect(squares.filter((s) => s.filled)).toHaveLength(TOTAL_SQUARES);
		});
	});

	describe("2月平年（preOpened=16）", () => {
		it("0pt でも 16マス埋まっている", () => {
			const { preOpened, squares } = calcPointCard(0, [], 2025, MONTH_FEB);
			expect(preOpened).toBe(16);
			expect(squares.filter((s) => s.filled)).toHaveLength(16);
		});

		it("ポイントで埋められる最大は 560マス", () => {
			const { filledByPoints } = calcPointCard(
				PTS_PER_SQUARE * TOTAL_SQUARES,
				[],
				2025,
				MONTH_FEB,
			);
			expect(filledByPoints).toBe(TOTAL_SQUARES - 16);
		});
	});

	describe("ランダム埋め順", () => {
		it("fillOrder は 576 件", () => {
			const { fillOrder } = calcPointCard(0, [], YEAR, MONTH_MAR);
			expect(fillOrder).toHaveLength(TOTAL_SQUARES);
		});

		it("fillOrder は 0〜575 の各値を1回ずつ含む", () => {
			const { fillOrder } = calcPointCard(0, [], YEAR, MONTH_MAR);
			expect(new Set(fillOrder).size).toBe(TOTAL_SQUARES);
		});
	});

	describe("squaresの色", () => {
		it("埋まったマスは color が '#f3f4f6' でない（ドット絵カラー）", () => {
			const { squares } = calcPointCard(PTS_PER_SQUARE, [], YEAR, MONTH_MAR);
			const filled = squares.filter((s) => s.filled);
			expect(filled.every((s) => s.color !== "#f3f4f6")).toBe(true);
		});
	});
});
