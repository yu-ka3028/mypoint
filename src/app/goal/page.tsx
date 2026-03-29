"use client";

export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import type { Goal, GoalStep } from "@/types";

type GoalWithSteps = Goal & { steps: GoalStep[] };

type CreateForm = {
	name: string;
	target_date: string;
	milestone_title: string;
	milestone_date: string;
	extra_steps: { title: string; scheduled_date: string }[];
};

const DEFAULT_FORM: CreateForm = {
	name: "",
	target_date: "",
	milestone_title: "",
	milestone_date: "",
	extra_steps: [],
};

export default function GoalPage() {
	const supabase = createClient();
	const [userId, setUserId] = useState("");
	const [goals, setGoals] = useState<GoalWithSteps[]>([]);
	const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState<CreateForm>(DEFAULT_FORM);

	useEffect(() => {
		supabase.auth.getUser().then(({ data }) => {
			if (data.user) setUserId(data.user.id);
		});
	}, [supabase]);

	useEffect(() => {
		if (!userId) return;
		fetchGoals();
	}, [userId]);

	const fetchGoals = async () => {
		const { data: goalsData } = await supabase
			.from("goals")
			.select("*")
			.eq("user_id", userId)
			.order("created_at");
		if (!goalsData) return;

		const goalIds = goalsData.map((g) => g.id);
		if (goalIds.length === 0) {
			setGoals([]);
			return;
		}
		const { data: stepsData } = await supabase
			.from("goal_steps")
			.select("*")
			.in("goal_id", goalIds)
			.order("order");

		const combined: GoalWithSteps[] = goalsData.map((g) => ({
			...(g as Goal),
			steps: (stepsData ?? []).filter((s) => s.goal_id === g.id) as GoalStep[],
		}));

		setGoals(combined);
		if (combined.length > 0 && !selectedGoalId) {
			setSelectedGoalId(combined[0].id);
		}
	};

	const handleCreate = async () => {
		if (!form.name.trim() || !form.target_date || !form.milestone_title.trim() || !form.milestone_date) return;

		const { data: newGoal } = await supabase
			.from("goals")
			.insert({ user_id: userId, name: form.name.trim(), target_date: form.target_date })
			.select()
			.single();
		if (!newGoal) return;

		const steps = [
			...form.extra_steps
				.filter((s) => s.title.trim())
				.map((s, i) => ({
					goal_id: newGoal.id,
					title: s.title.trim(),
					order: i + 1,
					scheduled_date: s.scheduled_date || null,
					is_milestone: false,
				})),
			{
				goal_id: newGoal.id,
				title: form.milestone_title.trim(),
				order: form.extra_steps.filter((s) => s.title.trim()).length + 1,
				scheduled_date: form.milestone_date,
				is_milestone: true,
			},
			{
				goal_id: newGoal.id,
				title: form.name.trim(),
				order: form.extra_steps.filter((s) => s.title.trim()).length + 2,
				scheduled_date: form.target_date,
				is_milestone: true,
			},
		];

		await supabase.from("goal_steps").insert(steps);
		setShowForm(false);
		setForm(DEFAULT_FORM);
		await fetchGoals();
		setSelectedGoalId(newGoal.id);
	};

	const handleToggleStep = async (step: GoalStep) => {
		if (step.completed_at) {
			await supabase.from("goal_steps").update({ completed_at: null }).eq("id", step.id);
		} else {
			await supabase.from("goal_steps").update({ completed_at: new Date().toISOString() }).eq("id", step.id);
		}
		await fetchGoals();
	};

	const addExtraStep = () => {
		setForm((f) => ({ ...f, extra_steps: [...f.extra_steps, { title: "", scheduled_date: "" }] }));
	};

	const removeExtraStep = (i: number) => {
		setForm((f) => ({ ...f, extra_steps: f.extra_steps.filter((_, idx) => idx !== i) }));
	};

	const [editMode, setEditMode] = useState(false);
	const [editingStep, setEditingStep] = useState<GoalStep | null>(null);
	const [editStepForm, setEditStepForm] = useState({ title: "", scheduled_date: "" });
	const [showDatePicker, setShowDatePicker] = useState(false);

	const openEditStep = (step: GoalStep) => {
		setEditingStep(step);
		setEditStepForm({ title: step.title, scheduled_date: step.scheduled_date ?? "" });
		setShowDatePicker(false);
	};

	const handleSaveStep = async () => {
		if (!editingStep || !editStepForm.title.trim()) return;
		await supabase.from("goal_steps").update({
			title: editStepForm.title.trim(),
			scheduled_date: editStepForm.scheduled_date || null,
		}).eq("id", editingStep.id);

		// ゴールステップ（タイムライン上の最後のステップ）の日付変更時はgoals.target_dateも連動
		const goal = goals.find((g) => g.steps.some((s) => s.id === editingStep.id));
		if (goal && editStepForm.scheduled_date) {
			const sortedSteps = sortSteps(goal.steps);
			const isLastStep = sortedSteps[sortedSteps.length - 1].id === editingStep.id;
			if (isLastStep) {
				await supabase.from("goals").update({ target_date: editStepForm.scheduled_date }).eq("id", goal.id);
			}
		}

		setEditingStep(null);
		await fetchGoals();
	};

	const handleReorder = async (steps: GoalStep[], fromIndex: number, direction: "up" | "down") => {
		const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
		if (toIndex < 0 || toIndex >= steps.length) return;

		const updated = [...steps];
		const aOrder = updated[fromIndex].order;
		const bOrder = updated[toIndex].order;

		await Promise.all([
			supabase.from("goal_steps").update({ order: bOrder }).eq("id", updated[fromIndex].id),
			supabase.from("goal_steps").update({ order: aOrder }).eq("id", updated[toIndex].id),
		]);
		await fetchGoals();
	};

	const selectedGoal = goals.find((g) => g.id === selectedGoalId) ?? null;
	const isEmpty = goals.length === 0;

	return (
		<div className="min-h-screen bg-gray-50 pb-20">
			<div className="max-w-md mx-auto">
				<Header />

				{isEmpty ? (
					<EmptyState onAdd={() => setShowForm(true)} />
				) : (
					<>
						{/* カテゴリタブ */}
						<div className="flex bg-white border-b border-gray-200 overflow-x-auto">
							{goals.map((g) => (
								<button
									key={g.id}
									type="button"
									onClick={() => { setSelectedGoalId(g.id); setEditMode(false); }}
									className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap ${
										selectedGoalId === g.id
											? "text-indigo-600 border-b-2 border-indigo-600"
											: "text-gray-500"
									}`}
								>
									{g.name}
								</button>
							))}
							<button
								type="button"
								onClick={() => setShowForm(true)}
								className="flex-shrink-0 px-4 py-3 text-sm text-gray-400"
							>
								＋
							</button>
						</div>

						{selectedGoal && (
							<div className="px-4 pt-4">
								<div className="flex items-center justify-between mb-4">
									<p className="text-xs text-gray-400">
										{selectedGoal.started_at} → {selectedGoal.target_date}
									</p>
									<button
										type="button"
										onClick={() => setEditMode((v) => !v)}
										className="text-xs text-indigo-500"
									>
										{editMode ? "完了" : "編集"}
									</button>
								</div>
								<Timeline
									goal={selectedGoal}
									onToggle={handleToggleStep}
									editMode={editMode}
									onReorder={handleReorder}
									onEdit={openEditStep}
								/>
							</div>
						)}
					</>
				)}
			</div>

			{editingStep && (
				<div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={() => setEditingStep(null)}>
					<div className="bg-white w-full max-w-md mx-auto rounded-t-xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
						<h2 className="font-semibold text-gray-900">ステップを編集</h2>
						<input
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
							placeholder="内容"
							value={editStepForm.title}
							onChange={(e) => setEditStepForm((f) => ({ ...f, title: e.target.value }))}
							autoFocus
						/>
						<div>
							{editStepForm.scheduled_date && !showDatePicker ? (
								<div className="flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg">
									<span className="text-sm text-gray-700">{editStepForm.scheduled_date}</span>
									<div className="flex gap-3">
										<button type="button" onClick={() => setShowDatePicker(true)} className="text-xs text-indigo-500">変更</button>
										<button type="button" onClick={() => { setEditStepForm((f) => ({ ...f, scheduled_date: "" })); setShowDatePicker(false); }} className="text-xs text-red-400">削除</button>
									</div>
								</div>
							) : showDatePicker ? (
								<input
									type="date"
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
									value={editStepForm.scheduled_date}
									onChange={(e) => setEditStepForm((f) => ({ ...f, scheduled_date: e.target.value }))}
									autoFocus
								/>
							) : (
								<button type="button" onClick={() => setShowDatePicker(true)} className="text-sm text-indigo-500">
									＋ 日付を追加（任意）
								</button>
							)}
						</div>
						<div className="flex gap-2">
							<Button variant="outline" className="flex-1" onClick={() => setEditingStep(null)}>キャンセル</Button>
							<Button className="flex-1" onClick={handleSaveStep}>保存</Button>
						</div>
					</div>
				</div>
			)}

			{showForm && (
				<CreateModal
					form={form}
					setForm={setForm}
					onAdd={addExtraStep}
					onRemove={removeExtraStep}
					onSubmit={handleCreate}
					onClose={() => setShowForm(false)}
				/>
			)}

			<BottomNav />
		</div>
	);
}

type TimelineProps = {
	goal: GoalWithSteps;
	onToggle: (step: GoalStep) => void;
	editMode?: boolean;
	onReorder?: (steps: GoalStep[], fromIndex: number, direction: "up" | "down") => void;
	onEdit?: (step: GoalStep) => void;
};

function sortSteps(steps: GoalStep[]): GoalStep[] {
	const dated = steps
		.filter((s) => !!s.scheduled_date)
		.sort((a, b) => a.scheduled_date!.localeCompare(b.scheduled_date!) || a.order - b.order);
	const undated = steps.filter((s) => !s.scheduled_date).sort((a, b) => a.order - b.order);

	const result: GoalStep[] = [];
	let di = 0;
	for (const u of undated) {
		while (di < dated.length && dated[di].order < u.order) result.push(dated[di++]);
		result.push(u);
	}
	while (di < dated.length) result.push(dated[di++]);
	return result;
}

function Timeline({ goal, onToggle, editMode = false, onReorder, onEdit }: TimelineProps) {
	const steps = sortSteps(goal.steps);

	return (
		<div className="relative">
			{steps.map((step, i) => {
				const isLast = i === steps.length - 1;
				const isDone = !!step.completed_at;

				return (
					<div key={step.id} className="flex gap-3">
						{/* 縦線 + ノード */}
						<div className="flex flex-col items-center">
							<button
								type="button"
								onClick={() => onToggle(step)}
								className="mt-0.5 flex-shrink-0"
							>
								{step.is_milestone ? (
									<span className={`flex w-5 h-5 rounded items-center justify-center border-2 ${
										isDone ? "bg-indigo-500 border-indigo-500" : "border-gray-400 bg-white"
									}`}>
										{isDone && (
											<svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
											</svg>
										)}
									</span>
								) : (
									<span className={`flex w-5 h-5 rounded-full border-2 items-center justify-center ${
										isDone ? "bg-indigo-500 border-indigo-500" : "border-gray-300 bg-white"
									}`}>
										{isDone && (
											<svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
											</svg>
										)}
									</span>
								)}
							</button>
							{!isLast && (
								<div className="w-px flex-1 bg-gray-200 my-1" style={{ minHeight: "24px" }} />
							)}
						</div>

						{/* テキスト */}
						<div className="pb-4 flex-1 flex items-start justify-between">
							<div>
								<p className={`text-sm ${
									isDone ? "line-through text-gray-400" :
									isLast && step.is_milestone ? "font-bold underline text-gray-800" :
									step.is_milestone ? "underline text-gray-800" :
									"text-gray-800"
								}`}>
									{step.title}
								</p>
								{step.scheduled_date && (
									<p className="text-xs text-gray-400 mt-0.5">{step.scheduled_date}</p>
								)}
							</div>
							{editMode && (
								<div className="flex items-center gap-1 ml-2 flex-shrink-0">
									{onEdit && (
										<button
											type="button"
											onClick={() => onEdit(step)}
											className="text-gray-300 hover:text-gray-500 text-xs px-1"
										>
											編集
										</button>
									)}
									{onReorder && (
										<div className="flex flex-col">
											<button
												type="button"
												onClick={() => onReorder(steps, i, "up")}
												disabled={i === 0}
												className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none py-0.5"
											>
												▲
											</button>
											<button
												type="button"
												onClick={() => onReorder(steps, i, "down")}
												disabled={isLast}
												className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none py-0.5"
											>
												▼
											</button>
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
	return (
		<div className="px-4 pt-10">
			<p className="text-sm text-gray-400 text-center mb-8">ゴールを設定して、道のりを可視化しよう</p>
			<Button className="w-full" onClick={onAdd}>ゴールを作成する</Button>
		</div>
	);
}

type CreateModalProps = {
	form: CreateForm;
	setForm: React.Dispatch<React.SetStateAction<CreateForm>>;
	onAdd: () => void;
	onRemove: (i: number) => void;
	onSubmit: () => void;
	onClose: () => void;
};

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
	const [open, setOpen] = useState(false);
	if (value && !open) {
		return (
			<div className="flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg">
				<span className="text-sm text-gray-700">{value}</span>
				<div className="flex gap-3">
					<button type="button" onClick={() => setOpen(true)} className="text-xs text-indigo-500">変更</button>
					<button type="button" onClick={() => { onChange(""); setOpen(false); }} className="text-xs text-red-400">削除</button>
				</div>
			</div>
		);
	}
	if (open) {
		return (
			<div className="flex gap-2 items-center">
				<input
					type="date"
					className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
					value={value}
					onChange={(e) => { onChange(e.target.value); if (e.target.value) setOpen(false); }}
					autoFocus
				/>
				<button type="button" onClick={() => { onChange(""); setOpen(false); }} className="text-xs text-gray-400 whitespace-nowrap">キャンセル</button>
			</div>
		);
	}
	return (
		<button type="button" onClick={() => setOpen(true)} className="text-sm text-indigo-500 block">
			＋ 日付を追加（任意）
		</button>
	);
}

function CreateModal({ form, setForm, onAdd, onRemove, onSubmit, onClose }: CreateModalProps) {
	return (
		<div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={onClose}>
			<div
				className="bg-white w-full max-w-md mx-auto rounded-t-xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="font-semibold text-gray-900">ゴールを作成</h2>

				<div className="space-y-3">
					<input
						className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
						placeholder="ゴール名（例: 運動を習慣化する）"
						value={form.name}
						onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
						autoFocus
					/>
					<div>
						<label className="text-xs text-gray-500">ゴール日 <span className="text-red-400">*</span></label>
						<input
							type="date"
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
							value={form.target_date}
							onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))}
						/>
					</div>
				</div>

				<div className="border-t border-gray-100 pt-3 space-y-3">
					<p className="text-xs font-semibold text-gray-500">中間マイルストーン</p>
					<input
						className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
						placeholder="中間内容（例: 1ヶ月継続！）"
						value={form.milestone_title}
						onChange={(e) => setForm((f) => ({ ...f, milestone_title: e.target.value }))}
					/>
					<div>
						<label className="text-xs text-gray-500">中間到達日 <span className="text-red-400">*</span></label>
						<input
							type="date"
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
							value={form.milestone_date}
							onChange={(e) => setForm((f) => ({ ...f, milestone_date: e.target.value }))}
						/>
					</div>
				</div>

				{form.extra_steps.length > 0 && (
					<div className="border-t border-gray-100 pt-3 space-y-3">
						<p className="text-xs font-semibold text-gray-500">追加ステップ（任意）</p>
						{form.extra_steps.map((s, i) => (
							<div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
								<div className="flex gap-2 items-center">
									<span className="text-xs text-gray-400 font-medium">ステップ {i + 1}</span>
									<div className="flex-1" />
									<button
										type="button"
										onClick={() => onRemove(i)}
										className="text-gray-300 hover:text-gray-500 text-sm"
									>
										✕
									</button>
								</div>
								<input
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
									placeholder="ステップ内容"
									value={s.title}
									onChange={(e) => setForm((f) => {
										const next = [...f.extra_steps];
										next[i] = { ...next[i], title: e.target.value };
										return { ...f, extra_steps: next };
									})}
								/>
								<DateInput
									value={s.scheduled_date}
									onChange={(v) => setForm((f) => {
										const next = [...f.extra_steps];
										next[i] = { ...next[i], scheduled_date: v };
										return { ...f, extra_steps: next };
									})}
								/>
							</div>
						))}
					</div>
				)}

				<button
					type="button"
					onClick={onAdd}
					className="text-sm text-indigo-500"
				>
					＋ ステップを追加（任意）
				</button>

				<div className="flex gap-2 pt-2">
					<Button variant="outline" className="flex-1" onClick={onClose}>キャンセル</Button>
					<Button
						className="flex-1"
						onClick={onSubmit}
						disabled={!form.name.trim() || !form.target_date || !form.milestone_title.trim() || !form.milestone_date}
					>
						作成
					</Button>
				</div>
			</div>
		</div>
	);
}
