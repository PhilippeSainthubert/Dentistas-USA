# Dentistas USA: prototipo fase 1

Prototipo para automatizar la lista diaria de cada dentista de la clínica: el dentista apunta lo que hizo (igual que en el Excel), el seguro y el importe se ponen solos con la tabla de precios de la clínica, y sale lo que cobra cada dentista por semana.

- `prototipo-fase1.html`: la app. Tiene una pestaña por persona: Dentista, Recepción, Liquidación, Precios, y otra para comprobar el cálculo con filas pegadas del Excel.
- `engine.js`: el motor. Contiene la tabla de precios por seguro, los combos de examen + radiografías, la regla de Medicaid y el lector de las abreviaturas que usan los dentistas.

Para verlo, abre `prototipo-fase1.html` en el navegador con `engine.js` en la misma carpeta. Los pacientes y dentistas son inventados. Nada de lo que se escribe sale del navegador.
