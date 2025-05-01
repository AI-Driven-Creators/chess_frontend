/**
 * BoardUI Component
 * 
 * Responsible for displaying the 3x8 game board with chess pieces.
 * Handles dragging pieces between board positions and from/to the bench.
 */

import { state, ChessPiece } from '../gameState.js';
import { dragDropManager, BoardPosition } from '../utils/dragDrop.js';

// Define the component attributes
interface BoardUIAttributes {
    cellTemplate: pc.Entity;
    pieceTemplate: pc.Entity;
    boardContainer: pc.Entity;
    boardWidth: number;
    boardHeight: number;
    cellSize: number;
}

/**
 * BoardUI component for PlayCanvas
 */
export class BoardUI extends pc.ScriptType {
    // Attributes
    public cellTemplate!: pc.Entity;
    public pieceTemplate!: pc.Entity;
    public boardContainer!: pc.Entity;
    public boardWidth: number = 8;
    public boardHeight: number = 3;
    public cellSize: number = 80;

    // Component properties
    private cells: pc.Entity[][] = [];
    private pieces: Map<string, pc.Entity> = new Map();
    private isDragging: boolean = false;
    private draggedPiece: ChessPiece | null = null;
    private draggedEntity: pc.Entity | null = null;
    private draggedPosition: [number, number] | null = null;
    private highlightedCell: pc.Entity | null = null;

    /**
     * Initialize the component
     */
    public initialize(): void {
        // Hide the templates
        this.cellTemplate.enabled = false;
        this.pieceTemplate.enabled = false;

        // Create the board grid
        this.createBoard();

        // Update the board display
        this.updateBoard(state.board);

        // Set up drag and drop
        this.setupDragDrop();

        // Listen for state changes
        this.app.on('state:board:updated', this.onBoardUpdated, this);
        this.app.on('state:merge:notice', this.onMergeNotice, this);
    }

    /**
     * Clean up the component
     */
    public destroy(): void {
        // Remove state change listeners
        this.app.off('state:board:updated', this.onBoardUpdated, this);
        this.app.off('state:merge:notice', this.onMergeNotice, this);

        // Destroy pieces
        this.pieces.forEach(piece => piece.destroy());
        this.pieces.clear();

        // Destroy cells
        this.cells.forEach(row => row.forEach(cell => cell.destroy()));
        this.cells = [];
    }

