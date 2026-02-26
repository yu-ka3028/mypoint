"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthRefresher() {
	const router = useRouter();

	useEffect(() => {
		let timer: ReturnType<typeof setTimeout> | null = null;

		const refresh = () => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => {
				router.refresh();
				timer = null;
			}, 200);
		};

		// iOS Safari: bfcacheからの復帰はvisibilitychangeが発火しないためpageshowを使う
		const handlePageShow = (e: PageTransitionEvent) => {
			if (e.persisted) refresh();
		};

		// Android Chromeなどその他のブラウザ向け
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") refresh();
		};

		// 保険としてfocusも監視
		const handleFocus = () => refresh();

		window.addEventListener("pageshow", handlePageShow);
		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("focus", handleFocus);
		return () => {
			if (timer) clearTimeout(timer);
			window.removeEventListener("pageshow", handlePageShow);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("focus", handleFocus);
		};
	}, [router]);

	return null;
}
