"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getJSTDate, getJSTWeek } from "@/core/tasks";

const STORAGE_KEY = "lastCheckedDate";
const STORAGE_WEEK_KEY = "lastCheckedWeek";

export function useRoutineInit(userId: string) {
	useEffect(() => {
		if (!userId) return;

		const check = async () => {
			const today = getJSTDate();
			const week = getJSTWeek();
			const lastDate = localStorage.getItem(STORAGE_KEY);
			const lastWeek = localStorage.getItem(STORAGE_WEEK_KEY);

			const dateChanged = lastDate !== today;
			const weekChanged = lastWeek !== week;
			if (!dateChanged && !weekChanged) return;

			const supabase = createClient();

			if (dateChanged) {
				await supabase.rpc("reset_points_today", { p_user_id: userId });
			}
			if (weekChanged) {
				await supabase.rpc("reset_points_week", { p_user_id: userId });
			}

			const { data: dailyTasks } = await supabase
				.from("tasks")
				.select("id")
				.eq("user_id", userId)
				.eq("type", "daily_routine")
				.eq("is_active", true);

			if (dateChanged && dailyTasks && dailyTasks.length > 0) {
				await supabase.from("daily_routine_status").upsert(
					dailyTasks.map((t) => ({
						user_id: userId,
						task_id: t.id,
						target_date: today,
						completed: false,
					})),
					{ onConflict: "user_id,task_id,target_date", ignoreDuplicates: true },
				);
			}

				if (dateChanged) localStorage.setItem(STORAGE_KEY, today);
			if (weekChanged) localStorage.setItem(STORAGE_WEEK_KEY, week);
		};

		check();

		const onVisibilityChange = () => {
			if (document.visibilityState === "visible") check();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () => document.removeEventListener("visibilitychange", onVisibilityChange);
	}, [userId]);
}
