/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

const es = {
  "meta.title": "CyberMorph — El movimiento se convierte en sonido",
  "meta.description": "CyberMorph convierte el movimiento corporal en MIDI, sonido y loops.",
  "nav.how": "Cómo funciona",
  "nav.simulator": "Simulador",
  "nav.windows": "Windows",
  "hero.kicker": "INSTRUMENTO MUSICAL WEARABLE",
  "hero.line1": "Tu cuerpo",
  "hero.line2": "es la",
  "hero.emphasis": "interfaz.",
  "hero.description": "Convierte cada flexión, giro e impacto en MIDI, sonidos que evolucionan y loops vivos. Entrena el traje para que comprenda cómo te mueves.",
  "hero.launch": "Abrir simulador",
  "hero.download": "Descargar para Windows",
  "hero.build": "v0.1 preview · Windows 10/11 · código abierto",
  "hero.explore": "EXPLORAR",
  "hero.gesture": "GESTO",
  "process.eyebrow": "001 / FLUJO DE SEÑAL",
  "process.connect.title": "Conectar",
  "process.connect.text": "Transmití la orientación de las IMUs Arduino mediante USB serie.",
  "process.map.title": "Mapear",
  "process.map.text": "Convertí cualquier eje articular en MIDI, filtros, tono o loops.",
  "process.learn.title": "Aprender",
  "process.learn.text": "Grabá ejemplos y entrená el reconocimiento de gestos en el dispositivo.",
  "process.perform.title": "Interpretar",
  "process.perform.text": "Enrutá la señal a tu DAW y hacé audible el movimiento.",
  "studio.eyebrow": "002 / ESPACIO DE TRABAJO",
  "studio.title": "Laboratorio de movimiento",
  "studio.engine": "MOTOR 30 FPS",
  "source.sim": "SIM",
  "source.suit": "TRAJE",
  "serial.choose": "Elegir Arduino",
  "serial.disconnect": "Desconectar",
  "serial.desktopRequired": "La conexión Arduino requiere la app de escritorio",
  "serial.notConnected": "Sin conexión",
  "serial.connected": "Arduino conectado a 115200 baudios",
  "serial.disconnected": "Arduino desconectado",
  "midi.output": "Salida MIDI",
  "action.refresh": "Actualizar",
  "action.enable": "Activar",
  "audio.on": "Audio activo",
  "audio.start": "Iniciar audio",
  "avatar.eyebrow": "GEMELO DIGITAL",
  "avatar.reset": "Restablecer pose",
  "pose.neutral": "neutral",
  "pose.reach": "alcance",
  "pose.twist": "giro",
  "pose.crouch": "agachado",
  "pose.kick": "patada",
  "mapping.eyebrow": "MATRIZ DE ENRUTAMIENTO",
  "mapping.title": "Mapeos de movimiento",
  "mapping.add": "Agregar mapeo",
  "mapping.new": "Nuevo mapeo",
  "mapping.duplicate": "Duplicar",
  "mapping.delete": "Eliminar",
  "mapping.copy": "copia",
  "mapping.joint": "Articulación",
  "mapping.axis": "Eje",
  "mapping.function": "Función",
  "mapping.curve": "Curva",
  "mapping.inputMin": "Entrada mín.",
  "mapping.inputMax": "Entrada máx.",
  "mapping.outputMin": "Salida mín.",
  "mapping.outputMax": "Salida máx.",
  "mapping.ccNote": "CC / Nota",
  "mapping.channel": "Canal",
  "mapping.smooth": "Suavizado",
  "mapping.invert": "invertir",
  "mapping.default.leftElbow": "Codo izquierdo → filtro",
  "mapping.default.rightWrist": "Muñeca derecha → CC 1",
  "mapping.default.chest": "Giro del pecho → volumen",
  "target.midi_cc": "MIDI CC",
  "target.midi_note": "Nota MIDI",
  "target.filter": "Filtro",
  "target.volume": "Volumen",
  "target.pitch": "Tono",
  "target.loop": "Loop",
  "curve.linear": "Lineal",
  "curve.exponential": "Exponencial",
  "curve.logarithmic": "Logarítmica",
  "curve.s_curve": "Curva S",
  "dataset.eyebrow": "LABORATORIO DE CONDUCTAS",
  "dataset.title": "Aprendizaje de gestos",
  "dataset.waiting": "esperando",
  "dataset.captures": "capturas",
  "dataset.labels": "etiquetas",
  "dataset.frames": "frames",
  "dataset.behaviourLabel": "Etiqueta de conducta",
  "dataset.placeholder": "p. ej. golpe_brazo_izquierdo",
  "dataset.record": "Grabar ejemplo",
  "dataset.stop": "Detener grabación",
  "dataset.empty": "Grabá al menos dos ejemplos. Cinco por gesto mejora el resultado.",
  "dataset.retrain": "Reentrenar modelo",
  "dataset.train": "Entrenar modelo local",
  "dataset.examplesLoaded": "{{count}} ejemplos cargados",
  "dataset.knn": "K vecinos más cercanos · en el dispositivo",
  "dataset.import": "Importar",
  "footer.tagline": "Creado para cuerpos que se niegan a quedarse quietos.",
  "footer.source": "Código",
  "footer.simulator": "Simulador",
  "error.import": "No se pudo importar el dataset.",
  "error.serial": "No se pudo abrir la conexión con Arduino.",
  "error.audio": "No se pudo iniciar el audio en este navegador.",
  "error.training": "No se pudo entrenar el modelo.",
  "joint.head": "Cabeza",
  "joint.chest": "Pecho",
  "joint.left_shoulder": "Hombro izquierdo",
  "joint.left_elbow": "Codo izquierdo",
  "joint.left_wrist": "Muñeca izquierda",
  "joint.right_shoulder": "Hombro derecho",
  "joint.right_elbow": "Codo derecho",
  "joint.right_wrist": "Muñeca derecha",
  "joint.left_hip": "Cadera izquierda",
  "joint.left_knee": "Rodilla izquierda",
  "joint.left_ankle": "Tobillo izquierdo",
  "joint.right_hip": "Cadera derecha",
  "joint.right_knee": "Rodilla derecha",
  "joint.right_ankle": "Tobillo derecho"
} as const;

