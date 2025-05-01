/**
 * API Helpers
 * 
 * Provides wrapper functions for WebSocket API calls.
 * Simplifies sending messages to the server.
 */

import { webSocketManager } from '../websocket.js';

/**
 * Creates a new game
 * @param playerId The player ID
 * @param seed The random seed (optional)
 */
export async function sendCreateGame(playerId: string, seed?: number): Promise<void> {
  await webSocketManager.send('CreateGame', {
    playerId,
    seed: seed || Math.floor(Math.random() * 1000)
  });
}

/**
 * Requests the current game state
 * @param gameId The game ID
 * @param playerId The player ID
 */
export async function sendGetGameState(gameId: string, playerId: string): Promise<void> {
  await webSocketManager.send('GetGameState', {
    gameId,
    playerId
  });
}

/**
 * Requests the list of chess pieces
 * @param playerId The player ID
 */
export async function sendListChess(playerId: string): Promise<void> {
  await webSocketManager.send('ListChess', {
    playerId
  });
}

/**
 * Refreshes the shop
 * @param playerId The player ID
 */
export async function sendRefreshShop(playerId: string): Promise<void> {
  await webSocketManager.send('RefreshShop', {
    playerId
  });
}

/**
 * Buys a chess piece from the shop
 * @param playerId The player ID
 * @param chessName The name of the chess piece to buy
 */
export async function sendBuyChess(playerId: string, chessName: string): Promise<void> {
  await webSocketManager.send('BuyChess', {
    playerId,
    chessName
  });
}

/**
 * Locks or unlocks the shop
 * @param playerId The player ID
 * @param locked Whether to lock the shop
 */
export async function sendLockShop(playerId: string, locked: boolean): Promise<void> {
  await webSocketManager.send('LockShop', {
    playerId,
    locked
  });
}

/**
 * Moves a chess piece
 * @param playerId The player ID
 * @param from The source position (either "bench-X" or [x, y])
 * @param to The target position (either "bench" or [x, y])
 */
export async function sendMoveChess(
  playerId: string, 
  from: string | [number, number], 
  to: string | [number, number]
): Promise<void> {
  await webSocketManager.send('MoveChess', {
    playerId,
    from,
    to
  });
}

/**
 * Sells a chess piece
 * @param playerId The player ID
 * @param unitId The ID of the chess piece to sell
 */
export async function sendSellChess(playerId: string, unitId: string): Promise<void> {
  await webSocketManager.send('SellChess', {
    playerId,
    unitId
  });
}

/**
 * Buys XP
 * @param playerId The player ID
 */
export async function sendBuyXP(playerId: string): Promise<void> {
  await webSocketManager.send('BuyXP', {
    playerId
  });
}

/**
 * Sets up event listeners for all game events
 * @param callbacks An object containing callback functions for each event type
 */
export function setupEventListeners(callbacks: {
  onCreateGameResult?: (payload: any) => void;
  onGetGameStateResult?: (payload: any) => void;
  onListChessResult?: (payload: any) => void;
  onRefreshShopResult?: (payload: any) => void;
  onBuyChessResult?: (payload: any) => void;
  onLockShopResult?: (payload: any) => void;
  onMoveChessResult?: (payload: any) => void;
  onSellChessResult?: (payload: any) => void;
  onBuyXPResult?: (payload: any) => void;
  onXPUpdatedNotice?: (payload: any) => void;
  onLevelUpNotice?: (payload: any) => void;
  onBattleNotice?: (payload: any) => void;
  onMergeNotice?: (payload: any) => void;
  onUnitMoved?: (payload: any) => void;
  onUnitAttacked?: (payload: any) => void;
  onDamageTaken?: (payload: any) => void;
  onAttackSpeedChanged?: (payload: any) => void;
  onSkillCasted?: (payload: any) => void;
  onUnitDied?: (payload: any) => void;
  onBattleEnded?: (payload: any) => void;
}): void {
  if (callbacks.onCreateGameResult) {
    webSocketManager.on('CreateGameResult', callbacks.onCreateGameResult);
  }
  
  if (callbacks.onGetGameStateResult) {
    webSocketManager.on('GetGameStateResult', callbacks.onGetGameStateResult);
  }
  
  if (callbacks.onListChessResult) {
    webSocketManager.on('ListChessResult', callbacks.onListChessResult);
  }
  
  if (callbacks.onRefreshShopResult) {
    webSocketManager.on('RefreshShopResult', callbacks.onRefreshShopResult);
  }
  
  if (callbacks.onBuyChessResult) {
    webSocketManager.on('BuyChessResult', callbacks.onBuyChessResult);
  }
  
  if (callbacks.onLockShopResult) {
    webSocketManager.on('LockShopResult', callbacks.onLockShopResult);
  }
  
  if (callbacks.onMoveChessResult) {
    webSocketManager.on('MoveChessResult', callbacks.onMoveChessResult);
  }
  
  if (callbacks.onSellChessResult) {
    webSocketManager.on('SellChessResult', callbacks.onSellChessResult);
  }
  
  if (callbacks.onBuyXPResult) {
    webSocketManager.on('BuyXPResult', callbacks.onBuyXPResult);
  }
  
  if (callbacks.onXPUpdatedNotice) {
    webSocketManager.on('XPUpdatedNotice', callbacks.onXPUpdatedNotice);
  }
  
  if (callbacks.onLevelUpNotice) {
    webSocketManager.on('LevelUpNotice', callbacks.onLevelUpNotice);
  }
  
  if (callbacks.onBattleNotice) {
    webSocketManager.on('BattleNotice', callbacks.onBattleNotice);
  }
  
  if (callbacks.onMergeNotice) {
    webSocketManager.on('MergeNotice', callbacks.onMergeNotice);
  }
  
  if (callbacks.onUnitMoved) {
    webSocketManager.on('UnitMoved', callbacks.onUnitMoved);
  }
  
  if (callbacks.onUnitAttacked) {
    webSocketManager.on('UnitAttacked', callbacks.onUnitAttacked);
  }
  
  if (callbacks.onDamageTaken) {
    webSocketManager.on('DamageTaken', callbacks.onDamageTaken);
  }
  
  if (callbacks.onAttackSpeedChanged) {
    webSocketManager.on('AttackSpeedChanged', callbacks.onAttackSpeedChanged);
  }
  
  if (callbacks.onSkillCasted) {
    webSocketManager.on('SkillCasted', callbacks.onSkillCasted);
  }
  
  if (callbacks.onUnitDied) {
    webSocketManager.on('UnitDied', callbacks.onUnitDied);
  }
  
  if (callbacks.onBattleEnded) {
    webSocketManager.on('BattleEnded', callbacks.onBattleEnded);
  }
}