    /**
     * Creates the board grid
     */
    private createBoard(): void {
        // Initialize the cells array
        this.cells = Array(this.boardHeight).fill(null).map(() => Array(this.boardWidth).fill(null));

        // Calculate the total board dimensions
        const totalWidth = this.cellSize * this.boardWidth;
        const totalHeight = this.cellSize * this.boardHeight;
        const startX = -totalWidth / 2 + this.cellSize / 2;
        const startY = -totalHeight / 2 + this.cellSize / 2;

        // Create the cells
        for (let y = 0; y < this.boardHeight; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                const cell = this.cellTemplate.clone();
                cell.enabled = true;
                this.boardContainer.addChild(cell);

                // Position the cell
                cell.setLocalPosition(
                    startX + x * this.cellSize,
                    startY + y * this.cellSize,
                    0
                );

                // Set up cell properties
                const cellBg = cell.findByName('CellBackground');
                if (cellBg && cellBg.element) {
                    // Alternate cell colors for a checkerboard pattern
                    const isEven = (x + y) % 2 === 0;
                    cellBg.element.color = isEven
                        ? new pc.Color(0.8, 0.8, 0.8) // Light gray
                        : new pc.Color(0.6, 0.6, 0.6); // Dark gray
                }

                // Set up cell events
                cell.element!.on('mouseenter', () => this.onCellMouseEnter(x, y), this);
                cell.element!.on('mouseleave', () => this.onCellMouseLeave(x, y), this);
                cell.element!.on('mousedown', (event: any) => this.onCellMouseDown(x, y, event), this);
                cell.element!.on('mouseup', (event: any) => this.onCellMouseUp(x, y, event), this);

                // Store the cell
                this.cells[y][x] = cell;

                // Add coordinates as tags for easy reference
                cell.tags.add(`cell-x:${x}`);
                cell.tags.add(`cell-y:${y}`);
            }
        }
    }

    /**
     * Updates the board display
     * @param board The board pieces to display
     */
    private updateBoard(board: ChessPiece[]): void {
        // Track which pieces are still on the board
        const remainingPieceIds = new Set<string>();

        // Update or create pieces for each board piece
        board.forEach(chessPiece => {
            if (!chessPiece.position) {
                return; // Skip pieces without a position
            }

            const [x, y] = chessPiece.position;
            remainingPieceIds.add(chessPiece.id);

            // Check if the piece already exists
            if (this.pieces.has(chessPiece.id)) {
                // Update the existing piece
                const pieceEntity = this.pieces.get(chessPiece.id)!;
                this.updatePieceEntity(pieceEntity, chessPiece);

                // Move the piece to the correct position
                this.movePieceToCell(pieceEntity, x, y);
            } else {
                // Create a new piece
                this.createPieceEntity(chessPiece, x, y);
            }
        });

        // Remove pieces that are no longer on the board
        this.pieces.forEach((pieceEntity, pieceId) => {
            if (!remainingPieceIds.has(pieceId)) {
                pieceEntity.destroy();
                this.pieces.delete(pieceId);
            }
        });
    }

    /**
     * Creates a new piece entity
     * @param chessPiece The chess piece data
     * @param x The x coordinate
     * @param y The y coordinate
     */
    private createPieceEntity(chessPiece: ChessPiece, x: number, y: number): void {
        // Create a new piece entity
        const pieceEntity = this.pieceTemplate.clone();
        pieceEntity.enabled = true;

        // Update the piece content
        this.updatePieceEntity(pieceEntity, chessPiece);

        // Position the piece
        this.movePieceToCell(pieceEntity, x, y);

        // Add the piece to the board container
        this.boardContainer.addChild(pieceEntity);

        // Store the piece
        this.pieces.set(chessPiece.id, pieceEntity);
    }

    /**
     * Updates a piece entity with chess piece data
     * @param pieceEntity The piece entity to update
     * @param chessPiece The chess piece data
     */
    private updatePieceEntity(pieceEntity: pc.Entity, chessPiece: ChessPiece): void {
        // Update piece content
        const nameText = pieceEntity.findByName('NameText');
        if (nameText && nameText.element) {
            nameText.element.text = chessPiece.chess;
        }

        const levelText = pieceEntity.findByName('LevelText');
        if (levelText && levelText.element) {
            levelText.element.text = `★${chessPiece.level}`;
        }

        // Update piece background based on level
        const pieceBg = pieceEntity.findByName('PieceBackground');
        if (pieceBg && pieceBg.element) {
            // Set background color based on level
            const colors = [
                new pc.Color(0.7, 0.7, 0.7), // 1-star (gray)
                new pc.Color(0.2, 0.8, 0.2), // 2-star (green)
                new pc.Color(0.8, 0.8, 0.2)  // 3-star (gold)
            ];

            pieceBg.element.color = colors[chessPiece.level - 1] || colors[0];
        }

        // Update piece image
        const pieceImage = pieceEntity.findByName('ChessImage');
        if (pieceImage && pieceImage.element) {
            // Set the image based on the chess name
            // This is a placeholder, you would load actual textures
            // pieceImage.element.textureAsset = this.app.assets.find(`${chessPiece.chess}.png`);
        }

        // Update health bar if available
        if (chessPiece.hp !== undefined && chessPiece.maxHp !== undefined) {
            const healthBar = pieceEntity.findByName('HealthBar');
            if (healthBar && healthBar.element) {
                const healthPercent = chessPiece.hp / chessPiece.maxHp;
                healthBar.element.width = 70 * healthPercent; // Assuming the full width is 70
                
                // Color the health bar based on health percentage
                if (healthPercent > 0.7) {
                    healthBar.element.color = new pc.Color(0.2, 0.8, 0.2); // Green
                } else if (healthPercent > 0.3) {
                    healthBar.element.color = new pc.Color(0.8, 0.8, 0.2); // Yellow
                } else {
                    healthBar.element.color = new pc.Color(0.8, 0.2, 0.2); // Red
                }
            }
        }

        // Store the chess piece ID on the entity for reference
        pieceEntity.tags.add('chess-id:' + chessPiece.id);
    }

    /**
     * Moves a piece entity to a cell
     * @param pieceEntity The piece entity to move
     * @param x The x coordinate
     * @param y The y coordinate
     */
    private movePieceToCell(pieceEntity: pc.Entity, x: number, y: number): void {
        // Get the cell position
        const cell = this.cells[y][x];
        const cellPosition = cell.getLocalPosition();

        // Set the piece position
        pieceEntity.setLocalPosition(cellPosition.x, cellPosition.y, 1); // Z=1 to be above the cell
    }

    /**
     * Sets up drag and drop functionality
     */
    private setupDragDrop(): void {
        // Listen for mouse move events on the document
        this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
    }

    /**
     * Handles mouse enter on a cell
     * @param x The x coordinate
     * @param y The y coordinate
     */
    private onCellMouseEnter(x: number, y: number): void {
        // Highlight the cell if we're dragging
        if (this.isDragging) {
            const cell = this.cells[y][x];
            this.highlightCell(cell);
        }
    }

    /**
     * Handles mouse leave on a cell
     * @param x The x coordinate
     * @param y The y coordinate
     */
    private onCellMouseLeave(x: number, y: number): void {
        // Remove the highlight
        this.unhighlightCell();
    }

    /**
     * Handles mouse down on a cell
     * @param x The x coordinate
     * @param y The y coordinate
     * @param event The mouse event
     */
    private onCellMouseDown(x: number, y: number, event: any): void {
        // Find the chess piece at this position
        const chessPiece = state.board.find(piece => 
            piece.position && 
            piece.position[0] === x && 
            piece.position[1] === y
        );

        if (!chessPiece) {
            return;
        }

        // Start dragging
        this.isDragging = true;
        this.draggedPiece = chessPiece;
        this.draggedPosition = [x, y];
        this.draggedEntity = this.pieces.get(chessPiece.id) || null;

        // Start the drag operation in the drag drop manager
        dragDropManager.startDrag(chessPiece, { type: 'board', x, y });

        // Prevent default behavior
        event.stopPropagation();
        event.preventDefault();
    }

    /**
     * Handles mouse up on a cell
     * @param x The x coordinate
     * @param y The y coordinate
     * @param event The mouse event
     */
    private onCellMouseUp(x: number, y: number, event: any): void {
        if (!this.isDragging) {
            return;
        }

        // End the drag operation in the drag drop manager
        dragDropManager.endDrag({ type: 'board', x, y });

        // Reset dragging state
        this.resetDragState();

        // Prevent default behavior
        event.stopPropagation();
        event.preventDefault();
    }

    /**
     * Handles mouse move
     * @param event The mouse event
     */
    private onMouseMove(event: any): void {
        if (!this.isDragging || !this.draggedEntity) {
            return;
        }

        // Update the position of the dragged piece visual
        // This is a placeholder, you would update the position of the visual element

        // Update the drag operation in the drag drop manager
        dragDropManager.moveDrag(event.x, event.y);
    }

    /**
     * Highlights a cell
     * @param cell The cell to highlight
     */
    private highlightCell(cell: pc.Entity): void {
        // Remove any existing highlight
        this.unhighlightCell();

        // Highlight the new cell
        this.highlightedCell = cell;
        const cellBg = cell.findByName('CellBackground');
        if (cellBg && cellBg.element) {
            // Store the original color
            if (!cellBg.tags.has('original-color')) {
                const color = cellBg.element.color;
                cellBg.tags.add(`original-color:${color.r},${color.g},${color.b}`);
            }

            // Set the highlight color
            cellBg.element.color = new pc.Color(0.2, 0.6, 0.9); // Blue highlight
        }
    }

    /**
     * Removes the highlight from the currently highlighted cell
     */
    private unhighlightCell(): void {
        if (!this.highlightedCell) {
            return;
        }

        const cellBg = this.highlightedCell.findByName('CellBackground');
        if (cellBg && cellBg.element) {
            // Restore the original color
            const originalColorTag = cellBg.tags.list().find(tag => tag.startsWith('original-color:'));
            if (originalColorTag) {
                const [r, g, b] = originalColorTag.substring(15).split(',').map(Number);
                cellBg.element.color = new pc.Color(r, g, b);
                cellBg.tags.remove(originalColorTag);
            }
        }

        this.highlightedCell = null;
    }

    /**
     * Resets the dragging state
     */
    private resetDragState(): void {
        this.isDragging = false;
        this.draggedPiece = null;
        this.draggedPosition = null;
        this.draggedEntity = null;
        this.unhighlightCell();
    }

    /**
     * Handles board updates from the state
     * @param board The updated board pieces
     */
    private onBoardUpdated(board: ChessPiece[]): void {
        this.updateBoard(board);
    }

    /**
     * Handles merge notices from the state
     * @param mergeData The merge data
     */
    private onMergeNotice(mergeData: any): void {
        const { unitIds, newUnit } = mergeData;

        // Find the positions of the merged units
        const mergedPositions: [number, number][] = [];
        unitIds.forEach((unitId: string) => {
            const chessPiece = state.board.find(piece => piece.id === unitId);
            if (chessPiece && chessPiece.position) {
                mergedPositions.push(chessPiece.position);
            }
        });

        // Play merge animation
        this.playMergeAnimation(mergedPositions, newUnit);
    }

    /**
     * Plays a merge animation
     * @param positions The positions of the merged units
     * @param newUnit The new unit created by the merge
     */
    private playMergeAnimation(positions: [number, number][], newUnit: ChessPiece): void {
        // This is a placeholder for the merge animation
        // In a real implementation, you would create visual effects and animations

        // For now, we'll just log the merge
        console.log(`Merged units at positions ${JSON.stringify(positions)} into ${newUnit.chess} level ${newUnit.level}`);
    }

    /**
     * Gets the board position for a screen position
     * @param x The x coordinate
     * @param y The y coordinate
     * @returns The board position, or null if the position is not on the board
     */
    public getBoardPositionForScreenPosition(x: number, y: number): BoardPosition | null {
        const rect = this.boardContainer.element!.screenCorners;

        // Check if the position is within the board container
        if (
            x >= rect[0].x && x <= rect[2].x &&
            y >= rect[0].y && y <= rect[2].y
        ) {
            // Calculate the board coordinates
            const relativeX = x - rect[0].x;
            const relativeY = y - rect[0].y;
            const boardX = Math.floor(relativeX / this.cellSize);
            const boardY = Math.floor(relativeY / this.cellSize);

            if (
                boardX >= 0 && boardX < this.boardWidth &&
                boardY >= 0 && boardY < this.boardHeight
            ) {
                return { type: 'board', x: boardX, y: boardY };
            }
        }

        return null;
    }
}

// Register the script with PlayCanvas
pc.registerScript(BoardUI, 'boardUI');

// Define the component attributes
BoardUI.attributes!.add('cellTemplate', { type: 'entity' });
BoardUI.attributes!.add('pieceTemplate', { type: 'entity' });
BoardUI.attributes!.add('boardContainer', { type: 'entity' });
BoardUI.attributes!.add('boardWidth', { type: 'number', default: 8 });
BoardUI.attributes!.add('boardHeight', { type: 'number', default: 3 });
BoardUI.attributes!.add('cellSize', { type: 'number', default: 80 });