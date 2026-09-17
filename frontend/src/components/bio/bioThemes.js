export const THEMES = {
  'minimal-light': {
    id: 'minimal-light',
    name: 'Minimal Light',
    bgStyle: {
      background: '#f8fafc',
      color: '#0f172a',
    },
    cardStyle: {
      background: '#ffffff',
      color: '#0f172a',
      border: '1px solid #e2e8f0',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
    },
    titleColor: '#0f172a',
    bioColor: '#64748b',
    buttonStyle: {
      background: '#f1f5f9',
      color: '#0f172a',
      border: '1px solid #cbd5e1',
    },
  },

  'dark-slate': {
    id: 'dark-slate',
    name: 'Dark Slate',
    bgStyle: {
      background: '#0f172a',
      color: '#f8fafc',
    },
    cardStyle: {
      background: 'rgba(30, 41, 59, 0.85)',
      color: '#f8fafc',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    },
    titleColor: '#38bdf8',
    bioColor: '#94a3b8',
    buttonStyle: {
      background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
    },
  },

  gradient: {
    id: 'gradient',
    name: 'Gradient',
    bgStyle: {
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)',
      color: '#ffffff',
    },
    cardStyle: {
      background: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(16px)',
      color: '#ffffff',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
    },
    titleColor: '#ffffff',
    bioColor: 'rgba(255, 255, 255, 0.85)',
    buttonStyle: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: '#ffffff',
      border: '1px solid rgba(255, 255, 255, 0.35)',
      backdropFilter: 'blur(8px)',
    },
  },
};

export const PLATFORM_CONFIG = {
  github: { name: 'GitHub', icon: '🐙', color: '#333' },
  linkedin: { name: 'LinkedIn', icon: '💼', color: '#0077b5' },
  instagram: { name: 'Instagram', icon: '📸', color: '#e4405f' },
  x: { name: 'X / Twitter', icon: '🐦', color: '#000000' },
  youtube: { name: 'YouTube', icon: '▶️', color: '#ff0000' },
  facebook: { name: 'Facebook', icon: '📘', color: '#1877f2' },
};
