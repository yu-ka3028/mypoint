"use client";

import { useEffect, useRef, useMemo } from "react";
import confetti from "canvas-confetti";
import { calcPointCard, PTS_PER_SQUARE, type Reward } from "@/core/pointCard";

type Props = {
	currentPoints: number;
	rewards: Reward[];
	animatingIndex: number | null; // ポイント積み上げによる埋め順位置（0始まり、preOpened除く）
};

export function PointCardAnimated({ currentPoints, rewards, animatingIndex }: Props) {
	const { squares, fillOrder, preOpened } = calcPointCard(currentPoints, rewards);
	const squareRefs = useRef<Map<number, HTMLDivElement>>(new Map());

	const rewardFillPositions = useMemo(
		() => new Set(rewards.map((r) => Math.ceil(r.points / PTS_PER_SQUARE) - 1)),
		[rewards],
	);

	const animatingGridIndex =
		animatingIndex !== null ? (fillOrder[preOpened + animatingIndex] ?? null) : null;

	useEffect(() => {
		if (animatingIndex === null || !rewardFillPositions.has(animatingIndex)) return;
		if (animatingGridIndex === null) return;

		const el = squareRefs.current.get(animatingGridIndex);
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
	}, [animatingIndex, rewardFillPositions, animatingGridIndex]);

	return (
		<div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4">
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(24, minmax(0, 1fr))",
					gap: "1px",
				}}
			>
				{squares.map((square, gridIndex) => {
					const isAnimating = gridIndex === animatingGridIndex;
					const animClass = square.filled && isAnimating ? "animate-stamp" : "";

					return (
						<div
							key={gridIndex}
							ref={(el) => {
								if (el) squareRefs.current.set(gridIndex, el);
								else squareRefs.current.delete(gridIndex);
							}}
							className={`aspect-square ${animClass}`}
							style={{ backgroundColor: square.filled ? square.color : "#f3f4f6" }}
						/>
					);
				})}
			</div>
		</div>
	);
}
