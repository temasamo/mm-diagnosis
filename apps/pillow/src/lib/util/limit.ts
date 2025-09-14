export function pLimit(concurrency: number) {
  const queue: Array<() => void> = [];
  let active = 0;
  const next = () => {
    active--;
    if (queue.length) queue.shift()?.();
  };
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    if (active >= concurrency) await new Promise<void>(r => queue.push(r));
    active++;
    try { return await fn(); }
    finally { next(); }
  };
}
