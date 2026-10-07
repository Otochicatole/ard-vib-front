import React from 'react';
import { Droplet, Wind, SunMedium, Power } from 'lucide-react';

interface ActuatorsPanelProps {
  waterPump: boolean | null | undefined;
  exhaustFan: boolean | null | undefined;
  growLight: boolean | null | undefined;
}

export const ActuatorsPanel: React.FC<ActuatorsPanelProps> = ({
  waterPump,
  exhaustFan,
  growLight,
}) => {
  const actuators = [
    {
      id: 'pump',
      name: 'Bomba de Riego',
      description: 'Sistema de irrigación por goteo',
      icon: Droplet,
      active: !!waterPump,
      activeClass: 'actuator-pump-on',
    },
    {
      id: 'fan',
      name: 'Extractor de Ventilación',
      description: 'Control de temperatura y renovación de aire',
      icon: Wind,
      active: !!exhaustFan,
      activeClass: 'actuator-fan-on',
    },
    {
      id: 'light',
      name: 'Luces de Crecimiento',
      description: 'Espectro fotoperiódico asistido',
      icon: SunMedium,
      active: !!growLight,
      activeClass: 'actuator-light-on',
    },
  ];

  const activeCount = actuators.filter((a) => a.active).length;

  return (
    <div className="actuators-card">
      <div className="card-header-clean">
        <div>
          <h2 className="card-title">Estado de Actuadores y Relés</h2>
          <p className="card-subtitle">
            Dispositivos electromecánicos reportados en tiempo real por el nodo
          </p>
        </div>
        <div className="card-badge">
          {activeCount} de {actuators.length} Activos
        </div>
      </div>

      <div className="actuators-grid">
        {actuators.map((act) => {
          const Icon = act.icon;
          return (
            <div
              key={act.id}
              className={`actuator-item ${
                act.active ? `actuator-active ${act.activeClass}` : 'actuator-inactive'
              }`}
            >
              <div className="actuator-icon-wrap">
                <Icon size={24} />
              </div>
              <div className="actuator-details">
                <h3 className="actuator-name">{act.name}</h3>
                <p className="actuator-desc">{act.description}</p>
              </div>
              <div className={`actuator-state-pill ${act.active ? 'pill-on' : 'pill-off'}`}>
                <Power size={13} />
                <span>{act.active ? 'ACTIVO' : 'INACTIVO'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
