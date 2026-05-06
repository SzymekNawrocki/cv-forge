const os = require("os");

const freeRam = os.freemem();
const GB = 1024 ** 3;
const THRESHOLD = 1 * GB;

if (freeRam < THRESHOLD) {
  console.warn(
    `WARNING: Only ${(freeRam / GB).toFixed(2)} GB RAM free — below 1 GB threshold. Close other apps.`
  );
  process.exit(1);
}

console.log(`RAM OK: ${(freeRam / GB).toFixed(2)} GB free`);
