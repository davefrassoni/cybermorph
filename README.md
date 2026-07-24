# CyberMorph

## Probar online

**[Abrir CyberMorph Simulator en davefrassoni.com/cybermorph](https://davefrassoni.com/cybermorph/)**

El simulador web permite mover el traje 3D, reproducir bailes, grabar
movimientos propios, configurar las IMUs, probar el motor de audio y grabar
ejemplos de gestos sin conectar ningún Arduino.

CyberMorph convierte el movimiento de un traje wearable con Arduino e IMUs en
MIDI, sonido y loops. Incluye:

- **CyberMorph Studio** para Windows: entrada de sensores por puerto serie,
  mapeo MIDI por eje, audio en vivo, grabación de datasets y reconocimiento de
  gestos.
- **CyberMorph Simulator**: un cuerpo 3D con esqueleto jerárquico y límites
  biomecánicos por articulación para probar los mapeos sin conectar el
  hardware.
- **Secuenciador corporal**: cuatro bailes originales de prueba y grabación,
  almacenamiento local, reproducción, importación y exportación de movimientos.
- **Traje configurable**: cuatro IMUs iniciales en manos y pies, con aceleración
  y giroscopio XYZ. Cada sensor se puede activar, desactivar, reubicar o
  eliminar, y se pueden agregar otros.
- **Referencia por cámara**: seguimiento corporal opcional con MediaPipe para
  completar el avatar y grabar el esqueleto. El video se procesa localmente y
  no reemplaza las IMUs que controlan MIDI.
- **Programador USB**: conexión y carga local de firmware para Arduino Uno y
  Nano con ATmega328P desde Chrome, Edge o la aplicación de escritorio.
- **Actualizaciones de escritorio**: CyberMorph Studio comprueba el canal
  publicado en el sitio, descarga nuevas versiones y las instala al reiniciar.
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
{"t":1712345678,"sensors":{"left_hand":{"pitch":42.1,"roll":-8.4,"yaw":12.0,"accel":[0.4,-1.2,9.7],"gyro":[84.0,-12.5,6.1]},"right_foot":{"pitch":8.0,"roll":2.0,"yaw":-4.0,"accel":[1.1,0.3,12.8],"gyro":[2.0,18.0,-3.0]}}}
```

Para firmware anterior también se acepta el formato abreviado de orientación:

```json
{"left_wrist":[42.1,-8.4,12],"right_ankle":[8,2,-4]}
```

Los identificadores (`left_hand`, `right_foot`, etc.) corresponden al campo
**ID** del panel de sensores. Su ubicación corporal se configura en Studio, por
lo que una misma placa se puede mover sin cambiar los mapeos. Los campos
`pitch`, `roll` y `yaw` son opcionales cuando la IMU no ofrece fusión de
orientación; aceleración y giroscopio se pueden enviar como arrays `accel` y
`gyro` o como `ax/ay/az` y `gx/gy/gz`.

Consultar [`docs/arduino-example.ino`](docs/arduino-example.ino) para ver una
plantilla completa del transmisor.

## Movimientos y cámara

El secuenciador incluye Groove lateral, Pulso robot, Onda de mano y Paso con
patada. Se puede mover el avatar manualmente o activar la cámara, presionar
**Grabar esqueleto** y guardar la secuencia en el navegador. Las grabaciones se
pueden reproducir y compartir como JSON.

La cámara requiere permiso explícito y HTTPS en la web. MediaPipe descarga el
modelo de pose al dispositivo y procesa allí los frames: CyberMorph no guarda
ni transmite video. Con el traje conectado, su estimación sólo completa el
avatar y las grabaciones de poses, mientras MIDI y el dataset usan las IMUs
reales. En modo SIM, la pose de cámara mueve las IMUs virtuales para poder
probar sonido y aprendizaje sin hardware.

Consultar [`docs/sensores-movimientos-camara.md`](docs/sensores-movimientos-camara.md)
para conocer el diseño, las limitaciones y el formato de datos.

El panel **Firmware** puede instalar el firmware base o un archivo Intel HEX
propio directamente por USB. Consultar
[`docs/firmware-web.md`](docs/firmware-web.md) para conocer las placas
compatibles y las precauciones de uso.

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
GitHub Actions. También publica el manifiesto y los archivos del canal continuo
de actualización de escritorio. Tras validar ambos artefactos, GitHub Actions
los despliega directamente al VPS por SSH y comprueba Nginx y la URL pública.

Consultar [`docs/deployment.md`](docs/deployment.md) para conocer el flujo
completo.
