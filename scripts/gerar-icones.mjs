// Gera os ícones do PWA a partir do símbolo da marca (porta em arco de latão sobre lápis-lazúli).
// Uso: node scripts/gerar-icones.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const LAPIS = "#2c3fa3";
const LATAO = "#d9ae5a";
const CREME = "#f3e6c8";

/** Símbolo num quadro de 40×40; `escala` encolhe a porta (ícone maskable precisa de margem). */
function svg({ cantos, escala = 1 }) {
  const t = (40 - 40 * escala) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
  <rect width="40" height="40" rx="${cantos}" fill="${LAPIS}"/>
  <g transform="translate(${t} ${t}) scale(${escala})">
    <path d="M12.5 31.5V19.5a7.5 7.5 0 0 1 15 0v12z" fill="${LATAO}"/>
    <path d="M12.5 31.5h15" stroke="${CREME}" stroke-width="1.2"/>
    <circle cx="23.6" cy="25.2" r="1.35" fill="${LAPIS}"/>
  </g>
</svg>`;
}

mkdirSync("public/icones", { recursive: true });
const png = (fonte, tamanho, destino) => sharp(Buffer.from(fonte)).resize(tamanho, tamanho).png().toFile(destino);

writeFileSync("src/app/icon.svg", svg({ cantos: 11 }));
await png(svg({ cantos: 11 }), 192, "public/icones/icone-192.png");
await png(svg({ cantos: 11 }), 512, "public/icones/icone-512.png");
await png(svg({ cantos: 0, escala: 0.72 }), 512, "public/icones/icone-maskable-512.png");
await png(svg({ cantos: 0, escala: 0.86 }), 180, "src/app/apple-icon.png");
console.log("Ícones gerados.");
