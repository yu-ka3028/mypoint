"use client";

import { useEffect } from "react";

export function AuthRefresher() {
	useEffect(() => {
		sessionStorage.removeItem("bfcache_reloading");

		const handlePageShow = (e: PageTransitionEvent) => {
			if (e.persisted && !sessionStorage.getItem("bfcache_reloading")) {
				sessionStorage.setItem("bfcache_reloading", "1");
				window.location.reload();
			}
		};

		window.addEventListener("pageshow", handlePageShow);
		return () => window.removeEventListener("pageshow", handlePageShow);
	}, []);

	return null;
}
