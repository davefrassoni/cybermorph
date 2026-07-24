# Firmware desde el navegador

CyberMorph puede programar placas **Arduino Uno y Nano con ATmega328P**
directamente desde la web o desde la aplicación de escritorio. La transferencia
utiliza Web Serial y el protocolo STK500v1 del bootloader. El archivo permanece
en la computadora del usuario: el navegador no lo envía al servidor.

## Compatibilidad

| Placa | Perfil en CyberMorph | Velocidad |
| --- | --- | ---: |
| Arduino Uno R3 / compatible ATmega328P | Uno | 115200 |
| Arduino Nano con bootloader nuevo | Nano | 115200 |
| Arduino Nano con bootloader anterior | Nano anterior | 57600 |

La programación web requiere HTTPS y un navegador de escritorio con Web Serial,
como Chrome o Edge. La aplicación de escritorio incluye el mismo programador.
Safari y Firefox sin Web Serial no pueden acceder al puerto.

Otras familias —Mega, Leonardo, Uno R4, SAMD, RP2040, ESP32 y variantes— usan
otros bootloaders y formatos. No deben programarse seleccionando un perfil
ATmega328P. Para esas placas se puede utilizar Arduino Cloud Editor con Arduino
Cloud Agent o Arduino CLI hasta que se agregue un backend específico.

## Uso

1. Conectar un solo Arduino por USB y cerrar Arduino IDE o cualquier monitor
   serie que tenga ocupado el puerto.
2. Abrir **Firmware** en la barra de conexión.
3. Elegir el modelo y bootloader correctos.
4. Instalar el firmware base incluido o seleccionar un archivo Intel HEX.
5. No desconectar la placa hasta que el progreso llegue al 100 %.

El cargador valida el formato, checksum y tamaño de cada registro Intel HEX
antes de abrir el puerto. También respeta el espacio reservado para el
bootloader.

## Firmware base

[`arduino-example.ino`](arduino-example.ino) es la fuente del firmware base
incluido en el sitio. Emite frames JSON compatibles con CyberMorph a 115200
baudios, pero `readJoint()` devuelve valores neutros. Para un traje real se debe
reemplazar esa función con la lectura del modelo de IMU utilizado, compilar el
sketch y cargar el `.hex` resultante desde el mismo panel.

Compilación reproducible con Arduino CLI:

```powershell
arduino-cli core install arduino:avr
arduino-cli compile --fqbn arduino:avr:uno --output-dir build CyberMorphBase
```

El firmware que se instala desde la web se encuentra en
`apps/studio/public/firmware/cybermorph-atmega328p.hex`.
