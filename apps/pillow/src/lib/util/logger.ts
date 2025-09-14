export const log = (...a: any[]) => {
  if (process.env.NODE_ENV !== 'production') console.log('[MM]', ...a);
};
export const warn = (...a: any[]) => console.warn('[MM:warn]', ...a);
export const err = (...a: any[]) => console.error('[MM:error]', ...a);
