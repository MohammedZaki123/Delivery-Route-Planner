'use strict';

const path = require('path');
const fs = require('fs');
const { parseCsvFile } = require('./parser');
const { planTrips, buildSummary, VEHICLE_CAPACITY_KG } = require('./planner');

/**
 * Usage:
 *   node src/index.js [inputFile] [--capacity=10] [--out=summary.json]
 *
 * Defaults:
 *   inputFile -> data/sample_deliveries.csv
 *   capacity  -> 10 (kg)
 *   out       -> not written unless --out is passed
 */

// function parseArgs(argv) {
//   const args = { file: null, capacity: VEHICLE_CAPACITY_KG, out: null };
//   for (const arg of argv) {
//     if (arg.startsWith('--capacity=')) {
//       args.capacity = Number(arg.split('=')[1]);
//     } else if (arg.startsWith('--out=')) {
//       args.out = arg.split('=')[1];
//     } else if (!arg.startsWith('--')) {
//       args.file = arg;
//     }
//   }
//   return args;
// }

function printTrips(trips) {
  if (trips.length === 0) {
    console.log('No deliveries to plan — nothing to show.');
    return;
  }

  for (const trip of trips) {
    console.log(
      `\nTrip ${trip.tripNumber} — ${trip.area} (${trip.totalWeight} kg / ${VEHICLE_CAPACITY_KG} kg)`
    );
    for (const d of trip.deliveries) {
      console.log(`  - #${d.id} priority=${d.priority} weight=${d.weight}kg`);
    }
  }
}

function printRejected(rejected) {
  if (rejected.length === 0) return;
  console.log('\nRejected deliveries (exceed vehicle capacity, cannot be placed):');
  for (const d of rejected) {
    console.log(`  - #${d.id} (${d.area}) weight=${d.weight}kg`);
  }
}

function printMalformed(malformed) {
  if (malformed.length === 0) return;
  console.log('\nMalformed input rows (skipped):');
  for (const m of malformed) {
    console.log(`  - line ${m.line}: ${m.reason} -> "${m.raw}"`);
  }
}

function main() {
  // const args = parseArgs(process.argv.slice(2));
  // const inputFile = args.file;
  const capacity = VEHICLE_CAPACITY_KG;


  const { deliveries, malformed } = parseCsvFile(inputFile);

  if (deliveries.length === 0 && malformed.length === 0) {
    console.log('No deliveries found in input file.');
  }

  const { trips, rejected } = planTrips(deliveries, capacity);
  const summary = buildSummary(deliveries, trips, rejected, malformed, capacity);

  printTrips(trips);
  printRejected(rejected);
  printMalformed(malformed);

  console.log('\nSummary:');
  console.table(summary);

  if (args.out) {
    const outPath = path.resolve(args.out);
    fs.writeFileSync(
      outPath,
      JSON.stringify({ trips, rejected, malformed, summary }, null, 2)
    );
    console.log(`\nFull report written to: ${outPath}`);
  }
}

main();
