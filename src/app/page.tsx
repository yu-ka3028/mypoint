"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export default function Home() {
	const supabase = createClient();
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		supabase.auth.getUser().then(({ data }) => {
			setUser(data.user);
		});
	}, [supabase]);

	const handleLogout = async () => {
		await supabase.auth.signOut();
		window.location.href = "/login";
	};

	return (
		<div className="min-h-screen bg-gray-50 p-4">
			<div className="max-w-md mx-auto">
				<div className="flex items-center justify-between py-4">
					<h1 className="text-xl font-bold text-gray-900">mypoint</h1>
					<Button variant="outline" size="sm" onClick={handleLogout}>
						ログアウト
					</Button>
				</div>
				<div className="bg-white rounded-2xl border border-gray-100 p-6 mt-4">
					<p className="text-sm text-gray-500">ログイン中:</p>
					<p className="font-medium text-gray-900 mt-1">{user?.email}</p>
				</div>
			</div>
		</div>
	);
}
