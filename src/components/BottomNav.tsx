"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
	const pathname = usePathname();

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
					className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 ${
						pathname === "/card" ? "text-indigo-600" : "text-gray-400"
					}`}
				>
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
					</svg>
					カード
				</Link>
			</div>
		</nav>
	);
}
