# Dentistas USA: prototipo fase 1

Prototipo para automatizar la lista diaria de cada dentista de la clínica: el dentista apunta lo que hizo, recepción pone el seguro, el importe sale solo con la tabla de precios de la clínica y Javier da el visto bueno de la quincena.

- `prototipo-fase1.html`: la app. Una pestaña por persona de la cadena:
  - **Dentista**: añade sus pacientes del día y los tratamientos (visitas habituales con un clic o buscador), y pulsa «Enviar lista». No toca el seguro.
  - **Seguros** (Carmen): bandeja con los pacientes sin seguro de las listas enviadas. Elige el seguro y el importe sale solo, sin el paso de la tabla de precios. Ve qué dentistas no han enviado la lista y les puede recordar.
  - **Revisión** (Javier): la quincena, con lo que falta antes de aprobar (listas sin enviar, pacientes sin seguro, tratamientos sin precio). Lo que está en espera no se pierde: pasa a la siguiente quincena hasta que se paga. «Dar el visto bueno» marca lo pagado y copia los importes para ADP.
  - **Precios**: la tabla de la clínica, con tratamientos y seguros nuevos y subida anual.
- `engine.js`: el motor. Contiene la tabla de precios por seguro, los combos de examen + radiografías y la regla de Medicaid.
- `build.mjs`: genera `index.html` (la página completa que sirve Vercel). Después de tocar `prototipo-fase1.html`, ejecuta `node build.mjs` y sube los dos archivos.

En vivo: https://delaware-dental.vercel.app (la dirección antigua, dentistas-usa.vercel.app, también funciona). Los pacientes y dentistas son inventados, y lo que se escribe se queda en el navegador de cada uno.
