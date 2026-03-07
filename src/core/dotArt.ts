const PALETTE: Record<string, string> = {
	".": "#fef9c3", // 背景（薄黄）
	R: "#dc2626", // 赤
};

// 祝（24×24）仮パターン
const MARCH_PATTERN: string[] = [
	"........................", //  0
	".....R..................", //  1
	".....R..................", //  2
	"........................", //  3
	".RRRRRRRRRR..RRRRRRRRRR.", //  4  礻横画 + 兄「口」上
	".....R.......R........R.", //  5
	".....R.......R........R.", //  6
	".....R.......R........R.", //  7
	".RRRRR.RRRR..RRRRRRRRRR.", //  8  礻左右払い + 兄「口」下
	".....R...........R......", //  9
	".....R...........R......", // 10
	".....R...........R......", // 11
	".....R...........R......", // 12
	"...R.R.R.........R......", // 13  礻下点
	"...R.R.R.........R......", // 14
	".....R..........R.R.....", // 15  儿 脚分岐
	".....R.........R...R....", // 16
	".....R........R.....R...", // 17
	".....R.......R.......R..", // 18
	".....R.......R.......R..", // 19
	".....R.......R.......R..", // 20
	".....R.......R.......R..", // 21
	"........................", // 22
	"........................", // 23
];

function parsePattern(rows: string[]): string[] {
	return rows.flatMap((row) => row.split("").map((ch) => PALETTE[ch] ?? PALETTE["."]));
}

function generateFillOrder(seed: number, size: number): number[] {
	const arr = Array.from({ length: size }, (_, i) => i);
	let s = seed;
	for (let i = size - 1; i > 0; i--) {
		s = (s * 48271) % 2147483647;
		const j = s % (i + 1);
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

export type MonthDotArt = {
	colors: string[]; // 576件、グリッド順（行優先）の色
	fillOrder: number[]; // 576件、埋める順番（値=グリッドインデックス）
};

const MARCH_DOT_ART: MonthDotArt = {
	colors: parsePattern(MARCH_PATTERN),
	fillOrder: generateFillOrder(3, 576),
};

export function getDotArt(_month: number): MonthDotArt {
	return MARCH_DOT_ART;
}
