"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const FEEDBACK_URL = "https://forms.gle/8v4SscVj5ZthXj6J9";

export function Header() {
	const supabase = createClient();

	const handleLogout = async () => {
		await supabase.auth.signOut();
		window.location.href = "/login";
	};

	return (
		<div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
			<h1 className="text-xl font-bold text-gray-900">mypoint</h1>
			<div className="flex items-center gap-2">
				<a
					href={FEEDBACK_URL}
					target="_blank"
					rel="noopener noreferrer"
					className="p-2 text-gray-400 hover:text-gray-600"
					aria-label="お問い合わせ"
				>
					<Mail size={20} />
				</a>
				<Button variant="outline" size="sm" onClick={handleLogout}>
					ログアウト
				</Button>
			</div>
		</div>
	);
}
