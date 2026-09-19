'use strict';

const fs = require('fs');


function parseCsvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Input file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    // Empty file edge case: no header, no data.
    return { deliveries: [], malformed: [] };
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());

  const idx = {
    id: header.indexOf('id'),
    area: header.indexOf('area'),
    priority: header.indexOf('priority'),
    weight: header.indexOf('weight'),
  };

  const deliveries = [];
  const malformed = [];
  const seenIds = new Set();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());

    // if (cols.length !== header.length) {
    //   malformed.push({ line: i + 1, raw: lines[i], reason: 'column count mismatch' });
    //   continue;
    // }

    const id = cols[idx.id];
    const area = cols[idx.area];
    const priority = Number(cols[idx.priority]);
    const weight = Number(cols[idx.weight]);

    if (!id) {
      malformed.push({ line: i + 1, raw: lines[i], reason: 'missing id' });
      continue;
    }
    if (seenIds.has(id)) {
      malformed.push({ line: i + 1, raw: lines[i], reason: `duplicate id "${id}"` });
      continue;
    }
    if (!area) {
      malformed.push({ line: i + 1, raw: lines[i], reason: 'missing area' });
      continue;
    }
    if (!Number.isFinite(priority) || !Number.isInteger(priority) || priority < 1) {
      malformed.push({ line: i + 1, raw: lines[i], reason: 'invalid priority' });
      continue;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      malformed.push({ line: i + 1, raw: lines[i], reason: 'invalid weight' });
      continue;
    }

    seenIds.add(id);
    deliveries.push({ id, area, priority, weight });
  }

  return { deliveries, malformed };
}

module.exports = { parseCsvFile };
