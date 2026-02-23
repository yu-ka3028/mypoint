"use client";

import { createClient } from "@/lib/supabase/client";
import { PointCardAnimated } from "@/components/point-card/PointCardAnimated";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { getStampCount, resetStamps, getPrevCardPoints, setPrevCardPoints } from "@/lib/stampBadge";
import { PTS_PER_SQUARE } from "@/core/pointCard";
import type { UserProfile } from "@/types";
import type { Reward } from "@/core/pointCard";

type RewardForm = {
	title: string;
	target_points: number;
};

type EditRewardForm = RewardForm & { id: string };

export default function CardPage() {
	const supabase = createClient();
	const [userId, setUserId] = useState("");
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [rewards, setRewards] = useState<Reward[]>([]);
	const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
	const animationStarted = useRef(false);
	const [showAddForm, setShowAddForm] = useState(false);
	const [addForm, setAddForm] = useState<RewardForm>({ title: "", target_points: 0 });
	const [editReward, setEditReward] = useState<EditRewardForm | null>(null);
	const [confirmDelete, setConfirmDelete] = useState(false);

	useEffect(() => {
		const load = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;
			setUserId(user.id);

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

	const fetchRewards = async () => {
		if (!userId) return;
		const { data } = await supabase.from("rewards").select("*").eq("user_id", userId).order("target_points");
		if (data) {
			setRewards(data.map((r) => ({ id: r.id, label: r.title, points: r.target_points })));
		}
	};

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

	const handleAddReward = async () => {
		if (!addForm.title.trim() || addForm.target_points <= 0) return;
		await supabase.from("rewards").insert({
			user_id: userId,
			title: addForm.title.trim(),
			target_points: addForm.target_points,
			is_public: false,
		});
		setAddForm({ title: "", target_points: 0 });
		setShowAddForm(false);
		await fetchRewards();
	};

	const handleSaveEdit = async () => {
		if (!editReward || !editReward.title.trim() || editReward.target_points <= 0) return;
		await supabase.from("rewards").update({
			title: editReward.title.trim(),
			target_points: editReward.target_points,
		}).eq("id", editReward.id);
		setEditReward(null);
		await fetchRewards();
	};

	const handleDeleteReward = async () => {
		if (!editReward) return;
		await supabase.from("rewards").delete().eq("id", editReward.id);
		setEditReward(null);
		await fetchRewards();
	};

	const openEdit = (reward: Reward) => {
		setEditReward({ id: reward.id, title: reward.label, target_points: reward.points });
		setConfirmDelete(false);
	};

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

					{/* ご褒美一覧 */}
					<div className="mt-6">
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-sm font-semibold text-gray-700">ご褒美</h2>
						</div>
						<Button variant="outline" size="sm" className="w-full mb-3" onClick={() => setShowAddForm(true)}>
							+ ご褒美を追加
						</Button>
						{rewards.length > 0 && (
							<div className="space-y-2">
								{rewards.map((reward) => (
									<div
										key={reward.id}
										className="flex items-center bg-white rounded-lg border border-gray-200"
									>
										<div className="flex items-center gap-3 flex-1 px-4 py-3">
											<span className="text-lg">🎁</span>
											<span className="flex-1 text-sm text-gray-800">{reward.label}</span>
											<span className="text-xs text-indigo-500 font-medium">{reward.points}pt</span>
										</div>
										<button
											type="button"
											onClick={() => openEdit(reward)}
											className="px-3 py-3 text-gray-300 hover:text-gray-500 text-lg leading-none"
										>
											…
										</button>
									</div>
								))}
							</div>
						)}
						{rewards.length === 0 && (
							<p className="text-center text-gray-400 text-sm mt-4">ご褒美を設定するとカードにマイルストーンが表示されます</p>
						)}
					</div>
				</div>
			</div>

			{/* 追加モーダル */}
			{showAddForm && (
				<div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={() => setShowAddForm(false)}>
					<div className="bg-white w-full max-w-md mx-auto rounded-t-xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
						<h2 className="font-semibold text-gray-900">ご褒美を追加</h2>
						<input
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
							placeholder="ご褒美の名前（例：ケーキ）"
							value={addForm.title}
							onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
							autoFocus
						/>
						<input
							type="number"
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
							placeholder="目標ポイント（例：500）"
							min={1}
							value={addForm.target_points || ""}
							onChange={(e) => setAddForm({ ...addForm, target_points: Number(e.target.value) })}
						/>
						<div className="flex gap-2">
							<Button variant="outline" className="flex-1" onClick={() => setShowAddForm(false)}>キャンセル</Button>
							<Button className="flex-1" onClick={handleAddReward}>追加</Button>
						</div>
					</div>
				</div>
			)}

			{/* 編集モーダル */}
			{editReward && (
				<div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={() => setEditReward(null)}>
					<div className="bg-white w-full max-w-md mx-auto rounded-t-xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
						<h2 className="font-semibold text-gray-900">ご褒美を編集</h2>
						<input
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
							placeholder="ご褒美の名前"
							value={editReward.title}
							onChange={(e) => setEditReward({ ...editReward, title: e.target.value })}
							autoFocus
						/>
						<input
							type="number"
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
							placeholder="目標ポイント"
							min={1}
							value={editReward.target_points || ""}
							onChange={(e) => setEditReward({ ...editReward, target_points: Number(e.target.value) })}
						/>
						<div className="flex gap-2">
							<Button variant="outline" className="flex-1" onClick={() => setEditReward(null)}>キャンセル</Button>
							<Button className="flex-1" onClick={handleSaveEdit}>保存</Button>
						</div>
						<div className="border-t border-gray-100 pt-3">
							{confirmDelete ? (
								<div className="flex items-center gap-3">
									<span className="text-sm text-gray-500 flex-1">本当に削除しますか？</span>
									<button type="button" onClick={() => setConfirmDelete(false)} className="text-sm text-gray-400">
										キャンセル
									</button>
									<button type="button" onClick={handleDeleteReward} className="text-sm text-red-500 font-medium">
										削除する
									</button>
								</div>
							) : (
								<button
									type="button"
									onClick={() => setConfirmDelete(true)}
									className="text-sm text-red-400 w-full text-left"
								>
									このご褒美を削除
								</button>
							)}
						</div>
					</div>
				</div>
			)}

			<BottomNav />
		</div>
	);
}
