"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getStampCount } from "@/lib/stampBadge";

export function BottomNav() {
	const pathname = usePathname();
	const [stampCount, setStampCount] = useState(0);

	useEffect(() => {
		setStampCount(getStampCount());
		const handler = () => setStampCount(getStampCount());
		window.addEventListener("stampUpdate", handler);
		return () => window.removeEventListener("stampUpdate", handler);
	}, []);

	return (
		<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
			<div className="max-w-md mx-auto flex">
				<Link
					href="/"
					className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 ${
						pathname === "/" ? "text-indigo-600" : "text-gray-400"
					}`}
				>
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
					</svg>
					タスク
				</Link>
				<Link
					href="/card"
					className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 relative ${
						pathname === "/card" ? "text-indigo-600" : "text-gray-400"
					}`}
				>
					<span className="relative">
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
						</svg>
						{stampCount > 0 && (
							<span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
								{stampCount > 99 ? "99+" : stampCount}
							</span>
						)}
					</span>
					カード
				</Link>
			</div>
		</nav>
	);
}
