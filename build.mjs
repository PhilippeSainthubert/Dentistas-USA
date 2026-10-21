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
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${body}
</body>
</html>
`;
writeFileSync(new URL("./index.html", import.meta.url), html);
console.log("index.html written");
