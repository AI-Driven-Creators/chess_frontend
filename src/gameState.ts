/**
 * GameState
 * 
 * Defines the game state data model and provides a singleton instance for global access.
 * Includes money, level, xp, shop, bench, board, synergies, etc.
 */
import * as pc from 'playcanvas';
declare const app: pc.Application;

// Type definitions for chess pieces and game state
export interface ChessPiece {
  id: string;
  chess: string;
  level: number;
  position?: [number, number]; // For board pieces
  benchIndex?: number; // For bench pieces
  hp?: number;
  maxHp?: number;
  mp?: number;
  maxMp?: number;
  attack?: number;
  attackSpeed?: number;
  synergies?: string[];
  status?: string[];
}

export interface ShopItem {
  chess: string;
  level: number;
}

export interface Synergy {
  name: string;
  count: number;
  bonusLevel: number;
}

export interface XP {
  current: number;
  required: number;
}

export interface GameState {
  gameId: string;
  playerId: string;
  round: number;
  money: number;
  level: number;
  xp: XP;
  shop: ShopItem[];
  bench: ChessPiece[];
  board: ChessPiece[];
  synergies: Synergy[];
  shopLocked: boolean;
  isInBattle: boolean;
}

// Initial game state
const initialState: GameState = {
  gameId: '',
  playerId: '',
  round: 1,
  money: 10,
  level: 1,
  xp: { current: 0, required: 2 },
  shop: [],
  bench: [],
  board: [],
  synergies: [],
  shopLocked: false,
  isInBattle: false
};

// Create a singleton state instance
export const state: GameState = { ...initialState };

/**
 * Resets the game state to its initial values
 */
export function resetState(): void {
  Object.assign(state, initialState);
}

// 定義事件回調函數的類型
type EventCallback = (data: any) => void;

// 創建一個事件發送器
const eventEmitter = {
  listeners: new Map<string, EventCallback[]>(),
  
  on(event: string, callback: EventCallback) {
      if (!this.listeners.has(event)) {
          this.listeners.set(event, []);
      }
      this.listeners.get(event)!.push(callback);
  },
  
  off(event: string, callback: EventCallback) {
      if (!this.listeners.has(event)) return;
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
          callbacks.splice(index, 1);
      }
  },
  
  fire(event: string, data: any) {
      if (!this.listeners.has(event)) return;
      this.listeners.get(event)!.forEach(callback => callback(data));
  }
};

/**
 * Updates the game state with new values
 * @param newState The new state values to merge
 */
export function updateState(newState: Partial<GameState>): void {
  const oldState = { ...state };
  Object.assign(state, newState);
  
  // 使用事件發送器觸發事件
  if (newState.xp && (newState.xp.current !== oldState.xp.current || newState.xp.required !== oldState.xp.required)) {
      eventEmitter.fire('state:xp:updated', newState.xp);
  }
  
  if (newState.level && newState.level !== oldState.level) {
      eventEmitter.fire('state:level:updated', newState.level);
  }
  
  if (newState.money !== undefined && newState.money !== oldState.money) {
      eventEmitter.fire('state:money:updated', newState.money);
  }
}

// 導出事件發送器
export { eventEmitter };

/**
 * Updates the shop with new items
 * @param shop The new shop items
 */
export function updateShop(shop: ShopItem[]): void {
  state.shop = shop;
}

/**
 * Updates the bench with new chess pieces
 * @param bench The new bench pieces
 */
export function updateBench(bench: ChessPiece[]): void {
  state.bench = bench;
}

/**
 * Updates the board with new chess pieces
 * @param board The new board pieces
 */
export function updateBoard(board: ChessPiece[]): void {
  state.board = board;
}

/**
 * Updates the player's money
 * @param money The new money amount
 */
export function updateMoney(money: number): void {
  state.money = money;
}

/**
 * Updates the player's XP and level
 * @param xp The new XP values
 * @param level The new level (optional)
 */
export function updateXP(xp: XP, level?: number): void {
  state.xp = xp;
  if (level !== undefined) {
    state.level = level;
  }
}

/**
 * Updates the shop lock status
 * @param locked Whether the shop is locked
 */
export function updateShopLock(locked: boolean): void {
  state.shopLocked = locked;
}

/**
 * Updates the battle status
 * @param isInBattle Whether the player is in battle
 */
export function updateBattleStatus(isInBattle: boolean): void {
  state.isInBattle = isInBattle;
}

/**
 * Updates the synergies
 * @param synergies The new synergies
 */
export function updateSynergies(synergies: Synergy[]): void {
  state.synergies = synergies;
}

/**
 * Finds a chess piece by ID
 * @param id The chess piece ID
 * @returns The chess piece, or undefined if not found
 */
export function findChessPieceById(id: string): ChessPiece | undefined {
  return [...state.board, ...state.bench].find(piece => piece.id === id);
}

/**
 * Finds a chess piece on the bench by index
 * @param index The bench index
 * @returns The chess piece, or undefined if not found
 */
export function findChessPieceByBenchIndex(index: number): ChessPiece | undefined {
  return state.bench.find(piece => piece.benchIndex === index);
}

/**
 * Finds a chess piece on the board by position
 * @param position The board position [x, y]
 * @returns The chess piece, or undefined if not found
 */
export function findChessPieceByPosition(position: [number, number]): ChessPiece | undefined {
  return state.board.find(piece => 
    piece.position && 
    piece.position[0] === position[0] && 
    piece.position[1] === position[1]
  );
}