/**
 * CLI Test Runner for LifeOps Daily Planner
 */
import { runAllAgentTests } from './agent_tests.ts';

async function main() {
  console.log('========================================================');
  console.log('Running LifeOps Daily Planner Agent Automated Test Suite');
  console.log('========================================================\n');

  const results = await runAllAgentTests();
  let passedCount = 0;

  for (const r of results) {
    const symbol = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${symbol}] Test ${r.id}: ${r.name}`);
    console.log(`       ${r.message}`);
    if (r.passed) passedCount++;
  }

  console.log('\n--------------------------------------------------------');
  console.log(`Results: ${passedCount}/${results.length} tests passed.`);
  console.log('========================================================');

  if (passedCount < results.length) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
