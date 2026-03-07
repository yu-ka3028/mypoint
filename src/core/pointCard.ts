import { getDotArt } from "./dotArt";
import type { MonthDotArt } from "./dotArt";

export const GRID_SIZE = 24;
export const TOTAL_SQUARES = GRID_SIZE * GRID_SIZE; // 576
export const PTS_PER_SQUARE = 5;

export type Reward = {
	id: string;
	label: string;
	points: number;
};

export type SquareState = {
	filled: boolean;
	color: string;
};

export type PointCardState = {
	filledByPoints: number;
	preOpened: number;
	totalSquares: number;
	squares: SquareState[];
	fillOrder: number[];
};

function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate();
}

export function calcPreOpened(year: number, month: number): number {
	const days = getDaysInMonth(year, month);
	const maxFillable = Math.floor((days * 100) / PTS_PER_SQUARE);
	return Math.max(0, TOTAL_SQUARES - maxFillable);
}

export function calcPointCard(
	currentPoints: number,
	_rewards: Reward[],
	year?: number,
	month?: number,
): PointCardState {
	const now = new Date();
	const y = year ?? now.getFullYear();
	const m = month ?? now.getMonth() + 1;

	const dotArt: MonthDotArt = getDotArt(m);
	const preOpened = calcPreOpened(y, m);

	const filledByPoints = Math.min(
		Math.floor(currentPoints / PTS_PER_SQUARE),
		TOTAL_SQUARES - preOpened,
	);
	const totalFilled = preOpened + filledByPoints;

	const fillPosition = new Array<number>(TOTAL_SQUARES);
	for (let i = 0; i < TOTAL_SQUARES; i++) {
		fillPosition[dotArt.fillOrder[i]] = i;
	}

	const squares: SquareState[] = Array.from({ length: TOTAL_SQUARES }, (_, gridIndex) => ({
		filled: fillPosition[gridIndex] < totalFilled,
		color: dotArt.colors[gridIndex],
	}));

	return {
		filledByPoints,
		preOpened,
		totalSquares: TOTAL_SQUARES,
		squares,
		fillOrder: dotArt.fillOrder,
	};
}
