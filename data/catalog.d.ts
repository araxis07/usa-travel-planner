declare module '*.json?overview' {
  const catalog: { states: unknown };
  export default catalog;
}
declare module '*.json?photos' {
  const photos: unknown;
  export default photos;
}
declare module 'virtual:state-details' {
  const loaders: Record<string, () => Promise<{ default: import('./state-details').StateDetails }>>;
  export default loaders;
}
