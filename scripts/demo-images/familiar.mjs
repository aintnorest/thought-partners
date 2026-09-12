import { board, bowl, ellipse, flecks, group, line, pan, path, plate, rect } from "./drawing.mjs";

const cream = "#f7eaca";
const egg = "#f4d36e";
const toast = "#d79a4c";
const tomato = "#bb4e35";

function fork() {
  return path(
    "M0 88 L0 4 M-15 -42 L-15 -8 Q-15 6 0 6 Q15 6 15 -8 L15 -42 M-5 -42 L-5 -9 M5 -42 L5 -9",
    "none",
    "#89897c",
    6,
  );
}

function spatula(fill = "#a6aea0") {
  return (
    rect(-10, 25, 20, 170, "#b59b75", 8) +
    path("M-35 -45 Q0 -55 35 -45 L29 30 Q0 48 -29 30 Z", fill, "#656c5f")
  );
}

function leaf(x, y, angle, scale = 1) {
  return group(
    path("M0 28 Q-35 4 0 -35 Q36 0 0 28Z", "#62834d", "#486743", 2) +
      path("M0 24 Q-5 -3 0 -27 M0 7 L-15 -5 M0 -4 L13 -16", "none", "#a0b179", 2),
    `translate(${x} ${y}) rotate(${angle}) scale(${scale})`,
  );
}

function bread(fill = cream, toasted = false) {
  return (
    path(
      "M-99 -54 C-129 -89 -97 -129 -55 -130 Q0 -152 55 -130 C99 -130 126 -89 99 -54 L99 108 Q0 122 -99 108 Z",
      "#bd8247",
      "#90623b",
    ) +
    path(
      "M-84 -51 C-107 -83 -82 -113 -47 -112 Q0 -130 47 -112 C86 -112 108 -82 83 -51 L83 93 Q0 105 -83 93 Z",
      fill,
      toasted ? "#e0ab66" : "#e6d7b7",
      3,
    ) +
    flecks(toasted ? 83 : 44, 0, 0, 72, 88, toasted ? "#b97c3a" : "#ddcaa6", toasted ? 2.2 : 1.6)
  );
}

function pancake(x, y, r, flipped = false) {
  const food =
    ellipse(0, 0, r, r * 0.92, flipped ? "#bc7b38" : "#d6ba7e", "#c28e4e", 3) +
    ellipse(-1, -2, r - 7, r * 0.92 - 7, flipped ? "#dba04f" : "#eed7a2", "none") +
    (flipped
      ? path(
          `M${-r * 0.63} ${-r * 0.28} Q${-r * 0.3} ${-r * 0.7} ${r * 0.26} ${-r * 0.62} M${r * 0.61} ${r * 0.03} Q${r * 0.55} ${r * 0.48} ${r * 0.19} ${r * 0.59}`,
          "none",
          "#e9b86d",
          9,
        ) + flecks(47, 0, 0, r * 0.76, r * 0.7, "#c38943", 2)
      : Array.from({ length: 25 }, (_, i) => {
          const angle = i * 2.39996323;
          const distance = Math.sqrt((i + 0.5) / 25) * r * 0.76;
          const bx = Math.cos(angle) * distance;
          const by = Math.sin(angle) * distance * 0.89;
          return (
            ellipse(bx, by, 4 + (i % 3), 3.5 + (i % 3), "#b69b68", "#f8e6b9", 2) +
            path(
              `M${bx - 3} ${by + 3} Q${bx} ${by + 5} ${bx + 4} ${by + 2}`,
              "none",
              "#e2c58e",
              1.5,
            )
          );
        }).join(""));
  return group(food, `translate(${x} ${y})`);
}

function sauceTexture(x, y, rx, ry, count = 58) {
  return Array.from({ length: count }, (_, i) => {
    const angle = i * 2.39996323;
    const radius = Math.sqrt((i + 0.5) / count);
    const px = x + Math.cos(angle) * rx * radius;
    const py = y + Math.sin(angle) * ry * radius;
    return (
      path(
        `M${px - 7} ${py} q4 -7 12 -2 l-2 6 q-8 4 -10 -4`,
        i % 3 === 0 ? "#d66543" : "#a84430",
        "none",
      ) + (i % 4 === 0 ? line(px + 5, py + 9, px + 9, py + 8, "#edb86e", 2) : "")
    );
  }).join("");
}

