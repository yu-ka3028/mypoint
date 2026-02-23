import { describe, it, expect } from "vitest";
import { calcRoutinePoints, getJSTDate, getJSTWeek } from "./tasks";

describe("calcRoutinePoints", () => {
	it("1タスクのとき 100pt になる", () => {
		expect(calcRoutinePoints(1)).toBe(100);
	});

	it("2タスクのとき 50pt になる", () => {
		expect(calcRoutinePoints(2)).toBe(50);
	});

	it("3タスクのとき 33pt になる（floor）", () => {
		expect(calcRoutinePoints(3)).toBe(33);
	});

	it("5タスクのとき 20pt になる", () => {
		expect(calcRoutinePoints(5)).toBe(20);
	});

	it("7タスクのとき 14pt になる（floor）", () => {
		expect(calcRoutinePoints(7)).toBe(14);
	});

	it("0のとき 0pt になる", () => {
		expect(calcRoutinePoints(0)).toBe(0);
	});

	it("負数のとき 0pt になる", () => {
		expect(calcRoutinePoints(-1)).toBe(0);
	});
});

describe("getJSTDate", () => {
	it("YYYY-MM-DD 形式の文字列を返す", () => {
		const result = getJSTDate();
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it("有効な日付文字列を返す", () => {
		const result = getJSTDate();
		const date = new Date(result);
		expect(date.toString()).not.toBe("Invalid Date");
	});
});

describe("getJSTWeek", () => {
	it("YYYY-Www 形式の文字列を返す", () => {
		const result = getJSTWeek();
		expect(result).toMatch(/^\d{4}-W\d{2}$/);
	});

	it("週番号が 1〜53 の範囲内になる", () => {
		const result = getJSTWeek();
		const week = Number(result.split("-W")[1]);
		expect(week).toBeGreaterThanOrEqual(1);
		expect(week).toBeLessThanOrEqual(53);
	});
});
