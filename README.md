# CyberMorph

CyberMorph convierte el movimiento de un traje wearable con Arduino e IMUs en
MIDI, sonido y loops. Incluye:

- **CyberMorph Studio** para Windows: entrada de sensores por puerto serie,
  mapeo MIDI por eje, audio en vivo, grabación de datasets y reconocimiento de
  gestos.
- **CyberMorph Simulator**: un cuerpo 3D articulado para probar los mapeos sin
  conectar el hardware.
- **Motor de movimiento compartido**: el simulador web y la aplicación de
  escritorio utilizan el mismo código de normalización, curvas, suavizado y
  clasificación de gestos.

## Inicio rápido

```bash
npm install
npm run dev
```

Abrir `http://localhost:5173/cybermorph/`. Para ejecutar la aplicación de
escritorio:

```bash
npm run dev:desktop
```

Para crear el instalador de Windows:

```bash
npm run dist:win
```

El instalador se genera en `apps/desktop/release/`.

## Protocolo Arduino

Enviar un objeto JSON por frame, delimitado por un salto de línea, a 115200
baudios:

```json
{"t":1712345678,"sensors":{"left_elbow":{"pitch":42.1,"roll":-8.4,"yaw":12.0},"right_knee":{"pitch":71.0,"roll":2.0,"yaw":-4.0}}}
```

También se acepta el formato abreviado con arrays:

```json
{"left_elbow":[42.1,-8.4,12],"right_knee":[71,2,-4]}
```

Consultar [`docs/arduino-example.ino`](docs/arduino-example.ino) para ver una
plantilla completa del transmisor.

## Enrutamiento MIDI

CyberMorph Studio envía mensajes MIDI estándar de Control Change y Note.
Seleccionar como salida un DAW, sintetizador físico o cable MIDI virtual —por
ejemplo, loopMIDI— y después utilizar MIDI Learn en el VST deseado. De este modo,
la primera versión es compatible con cualquier host VST y no ata el traje a un
DAW específico.

## Aprendizaje de gestos

1. Escribir una etiqueta, por ejemplo `brazo_arriba`.
2. Grabar varios ejemplos de entre 1 y 3 segundos.
3. Presionar **Train local model**.
4. Activar el reconocimiento en vivo y asociar el gesto detectado a una nota o
   un loop.

El clasificador local extrae la media, desviación, rango, pico y velocidad de
cada eje de los sensores, y utiliza vecinos más cercanos normalizados (KNN).
Los datasets y modelos pueden exportarse como JSON; las capturas sin procesar
también pueden exportarse como CSV.

## Producción

El sitio se compila con la ruta base `/cybermorph/`. Cada push a `main` ejecuta
los tests, compila la web y genera el instalador de Windows como artefacto de
GitHub Actions. En el VPS, `cybermorph-pull.timer` detecta nuevos commits,
repite los tests y el build, y publica la web en
`/var/www/davefrassoni/cybermorph`.

Consultar [`docs/deployment.md`](docs/deployment.md) para conocer el flujo
completo.
