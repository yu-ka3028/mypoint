"use client";

import { useEffect, useRef, useMemo } from "react";
import confetti from "canvas-confetti";
import { calcPointCard, PTS_PER_SQUARE, type Reward } from "@/core/pointCard";

type Props = {
	currentPoints: number;
	rewards: Reward[];
	animatingIndex: number | null;
};

export function PointCardAnimated({ currentPoints, rewards, animatingIndex }: Props) {
	const { rows } = calcPointCard(currentPoints, rewards);
	const squareRefs = useRef<Map<number, HTMLDivElement>>(new Map());

	const rewardIndices = useMemo(
		() => new Set(rewards.map((r) => Math.ceil(r.points / PTS_PER_SQUARE) - 1)),
		[rewards],
	);

	useEffect(() => {
		if (animatingIndex === null || !rewardIndices.has(animatingIndex)) return;
		const el = squareRefs.current.get(animatingIndex);
		if (!el) return;

		const rect = el.getBoundingClientRect();
		confetti({
			origin: {
				x: (rect.left + rect.width / 2) / window.innerWidth,
				y: (rect.top + rect.height / 2) / window.innerHeight,
			},
			particleCount: 100,
			spread: 80,
			startVelocity: 28,
			gravity: 0.9,
			colors: ["#6366f1", "#818cf8", "#f59e0b", "#fbbf24", "#ec4899", "#34d399"],
		});
	}, [animatingIndex, rewardIndices]);

	return (
		<div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-6 space-y-1">
			{rows.map((row, rowIndex) => (
				<div key={rowIndex} className="grid grid-cols-8 gap-1">
					{row.squares.map((square, colIndex) => {
						const squareIndex = rowIndex * 8 + colIndex;
						const isAnimating = animatingIndex === squareIndex;

						let animClass = "";
						if (square.filled && isAnimating) {
							animClass = square.reward ? "animate-reward-clear" : "animate-stamp";
						}

						return (
							<div
								key={colIndex}
								ref={(el) => {
									if (el) squareRefs.current.set(squareIndex, el);
									else squareRefs.current.delete(squareIndex);
								}}
								className={`aspect-square rounded-sm flex items-center justify-center text-sm ${
									square.filled ? `bg-indigo-500 ${animClass}` : "bg-gray-100"
								}`}
							>
								{square.reward ? "🎁" : null}
							</div>
						);
					})}
				</div>
			))}
		</div>
	);
}
