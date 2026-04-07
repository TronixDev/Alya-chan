export function presentTable(rows: string[][]): string {
	const cols = Math.max(...rows.map((row) => row.length), 0);
	if (cols === 0) return "";

	const widths = Array(cols).fill(0);
	rows.forEach((row) => {
		row.forEach((value, i) => {
			widths[i] = Math.max(widths[i], value.length);
		});
	});

	const lines = rows.map((row, rowIndex) => {
		const cells = row.map((cell, i) => cell.padEnd(widths[i], " "));
		const line = cells.join(" | ");
		if (rowIndex === 0) {
			const sep = widths.map((w) => "-".repeat(w)).join("-+-");
			return `${line}\n${sep}`;
		}
		return line;
	});

	return lines.join("\n");
}
