const KEY = "pendingStamps";
const PREV_POINTS_KEY = "prevCardPoints";

export function getStampCount(): number {
	if (typeof window === "undefined") return 0;
	return parseInt(localStorage.getItem(KEY) ?? "0", 10);
}

export function addStamp(): void {
	localStorage.setItem(KEY, String(getStampCount() + 1));
	window.dispatchEvent(new Event("stampUpdate"));
}

export function removeStamp(): void {
	localStorage.setItem(KEY, String(Math.max(0, getStampCount() - 1)));
	window.dispatchEvent(new Event("stampUpdate"));
}

export function resetStamps(): void {
	localStorage.setItem(KEY, "0");
	window.dispatchEvent(new Event("stampUpdate"));
}

export function getPrevCardPoints(): number | null {
	if (typeof window === "undefined") return null;
	const v = localStorage.getItem(PREV_POINTS_KEY);
	return v === null ? null : parseInt(v, 10);
}

export function setPrevCardPoints(points: number): void {
	localStorage.setItem(PREV_POINTS_KEY, String(points));
}
