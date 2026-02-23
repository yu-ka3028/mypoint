export type TaskType = "daily_routine" | "weekly_routine" | "urgent" | "someday";

export type Task = {
	id: string;
	user_id: string;
	title: string;
	type: TaskType;
	points: number;
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

export type WeeklyRoutineStatus = {
	id: string;
	task_id: string;
	target_week: string;
	completed: boolean;
};

export type UserProfile = {
	id: string;
	display_name: string;
	points_today: number;
	points_this_week: number;
	points_total: number;
};
