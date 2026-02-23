const KEY = "pendingStamps";

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
