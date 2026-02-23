import { createClient } from "@/lib/supabase/server";

export async function Ranking() {
	const supabase = await createClient();
	const { data: users } = await supabase
		.from("user_profiles")
		.select("display_name, points_total")
		.order("points_total", { ascending: false })
		.limit(5);

	if (!users || users.length === 0) return null;

	return (
		<div className="space-y-2">
			<h2 className="text-sm font-medium text-gray-500 text-center">ランキング</h2>
			<div className="space-y-1">
				{users.map((user, index) => (
					<div
						key={index}
						className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-gray-100"
					>
						<div className="flex items-center gap-3">
							<span className="text-sm font-bold text-gray-400 w-4">{index + 1}</span>
							<span className="text-sm text-gray-900">{user.display_name}</span>
						</div>
						<span className="text-sm font-medium text-indigo-600">
							{user.points_total.toLocaleString()}pt
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
