"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthRefresher() {
	const supabase = createClient();
	const router = useRouter();

	useEffect(() => {
		const refresh = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session) {
				router.push("/login");
			}
		};

		// iOS Safari: bfcacheからの復帰はvisibilitychangeが発火しないためpageshowを使う
		const handlePageShow = (e: PageTransitionEvent) => {
			if (e.persisted) refresh();
		};

		// Android Chromeなどその他のブラウザ向け
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") refresh();
		};

		window.addEventListener("pageshow", handlePageShow);
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			window.removeEventListener("pageshow", handlePageShow);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [supabase, router]);

	return null;
}