const omelette = {
  id: "classic-french-omelette",
  title: "Classic French Omelette",
  source: "samples/cooklang/familiar/classic-french-omelette.cook",
  stages: [
    {
      id: "prep",
      title: "Beat the eggs",
      caption:
        "Three eggs beaten with a pinch of salt into a uniform yellow mixture; a fork rests in the bowl.",
      body:
        group(bowl(egg), "translate(-42 0)") +
        path(
          "M235 261 C255 187 429 159 495 254 M235 333 C294 395 430 405 493 324 M263 309 Q353 263 463 285",
          "none",
          "#e6b34e",
          7,
        ) +
        path("M259 240 Q302 204 367 207 M280 373 Q326 390 363 386", "none", "#fff1b5", 6) +
        flecks(17, 350, 300, 155, 135, "#ffe8a0", 3) +
        group(fork(), "translate(446 242) rotate(-36) scale(1.4)") +
        [0, 1, 2]
          .map((i) =>
            group(
              path(
                "M-40 0 Q-39 51 0 54 Q40 52 40 0 L26 10 L14 -2 L0 9 L-14 -1 L-27 11 Z",
                "#e2c5a2",
                "#a6896d",
                2,
              ) + path("M-31 17 Q0 42 30 17", "none", "#f6e5ce", 5),
              `translate(${649 + (i % 2) * 27} ${170 + i * 93}) rotate(${i * 17 - 15})`,
            ),
          )
          .join(""),
    },
    {
      id: "cooking",
      title: "Stir soft curds",
      caption:
        "Small soft egg curds gather in the skillet while the surrounding egg remains glossy and yellow, with no browned patches.",
      body:
        pan() +
        path(
          "M207 263 C210 171 325 124 420 135 C535 142 588 216 579 322 C570 422 484 472 382 470 C260 467 196 374 207 263Z",
          egg,
          "#e7b954",
          3,
        ) +
        Array.from({ length: 36 }, (_, i) => {
          const angle = i * 2.39996323;
          const radius = Math.sqrt((i + 0.5) / 36);
          const x = 391 + Math.cos(angle) * 165 * radius;
          const y = 303 + Math.sin(angle) * 146 * radius;
          return group(
            path(
              "M-19 0 Q-22 -13 -6 -13 Q3 -21 14 -11 Q27 -4 17 8 Q5 19 -8 10 Q-22 13 -19 0Z",
              "#ffe79a",
              "#dfb34c",
              2,
            ) + path("M-11 -5 Q-3 -10 5 -6", "none", "#fff3c2", 3),
            `translate(${x} ${y}) rotate(${i * 29})`,
          );
        }).join("") +
        path(
          "M264 366 Q287 324 324 346 M421 181 Q449 167 470 190 M454 396 Q486 370 514 372",
          "none",
          "#fff0b6",
          5,
        ) +
        group(spatula("#a9b3a1"), "translate(518 381) rotate(-36)"),
    },
    {
      id: "finished",
      title: "Roll without browning",
      caption:
        "A pale yellow rolled French omelette has a smooth glossy surface and a light scattering of the optional chopped chives.",
      body:
        plate() +
        group(
          path(
            "M-180 -17 Q-170 -61 -111 -66 L97 -61 Q158 -57 185 -8 Q177 54 110 67 L-110 65 Q-169 56 -180 -17Z",
            "#f1cd65",
            "#d3ac48",
            3,
          ) +
            path(
              "M-170 -10 Q-133 -53 -74 -47 L91 -44 Q147 -38 174 -7 Q163 23 119 26 L-111 29 Q-150 29 -170 -10Z",
              "#ffe49a",
              "none",
            ) +
            path("M-151 34 Q-59 54 73 43 Q133 37 166 4", "none", "#dcb852", 4) +
            path("M-125 -25 Q-39 -40 78 -25", "none", "#fff3c3", 9) +
            [-90, -65, -28, -5, 31, 56, 83]
              .map((x, i) =>
                group(
                  rect(-2, -9, 4, 18, "#66834a", 1, "#66834a"),
                  `translate(${x} ${i % 2 ? 12 : -10}) rotate(${i * 27})`,
                ),
              )
              .join(""),
          "translate(400 303) rotate(-16)",
        ),
    },
  ],
};

