"use client";

import { useState, useEffect, useRef } from "react";
import { PTS_PER_SQUARE } from "@/core/pointCard";
import { PointCardAnimated } from "@/components/point-card/PointCardAnimated";
import type { Reward } from "@/core/pointCard";

const DEMO_REWARDS: Reward[] = [
	{ id: "1", label: "ケーキ", points: 50 },
	{ id: "2", label: "映画", points: 120 },
];

const DEMO_STEPS = 40;
const STEP_MS = 600;
const ANIM_MS = 400;
const REWARD_ANIM_MS = 800;

const REWARD_FILL_POSITIONS = new Set(
	DEMO_REWARDS.map((r) => Math.ceil(r.points / PTS_PER_SQUARE) - 1),
);

export function PointCardDemo() {
	const [filledCount, setFilledCount] = useState(0);
	const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
	const stepRef = useRef(0);

	useEffect(() => {
		const interval = setInterval(() => {
			const step = stepRef.current;
			if (step < DEMO_STEPS) {
				setAnimatingIndex(step);
				setFilledCount(step + 1);
				const clearDelay = REWARD_FILL_POSITIONS.has(step) ? REWARD_ANIM_MS : ANIM_MS;
				setTimeout(() => setAnimatingIndex(null), clearDelay);
				stepRef.current = step + 1;
			} else {
				stepRef.current = 0;
				setFilledCount(0);
			}
		}, STEP_MS);

		return () => clearInterval(interval);
	}, []);

	return (
		<PointCardAnimated
			currentPoints={filledCount * PTS_PER_SQUARE}
			animatingIndex={animatingIndex}
			rewards={DEMO_REWARDS}
		/>
	);
}
