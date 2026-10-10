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
declare module '*.json?copy' {
  const content: { copy: import('../lib/city-content').CityContent['copy'] };
  export default content;
}
declare module 'virtual:city-details' {
  const loaders: Record<string, () => Promise<{ default: import('../lib/city-content').City }>>;
  export default loaders;
}
