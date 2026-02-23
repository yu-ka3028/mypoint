"use client";

import { useState } from "react";
import { type Reward, calcPointCard } from "@/core/pointCard";

type Props = {
	currentPoints: number;
	rewards: Reward[];
};

type TooltipState = {
	reward: Reward;
	squareIndex: number;
} | null;

export function PointCard({ currentPoints, rewards }: Props) {
	const { rows } = calcPointCard(currentPoints, rewards);
	const [tooltip, setTooltip] = useState<TooltipState>(null);

	return (
		<div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-6 space-y-1">
			{rows.map((row, rowIndex) => (
				<div key={rowIndex} className="grid grid-cols-8 gap-1">
					{row.squares.map((square, colIndex) => {
						const squareIndex = rowIndex * 8 + colIndex;
						const isTooltipOpen = tooltip?.squareIndex === squareIndex;

						if (square.reward) {
							return (
								<div key={colIndex} className="relative">
									<button
										type="button"
										className={`w-full aspect-square rounded-sm flex items-center justify-center text-sm ${
											square.filled
												? "bg-indigo-500 text-white"
												: "bg-gray-100 text-gray-400"
										}`}
										onClick={() =>
											setTooltip(isTooltipOpen ? null : { reward: square.reward!, squareIndex })
										}
									>
										🎁
									</button>
									{isTooltipOpen && (
										<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 whitespace-nowrap bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
											<p className="font-medium">{square.reward.label}</p>
											<p className="text-gray-300">{square.reward.points}pt</p>
											<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
										</div>
									)}
								</div>
							);
						}

						return (
							<div
								key={colIndex}
								className={`aspect-square rounded-sm ${
									square.filled ? "bg-indigo-500" : "bg-gray-100"
								}`}
							/>
						);
					})}
				</div>
			))}
		</div>
	);
}
