"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthRedirect() {
	const router = useRouter();

	useEffect(() => {
		const check = async () => {
			try {
				const supabase = createClient();
				const { data } = await supabase.auth.getUser();
				if (data.user) router.replace("/");
			} catch {
				// 認証チェック失敗時はそのままログインページを表示
			}
		};

		check();

		const handlePageShow = (e: PageTransitionEvent) => {
			if (e.persisted) check();
		};

		window.addEventListener("pageshow", handlePageShow);
		return () => window.removeEventListener("pageshow", handlePageShow);
	}, [router]);

	return null;
}
