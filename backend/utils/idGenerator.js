const dayjs = require('dayjs');

function generateEmployeeId(index = 1) {
  // Example: EMP-2026-001
  const year = dayjs().year();
  const padded = String(index).padStart(3, '0');
  return `EMP-${year}-${padded}`;
}

module.exports = { generateEmployeeId };