export type TranslationKey = keyof typeof es;

const en: Record<TranslationKey, string> = {
  "meta.title": "CyberMorph — Motion becomes sound",
  "meta.description": "CyberMorph turns body movement into MIDI, sound and loops.",
  "nav.how": "How it works",
  "nav.simulator": "Simulator",
  "nav.windows": "Windows",
  "hero.kicker": "WEARABLE MUSIC INSTRUMENT",
  "hero.line1": "Your body",
  "hero.line2": "is the",
  "hero.emphasis": "interface.",
  "hero.description": "Turn every bend, twist and impact into MIDI, evolving sound and living loops. Train the suit to understand the way you move.",
  "hero.launch": "Launch simulator",
  "hero.download": "Download for Windows",
  "hero.build": "v0.1 preview · Windows 10/11 · open source",
  "hero.explore": "EXPLORE",
  "hero.gesture": "GESTURE",
  "process.eyebrow": "001 / SIGNAL FLOW",
  "process.connect.title": "Connect",
  "process.connect.text": "Stream orientation from Arduino IMUs over USB serial.",
  "process.map.title": "Map",
  "process.map.text": "Shape any joint axis into MIDI, filters, pitch or loops.",
  "process.learn.title": "Learn",
  "process.learn.text": "Record examples and train gesture recognition on-device.",
  "process.perform.title": "Perform",
  "process.perform.text": "Route the signal into your DAW and make movement audible.",
  "studio.eyebrow": "002 / LIVE WORKSPACE",
  "studio.title": "Movement laboratory",
  "studio.engine": "ENGINE 30 FPS",
  "source.sim": "SIM",
  "source.suit": "SUIT",
  "serial.choose": "Choose Arduino",
  "serial.disconnect": "Disconnect",
  "serial.desktopRequired": "The desktop app is required for Arduino",
  "serial.notConnected": "Not connected",
  "serial.connected": "Arduino connected at 115200 baud",
  "serial.disconnected": "Arduino disconnected",
  "midi.output": "MIDI output",
  "action.refresh": "Refresh",
  "action.enable": "Enable",
  "audio.on": "Audio on",
  "audio.start": "Start audio",
  "avatar.eyebrow": "DIGITAL TWIN",
  "avatar.reset": "Reset pose",
  "pose.neutral": "neutral",
  "pose.reach": "reach",
  "pose.twist": "twist",
  "pose.crouch": "crouch",
  "pose.kick": "kick",
  "mapping.eyebrow": "ROUTING MATRIX",
  "mapping.title": "Motion mappings",
  "mapping.add": "Add mapping",
  "mapping.new": "New mapping",
  "mapping.duplicate": "Duplicate",
  "mapping.delete": "Delete",
  "mapping.copy": "copy",
  "mapping.joint": "Joint",
  "mapping.axis": "Axis",
  "mapping.function": "Function",
  "mapping.curve": "Curve",
  "mapping.inputMin": "Input min",
  "mapping.inputMax": "Input max",
  "mapping.outputMin": "Output min",
  "mapping.outputMax": "Output max",
  "mapping.ccNote": "CC / Note",
  "mapping.channel": "Channel",
  "mapping.smooth": "Smooth",
  "mapping.invert": "invert",
  "mapping.default.leftElbow": "Left elbow → filter",
  "mapping.default.rightWrist": "Right wrist → CC 1",
  "mapping.default.chest": "Chest twist → volume",
  "target.midi_cc": "MIDI CC",
  "target.midi_note": "MIDI note",
  "target.filter": "Filter",
  "target.volume": "Volume",
  "target.pitch": "Pitch",
  "target.loop": "Loop",
  "curve.linear": "Linear",
  "curve.exponential": "Exponential",
  "curve.logarithmic": "Logarithmic",
  "curve.s_curve": "S curve",
  "dataset.eyebrow": "BEHAVIOUR LAB",
  "dataset.title": "Gesture learning",
  "dataset.waiting": "waiting",
  "dataset.captures": "captures",
  "dataset.labels": "labels",
  "dataset.frames": "frames",
  "dataset.behaviourLabel": "Behaviour label",
  "dataset.placeholder": "e.g. left_arm_hit",
  "dataset.record": "Record sample",
  "dataset.stop": "Stop recording",
  "dataset.empty": "Record at least two examples. Five per gesture works better.",
  "dataset.retrain": "Retrain model",
  "dataset.train": "Train local model",
  "dataset.examplesLoaded": "{{count}} examples loaded",
  "dataset.knn": "K-nearest neighbours · on-device",
  "dataset.import": "Import",
  "footer.tagline": "Built for bodies that refuse to stand still.",
  "footer.source": "Source",
  "footer.simulator": "Simulator",
  "error.import": "Could not import the dataset.",
  "error.serial": "Could not open the Arduino connection.",
  "error.audio": "Audio could not be started in this browser.",
  "error.training": "The model could not be trained.",
  "joint.head": "Head",
  "joint.chest": "Chest",
  "joint.left_shoulder": "Left shoulder",
  "joint.left_elbow": "Left elbow",
  "joint.left_wrist": "Left wrist",
  "joint.right_shoulder": "Right shoulder",
  "joint.right_elbow": "Right elbow",
  "joint.right_wrist": "Right wrist",
  "joint.left_hip": "Left hip",
  "joint.left_knee": "Left knee",
  "joint.left_ankle": "Left ankle",
  "joint.right_hip": "Right hip",
  "joint.right_knee": "Right knee",
  "joint.right_ankle": "Right ankle"
};

export type Locale = "es" | "en";
type Variables = Record<string, string | number>;

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, variables?: Variables) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const requested = new URLSearchParams(window.location.search).get("lang");
    if (requested === "es" || requested === "en") return requested;
    return localStorage.getItem("cm.locale") === "en" ? "en" : "es";
  });

  const value = useMemo<I18nValue>(() => {
    const dictionary = locale === "es" ? es : en;
    return {
      locale,
      setLocale: (next) => {
        localStorage.setItem("cm.locale", next);
        setLocaleState(next);
      },
      t: (key, variables = {}) =>
        Object.entries(variables).reduce(
          (text, [name, replacement]) =>
            text.replaceAll(`{{${name}}}`, String(replacement)),
          dictionary[key]
        )
    };
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = value.t("meta.title");
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", value.t("meta.description"));
  }, [locale, value]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  return (
    <div className={`language-toggle ${compact ? "compact" : ""}`} aria-label="Language / Idioma">
      <button className={locale === "es" ? "active" : ""} onClick={() => setLocale("es")} aria-pressed={locale === "es"}>ES</button>
      <button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")} aria-pressed={locale === "en"}>EN</button>
    </div>
  );
}
