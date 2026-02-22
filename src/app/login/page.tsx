"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
	const supabase = createClient();

	const handleGoogleLogin = async () => {
		await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
			},
		});
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-sm text-center space-y-6">
				<div className="space-y-2">
					<h1 className="text-2xl font-bold text-gray-900">mypoint</h1>
					<p className="text-sm text-gray-500">日常をポイント化するタスク管理</p>
				</div>
				<Button onClick={handleGoogleLogin} className="w-full" size="lg">
					Google でログイン
				</Button>
			</div>
		</div>
	);
}
