/**
 * Drag and Drop Utility
 * 
 * Provides functionality for dragging and dropping chess pieces.
 * Handles bench ↔ board and board ↔ board interactions.
 */

import { ChessPiece } from '../gameState.js';
import { sendMoveChess } from './apiHelpers.js';

// Types for drag sources and targets
export type DragSource = 'bench' | 'board';
export type DropTarget = 'bench' | 'board';

// Position types
export type BenchPosition = { type: 'bench'; index: number };
export type BoardPosition = { type: 'board'; x: number; y: number };
export type Position = BenchPosition | BoardPosition;

// Drag event data
export interface DragEventData {
  chessPiece: ChessPiece;
  source: Position;
  target?: Position;
}

// Callback types
export type DragStartCallback = (data: DragEventData) => void;
export type DragMoveCallback = (data: DragEventData, x: number, y: number) => void;
export type DragEndCallback = (data: DragEventData, success: boolean) => void;
export type DropCallback = (data: DragEventData, success: boolean) => void;

export class DragDropManager {
  private playerId: string;
  private currentDrag: DragEventData | null = null;
  private dragStartCallbacks: DragStartCallback[] = [];
  private dragMoveCallbacks: DragMoveCallback[] = [];
  private dragEndCallbacks: DragEndCallback[] = [];
  private dropCallbacks: DropCallback[] = [];
  private boardWidth: number;
  private boardHeight: number;
  private benchSize: number;

  /**
   * Creates a new DragDropManager instance
   * @param playerId The player ID
   * @param boardWidth The width of the board (number of cells)
   * @param boardHeight The height of the board (number of cells)
   * @param benchSize The size of the bench (number of cells)
   */
  constructor(
    playerId: string,
    boardWidth: number = 8,
    boardHeight: number = 3,
    benchSize: number = 9
  ) {
    this.playerId = playerId;
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.benchSize = benchSize;
  }

  /**
   * Starts dragging a chess piece
   * @param chessPiece The chess piece to drag
   * @param source The source position
   */
  public startDrag(chessPiece: ChessPiece, source: Position): void {
    this.currentDrag = {
      chessPiece,
      source
    };

    this.dragStartCallbacks.forEach(callback => callback(this.currentDrag!));
  }

  /**
   * Updates the position of the dragged chess piece
   * @param x The x coordinate
   * @param y The y coordinate
   */
  public moveDrag(x: number, y: number): void {
    if (!this.currentDrag) {
      return;
    }

    this.dragMoveCallbacks.forEach(callback => callback(this.currentDrag!, x, y));
  }

  /**
   * Ends dragging a chess piece
   * @param target The target position
   */
  public endDrag(target?: Position): void {
    if (!this.currentDrag) {
      return;
    }

    if (target) {
      this.currentDrag.target = target;
      this.drop(this.currentDrag);
    } else {
      this.cancelDrag();
    }
  }

  /**
   * Cancels dragging a chess piece
   */
  public cancelDrag(): void {
    if (!this.currentDrag) {
      return;
    }

    const dragData = this.currentDrag;
    this.currentDrag = null;

    this.dragEndCallbacks.forEach(callback => callback(dragData, false));
  }

  /**
   * Drops a chess piece at the target position
   * @param dragData The drag event data
   */
  private async drop(dragData: DragEventData): Promise<void> {
    if (!dragData.target) {
      this.cancelDrag();
      return;
    }

    const { source, target } = dragData;
    let fromParam: string | [number, number];
    let toParam: string | [number, number];

    // Convert source position to API format
    if (source.type === 'bench') {
      fromParam = `bench-${source.index}`;
    } else {
      fromParam = [source.x, source.y];
    }

    // Convert target position to API format
    if (target.type === 'bench') {
      toParam = 'bench';
    } else {
      toParam = [target.x, target.y];
    }

    try {
      await sendMoveChess(this.playerId, fromParam, toParam);
      
      // The actual success will be determined by the server response,
      // but we'll trigger the callbacks here for immediate UI feedback
      this.dragEndCallbacks.forEach(callback => callback(dragData, true));
      this.dropCallbacks.forEach(callback => callback(dragData, true));
    } catch (error) {
      console.error('Error moving chess piece:', error);
      this.dragEndCallbacks.forEach(callback => callback(dragData, false));
      this.dropCallbacks.forEach(callback => callback(dragData, false));
    }

    this.currentDrag = null;
  }

  /**
   * Checks if a position is valid
   * @param position The position to check
   * @returns True if the position is valid, false otherwise
   */
  public isValidPosition(position: Position): boolean {
    if (position.type === 'bench') {
      return position.index >= 0 && position.index < this.benchSize;
    } else {
      return (
        position.x >= 0 &&
        position.x < this.boardWidth &&
        position.y >= 0 &&
        position.y < this.boardHeight
      );
    }
  }

  /**
   * Adds a callback for when a drag starts
   * @param callback The callback function
   */
  public onDragStart(callback: DragStartCallback): void {
    this.dragStartCallbacks.push(callback);
  }

  /**
   * Adds a callback for when a drag moves
   * @param callback The callback function
   */
  public onDragMove(callback: DragMoveCallback): void {
    this.dragMoveCallbacks.push(callback);
  }

  /**
   * Adds a callback for when a drag ends
   * @param callback The callback function
   */
  public onDragEnd(callback: DragEndCallback): void {
    this.dragEndCallbacks.push(callback);
  }

  /**
   * Adds a callback for when a drop occurs
   * @param callback The callback function
   */
  public onDrop(callback: DropCallback): void {
    this.dropCallbacks.push(callback);
  }

  /**
   * Converts screen coordinates to a board position
   * @param x The x coordinate
   * @param y The y coordinate
   * @param boardElement The board element
   * @param cellSize The size of each cell
   * @returns The board position, or null if the coordinates are outside the board
   */
  public screenToBoardPosition(
    x: number,
    y: number,
    boardElement: HTMLElement,
    cellSize: number
  ): BoardPosition | null {
    const rect = boardElement.getBoundingClientRect();
    const boardX = Math.floor((x - rect.left) / cellSize);
    const boardY = Math.floor((y - rect.top) / cellSize);

    if (
      boardX >= 0 &&
      boardX < this.boardWidth &&
      boardY >= 0 &&
      boardY < this.boardHeight
    ) {
      return { type: 'board', x: boardX, y: boardY };
    }

    return null;
  }

  /**
   * Converts screen coordinates to a bench position
   * @param x The x coordinate
   * @param y The y coordinate
   * @param benchElement The bench element
   * @param cellSize The size of each cell
   * @returns The bench position, or null if the coordinates are outside the bench
   */
  public screenToBenchPosition(
    x: number,
    y: number,
    benchElement: HTMLElement,
    cellSize: number
  ): BenchPosition | null {
    const rect = benchElement.getBoundingClientRect();
    const benchIndex = Math.floor((x - rect.left) / cellSize);

    if (benchIndex >= 0 && benchIndex < this.benchSize) {
      return { type: 'bench', index: benchIndex };
    }

    return null;
  }
}

// Create a singleton instance for global use
export const dragDropManager = new DragDropManager('');

/**
 * Sets the player ID for the drag drop manager
 * @param playerId The player ID
 */
export function setDragDropPlayerId(playerId: string): void {
  (dragDropManager as any).playerId = playerId;
}