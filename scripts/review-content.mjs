import fs from 'node:fs/promises';

// Read-only editorial queue; reaching a review date does not mean a place is closed.
const args = process.argv.slice(2);
const date =
  args.find((arg) => arg.startsWith('--date='))?.slice(7) ?? new Date().toISOString().slice(0, 10);
const days = Number(args.find((arg) => arg.startsWith('--days='))?.slice(7) ?? 7);
if (
  args.some((arg) => !/^--(?:date|days)=/.test(arg)) ||
  !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
  !Number.isFinite(Date.parse(date)) ||
  new Date(date).toISOString().slice(0, 10) !== date ||
  !Number.isInteger(days) ||
  days < 0 ||
  days > 366
)
  throw new Error('Usage: npm run review:content -- --date=YYYY-MM-DD --days=7 (0–366 days)');
const end = new Date(Date.parse(date) + days * 86400000).toISOString().slice(0, 10);
const rows = [];
for (const file of [
  'content/states.json',
  'content/city-guides.json',
  'content/travel-preparation.json',
]) {
  const data = JSON.parse(await fs.readFile(file, 'utf8'));
  const visit = (value, path, label) => {
    if (!value || typeof value !== 'object') return;
    const name = value.placeId ?? value.id ?? value.code ?? label;
    if (value.reviewAfter && value.reviewAfter <= end) {
      rows.push({
        due: value.reviewAfter,
        status:
          value.reviewAfter < date
            ? 'overdue'
            : value.reviewAfter === date
              ? 'due today'
              : 'upcoming',
        item: name,
        checked: value.checkedAt ?? value.reviewedAt ?? '—',
        location: `${file}:${path}`,
      });
    }
    for (const [key, child] of Object.entries(value)) {
      if (child && typeof child === 'object') visit(child, path ? `${path}.${key}` : key, name);
    }
  };
  visit(data, '', 'guide');
}
rows.sort((a, b) => a.due.localeCompare(b.due) || a.location.localeCompare(b.location));
console.log(`Editorial reviews through ${end} (as of ${date}, UTC date by default)`);
console.log('Due\tStatus\tItem\tLast checked\tSource location');
for (const row of rows)
  console.log([row.due, row.status, row.item, row.checked, row.location].join('\t'));
console.log(`${rows.length} sections. This report does not fetch sources or change review dates.`);
