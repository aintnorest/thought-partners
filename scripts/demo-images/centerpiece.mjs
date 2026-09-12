import { board, ellipse, flecks, group, line, path, plate, rect } from "./drawing.mjs";

const herb = (x, y, angle = 0, color = "#59714a") =>
  group(
    path("M0 30Q5 0 0 -33", "none", color, 3) +
      [-20, -5, 10]
        .map((dy) =>
          path(
            `M2 ${dy + 8}Q-25 ${dy - 7} -14 ${dy - 15}Q0 ${dy - 13} 2 ${dy + 8}M2 ${dy + 8}Q24 ${dy - 7} 16 ${dy - 15}Q4 ${dy - 13} 2 ${dy + 8}`,
            color,
            color,
            1,
          ),
        )
        .join(""),
    `translate(${x} ${y}) rotate(${angle})`,
  );
const lemon = (x, y, r = 30) =>
  ellipse(x, y, r, r, "#f6d26f", "#c8a449", 2) +
  ellipse(x, y, r - 5, r - 5, "#fff0b7", "#fff8da", 2) +
  Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4;
    return line(x, y, x + Math.cos(angle) * (r - 7), y + Math.sin(angle) * (r - 7), "#e8c976", 2);
  }).join("");
const wrapper = (x, y, r = 64) =>
  ellipse(x, y, r, r * 0.91, "#f4e4bf", "#bdab89", 2) +
  ellipse(x, y, r - 7, (r - 7) * 0.91, "none", "#fff3d6", 2);
const filling = (x, y, scale = 1) =>
  group(
    path(
      "M-33 12Q-44 -6 -21 -18Q-10 -34 6 -22Q35 -30 39 -8Q52 12 27 25Q-3 39 -33 12Z",
      "#be8880",
      "#91685e",
      2,
    ) +
      flecks(24, 0, 0, 33, 21, "#e1b2a0", 5) +
      flecks(14, 0, 0, 28, 22, "#5f7950", 4) +
      [-15, 0, 15].map((dx) => path(`M${dx - 7} -8q13 -12 22 5`, "none", "#d6deae", 4)).join(""),
    `translate(${x} ${y}) scale(${scale})`,
  );
const dumpling = (x, y, angle = 0, browned = false, scale = 1) =>
  group(
    ellipse(0, 29, 67, 13, "#dad1bd", "none") +
      path(
        "M-66 15Q-64 -33 -10 -42Q41 -47 66 14Q37 49 -15 42Q-49 37 -66 15Z",
        browned ? "#e9c284" : "#f1e1bd",
        "#a28963",
        2.5,
      ) +
      path(
        "M-61 19Q-25 46 18 38Q48 33 63 15Q50 52 3 50Q-45 47 -61 19Z",
        browned ? "#a65e30" : "#dec79b",
        "#a28963",
        2,
      ) +
      path("M-64 15Q-22 -26 13 -32Q39 -23 65 14", "none", "#c0a579", 4) +
      [-43, -26, -9, 8, 25, 42]
        .map((dx, i) =>
          path(
            `M${dx} ${-16 - Math.sin(i * 0.55) * 13}q-10 16 1 30q5 -13 11 -22`,
            "#f7e9ca",
            "#b89e73",
            2,
          ),
        )
        .join("") +
      (browned ? flecks(14, 0, 35, 44, 7, "#774c2d", 3) : ""),
    `translate(${x} ${y}) rotate(${angle}) scale(${scale})`,
  );
const tray = (fill = "#d6d7d0") =>
  rect(79, 80, 642, 440, "#adb4b2", 31, "#748080") + rect(96, 99, 608, 403, fill, 22, "#8b9792");
