/**
 * Type definitions for PlayCanvas
 * 
 * This file provides TypeScript type definitions for the PlayCanvas engine.
 * It's a simplified version that covers only what we need for this project.
 */

declare namespace pc {
  // Basic types
  class Color {
    constructor(r: number, g: number, b: number, a?: number);
    r: number;
    g: number;
    b: number;
    a: number;
  }

  class Vec2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
  }

  // Events
  const EVENT_MOUSEDOWN: string;
  const EVENT_MOUSEUP: string;
  const EVENT_MOUSEMOVE: string;
  const EVENT_MOUSEWHEEL: string;
  const EVENT_TOUCHSTART: string;
  const EVENT_TOUCHEND: string;
  const EVENT_TOUCHMOVE: string;
  const EVENT_TOUCHCANCEL: string;

  class Vec3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
  }

  class Quat {
    constructor(x?: number, y?: number, z?: number, w?: number);
    x: number;
    y: number;
    z: number;
    w: number;
  }

  // Asset system
  class Asset {
    id: number;
    name: string;
    type: string;
    tags: string[];
    resource: any;
  }

  class AssetRegistry {
    find(name: string, type?: string): Asset | null;
    findAll(name: string, type?: string): Asset[];
    get(id: number): Asset | null;
    load(assets: Asset | Asset[]): void;
  }

  // Entity system
  class Entity {
    name: string;
    tags: {
      add(tag: string): void;
      remove(tag: string): void;
      has(tag: string): boolean;
      list(): string[];
    };
    enabled: boolean;
    parent: Entity | null;
    children: Entity[];
    element?: ElementComponent;
    script?: ScriptComponent;
    
    getLocalPosition(): Vec3;
    getLocalEulerAngles(): Vec3;
    getLocalScale(): Vec3;
    getPosition(): Vec3;
    getEulerAngles(): Vec3;
    getScale(): Vec3;
    
    addComponent(type: string, data?: any): any;
    findByName(name: string): Entity | null;
    findByTag(tag: string): Entity[];
    findComponents(type: string): any[];
    destroy(): void;
    clone(): Entity;
    setLocalPosition(x: number, y: number, z: number): void;
    setLocalEulerAngles(x: number, y: number, z: number): void;
    setLocalScale(x: number, y: number, z: number): void;
    addChild(child: Entity): void;
    removeChild(child: Entity): void;
  }

  // Components
  class ElementComponent {
    type: string;
    width: number;
    height: number;
    color: Color;
    opacity: number;
    text: string;
    fontSize: number;
    fontAsset: Asset | number;
    textureAsset: Asset | number;
    screenCorners: Vec3[];
    useInput: boolean;
    
    on(event: string, callback: Function, scope?: any): void;
    off(event: string, callback: Function, scope?: any): void;
    fire(event: string, arg1?: any, arg2?: any, arg3?: any, arg4?: any): void;
  }

  class ScriptComponent {
    create(name: string, args?: any): any;
    destroy(name: string): void;
  }

  // Application
  class Application {
    assets: AssetRegistry;
    root: Entity;
    scenes: SceneRegistry;
    mouse: {
      on(event: string, callback: Function, scope?: any): void;
      off(event: string, callback: Function, scope?: any): void;
    };
    touch: {
      on(event: string, callback: Function, scope?: any): void;
      off(event: string, callback: Function, scope?: any): void;
    };
    
    start(): void;
    update(dt: number): void;
    on(event: string, callback: Function, scope?: any): void;
    off(event: string, callback: Function, scope?: any): void;
    fire(event: string, arg1?: any, arg2?: any, arg3?: any, arg4?: any): void;
  }

  class SceneRegistry {
    loadScene(url: string, callback: Function): void;
    loadSceneHierarchy(url: string, callback: Function): void;
  }

  // Script system
  class ScriptType {
    app: Application;
    entity: Entity;
    enabled: boolean;
    
    initialize?(): void;
    postInitialize?(): void;
    update?(dt: number): void;
    postUpdate?(dt: number): void;
    destroy?(): void;
  }

  // Static functions
  function registerScript(script: Function, name: string): void;
}

// Add ScriptType static properties
interface ScriptTypeConstructor {
  new(): pc.ScriptType;
  attributes: {
    add(name: string, options: any): void;
  };
}

// Extend the ScriptType constructor
declare interface Function {
  attributes?: {
    add(name: string, options: any): void;
  };
}