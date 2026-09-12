// Shared top-down drawing primitives for the deterministic demo illustrations.
export const ink = "#51483e";
export const esc = (text) => String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
export const ellipse = (x, y, rx, ry, fill, stroke = ink, width = 3) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
export const rect = (x, y, w, h, fill, radius = 12, stroke = ink) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`;
export const path = (d, fill = "none", stroke = ink, width = 3) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const line = (x1, y1, x2, y2, stroke = ink, width = 3) => path(`M${x1} ${y1}L${x2} ${y2}`, "none", stroke, width);
export const group = (body, transform = "") => `<g transform="${transform}">${body}</g>`;
export const plate = () => ellipse(400, 300, 248, 228, "#fdfcf8", "#b6b0a4") + ellipse(400, 300, 210, 190, "#f7f4ea", "#d7d1c4", 2);
export const bowl = (fill = "#f7f2df") => ellipse(400, 300, 225, 210, "#fdfcf8", "#aaa79a") + ellipse(400, 300, 201, 186, fill, "#d0c9b7", 2);
export const pan = (fill = "#393a34") => group(rect(610, 268, 160, 60, "#55554c", 18) + ellipse(395, 300, 236, 226, "#55554c") + ellipse(395, 300, 215, 205, fill, "#8c8a79", 3));
export const board = () => rect(95, 88, 610, 424, "#e5cba4", 32, "#b49872") + [130, 220, 310, 400, 490].map(y => path(`M120 ${y} Q340 ${y - 12} 680 ${y + 4}`, "none", "#d2b58c", 2)).join("");
export function flecks(count, x, y, rx, ry, color = "#5a704b", size = 3) {
  return Array.from({ length: count }, (_, i) => {
    const a = i * 2.39996323;
    const r = Math.sqrt((i + 0.5) / count);
    return ellipse(x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r, size, size * 0.65, color, "none");
  }).join("");
}
export function svg(title, caption, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}</title><desc id="desc">Demo illustration. ${esc(caption)}</desc><rect width="800" height="600" fill="#faf8f2"/>${body}</svg>\n`;
}
