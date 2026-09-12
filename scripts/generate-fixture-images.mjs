// Generates deterministic carbonara fixture images with no external dependencies.
// Run with: pnpm fixture-images
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public", "images", "carbonara");

const WIDTH = 320;
const HEIGHT = 240;
const BORDER_WIDTH = 3;
const BACKGROUND = [0x26, 0x23, 0x20];
const BORDER = [0xde, 0x6b, 0x3f];
const TARGETS = ["chop-guanciale.png", "combine-pasta.png", "plate-carbonara.png"];

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function makeFixtureImage() {
  const stride = WIDTH * 4 + 1;
  const raw = Buffer.alloc(stride * HEIGHT);

  for (let y = 0; y < HEIGHT; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < WIDTH; x++) {
      const isBorder =
        x < BORDER_WIDTH ||
        x >= WIDTH - BORDER_WIDTH ||
        y < BORDER_WIDTH ||
        y >= HEIGHT - BORDER_WIDTH;
      const color = isBorder ? BORDER : BACKGROUND;
      const offset = y * stride + 1 + x * 4;
      raw[offset] = color[0];
      raw[offset + 1] = color[1];
      raw[offset + 2] = color[2];
      raw[offset + 3] = 0xff;
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(outDir, { recursive: true });
const image = makeFixtureImage();
for (const name of TARGETS) {
  writeFileSync(join(outDir, name), image);
  console.log(`wrote public/images/carbonara/${name}`);
}
