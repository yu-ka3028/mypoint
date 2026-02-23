"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function GoogleLoginButton() {
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
		<Button onClick={handleGoogleLogin} className="w-full" size="lg">
			Google でログイン
		</Button>
	);
}
