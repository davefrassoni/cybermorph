# Arquitectura

```text
IMUs Arduino -- JSONL / USB serie --+
                                    +--> motor de movimiento compartido
Simulador 3D -- frames generados ---+              |
                                                   +--> MIDI CC / notas --> DAW / VST
                                                   +--> sintetizador Web Audio / loops
                                                   +--> grabador --> modelo de gestos KNN
```

## Paquetes

- `packages/core`: parser del protocolo de hardware, curvas de mapeo,
  suavizado, serialización de datasets, extracción de características y
  clasificación KNN. No depende del navegador ni de Electron.
- `apps/studio`: interfaz React, simulador del traje con Three.js, audio con
  Tone.js y Web MIDI. Vite lo compila una vez para la web y otra con rutas
  relativas para la aplicación de escritorio.
- `apps/desktop`: contenedor Electron, acceso al puerto serie y diálogos nativos
  para abrir y guardar archivos.

## Estrategia VST

Studio envía MIDI estándar, por lo que ya puede controlar instrumentos y
efectos VST desde cualquier DAW o cable MIDI virtual. Un plugin VST3 real debe
ser un target JUCE/C++ separado que consuma los archivos JSON de mapeos y
modelos exportados.

Mantenerlo separado evita introducir controladores serie y Chromium dentro del
callback de audio, y permite conservar la seguridad del hilo de tiempo real.