const grilledCheese = {
  id: "grilled-cheese",
  title: "Grilled Cheese",
  source: "samples/cooklang/familiar/grilled-cheese.cook",
  stages: [
    {
      id: "prep",
      title: "Layer cheddar and bread",
      caption:
        "Two sandwich-bread slices on the board: one shows mayonnaise spread on its outside face, and the other holds cheddar for the filling.",
      body:
        board() +
        group(
          bread() +
            path(
              "M-61 -77 Q-22 -96 55 -74 L69 -30 L61 65 Q-2 83 -62 64 L-65 -19 Z",
              "#fff9e8",
              "#eee6d4",
              2,
            ) +
            path(
              "M-42 -53 Q8 -69 47 -48 M-43 -18 Q8 -33 48 -12 M-42 20 Q5 3 44 25 M-41 51 Q4 38 41 52",
              "none",
              "#e9dfc6",
              3,
            ),
          "translate(262 304) rotate(-9)",
        ) +
        group(
          bread() +
            rect(-83, -94, 158, 183, "#efbb51", 3, "#d59a34") +
            group(rect(-72, -90, 145, 174, "#f5c862", 3, "#dda743"), "rotate(14)") +
            path("M-52 -65 L44 -62 M-47 53 L45 63", "none", "#ffdc83", 3),
          "translate(526 289) rotate(8)",
        ) +
        group(
          path("M-9 100 L-11 -37 Q-11 -78 12 -82 L13 33 L8 100Z", "#a9aea4", "#767d73", 2) +
            rect(-10, 64, 22, 93, "#c5a077", 7),
          "translate(403 360) rotate(-67)",
        ),
    },
    {
      id: "cooking",
      title: "Turn the golden side up",
      caption:
        "The flipped sandwich shows an evenly golden first side; cheddar is softening and peeking out around the bread in the skillet.",
      body:
        pan() +
        group(
          path(
            "M-107 -40 Q-117 -82 -71 -99 L79 -101 Q117 -71 106 -23 L110 110 Q77 126 55 115 Q36 137 17 117 Q-1 129 -19 120 Q-60 129 -111 111Z",
            "#efb841",
            "#d49931",
            3,
          ) +
            group(bread(toast, true), "translate(0 -5) scale(1.08)") +
            path("M-65 118 Q-32 125 -12 120 M43 119 L69 116", "none", "#ffe195", 5),
          "translate(393 294) rotate(-13)",
        ) +
        group(
          spatula("#969f97") +
            line(-18, -28, -15, 16, "#657065", 4) +
            line(0, -29, 0, 17, "#657065", 4) +
            line(18, -28, 15, 16, "#657065", 4),
          "translate(558 385) rotate(-32)",
        ) +
        flecks(15, 395, 447, 80, 18, "#bc8b50", 2),
    },
    {
      id: "finished",
      title: "Slice diagonally",
      caption:
        "The rested grilled cheese is cut into two triangular halves, with golden bread and melted cheddar visible along the cut edges.",
      body:
        board() +
        group(
          path("M-132 -95 L136 -95 L-132 120Z", "#bd7a37", "#956032", 3) +
            path("M-129 -88 L130 -88 L-126 130Z", "#f4bb45", "#da9b2f", 2) +
            path("M-131 -107 L136 -107 L-131 109Z", "#dfaa60", "#ad7137", 3) +
            path("M-112 -91 L95 -91 L-112 75Z", "#d39a4c", "none") +
            path("M-112 -66 L17 -66 M-112 -43 L-25 -43", "none", "#edbb76", 4) +
            path(
              "M-112 103 Q-83 91 -52 65 M-8 34 Q20 9 46 -14 M76 -37 L117 -73",
              "none",
              "#ffe19a",
              5,
            ),
          "translate(324 279) rotate(-8)",
        ) +
        group(
          path("M133 -112 L133 111 L-137 111Z", "#b87a38", "#956032", 3) +
            path("M125 -112 L130 117 L-132 117Z", "#f6bd48", "#d49a32", 2) +
            path("M133 -126 L133 99 L-137 99Z", "#dfa65a", "#ad7137", 3) +
            path("M113 -82 L113 79 L-83 79Z", "#ce9145", "none") +
            path("M101 -40 L103 57 L-6 60", "none", "#e9b46a", 5) +
            path("M-101 87 Q-67 66 -34 38 M-12 21 L27 -12 M64 -44 L106 -80", "none", "#ffe099", 5),
          "translate(463 357) rotate(6)",
        ) +
        flecks(26, 428, 458, 146, 28, "#b07d45", 2),
    },
  ],
};

