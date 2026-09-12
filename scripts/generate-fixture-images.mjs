// Generate the complete demo image set and gallery without network access.
// Run: pnpm fixture-images. Artwork sources live in scripts/demo-images/.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import carbonara from "./demo-images/carbonara.mjs";
import familiar from "./demo-images/familiar.mjs";
import exotic from "./demo-images/exotic.mjs";
import centerpiece from "./demo-images/centerpiece.mjs";
import { esc, svg } from "./demo-images/drawing.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const recipes = [...carbonara, ...familiar, ...exotic, ...centerpiece];
const manifest = recipes.map(({ stages, ...recipe }) => ({
  ...recipe,
  stages: stages.map(({ body, ...stage }) => {
    const folder = recipe.id === "carbonara" ? "carbonara" : `demo/${recipe.id}`;
    const imageUrl = `/images/${folder}/${stage.id}.svg`;
    const destination = join(root, "public", imageUrl);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, svg(`${recipe.title}: ${stage.title}`, stage.caption, body));
    return { ...stage, imageUrl };
  }),
}));
const imageCount = manifest.reduce((sum, recipe) => sum + recipe.stages.length, 0);
mkdirSync(join(root, "public/images/demo"), { recursive: true });
writeFileSync(join(root, "public/images/demo/index.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const sections = manifest.map(recipe => `<section id="${esc(recipe.id)}" aria-labelledby="${esc(recipe.id)}-title">
  <p class="meta">${recipe.stages.length} illustrated stages</p>
  <h2 id="${esc(recipe.id)}-title">${esc(recipe.title)}</h2>
  ${recipe.stages.map((stage, index) => `<figure>
    <img data-src="${esc(stage.imageUrl)}" alt="${esc(stage.caption)}" width="800" height="600" loading="lazy" decoding="async">
    <figcaption><p class="meta">Stage ${index + 1} · Demo illustration</p><h3>${esc(stage.title)}</h3><p>${esc(stage.caption)}</p><a class="image-link" href="${esc(stage.imageUrl)}" target="_blank" rel="noopener">Open full-size image<span class="sr-only">: ${esc(recipe.title)} — ${esc(stage.title)}</span></a></figcaption>
  </figure>`).join("\n")}
  <a class="back" href="#top">Back to recipe list</a>
</section>`).join("\n");

writeFileSync(join(root, "public/demo-images.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#1B1916"><title>Recipe demo images · Jacques</title>
<style>
:root{color-scheme:dark;font-family:Outfit,system-ui,sans-serif;background:#1b1916;color:#f5f2ec}*{box-sizing:border-box}body{margin:0}main{max-width:640px;margin:auto;padding:40px 20px calc(40px + env(safe-area-inset-bottom))}h1,h2,h3{line-height:1.12;letter-spacing:-.02em}h1{font-size:clamp(2.5rem,8vw,3.25rem);margin:16px 0}h2{font-size:2rem;margin:12px 0 24px}h3{font-size:1.5rem;margin:12px 0}p{font-size:1.125rem;line-height:1.55;color:#a8a29a}a{color:#f5f2ec;text-underline-offset:5px}a:focus-visible{outline:2px solid #de6b3f;outline-offset:5px;border-radius:8px}.meta{font-size:.875rem;text-transform:uppercase;letter-spacing:.08em}nav{display:flex;flex-direction:column;gap:12px;margin:28px 0}nav a,.back,.image-link,.walkthrough{display:flex;align-items:center;min-height:56px;padding:12px 24px;border:1px solid rgba(245,242,236,.09);border-radius:28px;text-decoration:none}nav a:hover,.back:hover,.image-link:hover{background:#262320}.walkthrough{background:#de6b3f;color:#1b1916;font-weight:600;margin:24px 0}section{padding-top:48px;scroll-margin-top:24px}figure{margin:0 0 32px}img{display:block;width:100%;height:auto;aspect-ratio:4/3;border-radius:24px;border:1px solid rgba(245,242,236,.09);background:#262320}img[hidden]{display:none}figcaption{padding-top:16px}.image-link{width:fit-content;margin-top:16px}.back{width:fit-content}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}footer{margin-top:48px;border-top:1px solid rgba(245,242,236,.09);padding-top:24px}
</style></head><body><main id="top">
<header><p class="meta">Jacques · Demo assets</p><h1>From prep to plate.</h1><p>${imageCount} staged illustrations across ${manifest.length} recipes. Synthetic reference images for a repeatable demo — not camera captures or AI assessments.</p><p>Use these to explain the cooking stages, not to judge food or knife safety. They are illustrations, not realistic test inputs for vision.</p><a class="walkthrough" href="/?fixture=1">Open Carbonara walkthrough</a></header>
<nav aria-label="Choose a recipe">${manifest.map(recipe => `<a href="#${esc(recipe.id)}">${esc(recipe.title)}</a>`).join("")}</nav>
<noscript><p>Enable JavaScript to display the gallery images, or use each full-size image link.</p></noscript>
${sections}
<footer><p>All images are bundled locally. No image service or API key required. <a href="/images/demo/index.json">Image manifest</a></p></footer>
</main><script>
const hideImages = ["1", "true"].includes(new URLSearchParams(location.search).get("noimages"));
for (const image of document.querySelectorAll("img[data-src]")) {
  if (hideImages) image.hidden = true;
  else image.src = image.dataset.src;
}
if (hideImages) document.querySelector(".walkthrough").href = "/?fixture=1&noimages=1";
</script></body></html>\n`);
console.log(`Generated ${imageCount} illustrations for ${manifest.length} recipes. Gallery: /demo-images.html`);
