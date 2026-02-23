export function calcRoutinePoints(count: number): number {
	if (count <= 0) return 0;
	return Math.floor(100 / count);
}

export function getJSTDate(): string {
	return new Intl.DateTimeFormat("ja-JP", {
		timeZone: "Asia/Tokyo",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	})
		.format(new Date())
		.replace(/\//g, "-");
}

export function getJSTWeek(): string {
	const now = new Date(
		new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }),
	);
	const jan4 = new Date(now.getFullYear(), 0, 4);
	const startOfWeek1 = new Date(jan4);
	startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
	const dayOfYear = Math.floor(
		(now.getTime() - startOfWeek1.getTime()) / 86400000,
	);
	const week = Math.floor(dayOfYear / 7) + 1;
	return `${now.getFullYear()}-W${week.toString().padStart(2, "0")}`;
}
