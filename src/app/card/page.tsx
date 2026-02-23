"use client";

import { createClient } from "@/lib/supabase/client";
import { PointCardAnimated } from "@/components/point-card/PointCardAnimated";
import { BottomNav } from "@/components/BottomNav";
import { useEffect, useRef, useState } from "react";
import { getStampCount, resetStamps, getPrevCardPoints, setPrevCardPoints } from "@/lib/stampBadge";
import { PTS_PER_SQUARE } from "@/core/pointCard";
import type { UserProfile } from "@/types";
import type { Reward } from "@/core/pointCard";

export default function CardPage() {
	const supabase = createClient();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [rewards, setRewards] = useState<Reward[]>([]);
	const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
	const animationStarted = useRef(false);

	useEffect(() => {
		const load = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			const [profileRes, rewardsRes] = await Promise.all([
				supabase.from("user_profiles").select("*").eq("id", user.id).single(),
				supabase.from("rewards").select("*").eq("user_id", user.id).order("target_points"),
			]);

			if (profileRes.data) setProfile(profileRes.data as UserProfile);
			if (rewardsRes.data) {
				setRewards(
					rewardsRes.data.map((r) => ({
						id: r.id,
						label: r.title,
						points: r.target_points,
					})),
				);
			}
		};
		load();
	}, [supabase]);

	useEffect(() => {
		if (!profile || animationStarted.current) return;
		animationStarted.current = true;

		const currentPoints = profile.points_total;
		const pendingStamps = getStampCount();
		const prevPoints = getPrevCardPoints();

		resetStamps();
		setPrevCardPoints(currentPoints);

		if (pendingStamps === 0 || prevPoints === null) return;

		const prevFilled = Math.floor(prevPoints / PTS_PER_SQUARE);
		const currFilled = Math.floor(currentPoints / PTS_PER_SQUARE);
		if (currFilled <= prevFilled) return;

		const INTERVAL_MS = 300;
		for (let i = prevFilled; i < currFilled; i++) {
			const idx = i;
			setTimeout(() => setAnimatingIndex(idx), (idx - prevFilled) * INTERVAL_MS);
		}
		setTimeout(() => setAnimatingIndex(null), (currFilled - prevFilled) * INTERVAL_MS + 500);
	}, [profile]);

	return (
		<div className="min-h-screen bg-gray-50 pb-20">
			<div className="max-w-md mx-auto">
				<div className="px-4 py-4 bg-white border-b border-gray-200">
					<h1 className="text-xl font-bold text-gray-900">ポイントカード</h1>
				</div>
				<div className="px-4 pt-6">
					{profile && (
						<>
							<div className="flex gap-2 sm:gap-4 mb-6 text-center">
								<div className="flex-1 bg-white rounded-lg py-2 sm:py-3 border border-gray-200">
									<p className="text-xl sm:text-2xl font-bold text-indigo-600">{profile.points_today}</p>
									<p className="text-xs text-gray-500 mt-1">今日</p>
								</div>
								<div className="flex-1 bg-white rounded-lg py-2 sm:py-3 border border-gray-200">
									<p className="text-xl sm:text-2xl font-bold text-indigo-600">{profile.points_this_week}</p>
									<p className="text-xs text-gray-500 mt-1">今週</p>
								</div>
								<div className="flex-1 bg-white rounded-lg py-2 sm:py-3 border border-gray-200">
									<p className="text-xl sm:text-2xl font-bold text-indigo-600">{profile.points_total}</p>
									<p className="text-xs text-gray-500 mt-1">累計</p>
								</div>
							</div>
							<PointCardAnimated
								currentPoints={profile.points_total}
								rewards={rewards}
								animatingIndex={animatingIndex}
							/>
						</>
					)}
				</div>
			</div>
			<BottomNav />
		</div>
	);
}