const vegetables = () =>
  [
    [188, 177],
    [587, 191],
    [204, 402],
    [553, 408],
  ]
    .map(([x, y], i) =>
      group(
        path("M-44 -12L29 -25L45 4L-24 20Z", "#d88b47", "#a76b34", 2) +
          line(-20, -12, -12, 12, "#edac68", 3) +
          path("M-23 36Q-1 -12 27 24Q36 45 6 52Z", "#f0dfb1", "#aa956a", 2) +
          path("M-11 37Q6 6 20 29", "none", "#c5b783", 2) +
          group(
            rect(-12, -48, 72, 18, "#849157", 5, "#677848") + line(-5, -39, 54, -39, "#b9be80", 2),
            "rotate(25)",
          ),
        `translate(${x} ${y}) rotate(${i * 62})`,
      ),
    )
    .join("");
const turkey = (x, y, scale = 1, roasted = false) =>
  group(
    ellipse(0, 43, 155, 129, "#786342", "none") +
      path(
        "M-11 -151Q92 -160 135 -58Q159 16 121 113Q103 153 42 150L-35 151Q-117 159 -140 93Q-176 -4 -119 -92Q-77 -146 -11 -151Z",
        roasted ? "#bd7841" : "#e6bc95",
        roasted ? "#865733" : "#b18464",
        3,
      ) +
      path(
        "M-17 -131Q-104 -117 -115 -39Q-133 37 -97 104Q-59 138 -15 118Q2 74 -3 19Q8 -56 -17 -131Z",
        roasted ? "#dea058" : "#efd1aa",
        "none",
      ) +
      path(
        "M9 -122Q84 -126 114 -48Q139 19 102 107Q84 133 31 128Q13 89 18 26Q31 -58 9 -122Z",
        roasted ? "#d59048" : "#f1ceaa",
        "none",
      ) +
      path("M-11 -127Q20 -41 6 24Q-3 90 17 135", "none", roasted ? "#9b6335" : "#c29672", 3) +
      flecks(90, 0, 0, 119, 119, roasted ? "#925c35" : "#bd9969", 2) +
      flecks(29, 0, -5, 106, 116, "#5d6942", 3) +
      (roasted
        ? path("M-103 -63Q-87 -102 -58 -113M57 -113Q89 -103 99 -68", "none", "#efbb77", 5)
        : path(
            "M-106 -41q28 -25 55 -10M37 51q30 -10 59 7M-62 91q19 -9 31 -5",
            "none",
            "#f7dfa0",
            10,
          )),
    `translate(${x} ${y}) scale(${scale})`,
  );
const fish = (x, y, scale = 1, roasted = false) =>
  group(
    path("M128 -17L207 -62L194 -13L213 44L128 20Z", roasted ? "#b59b62" : "#9faea0", "#6d796f", 2) +
      [-37, -20, 0, 21, 32]
        .map((dy) => line(139, 0, 198, dy, roasted ? "#84744b" : "#748b83", 2))
        .join("") +
      path("M-78 -40Q-7 -89 62 -47L21 -30Z", roasted ? "#b29858" : "#a8b1a3", "#6d796f", 2) +
      path("M-19 38L54 81L74 40Z", roasted ? "#b99b60" : "#aab6a6", "#6d796f", 2) +
      path(
        "M-193 -4Q-165 -43 -125 -50Q-21 -83 89 -42Q131 -28 151 0Q120 34 88 47Q-40 81 -140 44Q-179 26 -193 -4Z",
        roasted ? "#c6af78" : "#b8c8bc",
        "#69776e",
        3,
      ) +
      path("M-122 -41Q-26 -63 83 -31Q-7 -29 -97 -7Z", roasted ? "#ab975e" : "#91a79e", "none") +
      path("M-130 31Q-22 58 94 28Q35 66 -75 53Z", roasted ? "#eee0b2" : "#e4e7cd", "none") +
      path("M-126 -42Q-96 -8 -123 39M-186 6l25 5", "none", "#6c796b", 3) +
      ellipse(-150, -13, 10, 10, roasted ? "#ded5b2" : "#e9e9d2", "#6b766b", 2) +
      ellipse(-150, -13, 5, 5, "#374a44", "none") +
      [-60, -7, 46]
        .map(
          (dx) =>
            path(`M${dx - 9} -33q25 25 5 65`, "none", roasted ? "#f1e5c1" : "#f5eee0", 7) +
            path(`M${dx - 5} -32q19 22 4 61`, "none", "#79806b", 2),
        )
        .join("") +
      flecks(roasted ? 75 : 48, -3, 1, 98, 40, roasted ? "#8a784b" : "#d9e0ca", roasted ? 3 : 2) +
      path("M-66 35Q-7 24 77 40", "none", "#71806a", 3),
    `translate(${x} ${y}) scale(${scale})`,
  );
