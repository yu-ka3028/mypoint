export const COLS = 8;
export const PTS_PER_SQUARE = 25;
export const PTS_PER_ROW = COLS * PTS_PER_SQUARE; // 200

export type Reward = {
	id: string;
	label: string;
	points: number;
};

export type SquareState = {
	filled: boolean;
	reward: Reward | null;
};

export type RowState = {
	squares: SquareState[];
};

export type PointCardState = {
	filledSquares: number;
	totalSquares: number;
	rows: RowState[];
};

export function calcPointCard(currentPoints: number, rewards: Reward[]): PointCardState {
	const maxPoints = rewards.length > 0
		? Math.max(...rewards.map((r) => r.points))
		: 500;

	const maxSquareIndex = Math.ceil(maxPoints / PTS_PER_SQUARE) - 1;
	const totalRows = Math.ceil((maxSquareIndex + 1) / COLS);
	const totalSquares = totalRows * COLS;
	const filledSquares = Math.floor(currentPoints / PTS_PER_SQUARE);

	const rewardBySquare = new Map<number, Reward>();
	for (const reward of rewards) {
		const squareIndex = Math.ceil(reward.points / PTS_PER_SQUARE) - 1;
		rewardBySquare.set(squareIndex, reward);
	}

	const rows: RowState[] = Array.from({ length: totalRows }, (_, rowIndex) => {
		const squares: SquareState[] = Array.from({ length: COLS }, (_, colIndex) => {
			const squareIndex = rowIndex * COLS + colIndex;
			return {
				filled: squareIndex < filledSquares,
				reward: rewardBySquare.get(squareIndex) ?? null,
			};
		});
		return { squares };
	});

	return { filledSquares, totalSquares, rows };
}
