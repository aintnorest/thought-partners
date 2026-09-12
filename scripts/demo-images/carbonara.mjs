import { board, bowl, ellipse, flecks, group, line, pan, path, plate, rect } from "./drawing.mjs";

function batons(cooked = false, count = 16) {
  return Array.from({ length: count }, (_, i) => {
    const radius = Math.sqrt((i + 1) / count);
    const x = count === 16 ? 270 + (i % 4) * 72 : 390 + Math.cos(i * 2.4) * 155 * radius;
    const y = count === 16 ? 184 + Math.floor(i / 4) * 66 : 270 + Math.sin(i * 2.4) * 132 * radius;
    return group(
      rect(x, y, 52, 23, cooked ? "#b8703d" : "#c88d83", 5) +
        line(x + 5, y + 9, x + 46, y + 9, cooked ? "#e4b978" : "#f4e4d2", 7),
      `rotate(${((i % 3) - 1) * 15} ${x + 25} ${y + 12})`,
    );
  }).join("");
}
function noodles(plated = false) {
  return Array.from({ length: 30 }, (_, i) => {
    const angle = i * 12;
    const d = plated
      ? `M286 279 C245 205 438 164 504 279 C565 390 336 414 291 327 C254 245 450 224 477 307 S365 357 379 300`
      : `M250 ${200 + i * 5} C${320 + i * 3} 105 570 ${240 + i * 4} 475 383 S230 375 287 ${230 + i * 4}`;
    return group(
      path(d, "none", "#a9864a", 8) + path(d, "none", "#f0d38a", 5),
      plated ? `rotate(${angle} 400 300)` : "",
    );
  }).join("");
}
function whisk() {
  return group(
    rect(496, 110, 20, 142, "#b5b6af", 8) +
      [0, 1, 2].map((i) => ellipse(506, 282, 24 + i * 10, 75, "none", "#817f71", 3)).join(""),
    "rotate(35 506 282)",
  );
}
const bubbles = Array.from({ length: 24 }, (_, i) => {
  const a = i * 2.4,
    r = Math.sqrt((i + 1) / 24);
  return ellipse(
    400 + Math.cos(a) * 173 * r,
    300 + Math.sin(a) * 159 * r,
    8 + (i % 5) * 2,
    7 + (i % 4) * 2,
    "#f5f7ed",
    "#9baea8",
    2,
  );
}).join("");
const pot =
  bowl("#c6d5cf") + rect(133, 258, 45, 84, "#babeb6", 12) + rect(622, 258, 45, 84, "#babeb6", 12);
const garnish =
  flecks(38, 397, 300, 155, 120, "#51483e", 2.5) + flecks(60, 400, 310, 150, 122, "#fff9df", 4);

export default [
  {
    id: "carbonara",
    title: "Spaghetti Carbonara",
    source: "src/fixtures/plan.carbonara.json",
    stages: [
      {
        id: "chop-guanciale",
        title: "Cut the guanciale",
        caption: "Even batons with pale fat and pink meat; remove the tough skin before cutting.",
        body:
          board() +
          batons() +
          group(
            path("M560 153 L612 153 L612 392 Q578 376 560 320 Z", "#d9dcd5") +
              rect(562, 103, 48, 72, "#685c4c", 10),
            "rotate(-12 586 245)",
          ),
      },
      {
        id: "mix-egg-cheese",
        title: "Mix eggs and Pecorino",
        caption:
          "A thick, cohesive egg-and-cheese base speckled with black pepper; no dry pockets of cheese.",
        body:
          bowl("#eac66c") +
          path(
            "M279 292 C280 187 520 219 513 317 S301 393 301 300 C310 247 458 242 479 309",
            "none",
            "#f7de97",
            17,
          ) +
          flecks(45, 400, 300, 162, 135, "#615242", 2.6) +
          whisk(),
      },
      {
        id: "render-guanciale",
        title: "Render until golden",
        caption: "Golden, crisp-edged guanciale surrounded by a pool of clear rendered fat.",
        body: pan() + ellipse(392, 300, 175, 159, "#b9a46b", "#c4b280", 2) + batons(true),
      },
      {
        id: "boil-water",
        title: "Bring water to a rolling boil",
        caption: "Large bubbles break across the surface of the salted pasta water.",
        body: pot + bubbles,
      },
      {
        id: "cook-spaghetti",
        title: "Cook and reserve pasta water",
        caption:
          "Flexible spaghetti in the pot, with starchy water set aside before draining. Taste to judge the firm core.",
        body:
          pot +
          noodles() +
          group(
            rect(590, 363, 118, 128, "#d5dfd7", 18) +
              path("M708 385 C765 373 765 477 708 465", "none", "#98a59b", 6) +
              [402, 427, 452].map((y) => line(600, y, 622, y, "#7e8e83", 2)).join(""),
          ),
      },
      {
        id: "temper-sauce",
        title: "Loosen into a glossy ribbon",
        caption:
          "Warm egg-and-cheese sauce loosened with pasta water, flowing in a smooth ribbon rather than forming curds.",
        body:
          bowl("#f0d997") +
          path("M432 152 C482 208 357 212 410 256 S469 320 404 326", "none", "#c4a660", 27) +
          path("M432 152 C482 208 357 212 410 256 S469 320 404 326", "none", "#fae8ad", 20) +
          flecks(30, 388, 354, 140, 80, "#665641", 2) +
          group(whisk(), "translate(-130 -50)"),
      },
      {
        id: "combine-pasta",
        title: "Toss off the heat",
        caption:
          "Spaghetti and crisp guanciale coated in a fluid egg-Pecorino sauce; the skillet is off the heat.",
        body:
          pan("#c9b176") +
          noodles() +
          group(batons(true, 8), "translate(70 100) scale(.8)") +
          garnish +
          path("M633 126 L499 262 M660 139 L515 275", "none", "#8e948c", 12),
      },
      {
        id: "plate-carbonara",
        title: "Twirl, finish, and serve",
        caption:
          "A nest of glossy spaghetti with crisp guanciale, grated Pecorino, and cracked black pepper.",
        body:
          plate() +
          noodles(true) +
          group(batons(true, 8), "translate(100 135) scale(.75)") +
          garnish,
      },
    ],
  },
];