const fennel = (x, y, angle = 0) =>
  group(
    path("M0 30L0 -30M0 12L-26 -15M0 1L24 -25M0 -10L-18 -31M0 22L28 -6", "none", "#58846c", 2) +
      [-1, 1]
        .map((side) =>
          [-20, -6, 9]
            .map((dy) =>
              path(
                `M0 ${dy}l${side * 13} -12m${-side * 8} 7l${side * 3} -12`,
                "none",
                "#58846c",
                1.5,
              ),
            )
            .join(""),
        )
        .join(""),
    `translate(${x} ${y}) rotate(${angle})`,
  );
const fishStuffing = (x, y, scale = 1) =>
  group(
    lemon(-29, 33, 22) +
      lemon(9, 37, 22) +
      lemon(45, 38, 22) +
      herb(-54, 36, -72) +
      fennel(64, 32, 75),
    `translate(${x} ${y}) scale(${scale})`,
  );
const gravy = (x, y, radius = 71) =>
  ellipse(x, y, radius + 11, radius + 5, "#f2eee3", "#a6a494", 2) +
  ellipse(x, y, radius, radius - 6, "#a17644", "#82613f", 2) +
  path(
    `M${x - radius * 0.6} ${y - 14}Q${x} ${y - radius * 0.6} ${x + radius * 0.6} ${y - 12}`,
    "none",
    "#cfa16c",
    4,
  );

