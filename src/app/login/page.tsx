import { PointCardDemo } from "@/components/landing/PointCardDemo";
import { GoogleLoginButton } from "@/components/landing/GoogleLoginButton";
import { Ranking } from "@/components/landing/Ranking";

export default function LoginPage() {
	return (
		<div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4">
			<div className="max-w-md mx-auto space-y-6 sm:space-y-8">
				<div className="text-center space-y-2">
					<h1 className="text-3xl font-bold text-gray-900">mypoint</h1>
					<p className="text-gray-600">日常タスクをこなすだけで、ポイントが貯まる</p>
				</div>

				<PointCardDemo />

				<GoogleLoginButton />

				<Ranking />
			</div>
		</div>
	);
}
