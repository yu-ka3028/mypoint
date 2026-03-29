export type TaskType = "daily_routine" | "weekly_routine" | "urgent" | "someday";

export type Task = {
	id: string;
	user_id: string;
	title: string;
	type: TaskType;
	points: number;
	weekly_count: number;
	deadline: string | null;
	is_active: boolean;
	created_at: string;
};

export type DailyRoutineStatus = {
	id: string;
	task_id: string;
	target_date: string;
	completed: boolean;
};

export type WeeklyRoutineCompletion = {
	id: string;
	task_id: string;
	target_week: string;
	completed_date: string;
};

export type Goal = {
	id: string;
	user_id: string;
	name: string;
	started_at: string;
	target_date: string;
	completed_at: string | null;
	created_at: string;
};

export type GoalStep = {
	id: string;
	goal_id: string;
	title: string;
	order: number;
	scheduled_date: string | null;
	is_milestone: boolean;
	completed_at: string | null;
};

export type UserProfile = {
	id: string;
	display_name: string;
	points_today: number;
	points_this_week: number;
	points_total: number;
};
