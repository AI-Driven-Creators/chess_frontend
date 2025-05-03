declare module 'playcanvas' {
    export class ScriptType {
        app: pc.Application;
        entity: pc.Entity;
        attributes: any;
    }

    export class Entity {
        enabled: boolean;
        element?: ElementComponent;
        tags: pc.Tags;
        findByName(name: string): pc.Entity;
        addChild(child: pc.Entity): void;
        setLocalPosition(x: number, y: number, z: number): void;
        destroy(): void;
    }

    export class ElementComponent {
        color: pc.Color;
        text: string;
        opacity: number;
        on(event: string, callback: Function, scope?: any): void;
    }

    export class Color {
        constructor(r: number, g: number, b: number, a?: number);
    }

    export class Tags {
        add(tag: string): void;
    }

    export class Application {
        mouse: Mouse;
        on(event: string, callback: Function, scope?: any): void;
        off(event: string, callback: Function, scope?: any): void;
    }

    export class Mouse {
        on(event: string, callback: Function, scope?: any): void;
    }

    export function registerScript(script: any, name: string): void;
} 