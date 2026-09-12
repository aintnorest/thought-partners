// Generates the PWA PNG icons from a simple vector glyph, no external deps.
// Run with: pnpm icons
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public", "icons");

const BG = [0xe8, 0x55, 0x2d];
const FG = [0xff, 0xf7, 0xed];

// 5x7 bitmap of the letter "J".
const GLYPH = [".1110", "...10", "...10", "...10", "1..10", "1..10", ".110."];

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(size, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function makeIcon(size, padding) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = BG[0];
    rgba[i * 4 + 1] = BG[1];
    rgba[i * 4 + 2] = BG[2];
    rgba[i * 4 + 3] = 0xff;
  }

  const cols = GLYPH[0].length;
  const rows = GLYPH.length;
  const available = size * (1 - 2 * padding);
  const cell = Math.floor(Math.min(available / cols, available / rows));
  const offsetX = Math.floor((size - cell * cols) / 2);
  const offsetY = Math.floor((size - cell * rows) / 2);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (GLYPH[r][c] !== "1") continue;
      for (let y = 0; y < cell; y++) {
        for (let x = 0; x < cell; x++) {
          const px = offsetX + c * cell + x;
          const py = offsetY + r * cell + y;
          const idx = (py * size + px) * 4;
          rgba[idx] = FG[0];
          rgba[idx + 1] = FG[1];
          rgba[idx + 2] = FG[2];
          rgba[idx + 3] = 0xff;
        }
      }
    }
  }

  return encodePng(size, rgba);
}

mkdirSync(outDir, { recursive: true });
const targets = [
  ["icon-192.png", 192, 0.18],
  ["icon-512.png", 512, 0.18],
  ["icon-maskable-512.png", 512, 0.28],
  ["apple-touch-icon.png", 180, 0.12],
];
for (const [name, size, padding] of targets) {
  writeFileSync(join(outDir, name), makeIcon(size, padding));
  console.log(`wrote public/icons/${name}`);
}
