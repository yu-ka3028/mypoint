import { describe, it, expect } from "vitest";
import { calcPointCard } from "./pointCard";

describe("calcPointCard", () => {
	describe("最終ご褒美 200pt（横1行ぴったり）", () => {
		const rewards = [{ id: "1", label: "ケーキ", points: 200 }];

		it("totalSquares が 8 になる", () => {
			const { totalSquares } = calcPointCard(0, rewards);
			expect(totalSquares).toBe(8);
		});

		it("行数が 1 になる", () => {
			const { rows } = calcPointCard(0, rewards);
			expect(rows).toHaveLength(1);
		});

		it("1行目が 8 マスになる", () => {
			const { rows } = calcPointCard(0, rewards);
			expect(rows[0].squares).toHaveLength(8);
		});

		it("最終マス（index 7）にご褒美が配置される", () => {
			const { rows } = calcPointCard(0, rewards);
			expect(rows[0].squares[7].reward?.label).toBe("ケーキ");
		});

		it("200pt 達成時に全マス埋まる", () => {
			const { filledSquares, totalSquares } = calcPointCard(200, rewards);
			expect(filledSquares).toBe(totalSquares);
		});
	});

	describe("最終ご褒美 250pt（2行目途中で終わる）", () => {
		const rewards = [{ id: "1", label: "旅行", points: 250 }];

		it("totalSquares が 10 になる", () => {
			const { totalSquares } = calcPointCard(0, rewards);
			expect(totalSquares).toBe(10);
		});

		it("行数が 2 になる", () => {
			const { rows } = calcPointCard(0, rewards);
			expect(rows).toHaveLength(2);
		});

		it("1行目が 8 マスになる", () => {
			const { rows } = calcPointCard(0, rewards);
			expect(rows[0].squares).toHaveLength(8);
		});

		it("2行目が 2 マスになる（余白なし）", () => {
			const { rows } = calcPointCard(0, rewards);
			expect(rows[1].squares).toHaveLength(2);
		});

		it("最終マス（index 9）にご褒美が配置される", () => {
			const { rows } = calcPointCard(0, rewards);
			expect(rows[1].squares[1].reward?.label).toBe("旅行");
		});

		it("250pt 達成時に全マス埋まる", () => {
			const { filledSquares, totalSquares } = calcPointCard(250, rewards);
			expect(filledSquares).toBe(totalSquares);
		});
	});

	describe("最終ご褒美 10000pt", () => {
		const rewards = [{ id: "1", label: "海外旅行", points: 10000 }];

		it("totalSquares が 400 になる", () => {
			const { totalSquares } = calcPointCard(0, rewards);
			expect(totalSquares).toBe(400);
		});

		it("行数が 50 になる", () => {
			const { rows } = calcPointCard(0, rewards);
			expect(rows).toHaveLength(50);
		});

		it("全行が 8 マスになる", () => {
			const { rows } = calcPointCard(0, rewards);
			for (const row of rows) {
				expect(row.squares).toHaveLength(8);
			}
		});

		it("最終マス（index 399）にご褒美が配置される", () => {
			const { rows } = calcPointCard(0, rewards);
			expect(rows[49].squares[7].reward?.label).toBe("海外旅行");
		});

		it("10000pt 達成時に全マス埋まる", () => {
			const { filledSquares, totalSquares } = calcPointCard(10000, rewards);
			expect(filledSquares).toBe(totalSquares);
		});
	});
});
