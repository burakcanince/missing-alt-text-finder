import { useState, useEffect, useLayoutEffect } from 'react';
import { ImageIcon, CopyIcon, CheckIcon, DownloadIcon, SettingsIcon } from './icons';
import { loadAccentId, saveAccentId, applyAccent } from './accents';
import Settings from './Settings';

function findImagesWithoutAlt() {
  const isVisible = (img) => {
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (width <= 1 || height <= 1) return false;

    const style = window.getComputedStyle(img);
    return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0;
  };

  const visibleImages = [...document.querySelectorAll('img')].filter(isVisible);

  const images = visibleImages
    .filter(img => !img.getAttribute('alt')?.trim())
    .map(img => ({
      src: img.currentSrc || img.src,
      kind: img.hasAttribute('alt') ? 'empty' : 'missing'
    }));

  return { images, scanned: visibleImages.length };
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'missing', label: 'No alt' },
  { key: 'empty', label: 'Empty alt' }
];

const splitSrc = (src) => {
  if (src.startsWith('data:')) {
    return { file: 'Inline image', path: '' };
  }
  try {
    const url = new URL(src);
    const parts = url.pathname.split('/');
    const file = decodeURIComponent(parts.pop() || url.hostname);
    return { file, path: parts.join('/') + '/' };
  } catch {
    return { file: src || 'Unknown source', path: '' };
  }
};

const downloadText = (text) => {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'missing-alt-text-images.txt';
  link.click();
  URL.revokeObjectURL(url);
};

const Thumb = ({ src }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="image-item__thumb">
      {failed ? <ImageIcon /> : <img src={src} alt="" onError={() => setFailed(true)} />}
    </div>
  );
};

const App = () => {
  const [host, setHost] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('main');
  const [accentId, setAccentId] = useState(loadAccentId);

  useLayoutEffect(() => {
    applyAccent(accentId);
  }, [accentId]);

  const selectAccent = (id) => {
    setAccentId(id);
    saveAccentId(id);
  };

  useEffect(() => {
    const scan = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        setHost(new URL(tab.url).hostname);
        const [{ result: scanResult }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: findImagesWithoutAlt
        });
        setResult(scanResult);
      } catch {
        setError('This page can’t be scanned. Open a website and try again.');
      }
    };

    scan();
  }, []);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    });
  };

  const scanning = !result && !error;
  const images = result?.images ?? [];
  const scannedCount = result?.scanned ?? 0;
  const total = images.length;
  const counts = {
    all: total,
    missing: images.filter(img => img.kind === 'missing').length,
    empty: images.filter(img => img.kind === 'empty').length
  };
  const okCount = scannedCount - total;
  const urlList = images.map(img => img.src).join('\n');
  const allClearText =
    scannedCount === 0 ? 'No visible images were found on this page.'
    : scannedCount === 1 ? 'The only image on this page has alt text.'
    : `All ${scannedCount} images on this page have alt text.`;

  const visibleImages = images
    .map((image, index) => ({ ...image, index }))
    .filter(image => filter === 'all' || image.kind === filter);

  if (view === 'settings') {
    return (
      <div className="popup">
        <Settings accentId={accentId} onSelectAccent={selectAccent} onBack={() => setView('main')} />
      </div>
    );
  }

  return (
    <div className="popup">
      <header className="header">
        <img className="header__logo" src="images/icon48.png" alt="" />
        <div className="header__info">
          <div className="header__title">Missing Alt Finder</div>
          {host && (
            <div className="header__site">
              <span className="header__site-dot" />
              <span className="header__site-name">{host}</span>
            </div>
          )}
        </div>
        <button className="header__action-btn" aria-label="Settings" onClick={() => setView('settings')}>
          <SettingsIcon />
        </button>
      </header>

      {scanning && (
        <div className="status">
          <div className="spinner" />
          <p className="status__text">Scanning images…</p>
        </div>
      )}

      {error && (
        <div className="status">
          <div className="status__error">{error}</div>
        </div>
      )}

      {result && total > 0 && (
        <>
          <section className="stats">
            <div className="stats__top">
              <div className="stats__heading">
                <div className="stats__label">Images need alt text</div>
                <div className="stats__total">{total}</div>
              </div>
              <div className="stats__scanned">of {scannedCount} scanned</div>
            </div>
            <div className="stats__bar">
              {counts.missing > 0 && <div className="stats__bar-segment stats__bar-segment--missing" style={{ flexGrow: counts.missing }} />}
              {counts.empty > 0 && <div className="stats__bar-segment stats__bar-segment--empty" style={{ flexGrow: counts.empty }} />}
              {okCount > 0 && <div className="stats__bar-segment stats__bar-segment--ok" style={{ flexGrow: okCount }} />}
            </div>
            <div className="stats__legend">
              <span className="stats__legend-item"><i className="stats__swatch stats__swatch--missing" />{counts.missing} no alt</span>
              <span className="stats__legend-item"><i className="stats__swatch stats__swatch--empty" />{counts.empty} empty alt</span>
              <span className="stats__legend-item"><i className="stats__swatch stats__swatch--ok" />{okCount} ok</span>
            </div>
          </section>

          <div className="filters">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                aria-pressed={filter === key}
                className={`filters__tab ${filter === key ? 'filters__tab--active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
                <span className="filters__count">{counts[key]}</span>
              </button>
            ))}
          </div>

          <ul className="image-list">
            {visibleImages.map(image => {
              const { file, path } = splitSrc(image.src);
              const copied = copiedKey === image.index;
              return (
                <li key={image.index} className="image-item">
                  <Thumb src={image.src} />
                  <div className="image-item__info">
                    <div className="image-item__name" title={image.src}>{file}</div>
                    <div className="image-item__meta">
                      {image.kind === 'empty'
                        ? <span className="badge badge--empty">ALT=""</span>
                        : <span className="badge badge--missing">NO ALT</span>}
                      <span className="image-item__path">{path}</span>
                    </div>
                  </div>
                  <button
                    className={`image-item__copy-btn ${copied ? 'is-copied' : ''}`}
                    aria-label={copied ? 'Copied' : 'Copy image URL'}
                    onClick={() => copy(image.src, image.index)}
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                  </button>
                </li>
              );
            })}
          </ul>

          <footer className="actions">
            <button className="btn btn--primary" onClick={() => downloadText(urlList)}>
              <DownloadIcon />
              Download list
              <span className="btn__file-ext">.txt</span>
            </button>
            <button
              className={`btn btn--icon ${copiedKey === 'all' ? 'is-copied' : ''}`}
              aria-label={copiedKey === 'all' ? 'Copied' : 'Copy all URLs'}
              onClick={() => copy(urlList, 'all')}
            >
              {copiedKey === 'all' ? <CheckIcon size={18} /> : <CopyIcon />}
            </button>
          </footer>
        </>
      )}

      {result && total === 0 && (
        <section className="all-clear">
          <div className="all-clear__ring" />
          <div className="all-clear__icon">
            <CheckIcon size={30} strokeWidth={2.6} />
          </div>
          <div className="all-clear__content">
            <div className="all-clear__title">Every image has alt text.</div>
            <div className="all-clear__text">{allClearText}</div>
          </div>
          <div className="all-clear__stats">
            <div className="all-clear__stat">
              <div className="all-clear__stat-label">Scanned</div>
              <div className="all-clear__stat-value">{scannedCount}</div>
            </div>
            <div className="all-clear__stat">
              <div className="all-clear__stat-label">Missing alt</div>
              <div className="all-clear__stat-value">0</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default App;
