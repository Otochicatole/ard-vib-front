import React, { useState } from 'react';
import { X, Send, Sparkles, Cpu } from 'lucide-react';
import { sendTelemetry } from '../services/api';

interface SimulateModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  onSuccess: () => void;
}

export const SimulateModal: React.FC<SimulateModalProps> = ({
  isOpen,
  onClose,
  deviceId,
  onSuccess,
}) => {
  const [targetDevice, setTargetDevice] = useState(deviceId);
  const [temperature, setTemperature] = useState('24.2');
  const [humidity, setHumidity] = useState('68.5');
  const [soilMoisture, setSoilMoisture] = useState('54.0');
  const [light, setLight] = useState('950');
  const [co2, setCo2] = useState('420');
  const [waterPump, setWaterPump] = useState(false);
  const [exhaustFan, setExhaustFan] = useState(true);
  const [growLight, setGrowLight] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRandomize = () => {
    setTemperature((18 + Math.random() * 12).toFixed(1));
    setHumidity((50 + Math.random() * 35).toFixed(1));
    setSoilMoisture((40 + Math.random() * 40).toFixed(1));
    setLight(Math.round(200 + Math.random() * 1600).toString());
    setCo2(Math.round(380 + Math.random() * 300).toString());
    setWaterPump(Math.random() > 0.6);
    setExhaustFan(Math.random() > 0.5);
    setGrowLight(Math.random() > 0.7);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      await sendTelemetry({
        deviceId: targetDevice || deviceId,
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        soilMoisture: parseFloat(soilMoisture),
        light: parseFloat(light),
        co2: parseFloat(co2),
        waterPump,
        exhaustFan,
        growLight,
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Error al simular envío:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido al enviar telemetría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Cpu size={22} color="var(--color-primary)" />
            <h2 className="card-title">Simular Envío de Telemetría</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} title="Cerrar modal">
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label className="form-label">ID del Dispositivo Emisor</label>
            <input
              type="text"
              className="form-input"
              value={targetDevice}
              onChange={(e) => setTargetDevice(e.target.value)}
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Temperatura (°C)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Humedad Ambiente (%)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={humidity}
                onChange={(e) => setHumidity(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Humedad del Suelo (%)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={soilMoisture}
                onChange={(e) => setSoilMoisture(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Luminosidad (Lux)</label>
              <input
                type="number"
                className="form-input"
                value={light}
                onChange={(e) => setLight(e.target.value)}
                required
              />
            </div>

            <div className="form-field" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Dióxido de Carbono - CO₂ (ppm)</label>
              <input
                type="number"
                className="form-input"
                value={co2}
                onChange={(e) => setCo2(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-switches">
            <label className="switch-label">
              <input
                type="checkbox"
                checked={waterPump}
                onChange={(e) => setWaterPump(e.target.checked)}
              />
              <span>Bomba de Riego</span>
            </label>

            <label className="switch-label">
              <input
                type="checkbox"
                checked={exhaustFan}
                onChange={(e) => setExhaustFan(e.target.checked)}
              />
              <span>Extractor</span>
            </label>

            <label className="switch-label">
              <input
                type="checkbox"
                checked={growLight}
                onChange={(e) => setGrowLight(e.target.checked)}
              />
              <span>Luces Cultivo</span>
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRandomize}
              title="Generar valores aleatorios coherentes"
            >
              <Sparkles size={15} />
              <span>Generar Aleatorios</span>
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <Send size={15} />
              <span>{loading ? 'Enviando...' : 'Enviar al Backend'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