const pancakes = {
  id: "pancakes",
  title: "Buttermilk Pancakes",
  source: "samples/cooklang/familiar/pancakes.cook",
  stages: [
    {
      id: "prep",
      title: "Fold a lumpy batter",
      caption:
        "The wet and dry mixtures have been folded together into pale batter with small lumps; a spatula rests in the mixing bowl.",
      body:
        group(bowl("#ecdbb0"), "translate(-65 15) scale(1.03)") +
        path(
          "M222 260 C250 210 428 211 478 303 C499 355 352 411 269 359 C239 339 269 294 333 284 C375 279 419 304 395 328",
          "none",
          "#d1ba88",
          8,
        ) +
        path("M252 251 Q305 218 365 238 M277 367 Q326 388 367 372", "none", "#fff1ce", 7) +
        Array.from({ length: 27 }, (_, i) => {
          const angle = i * 2.39996323;
          const radius = Math.sqrt((i + 0.5) / 27);
          return ellipse(
            343 + Math.cos(angle) * 156 * radius,
            319 + Math.sin(angle) * 140 * radius,
            5 + (i % 4),
            4 + (i % 3),
            "#f7e8c3",
            "#d8c399",
            1.5,
          );
        }).join("") +
        group(spatula("#c6cdb9"), "translate(443 282) rotate(-143)") +
        group(
          ellipse(0, 0, 61, 58, "#f9f6ed", "#b4b09f") +
            ellipse(0, 0, 48, 44, "#fbf0d2", "#e0d1ad", 2) +
            path("M-29 -5 Q-7 -24 16 -12 Q37 5 17 17 M-15 22 L7 20", "none", "#e6d8b9", 4),
          "translate(656 202)",
        ) +
        group(
          path("M-46 -50 L40 -50 L49 48 Q0 65 -47 48Z", "#faf7ef", "#a7a696", 3) +
            path(
              "M42 -26 Q93 -32 90 13 Q87 48 49 36 M-46 -50 L-64 -67 L-27 -51",
              "#faf7ef",
              "#a7a696",
              3,
            ) +
            ellipse(-2, -49, 42, 13, "#f1e7cc", "#a7a696", 2),
          "translate(643 392)",
        ),
    },
    {
      id: "cooking",
      title: "Watch the bubbles open",
      caption:
        "Two pancakes show many popped bubbles and dry-looking rims on the griddle; a turned pancake shows its golden-brown underside.",
      body:
        rect(72, 81, 656, 438, "#62645a", 38, "#4f5249") +
        rect(93, 101, 614, 398, "#393d35", 28, "#8a8b7d") +
        rect(32, 239, 52, 118, "#737369", 15, "#55584e") +
        rect(716, 239, 52, 118, "#737369", 15, "#55584e") +
        pancake(265, 239, 101) +
        pancake(490, 229, 96) +
        pancake(373, 414, 91, true) +
        group(
          spatula("#949d92") +
            line(-18, -28, -15, 16, "#667063", 4) +
            line(0, -29, 0, 17, "#667063", 4) +
            line(18, -28, 15, 16, "#667063", 4),
          "translate(567 393) rotate(-55)",
        ),
    },
    {
      id: "finished",
      title: "Butter and maple syrup",
      caption:
        "A stack of golden pancakes is served with butter and maple syrup, with the browned edges visible around the stack.",
      body:
        plate() +
        pancake(399, 327, 154, true) +
        pancake(403, 307, 154, true) +
        pancake(394, 286, 154, true) +
        path(
          "M290 238 Q314 216 344 230 Q365 206 396 222 Q435 210 471 238 Q512 244 508 273 Q535 293 507 320 Q493 332 506 365 Q508 383 495 384 Q480 385 481 352 Q455 364 428 348 Q401 368 373 350 Q341 368 315 341 Q287 346 283 321 Q253 301 271 279 Q257 252 290 238Z",
          "#ac6b2f",
          "#a4672d",
          2,
        ) +
        path(
          "M299 250 Q317 239 340 246 M443 244 Q478 247 483 266 M299 314 Q308 328 330 325",
          "none",
          "#d49a51",
          6,
        ) +
        group(
          rect(-36, -31, 76, 64, "#edcc70", 7, "#caaa54") +
            path("M-36 -31 L29 -39 L43 -28 L40 24 L-36 32Z", "#f9e5a0", "#ddc37d", 2) +
            line(-24, -22, 23, -27, "#fff3c8", 4),
          "translate(392 276) rotate(-11)",
        ) +
        path("M462 433 Q476 420 490 434 Q500 444 484 451 Q469 455 462 443Z", "#b57834", "none"),
    },
  ],
};

