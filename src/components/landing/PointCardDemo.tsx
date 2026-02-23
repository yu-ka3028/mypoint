"use client";

import { useState, useEffect, useRef } from "react";
import { PTS_PER_SQUARE, calcPointCard, type Reward } from "@/core/pointCard";
import { PointCardAnimated } from "@/components/point-card/PointCardAnimated";

const DEMO_REWARDS: Reward[] = [
	{ id: "1", label: "ケーキ", points: 200 },
	{ id: "2", label: "映画", points: 500 },
];

const STEP_MS = 700;
const ANIM_MS = 500;
const REWARD_ANIM_MS = 800;
const RESET_MS = 1500;

const REWARD_INDICES = new Set(
	DEMO_REWARDS.map((r) => Math.ceil(r.points / PTS_PER_SQUARE) - 1),
);

export function PointCardDemo() {
	const { totalSquares } = calcPointCard(0, DEMO_REWARDS);
	const [filledCount, setFilledCount] = useState(0);
	const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
	const stepRef = useRef(0);

	useEffect(() => {
		const interval = setInterval(() => {
			const step = stepRef.current;
			if (step < totalSquares) {
				setAnimatingIndex(step);
				setFilledCount(step + 1);
				const clearDelay = REWARD_INDICES.has(step) ? REWARD_ANIM_MS : ANIM_MS;
				setTimeout(() => setAnimatingIndex(null), clearDelay);
				stepRef.current = step + 1;
			} else {
				stepRef.current = 0;
				setFilledCount(0);
			}
		}, STEP_MS);

		return () => clearInterval(interval);
	}, [totalSquares]);

	return (
		<PointCardAnimated
			currentPoints={filledCount * PTS_PER_SQUARE}
			animatingIndex={animatingIndex}
			rewards={DEMO_REWARDS}
		/>
	);
}
