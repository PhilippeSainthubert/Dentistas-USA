# Dentistas USA: prototipo fase 1

Prototipo para automatizar la lista diaria de cada dentista de la clínica: el dentista apunta lo que hizo (igual que en el Excel), el seguro y el importe se ponen solos con la tabla de precios de la clínica, y sale lo que cobra cada dentista por semana.

- `prototipo-fase1.html`: la app, como una hoja de Excel. Cada fila es un paciente; los tratamientos y el seguro se eligen en desplegables y el importe se calcula solo. Además tiene pestañas de Liquidación y Precios.
- `engine.js`: el motor. Contiene la tabla de precios por seguro, los combos de examen + radiografías y la regla de Medicaid.
- `build.mjs`: genera `index.html` (la página completa que sirve Vercel). Después de tocar `prototipo-fase1.html`, ejecuta `node build.mjs` y sube los dos archivos.

En vivo: https://dentistas-usa.vercel.app. Los pacientes y dentistas son inventados, y lo que se escribe se queda en el navegador de cada uno.
