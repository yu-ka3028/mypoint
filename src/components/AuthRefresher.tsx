"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthRefresher() {
	const router = useRouter();

	useEffect(() => {
		// iOS Safari: bfcacheからの復帰はvisibilitychangeが発火しないためpageshowを使う
		const handlePageShow = (e: PageTransitionEvent) => {
			if (e.persisted) router.refresh();
		};

		// Android Chromeなどその他のブラウザ向け
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") router.refresh();
		};

		// 保険としてfocusも監視
		const handleFocus = () => router.refresh();

		window.addEventListener("pageshow", handlePageShow);
		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("focus", handleFocus);
		return () => {
			window.removeEventListener("pageshow", handlePageShow);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("focus", handleFocus);
		};
	}, [router]);

	return null;
}
