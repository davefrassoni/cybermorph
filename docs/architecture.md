# Arquitectura

```text
IMUs Arduino -- ACC/GYRO JSONL / USB serie --+
                                             +--> configuración de sensores
Simulador 3D -- IMUs virtuales ---------------+              |
                                                            +--> MIDI / audio / loops
                                                            +--> dataset --> modelo KNN

Cámara -- MediaPipe local --> pose corporal --> avatar / secuenciador
Movimientos guardados -----------------------> avatar --> IMUs virtuales
```

## Paquetes

- `packages/core`: parser del protocolo de hardware, curvas de mapeo,
  suavizado, serialización de datasets, extracción de características y
  clasificación KNN. No depende del navegador ni de Electron.
- `apps/studio`: interfaz React, simulador del traje con Three.js, audio con
  Tone.js, Web MIDI, secuenciador corporal y referencia de pose con MediaPipe.
  Vite lo compila una vez para la web y otra con rutas relativas para la
  aplicación de escritorio.
- `apps/desktop`: contenedor Electron, acceso al puerto serie y diálogos nativos
  para abrir y guardar archivos.

## Estrategia VST

Studio envía MIDI estándar, por lo que ya puede controlar instrumentos y
efectos VST desde cualquier DAW o cable MIDI virtual. Un plugin VST3 real debe
ser un target JUCE/C++ separado que consuma los archivos JSON de mapeos y
modelos exportados.

Mantenerlo separado evita introducir controladores serie y Chromium dentro del
callback de audio, y permite conservar la seguridad del hilo de tiempo real.

## Separación entre IMUs y cámara

La ubicación física de cada IMU es configuración, no parte de su identidad.
Un frame conserva el ID estable del sensor y Studio decide qué parte del avatar
representa. Sólo los sensores habilitados alimentan mapeos y aprendizaje.

Con el traje conectado, la cámara no se mezcla con sus frames: reconstruye una
pose corporal de referencia para el avatar y el secuenciador. En modo SIM esa
pose sí alimenta las IMUs virtuales, de modo que se puedan probar MIDI y modelos
sin hardware sin alterar el comportamiento del modo de interpretación real.
