# Sensores, movimientos y cámara

## Configuración física del traje

La configuración inicial tiene cuatro IMUs:

| ID de datos | Ubicación inicial |
| --- | --- |
| `left_hand` | Muñeca/mano izquierda |
| `right_hand` | Muñeca/mano derecha |
| `left_foot` | Tobillo/pie izquierdo |
| `right_foot` | Tobillo/pie derecho |

El ID identifica el origen dentro del JSON de Arduino. La ubicación determina
dónde se dibuja el módulo en el avatar y qué parte del cuerpo representa. Desde
**Sensores IMU** se puede:

- activar o desactivar cada sensor sin perder su configuración;
- cambiar su nombre y ubicación corporal;
- agregar nuevas IMUs con un ID estable;
- eliminar sensores que ya no forman parte del traje.

Los mapeos seleccionan primero el sensor y luego uno de estos canales:
orientación `pitch/roll/yaw`, aceleración `accel_x/y/z` o velocidad angular
`gyro_x/y/z`. La aceleración se expresa normalmente en m/s² y el giroscopio en
grados por segundo, aunque los rangos de entrada son editables para adaptarse a
cada biblioteca y calibración.

## Simulación y movimientos

El simulador convierte la pose del avatar en lecturas virtuales de las IMUs
habilitadas. Calcula velocidad angular entre frames y una aceleración aproximada
para poder probar mapeos sin hardware. No pretende reemplazar una simulación
física: sirve para diseño MIDI y de sonido.

El secuenciador incluye cuatro movimientos originales, creados dentro del
proyecto y limitados por los rangos biomecánicos del avatar:

- Groove lateral.
- Pulso robot.
- Onda de mano.
- Paso con patada.

**Grabar esqueleto** toma unas 15 poses por segundo. La secuencia queda guardada
en el almacenamiento local del navegador o de la aplicación y se puede
reproducir, eliminar, exportar e importar como JSON. La grabación puede venir de
los controles manuales o de la referencia por cámara.

## Por qué se agregó la cámara

Cuatro IMUs en manos y pies no permiten reconstruir de forma única codos,
rodillas, hombros, cadera y torso. Una cámara frontal sí aporta una referencia
de cuerpo completo. CyberMorph usa MediaPipe Pose Landmarker, que estima 33
puntos y coordenadas tridimensionales a partir de imágenes o video.

La cámara resulta útil para:

- visualizar la intención del gesto completo;
- grabar movimientos del esqueleto sin agregar sensores;
- comparar lo que hacen manos y pies con la postura general.

Con el traje conectado no se usa como reemplazo de las IMUs para MIDI ni se
mezcla con su dataset. En modo SIM sí mueve el avatar y, por lo tanto, genera
lecturas en las IMUs virtuales para ensayar mapeos y modelos. Una sola cámara
estima profundidad y puede perder puntos por oclusión, iluminación, ropa o
salidas del encuadre. Para captura escénica precisa siguen siendo preferibles
más IMUs o un sistema multicámara.

La captura usa `MediaDevices.getUserMedia()`, requiere HTTPS o `localhost` y
siempre solicita permiso. Los frames se procesan en el dispositivo y no se
suben ni se guardan. Al apagar la función se detienen las pistas de cámara.

Referencias técnicas:

- [MediaPipe Pose Landmarker para Web](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js)
- [Especificación Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/)
