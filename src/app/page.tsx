"use client";

export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { useRoutineInit } from "@/hooks/useRoutineInit";
import { calcRoutinePoints, formatSlotDate, getJSTDate, getJSTWeek } from "@/core/tasks";
import { addStamp, removeStamp } from "@/lib/stampBadge";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Task, DailyRoutineStatus, WeeklyRoutineCompletion } from "@/types";

type Tab = "today" | "weekly" | "someday";

type AddTaskForm = {
	title: string;
	type: Task["type"];
	points: number;
	deadline: string;
	weekly_count: number;
};

type EditTaskForm = {
	id: string;
	type: Task["type"];
	title: string;
	points: number;
	deadline: string;
	weekly_count: number;
};

const TAB_DEFAULT_TYPE: Record<Tab, Task["type"]> = {
	today: "daily_routine",
	weekly: "weekly_routine",
	someday: "someday",
};

const DEBOUNCE_MS = 500;

export default function Home() {
	const supabase = createClient();
	const [userId, setUserId] = useState("");
	const [tab, setTab] = useState<Tab>("today");
	const [tasks, setTasks] = useState<Task[]>([]);
	const [dailyStatus, setDailyStatus] = useState<DailyRoutineStatus[]>([]);
	const [weeklyCompletions, setWeeklyCompletions] = useState<WeeklyRoutineCompletion[]>([]);
	const [todayCompletions, setTodayCompletions] = useState<{ task_id: string }[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState<AddTaskForm>({ title: "", type: "daily_routine", points: 0, deadline: "", weekly_count: 1 });
	const [showPointsInput, setShowPointsInput] = useState(false);
	const [editTask, setEditTask] = useState<EditTaskForm | null>(null);
	const [showEditPointsInput, setShowEditPointsInput] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [optimisticCompleted, setOptimisticCompleted] = useState<Record<string, boolean>>({});
	const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

	useRoutineInit(userId);

	useEffect(() => {
		supabase.auth.getUser().then(({ data }) => {
			if (data.user) setUserId(data.user.id);
		});
	}, [supabase]);

	useEffect(() => {
		if (!userId) return;
		fetchAll();
	}, [userId]);

	const fetchAll = async () => {
		const today = getJSTDate();
		const week = getJSTWeek();

		const [tasksRes, dailyRes, weeklyRes, completionsRes] = await Promise.all([
			supabase.from("tasks").select("*").eq("user_id", userId).eq("is_active", true).order("created_at"),
			supabase.from("daily_routine_status").select("*").eq("user_id", userId).eq("target_date", today),
			supabase.from("weekly_routine_completions").select("*").eq("user_id", userId).eq("target_week", week),
			supabase.from("task_completions").select("task_id").eq("user_id", userId).eq("completion_date", today),
		]);
		if (tasksRes.data) setTasks(tasksRes.data as Task[]);
		if (dailyRes.data) setDailyStatus(dailyRes.data as DailyRoutineStatus[]);
		if (weeklyRes.data) setWeeklyCompletions(weeklyRes.data as WeeklyRoutineCompletion[]);
		if (completionsRes.data) setTodayCompletions(completionsRes.data);
	};

	const isCompleted = (task: Task): boolean => {
		if (task.id in optimisticCompleted) return optimisticCompleted[task.id];
		if (task.type === "daily_routine") return dailyStatus.some((s) => s.task_id === task.id && s.completed);
		if (task.type === "weekly_routine") return weeklyCompletions.filter((c) => c.task_id === task.id).length >= task.weekly_count;
		return todayCompletions.some((c) => c.task_id === task.id);
	};

	const persistToggle = async (task: Task, completed: boolean) => {
		const today = getJSTDate();
		const week = getJSTWeek();

		if (completed) {
			if (task.type === "daily_routine") {
				await supabase.from("daily_routine_status").upsert(
					{ user_id: userId, task_id: task.id, target_date: today, completed: true, completed_at: new Date().toISOString() },
					{ onConflict: "user_id,task_id,target_date" },
				);
			}
			await supabase.from("task_completions").upsert(
				{ user_id: userId, task_id: task.id, points_earned: task.points, completion_date: today, completion_week: week },
				{ onConflict: "user_id,task_id,completion_date" },
			);
			await supabase.rpc("increment_points", { p_user_id: userId, p_points: task.points, p_type: task.type });
			toast(`+${task.points}pt ポイントゲット！`);
			addStamp();
		} else {
			if (task.type === "daily_routine") {
				await supabase.from("daily_routine_status")
					.update({ completed: false, completed_at: null })
					.eq("user_id", userId).eq("task_id", task.id).eq("target_date", today);
			}
			await supabase.from("task_completions")
				.delete()
				.eq("user_id", userId).eq("task_id", task.id).eq("completion_date", today);
			await supabase.rpc("increment_points", { p_user_id: userId, p_points: -task.points, p_type: task.type });
			removeStamp();
		}

		await fetchAll();
		setOptimisticCompleted((prev) => {
			const next = { ...prev };
			delete next[task.id];
			return next;
		});
	};

	const handleToggle = (task: Task) => {
		const newState = !isCompleted(task);
		setOptimisticCompleted((prev) => ({ ...prev, [task.id]: newState }));
		clearTimeout(debounceTimers.current[task.id]);
		debounceTimers.current[task.id] = setTimeout(() => {
			persistToggle(task, newState);
		}, DEBOUNCE_MS);
	};

	const handleSlotComplete = async (task: Task) => {
		const today = getJSTDate();
		const week = getJSTWeek();
		await supabase.from("weekly_routine_completions").insert({
			user_id: userId,
			task_id: task.id,
			target_week: week,
			completed_date: today,
		});
		await supabase.rpc("increment_points", { p_user_id: userId, p_points: task.points, p_type: task.type });
		toast(`+${task.points}pt ポイントゲット！`);
		addStamp();
		await fetchAll();
	};

	const handleSlotUncomplete = async (task: Task, completionId: string) => {
		await supabase.from("weekly_routine_completions").delete().eq("id", completionId);
		await supabase.rpc("increment_points", { p_user_id: userId, p_points: -task.points, p_type: task.type });
		removeStamp();
		await fetchAll();
	};

	const openEdit = (task: Task) => {
		setEditTask({ id: task.id, type: task.type, title: task.title, points: task.points, deadline: task.deadline ?? "", weekly_count: task.weekly_count });
		setShowEditPointsInput(task.points > 0);
		setConfirmDelete(false);
	};

	const handleSaveEdit = async () => {
		if (!editTask || !editTask.title.trim()) return;

		if (editTask.type === "weekly_routine") {
			await supabase.from("tasks").update({
				title: editTask.title.trim(),
				weekly_count: editTask.weekly_count,
			}).eq("id", editTask.id);

			const currentTask = tasks.find((t) => t.id === editTask.id);
			if (currentTask && currentTask.weekly_count !== editTask.weekly_count) {
				const allWeeklyTasks = tasks.filter((t) => t.type === "weekly_routine");
				const totalSlots = allWeeklyTasks.reduce((sum, t) =>
					sum + (t.id === editTask.id ? editTask.weekly_count : t.weekly_count), 0);
				const newPoints = calcRoutinePoints(totalSlots);
				await supabase.from("tasks").update({ points: newPoints }).in("id", allWeeklyTasks.map((t) => t.id));
			}
		} else {
			const isRoutine = editTask.type === "daily_routine";
			await supabase.from("tasks").update({
				title: editTask.title.trim(),
				...(isRoutine ? {} : { points: editTask.points, deadline: editTask.deadline || null }),
			}).eq("id", editTask.id);
		}

		await fetchAll();
		setEditTask(null);
	};

	const handleDeleteTask = async () => {
		if (!editTask) return;
		const task = tasks.find((t) => t.id === editTask.id);
		if (!task) return;
		await supabase.from("tasks").update({ is_active: false }).eq("id", editTask.id);
		const isRoutine = task.type === "daily_routine" || task.type === "weekly_routine";
		if (isRoutine) {
			const remaining = tasks.filter((t) => t.type === task.type && t.id !== task.id);
			if (remaining.length > 0) {
				let newPoints: number;
				if (task.type === "weekly_routine") {
					const totalSlots = remaining.reduce((sum, t) => sum + t.weekly_count, 0);
					newPoints = calcRoutinePoints(totalSlots);
				} else {
					newPoints = calcRoutinePoints(remaining.length);
				}
				await supabase.from("tasks").update({ points: newPoints }).in("id", remaining.map((t) => t.id));
			}
		}
		await fetchAll();
		setEditTask(null);
	};

	const handleAddTask = async () => {
		if (!form.title.trim()) return;

		const type = form.type;
		let points: number;

		if (type === "daily_routine") {
			const sameTypeTasks = tasks.filter((t) => t.type === "daily_routine");
			const newCount = sameTypeTasks.length + 1;
			points = calcRoutinePoints(newCount);
			if (sameTypeTasks.length > 0) {
				await supabase.from("tasks").update({ points }).in("id", sameTypeTasks.map((t) => t.id));
			}
		} else if (type === "weekly_routine") {
			const weeklyCount = form.weekly_count;
			const sameTypeTasks = tasks.filter((t) => t.type === "weekly_routine");
			const totalSlots = sameTypeTasks.reduce((sum, t) => sum + t.weekly_count, 0) + weeklyCount;
			points = calcRoutinePoints(totalSlots);
			if (sameTypeTasks.length > 0) {
				await supabase.from("tasks").update({ points }).in("id", sameTypeTasks.map((t) => t.id));
			}
		} else {
			points = form.points;
		}

		await supabase.from("tasks").insert({
			user_id: userId,
			title: form.title.trim(),
			type,
			points,
			...(type === "weekly_routine" ? { weekly_count: form.weekly_count } : {}),
			deadline: (type === "urgent" || type === "someday") ? (form.deadline || null) : null,
			is_active: true,
		});

		setForm({ title: "", type: TAB_DEFAULT_TYPE[tab], points: 0, deadline: "", weekly_count: 1 });
		setShowForm(false);
		await fetchAll();
	};

	const todayTasks = tasks.filter((t) => t.type === "daily_routine" || t.type === "urgent");
	const weeklyTasks = tasks.filter((t) => t.type === "weekly_routine");
	const somedayTasks = tasks.filter((t) => t.type === "someday");
	const visibleTasks = tab === "today" ? todayTasks : tab === "weekly" ? weeklyTasks : somedayTasks;
	const dailyRoutineTasks = todayTasks.filter((t) => t.type === "daily_routine");
	const urgentTasks = todayTasks.filter((t) => t.type === "urgent");

	const openForm = () => {
		setForm({ title: "", type: TAB_DEFAULT_TYPE[tab], points: 0, deadline: "", weekly_count: 1 });
		setShowPointsInput(false);
		setShowForm(true);
	};

	return (
		<div className="min-h-screen bg-gray-50 pb-20">
			<div className="max-w-md mx-auto">
				<Header />

				{/* Tabs */}
				<div className="flex bg-white border-b border-gray-200">
					{(["today", "weekly", "someday"] as Tab[]).map((t) => (
						<button
							key={t}
							onClick={() => { setTab(t); setShowForm(false); }}
							className={`flex-1 py-3 text-sm font-medium ${
								tab === t ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"
							}`}
						>
							{t === "today" ? "今日" : t === "weekly" ? "今週" : "いつか"}
						</button>
					))}
				</div>

				<div className="px-4 pt-4">
					<Button variant="outline" size="sm" className="w-full mb-4" onClick={openForm}>
						+ タスク追加
					</Button>

					{/* タスク追加モーダル */}
					{showForm && (
						<div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={() => setShowForm(false)}>
							<div className="bg-white w-full max-w-md mx-auto rounded-t-xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
								<h2 className="font-semibold text-gray-900">タスクを追加</h2>
								<input
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
									placeholder="タスク名"
									value={form.title}
									onChange={(e) => setForm({ ...form, title: e.target.value })}
									autoFocus
								/>
								{tab === "today" && (
									<select
										className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
										value={form.type}
										onChange={(e) => setForm({ ...form, type: e.target.value as Task["type"] })}
									>
										<option value="daily_routine">毎日ルーティン</option>
										<option value="urgent">緊急</option>
									</select>
								)}
								{tab === "weekly" && (
									<div className="flex items-center gap-3">
										<span className="text-sm text-gray-600">週の回数</span>
										<select
											className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
											value={form.weekly_count}
											onChange={(e) => setForm({ ...form, weekly_count: Number(e.target.value) })}
										>
											{[1, 2, 3, 4, 5, 6].map((n) => (
												<option key={n} value={n}>{n}回/週</option>
											))}
										</select>
									</div>
								)}
								{(form.type === "urgent" || form.type === "someday") && (
									(form.points > 0 || showPointsInput) ? (
										<div className="relative">
											<input
												type="number"
												className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-8"
												placeholder="ポイント数"
												min={1}
												autoFocus={showPointsInput && form.points === 0}
												value={form.points || ""}
												onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
											/>
											<button
												type="button"
												onClick={() => { setForm({ ...form, points: 0 }); setShowPointsInput(false); }}
												className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
											>
												✕
											</button>
										</div>
									) : (
										<button
											type="button"
											onClick={() => setShowPointsInput(true)}
											className="text-sm text-indigo-500"
										>
											+ ポイントを設定
										</button>
									)
								)}
								{(form.type === "urgent" || form.type === "someday") && (
									form.deadline ? (
										<div className="relative">
											<input
												type="date"
												className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 pr-8"
												value={form.deadline}
												onChange={(e) => setForm({ ...form, deadline: e.target.value })}
											/>
											<button
												type="button"
												onClick={() => setForm({ ...form, deadline: "" })}
												className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
											>
												✕
											</button>
										</div>
									) : (
										<label className="block">
											<span className="text-sm text-indigo-500 cursor-pointer">+ 期日を設定</span>
											<input
												type="date"
												className="sr-only"
												onChange={(e) => { if (e.target.value) setForm({ ...form, deadline: e.target.value }); }}
											/>
										</label>
									)
								)}
								<div className="flex gap-2">
									<Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>キャンセル</Button>
									<Button className="flex-1" onClick={handleAddTask}>追加</Button>
								</div>
							</div>
						</div>
					)}

					{/* 編集モーダル */}
					{editTask && (
						<div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={() => setEditTask(null)}>
							<div className="bg-white w-full max-w-md mx-auto rounded-t-xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
								<h2 className="font-semibold text-gray-900">タスクを編集</h2>
								<input
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
									placeholder="タスク名"
									value={editTask.title}
									onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
									autoFocus
								/>
								{editTask.type === "weekly_routine" && (
									<div className="flex items-center gap-3">
										<span className="text-sm text-gray-600">週の回数</span>
										<select
											className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
											value={editTask.weekly_count}
											onChange={(e) => setEditTask({ ...editTask, weekly_count: Number(e.target.value) })}
										>
											{[1, 2, 3, 4, 5, 6].map((n) => (
												<option key={n} value={n}>{n}回/週</option>
											))}
										</select>
									</div>
								)}
								{(editTask.type === "urgent" || editTask.type === "someday") && (
									(editTask.points > 0 || showEditPointsInput) ? (
										<div className="relative">
											<input
												type="number"
												className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-8"
												placeholder="ポイント数"
												min={1}
												autoFocus={showEditPointsInput && editTask.points === 0}
												value={editTask.points || ""}
												onChange={(e) => setEditTask({ ...editTask, points: Number(e.target.value) })}
											/>
											<button
												type="button"
												onClick={() => { setEditTask({ ...editTask, points: 0 }); setShowEditPointsInput(false); }}
												className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
											>
												✕
											</button>
										</div>
									) : (
										<button type="button" onClick={() => setShowEditPointsInput(true)} className="text-sm text-indigo-500">
											+ ポイントを設定
										</button>
									)
								)}
								{(editTask.type === "urgent" || editTask.type === "someday") && (
									editTask.deadline ? (
										<div className="relative">
											<input
												type="date"
												className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 pr-8"
												value={editTask.deadline}
												onChange={(e) => setEditTask({ ...editTask, deadline: e.target.value })}
											/>
											<button
												type="button"
												onClick={() => setEditTask({ ...editTask, deadline: "" })}
												className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
											>
												✕
											</button>
										</div>
									) : (
										<label className="block">
											<span className="text-sm text-indigo-500 cursor-pointer">+ 期日を設定</span>
											<input
												type="date"
												className="sr-only"
												onChange={(e) => { if (e.target.value) setEditTask({ ...editTask, deadline: e.target.value }); }}
											/>
										</label>
									)
								)}
								<div className="flex gap-2">
									<Button variant="outline" className="flex-1" onClick={() => setEditTask(null)}>キャンセル</Button>
									<Button className="flex-1" onClick={handleSaveEdit}>保存</Button>
								</div>
								<div className="border-t border-gray-100 pt-3">
									{confirmDelete ? (
										<div className="flex items-center gap-3">
											<span className="text-sm text-gray-500 flex-1">本当に削除しますか？</span>
											<button type="button" onClick={() => setConfirmDelete(false)} className="text-sm text-gray-400">
												キャンセル
											</button>
											<button type="button" onClick={handleDeleteTask} className="text-sm text-red-500 font-medium">
												削除する
											</button>
										</div>
									) : (
										<button
											type="button"
											onClick={() => setConfirmDelete(true)}
											className="text-sm text-red-400 w-full text-left"
										>
											このタスクを削除
										</button>
									)}
								</div>
							</div>
						</div>
					)}

					{/* タスク一覧 */}
					{tab === "today" && (
						<>
							<TaskSection
								title={`毎日ルーティン${dailyRoutineTasks.length > 0 ? ` (${dailyRoutineTasks[0].points}pt/個)` : ""}`}
								tasks={dailyRoutineTasks}
								isCompleted={isCompleted}
								onToggle={handleToggle}
								onEdit={openEdit}
							/>
							<TaskSection
								title="緊急"
								tasks={urgentTasks}
								isCompleted={isCompleted}
								onToggle={handleToggle}
								onEdit={openEdit}
								showPoints
							/>
						</>
					)}
					{tab === "weekly" && (
						<WeeklyTaskSection
							title={`毎週ルーティン${weeklyTasks.length > 0 ? ` (${weeklyTasks[0].points}pt/スロット)` : ""}`}
							tasks={weeklyTasks}
							completions={weeklyCompletions}
							onSlotComplete={handleSlotComplete}
							onSlotUncomplete={handleSlotUncomplete}
							onEdit={openEdit}
						/>
					)}
					{tab === "someday" && (
						<TaskSection
							title="いつかやる"
							tasks={somedayTasks}
							isCompleted={isCompleted}
							onToggle={handleToggle}
							onEdit={openEdit}
							showPoints
						/>
					)}

					{visibleTasks.length === 0 && (
						<p className="text-center text-gray-400 text-sm mt-8">タスクがありません</p>
					)}
				</div>
			</div>

			<BottomNav />
		</div>
	);
}

type TaskSectionProps = {
	title: string;
	tasks: Task[];
	isCompleted: (task: Task) => boolean;
	onToggle: (task: Task) => void;
	onEdit: (task: Task) => void;
	showPoints?: boolean;
};

function TaskSection({ title, tasks, isCompleted, onToggle, onEdit, showPoints }: TaskSectionProps) {
	if (tasks.length === 0) return null;
	return (
		<div className="mb-6">
			<h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h2>
			<div className="space-y-2">
				{tasks.map((task) => {
					const done = isCompleted(task);
					return (
						<div
							key={task.id}
							className={`flex items-center bg-white rounded-lg border ${done ? "border-gray-100" : "border-gray-200"}`}
						>
							<button
								type="button"
								onClick={() => onToggle(task)}
								className="flex items-center gap-3 flex-1 px-4 py-3 text-left active:opacity-70"
							>
								<span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
									done ? "bg-indigo-500 border-indigo-500" : "border-gray-300"
								}`}>
									{done && (
										<svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
										</svg>
									)}
								</span>
								<span className={`flex-1 text-sm ${done ? "line-through text-gray-400" : "text-gray-800"}`}>
									{task.title}
								</span>
								{showPoints && (
									<span className="text-xs text-gray-400">{task.points}pt</span>
								)}
							</button>
							<button
								type="button"
								onClick={() => onEdit(task)}
								className="px-3 py-3 text-gray-300 hover:text-gray-500 text-lg leading-none"
							>
								…
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
}

type WeeklyTaskSectionProps = {
	title: string;
	tasks: Task[];
	completions: WeeklyRoutineCompletion[];
	onSlotComplete: (task: Task) => void;
	onSlotUncomplete: (task: Task, completionId: string) => void;
	onEdit: (task: Task) => void;
};

function WeeklyTaskSection({ title, tasks, completions, onSlotComplete, onSlotUncomplete, onEdit }: WeeklyTaskSectionProps) {
	if (tasks.length === 0) return null;
	const today = getJSTDate();
	return (
		<div className="mb-6">
			<h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h2>
			<div className="space-y-2">
				{tasks.map((task) => {
					const taskCompletions = completions
						.filter((c) => c.task_id === task.id)
						.sort((a, b) => a.completed_date.localeCompare(b.completed_date));
					const isFull = taskCompletions.length >= task.weekly_count;

					if (task.weekly_count === 1) {
						const done = taskCompletions.length >= 1;
						return (
							<div key={task.id} className={`flex items-center bg-white rounded-lg border ${done ? "border-gray-100" : "border-gray-200"}`}>
								<button
									type="button"
									onClick={() => done
										? onSlotUncomplete(task, taskCompletions[0].id)
										: onSlotComplete(task)
									}
									className="flex items-center gap-3 flex-1 px-4 py-3 text-left active:opacity-70"
								>
									<span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
										done ? "bg-indigo-500 border-indigo-500" : "border-gray-300"
									}`}>
										{done && (
											<svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
											</svg>
										)}
									</span>
									<span className={`flex-1 text-sm ${done ? "line-through text-gray-400" : "text-gray-800"}`}>
										{task.title}
									</span>
								</button>
								<button type="button" onClick={() => onEdit(task)} className="px-3 py-3 text-gray-300 hover:text-gray-500 text-lg leading-none">…</button>
							</div>
						);
					}

					return (
						<div key={task.id} className={`bg-white rounded-lg border ${isFull ? "border-gray-100" : "border-gray-200"}`}>
							<div className="flex items-center px-4 py-2">
								<span className={`flex-1 text-sm ${isFull ? "line-through text-gray-400" : "text-gray-800"}`}>{task.title}</span>
								<span className="text-xs text-gray-400 mr-3">{taskCompletions.length}/{task.weekly_count}</span>
								<button type="button" onClick={() => onEdit(task)} className="text-gray-300 hover:text-gray-500 text-lg leading-none">…</button>
							</div>
							<div className="flex px-4 pb-3 gap-2">
								{Array.from({ length: task.weekly_count }).map((_, i) => {
									const completion = taskCompletions[i];
									const isToday = completion?.completed_date === today;
									const canTap = !completion || isToday;
									return (
										<button
											key={i}
											type="button"
											disabled={!canTap}
											onClick={() => {
												if (!completion) onSlotComplete(task);
												else if (isToday) onSlotUncomplete(task, completion.id);
											}}
											className={`flex-1 rounded border text-xs py-2 ${
												completion
													? isToday
														? "bg-indigo-100 border-indigo-300 text-indigo-700"
														: "bg-gray-100 border-gray-200 text-gray-500"
													: "border-gray-200 text-gray-300"
											}`}
										>
											{completion ? formatSlotDate(completion.completed_date) : ""}
										</button>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

