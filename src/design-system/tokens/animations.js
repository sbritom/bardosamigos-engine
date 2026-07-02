export const animations = Object.freeze({
  duration: {
    instant: '80ms',
    fast: '120ms',
    normal: '180ms',
    slow: '260ms',
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasized: 'cubic-bezier(0.2, 0, 0, 1.2)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
  },
  patterns: {
    hover: 'transform 180ms cubic-bezier(0.2, 0, 0, 1), border-color 180ms cubic-bezier(0.2, 0, 0, 1), box-shadow 180ms cubic-bezier(0.2, 0, 0, 1)',
    fade: 'opacity 180ms cubic-bezier(0.2, 0, 0, 1)',
    slide: 'transform 260ms cubic-bezier(0.2, 0, 0, 1), opacity 260ms cubic-bezier(0.2, 0, 0, 1)',
    focus: 'box-shadow 120ms cubic-bezier(0.2, 0, 0, 1)',
    loading: 'opacity 1200ms cubic-bezier(0.2, 0, 0, 1) infinite',
    skeleton: 'background-position 1200ms cubic-bezier(0.2, 0, 0, 1) infinite',
  },
  fast: '120ms cubic-bezier(0.2, 0, 0, 1)',
  normal: '180ms cubic-bezier(0.2, 0, 0, 1)',
  slow: '260ms cubic-bezier(0.2, 0, 0, 1)',
})
