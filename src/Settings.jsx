import { ACCENTS } from './accents';
import { BackIcon, CheckIcon } from './icons';

const Settings = ({ accentId, onSelectAccent, onBack }) => (
  <>
    <header className="header">
      <button className="header__action-btn" aria-label="Back" onClick={onBack}>
        <BackIcon />
      </button>
      <div className="header__title">Settings</div>
    </header>

    <div className="settings">
      <section className="settings__section">
        <h2 className="settings__heading">Accent color</h2>
        <p className="settings__hint">Used for highlights, counters and the all-clear screen.</p>

        <div className="accent-grid">
          {ACCENTS.map(({ id, name, color }) => (
            <button
              key={id}
              className={`accent-option ${accentId === id ? 'accent-option--selected' : ''}`}
              aria-pressed={accentId === id}
              onClick={() => onSelectAccent(id)}
            >
              <span className="accent-option__swatch" style={{ background: color }}>
                {accentId === id && <CheckIcon size={16} strokeWidth={2.8} />}
              </span>
              {name}
            </button>
          ))}
        </div>
      </section>
    </div>
  </>
);

export default Settings;
