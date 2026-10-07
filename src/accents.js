export const ACCENTS = [
  { id: 'lime', name: 'Lime', color: '#C8F04B', strong: '#B4DD32' },
  { id: 'sky', name: 'Sky', color: '#8FD8FF', strong: '#74C4F0' },
  { id: 'mint', name: 'Mint', color: '#7DECC0', strong: '#62D8AA' },
  { id: 'orange', name: 'Orange', color: '#FFA24D', strong: '#F28F33' },
  { id: 'pink', name: 'Pink', color: '#FF9EC4', strong: '#F28BB4' },
  { id: 'purple', name: 'Purple', color: '#B58CFF', strong: '#A074F5' },
  { id: 'yellow', name: 'Yellow', color: '#FFDF5C', strong: '#F2CC3D' },
  { id: 'red', name: 'Red', color: '#FF7F7F', strong: '#F26B6B' },
  { id: 'blue', name: 'Blue', color: '#86A8FF', strong: '#6F93F5' }
];

const STORAGE_KEY = 'accent';

export const loadAccentId = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return ACCENTS.some(accent => accent.id === saved) ? saved : ACCENTS[0].id;
  } catch {
    return ACCENTS[0].id;
  }
};

export const saveAccentId = (id) => {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch { }
};

export const applyAccent = (id) => {
  const { color, strong } = ACCENTS.find(accent => accent.id === id) ?? ACCENTS[0];
  const style = document.documentElement.style;
  style.setProperty('--color-accent', color);
  style.setProperty('--color-accent-strong', strong);
};
