// Builds index.html for Vercel from the page source. The source is written without a
// document skeleton (the Claude artifact adds its own); a standalone host needs one.
// The artifact stays unbranded; this build swaps the generic logo for the clinic's.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

let body = readFileSync(new URL("./prototipo-fase1.html", import.meta.url), "utf8");

if (existsSync(new URL("./brand/logo.png", import.meta.url))) {
  const branded = `<div class="logo brand">
      <span class="plate"><img src="brand/logo.png" width="777" height="149" alt="Southern Delaware Dental Specialists"></span>
      <span data-i18n="appSub"></span>
    </div>`;
  const before = body;
  body = body.replace(/<!--BRAND-->[\s\S]*?<!--\/BRAND-->/, branded);
  if (body === before) throw new Error("BRAND markers not found in prototipo-fase1.html");
}

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%231d2939'/%3E%3Cpath d='M11.5 7C9 7 7.6 9 7.6 11.4c0 2 .8 3.4 1.4 5.2.6 1.9.8 4.2 1.6 6.4.4 1.1 1.7 1.1 2.1 0 .6-1.7.9-4.4 2.9-4.4s2.3 2.7 2.9 4.4c.4 1.1 1.7 1.1 2.1 0 .8-2.2 1-4.5 1.6-6.4.6-1.8 1.4-3.2 1.4-5.2C24.4 9 23 7 20.5 7c-1.5 0-2.3.7-4 .7S13 7 11.5 7Z' fill='none' stroke='white' stroke-width='1.8' stroke-linejoin='round'/%3E%3C/svg%3E">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${body}
</body>
</html>
`;
writeFileSync(new URL("./index.html", import.meta.url), html);
console.log("index.html written");
