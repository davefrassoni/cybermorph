import { Plus, RadioTower, Trash2 } from "lucide-react";
import {
  JOINT_IDS,
  type JointId,
  type SuitSensor
} from "@cybermorph/core";
import { useI18n, type TranslationKey } from "./i18n";

type Props = {
  sensors: SuitSensor[];
  onChange: (sensors: SuitSensor[]) => void;
};

const defaultNameKeys: Partial<Record<string, TranslationKey>> = {
  left_hand: "sensor.leftHand",
  right_hand: "sensor.rightHand",
  left_foot: "sensor.leftFoot",
  right_foot: "sensor.rightFoot"
};
const defaultNameVariants = new Set([
  "IMU mano izquierda",
  "IMU mano derecha",
  "IMU pie izquierdo",
  "IMU pie derecho",
  "Left hand IMU",
  "Right hand IMU",
  "Left foot IMU",
  "Right foot IMU"
]);

export function SensorManager({ sensors, onChange }: Props) {
  const { t } = useI18n();
  const patch = (id: string, changes: Partial<SuitSensor>) => {
    onChange(sensors.map((sensor) => sensor.id === id ? { ...sensor, ...changes } : sensor));
  };
  const add = () => {
    let index = sensors.length + 1;
    while (sensors.some((sensor) => sensor.id === `imu_${index}`)) index += 1;
    onChange([...sensors, {
      id: `imu_${index}`,
      name: `IMU ${index}`,
      enabled: true,
      location: "chest"
    }]);
  };
  return (
    <section className="panel sensor-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">{t("sensor.eyebrow")}</span><h2>{t("sensor.title")}</h2></div>
        <button className="icon-button" title={t("sensor.add")} onClick={add}><Plus size={18} /></button>
      </div>
      <p className="sensor-intro">{t("sensor.intro")}</p>
      <div className="sensor-list">
        {sensors.map((sensor) => (
          <article key={sensor.id} className={sensor.enabled ? "" : "muted"}>
            <label className="toggle">
              <input type="checkbox" checked={sensor.enabled} onChange={(event) => patch(sensor.id, { enabled: event.target.checked })} />
              <span />
            </label>
            <RadioTower size={16} />
            <div>
              <input
                value={
                  defaultNameKeys[sensor.id] && defaultNameVariants.has(sensor.name)
                    ? t(defaultNameKeys[sensor.id]!)
                    : sensor.name
                }
                aria-label={t("sensor.name")}
                onChange={(event) => patch(sensor.id, { name: event.target.value })}
              />
              <small>{sensor.id}</small>
            </div>
            <select
              aria-label={t("sensor.location")}
              value={sensor.location}
              onChange={(event) => patch(sensor.id, { location: event.target.value as JointId })}
            >
              {JOINT_IDS.map((joint) => (
                <option key={joint} value={joint}>{t(`joint.${joint}` as TranslationKey)}</option>
              ))}
            </select>
            <button
              className="ghost-icon danger"
              title={t("sensor.delete")}
              onClick={() => onChange(sensors.filter((item) => item.id !== sensor.id))}
            >
              <Trash2 size={14} />
            </button>
          </article>
        ))}
      </div>
      <div className="sensor-legend">
        <span><i /> {t("sensor.enabled", { count: sensors.filter((sensor) => sensor.enabled).length })}</span>
        <span>ACC XYZ + GYRO XYZ</span>
      </div>
    </section>
  );
}
