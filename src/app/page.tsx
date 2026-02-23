"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PointCard } from "@/components/point-card/PointCard";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const SAMPLE_REWARDS = [
	{ id: "1", label: "ケーキ", points: 200 },
	{ id: "2", label: "映画", points: 500 },
];

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
				<p className="text-sm text-gray-500 mb-4">{user?.email}</p>
				<PointCard currentPoints={250} rewards={SAMPLE_REWARDS} />
			</div>
		</div>
	);
}