export default [
  {
    id: "hand-folded-dumplings",
    title: "Hand-Folded Pork and Cabbage Dumplings",
    source: "samples/cooklang/centerpiece/hand-folded-dumplings.cook",
    stages: [
      {
        id: "prep",
        title: "Center the filling",
        caption:
          "Squeezed napa cabbage is mixed with pork, scallions, ginger, soy sauce, sesame oil and white pepper. A small teaspoon mound leaves a clean border on the dumpling wrapper.",
        body:
          board() +
          ellipse(272, 290, 151, 156, "#faf5e8", "#a6a18e") +
          ellipse(272, 290, 132, 134, "#d7b09a", "#b39379", 2) +
          filling(272, 290, 3.05) +
          group(
            rect(-13, -17, 25, 130, "#a3835d", 8) +
              ellipse(0, -28, 26, 38, "#c4a57e", "#8d765c", 2),
            "translate(351 188) rotate(-25)",
          ) +
          wrapper(528, 335, 94) +
          filling(528, 335, 1.05) +
          wrapper(535, 173, 60) +
          wrapper(532, 165, 60) +
          wrapper(529, 157, 60) +
          ellipse(661, 421, 42, 39, "#f7f6eb", "#a6a18e", 2) +
          ellipse(661, 421, 33, 29, "#d5e6e3", "#abc0bd", 2) +
          flecks(12, 507, 437, 74, 17, "#ece4d0", 2),
      },
      {
        id: "cooking",
        title: "Fold and seal",
        caption:
          "Moisten the wrapper edge with water, fold it over the filling, then pleat one side against the other. The even pleats form a fully sealed edge without filling squeezing out.",
        body:
          board() +
          wrapper(231, 210, 80) +
          filling(231, 210, 0.9) +
          path("M166 234Q226 277 291 230", "none", "#aac3c4", 5) +
          group(
            path("M-83 25Q-78 -61 0 -65Q79 -63 84 25Q7 61 -83 25Z", "#f4e6c7", "#b19b76", 3) +
              path("M-75 25Q0 -28 76 25", "none", "#c3aa80", 4) +
              [-55, -33, -11]
                .map((dx) => path(`M${dx} 8q-8 -21 3 -29q3 14 17 17`, "#f7ebd0", "#b59c72", 2))
                .join(""),
            "translate(490 220) rotate(-12)",
          ) +
          dumpling(244, 399, -10, false, 1.13) +
          dumpling(452, 403, 8, false, 1.13) +
          dumpling(604, 370, -28, false, 0.86) +
          ellipse(647, 161, 39, 35, "#fffbee", "#aaa28d", 2) +
          ellipse(647, 161, 30, 26, "#d1e2df", "#9bb3b1", 2),
      },
      {
        id: "finished",
        title: "Golden, steamed and crisped",
        caption:
          "Dumplings are browned flat-side down, steamed with water under a lid, then uncovered until the water evaporates and the bottoms re-crisp. Serve with dumpling dipping sauce; several are turned to show the browned base.",
        body:
          plate() +
          [
            [283, 175, -22],
            [430, 153, 12],
            [544, 239, 49],
            [261, 311, -48],
            [409, 282, 12],
            [487, 391, -19],
            [339, 428, 16],
          ]
            .map(([x, y, angle]) => dumpling(x, y, angle, true, 0.9))
            .join("") +
          ellipse(660, 428, 76, 66, "#ede9db", "#a7a18c", 2) +
          ellipse(660, 428, 63, 53, "#654430", "#8c6b48", 2) +
          flecks(15, 660, 425, 45, 32, "#c6aa71", 2) +
          line(83, 157, 119, 479, "#795c3e", 8) +
          line(105, 153, 142, 474, "#96734d", 8),
      },
    ],
  },
  {
    id: "roast-turkey-breast-pan-gravy",
    title: "Roast Turkey Breast with Pan Gravy",
    source: "samples/cooklang/centerpiece/roast-turkey-breast-pan-gravy.cook",
    stages: [
      {
        id: "prep",
        title: "Herb-butter roasting pan",
        caption:
          "Thyme-and-lemon herb butter is spread under and over the unbroken skin of the bone-in turkey breast. Onion, carrot and celery support the breast in the roasting pan, ready for the 350°F oven.",
        body:
          tray("#cdc1a2") +
          vegetables() +
          turkey(397, 297, 1.04) +
          rect(45, 213, 35, 144, "#8c9791", 10, "#65716b") +
          rect(721, 213, 35, 144, "#8c9791", 10, "#65716b") +
          ellipse(647, 470, 76, 63, "#f5f0df", "#a8a18d", 2) +
          ellipse(647, 470, 60, 47, "#edd697", "#c2ad71", 2) +
          flecks(26, 647, 470, 49, 37, "#6d794c", 3) +
          group(
            path("M-9 -54L10 -54L16 35Q-2 53 -15 34Z", "#bf9b6a", "#97784f", 2) +
              rect(-7, -131, 14, 89, "#917856", 6),
            "translate(700 437) rotate(29)",
          ),
      },
      {
        id: "cooking",
        title: "Rest the roast, whisk gravy",
        caption:
          "Roast at 350°F for about 90 minutes, checking doneness with a thermometer—not skin color—before resting 20 minutes. Whisk butter and flour, then skimmed drippings and stock; simmer until the gravy coats a spoon and pours in a smooth ribbon.",
        body:
          group(board(), "translate(-35 38) scale(0.62)") +
          turkey(212, 248, 0.69, true) +
          rect(211, 108, 103, 31, "#e8e5da", 8, "#7e8982") +
          rect(222, 117, 41, 12, "#a9b6a8", 2, "#7e8982") +
          line(216, 139, 213, 230, "#979e93", 5) +
          rect(650, 360, 129, 48, "#676b60", 13, "#454d43") +
          ellipse(556, 364, 158, 143, "#62695f", "#4d594f", 3) +
          ellipse(556, 364, 142, 128, "#a37745", "#b3b2a2", 3) +
          path(
            "M446 377Q450 277 555 286Q651 281 663 366Q655 435 560 442Q482 449 460 397",
            "none",
            "#c2955b",
            6,
          ) +
          group(
            rect(-8, -127, 16, 140, "#aa9573", 7) +
              ellipse(0, 27, 35, 49, "#c5ac82", "#826d4d", 2) +
              ellipse(0, 28, 26, 38, "#a87945", "#8d6239", 2),
            "translate(588 174) rotate(15)",
          ) +
          path("M572 237C550 272 593 280 565 319", "none", "#734f30", 14) +
          path("M574 238C555 271 591 280 568 314", "none", "#bd8d55", 8) +
          path(
            "M426 103L490 103L508 128L491 133L491 209Q458 227 426 209Z",
            "#e8e7d6",
            "#999b8e",
            2,
          ) +
          path("M430 159L487 159L487 205Q458 218 430 205Z", "#9e784d", "none") +
          [130, 145, 160, 175, 190].map((y) => line(433, y, 445, y, "#979788", 2)).join(""),
      },
      {
        id: "finished",
        title: "Carve across the grain",
        caption:
          "After thermometer-verified cooking and the 20-minute rest, carve the breast from the bone and cut even slices about ¼ inch thick across the grain. Pan gravy is served alongside; the drawing does not establish doneness.",
        body:
          ellipse(400, 302, 302, 191, "#faf9f1", "#b2b2a2") +
          ellipse(400, 302, 273, 164, "#f1eee1", "#d2cebc", 2) +
          path(
            "M205 319Q212 202 340 205Q411 216 432 315Q400 377 301 374Z",
            "#bf8045",
            "#946437",
            3,
          ) +
          flecks(35, 315, 270, 84, 50, "#80572f", 3) +
          Array.from({ length: 6 }, (_, i) =>
            group(
              path(
                "M-63 -85Q18 -106 71 -44Q91 9 51 64Q-5 102 -71 55Q-103 -9 -63 -85Z",
                "#bd824b",
                "#90623e",
                2,
              ) +
                path(
                  "M-57 -76Q17 -91 61 -38Q77 9 44 55Q-8 84 -63 47Q-88 -10 -57 -76Z",
                  "#ede0c1",
                  "#d0ba95",
                  2,
                ) +
                [-40, -21, -2, 17, 36]
                  .map((dy) => path(`M-52 ${dy}q51 -17 96 13`, "none", "#d4c2a0", 1.5))
                  .join(""),
              `translate(${337 + i * 33} ${275 + i * 12}) rotate(-19) scale(.82)`,
            ),
          ).join("") +
          gravy(647, 164, 68) +
          path("M306 397Q348 362 406 406Q458 416 483 394", "none", "#b28b57", 13) +
          herb(172, 289, -23) +
          herb(195, 362, -49),
      },
    ],
  },
  {
    id: "whole-roasted-branzino",
    title: "Whole Roasted Branzino with Citrus and Herbs",
    source: "samples/cooklang/centerpiece/whole-roasted-branzino.cook",
    stages: [
      {
        id: "prep",
        title: "Score and loosely stuff",
        caption:
          "Two dried branzino are scored three times per side, seasoned with salt, pepper and olive oil, then loosely filled with lemon slices, parsley and fennel fronds without bulging the cavities.",
        body:
          board() +
          fish(392, 219, 1.14) +
          fishStuffing(392, 219, 1.14) +
          fish(392, 397, 1.14) +
          fishStuffing(392, 397, 1.14) +
          lemon(659, 130, 31) +
          lemon(654, 176, 31) +
          herb(132, 459, 20) +
          fennel(661, 463, 44) +
          group(
            path("M-14 -125L15 -125L15 66Q-16 35 -14 -125Z", "#d5dbd4", "#87958b", 2) +
              rect(-14, -184, 29, 65, "#82725d", 7),
            "translate(731 345) rotate(5)",
          ),
      },
      {
        id: "cooking",
        title: "Roast until blistered",
        caption:
          "Roast the stuffed fish on a sheet pan at 425°F for about 18 minutes. The recipe asks for blistered skin and a fork check at the thickest point for flesh near the backbone that flakes when nudged; this illustration cannot verify doneness.",
        body:
          tray("#d6c8a9") +
          path("M135 175Q388 97 656 182L654 261Q394 311 142 274Z", "#c6b488", "none") +
          path("M125 352Q370 286 656 359L661 440Q431 489 142 453Z", "#c9b389", "none") +
          fish(387, 214, 1.19, true) +
          fishStuffing(387, 214, 1.1) +
          fish(387, 398, 1.19, true) +
          fishStuffing(387, 398, 1.1) +
          flecks(28, 412, 314, 230, 14, "#937344", 3) +
          group(
            path(
              "M0 -67L0 51M-14 -69L-14 -37Q-13 -21 0 -21Q13 -21 14 -37L14 -69M-5 -69L-5 -35M5 -69L5 -35",
              "none",
              "#8a9990",
              5,
            ) + rect(-6, 34, 12, 61, "#9fa89b", 5, "#76847b"),
            "translate(708 299) rotate(-18)",
          ),
      },
      {
        id: "finished",
        title: "Lift broad fillets",
        caption:
          "A fish spatula and spoon lift the top fillets cleanly from the bones in broad pieces. Serve the branzino fillets with lemon wedges and olive oil; the plate depicts lifted fillets rather than the skeleton.",
        body:
          ellipse(400, 300, 302, 199, "#fbfaf2", "#aeb5a7") +
          ellipse(400, 300, 272, 170, "#f2f1e4", "#d1d4c6", 2) +
          [
            [395, 241, -12],
            [391, 365, 9],
          ]
            .map(([x, y, angle]) =>
              group(
                path(
                  "M-191 1Q-146 -69 -35 -56Q74 -70 180 -10L194 8Q122 58 -1 51Q-145 67 -191 1Z",
                  "#e6ddba",
                  "#9a977c",
                  3,
                ) +
                  path(
                    "M-172 -2Q-120 -53 -22 -44Q88 -51 171 -8L146 13Q70 29 -13 28Q-105 37 -151 15Z",
                    "#b6a775",
                    "#9d956e",
                    2,
                  ) +
                  flecks(66, 0, -6, 148, 28, "#8a825b", 3) +
                  [-104, -53, -2, 49, 100]
                    .map((dx) =>
                      path(`M${dx} -35q25 21 3 65l-18 12M${dx + 5} 9l25 12`, "none", "#f5edcf", 4),
                    )
                    .join("") +
                  path("M-166 19Q-116 51 -51 42M17 39Q82 46 139 22", "none", "#fff9e5", 5),
                `translate(${x} ${y}) rotate(${angle})`,
              ),
            )
            .join("") +
          group(
            path("M-44 16L0 -32L45 16Q0 50 -44 16Z", "#f1cf66", "#baa34e", 2) +
              path("M-33 15L0 -23L34 15Q0 37 -33 15Z", "#fff1bb", "#e5cc7a", 2) +
              line(0, -18, 0, 25, "#ddc479", 2),
            "translate(619 220) rotate(26)",
          ) +
          group(
            path("M-43 16L0 -32L44 16Q0 50 -43 16Z", "#f1cf66", "#baa34e", 2) +
              path("M-32 15L0 -23L33 15Q0 37 -32 15Z", "#fff1bb", "#e5cc7a", 2),
            "translate(188 381) rotate(-26)",
          ) +
          path("M250 453Q296 473 343 454M548 154q34 -12 65 4", "none", "#d3b867", 6) +
          herb(560, 445, 68) +
          fennel(219, 189, -66),
      },
    ],
  },
];
