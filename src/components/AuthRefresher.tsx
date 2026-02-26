"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthRefresher() {
	const supabase = createClient();
	const router = useRouter();

	useEffect(() => {
		const handleVisibilityChange = async () => {
			if (document.visibilityState === "visible") {
				const {
					data: { session },
				} = await supabase.auth.getSession();
				if (!session) {
					router.push("/login");
				}
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () =>
			document.removeEventListener("visibilitychange", handleVisibilityChange);
	}, [supabase, router]);

	return null;
}
