import { validateRegistry } from '../lib/bug-engine/registry';
import { STORE_BUGS } from '../data/bugs';
import { generateSeason } from '../lib/bug-engine/generator';

function main() {
  validateRegistry();

  const pageCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  for (const bug of STORE_BUGS) {
    pageCounts[bug.page] = (pageCounts[bug.page] ?? 0) + 1;
    categoryCounts[bug.category] = (categoryCounts[bug.category] ?? 0) + 1;
  }

  console.log(`✓ Registry valid: ${STORE_BUGS.length} bugs`);
  console.log('  Page distribution:', pageCounts);
  console.log('  Category distribution:', categoryCounts);

  const season = generateSeason('store', new Date());
  console.log(`✓ generateSeason produces ${season.length} challenges`);

  if (STORE_BUGS.length < 50) {
    process.exit(1);
  }
}

main();
