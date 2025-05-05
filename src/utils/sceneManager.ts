/**
 * SceneManager
 * 
 * 管理遊戲的不同場景之間的切換，例如大廳場景和遊戲場景。
 */

import * as pc from 'playcanvas';

// 場景類型枚舉
export enum SceneType {
  LOBBY = 'lobby',
  GAME = 'game'
}

// 場景管理器類別
export class SceneManager {
  private app: pc.Application;
  private currentScene: SceneType | null = null;
  private sceneEntities: Map<SceneType, pc.Entity> = new Map();
  
  constructor(app: pc.Application) {
    this.app = app;
  }
  
  /**
   * 註冊一個場景
   * @param type 場景類型
   * @param entity 場景根實體
   */
  public registerScene(type: SceneType, entity: pc.Entity): void {
    this.sceneEntities.set(type, entity);
    
    // 初始時隱藏所有場景
    entity.enabled = false;
  }
  
  /**
   * 切換到指定場景
   * @param type 要切換到的場景類型
   */
  public switchToScene(type: SceneType): void {
    if (this.currentScene === type) {
      return;
    }
    
    // 隱藏當前場景
    if (this.currentScene !== null) {
      const currentEntity = this.sceneEntities.get(this.currentScene);
      if (currentEntity) {
        currentEntity.enabled = false;
      }
    }
    
    // 顯示新場景
    const newEntity = this.sceneEntities.get(type);
    if (!newEntity) {
      console.error(`場景 ${type} 未註冊`);
      return;
    }
    
    newEntity.enabled = true;
    this.currentScene = type;
  }
  
  /**
   * 獲取當前場景類型
   */
  public getCurrentScene(): SceneType | null {
    return this.currentScene;
  }

  public getSceneEntity(type: SceneType): pc.Entity | undefined {
    return this.sceneEntities.get(type);
  }
}

// 創建單例實例
let sceneManagerInstance: SceneManager | null = null;

/**
 * 初始化場景管理器
 * @param app PlayCanvas 應用實例
 */
export function initSceneManager(app: pc.Application): SceneManager {
  if (!sceneManagerInstance) {
    sceneManagerInstance = new SceneManager(app);
  }
  return sceneManagerInstance;
}

/**
 * 獲取場景管理器實例
 */
export function getSceneManager(): SceneManager {
  if (!sceneManagerInstance) {
    throw new Error('場景管理器未初始化。請先調用 initSceneManager。');
  }
  return sceneManagerInstance;
}
