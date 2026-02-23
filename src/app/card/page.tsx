"use client";

import { createClient } from "@/lib/supabase/client";
import { PointCard } from "@/components/point-card/PointCard";
import { BottomNav } from "@/components/BottomNav";
import { useEffect, useState } from "react";
import { resetStamps } from "@/lib/stampBadge";
import type { UserProfile } from "@/types";
import type { Reward } from "@/core/pointCard";

export default function CardPage() {
	const supabase = createClient();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [rewards, setRewards] = useState<Reward[]>([]);

	useEffect(() => {
		resetStamps();
	}, []);

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

	return (
		<div className="min-h-screen bg-gray-50 pb-20">
			<div className="max-w-md mx-auto">
				<div className="px-4 py-4 bg-white border-b border-gray-200">
					<h1 className="text-xl font-bold text-gray-900">ポイントカード</h1>
				</div>
				<div className="px-4 pt-6">
					{profile && (
						<>
							<div className="flex gap-4 mb-6 text-center">
								<div className="flex-1 bg-white rounded-lg py-3 border border-gray-200">
									<p className="text-2xl font-bold text-indigo-600">{profile.points_today}</p>
									<p className="text-xs text-gray-500 mt-1">今日</p>
								</div>
								<div className="flex-1 bg-white rounded-lg py-3 border border-gray-200">
									<p className="text-2xl font-bold text-indigo-600">{profile.points_this_week}</p>
									<p className="text-xs text-gray-500 mt-1">今週</p>
								</div>
								<div className="flex-1 bg-white rounded-lg py-3 border border-gray-200">
									<p className="text-2xl font-bold text-indigo-600">{profile.points_total}</p>
									<p className="text-xs text-gray-500 mt-1">累計</p>
								</div>
							</div>
							<PointCard currentPoints={profile.points_total} rewards={rewards} />
						</>
					)}
				</div>
			</div>
			<BottomNav />
		</div>
	);
}