const marinara = {
  id: "simple-marinara",
  title: "Simple Marinara",
  source: "samples/cooklang/familiar/simple-marinara.cook",
  stages: [
    {
      id: "prep",
      title: "Keep the garlic pale",
      caption:
        "Pale garlic pieces sit in olive oil in the saucepan; crushed tomatoes are ready in a separate bowl to add next.",
      body:
        group(
          pan("#ddd0a6") +
            path(
              "M259 222 Q355 157 477 223 Q548 268 509 369 Q436 435 313 380 Q241 342 259 222Z",
              "#d9b966",
              "#c6a052",
              2,
            ) +
            Array.from({ length: 21 }, (_, i) => {
              const angle = i * 2.39996323;
              const radius = Math.sqrt((i + 0.5) / 21);
              return group(
                path("M-10 -9 Q1 -16 12 -4 L8 10 Q-3 16 -12 3Z", "#fff0c3", "#d8c88e", 2) +
                  line(-4, -5, 5, 4, "#fff9e0", 2),
                `translate(${391 + Math.cos(angle) * 116 * radius} ${300 + Math.sin(angle) * 103 * radius}) rotate(${i * 41})`,
              );
            }).join("") +
            path("M275 272 Q271 238 302 225 M444 388 Q474 379 488 351", "none", "#f7df90", 6),
          "translate(-42 67) scale(.78)",
        ) +
        group(
          bowl(tomato) + sauceTexture(400, 300, 180, 164, 58),
          "translate(410 159) scale(.51)",
        ) +
        group(
          path(
            "M-33 31 Q-55 4 -23 -17 Q-3 -30 8 -56 Q42 -11 28 17 Q13 42 -33 31Z",
            "#f1e7ce",
            "#b3a587",
            2,
          ) + path("M-16 24 Q-32 -7 8 -43 M1 27 Q-6 -3 13 -30", "none", "#d0c0a1", 2),
          "translate(601 451) rotate(12)",
        ),
    },
    {
      id: "cooking",
      title: "Simmer and stir",
      caption:
        "Thickening crushed-tomato sauce has a few gentle surface bubbles; the wooden spoon draws a brief curved trail through the sauce.",
      body:
        pan(tomato) +
        sauceTexture(395, 300, 198, 185, 93) +
        [
          [278, 219, 14],
          [454, 185, 11],
          [501, 334, 16],
          [294, 390, 12],
          [387, 437, 10],
        ]
          .map(
            ([x, y, r]) =>
              ellipse(x, y, r, r * 0.72, "#973d2c", "#e07851", 3) +
              path(
                `M${x - r * 0.55} ${y - 2} Q${x} ${y - r * 0.65} ${x + r * 0.5} ${y - 2}`,
                "none",
                "#ed946b",
                2,
              ),
          )
          .join("") +
        path("M284 304 C316 349 404 351 432 296 C451 259 417 234 385 259", "none", "#773e2c", 19) +
        path("M280 293 C320 335 397 335 415 293", "none", "#e16f46", 9) +
        group(
          rect(-9, 14, 18, 222, "#b68a54", 7, "#805e3e") +
            ellipse(0, -15, 32, 51, "#bb905c", "#80603e", 3) +
            ellipse(0, -20, 24, 38, "#b34b31", "#a8462d", 2) +
            path("M-14 -32 Q-4 -44 10 -28 M-10 -11 L8 -7", "none", "#de7750", 3),
          "translate(418 276) rotate(-43)",
        ),
    },
    {
      id: "finished",
      title: "Finish with basil and oil",
      caption:
        "The thick marinara fills a serving bowl, with torn basil and ribbons of olive oil over the visibly textured crushed tomatoes.",
      body:
        bowl(tomato) +
        sauceTexture(400, 300, 184, 169, 105) +
        path(
          "M261 268 C276 192 405 175 480 232 C546 282 499 389 416 407 C347 422 275 380 288 329 C298 291 357 266 414 284 C458 296 444 336 410 344",
          "none",
          "#d89c49",
          6,
        ) +
        path("M267 270 C282 206 347 199 377 202 M469 359 Q456 380 426 386", "none", "#f1c879", 3) +
        leaf(330, 247, -42, 0.85) +
        leaf(436, 246, 53, 0.7) +
        leaf(471, 336, 117, 0.83) +
        leaf(340, 364, -116, 0.78) +
        group(
          path("M-20 11 L-24 -8 Q-9 -26 12 -18 L8 1 L23 9 Q0 29 -20 11Z", "#587b46", "#41633c", 2),
          "translate(381 302) rotate(32)",
        ) +
        group(
          path("M-20 11 L-24 -8 Q-9 -26 12 -18 L8 1 L23 9 Q0 29 -20 11Z", "#64864e", "#41633c", 2),
          "translate(425 381) rotate(-21)",
        ) +
        leaf(269, 309, -70, 0.48) +
        leaf(399, 214, 18, 0.5),
    },
  ],
};

export default [omelette, grilledCheese, pancakes, marinara];
