// Minimal ambient types for jsvectormap (the package ships no type definitions).
declare module 'jsvectormap' {
  interface JsVectorMapOptions {
    selector?: string | HTMLElement | Element | null;
    map?: string;
    [key: string]: unknown;
  }
  export default class jsVectorMap {
    constructor(options: JsVectorMapOptions);
    static addMap(name: string, data: unknown): void;
    destroy(): void;
    updateSize(): void;
    [key: string]: unknown;
  }
}

// World map data file — registers the "world" map on the global jsVectorMap.
declare module 'jsvectormap/dist/maps/world.js';
