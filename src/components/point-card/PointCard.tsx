"use client";

import { type Reward, calcPointCard } from "@/core/pointCard";

type Props = {
	currentPoints: number;
	rewards: Reward[];
};

export function PointCard({ currentPoints, rewards }: Props) {
	const { squares } = calcPointCard(currentPoints, rewards);

	return (
		<div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4">
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(24, minmax(0, 1fr))",
					gap: "1px",
				}}
			>
				{squares.map((square, i) => (
					<div
						key={i}
						className="aspect-square"
						style={{ backgroundColor: square.filled ? square.color : "#f3f4f6" }}
					/>
				))}
			</div>
		</div>
	);
}
