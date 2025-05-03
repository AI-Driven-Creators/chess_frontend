/**
 * BenchUI Component
 * 
 * Responsible for displaying the bench with up to 9 character cards.
 * Handles dragging characters to the board and selling characters.
 */

import { state, ChessPiece } from '../gameState.js';
import { sendSellChess } from '../utils/apiHelpers.js';
import { dragDropManager, BenchPosition } from '../utils/dragDrop.js';
import * as pc from 'playcanvas';

// Define the component attributes
interface BenchUIAttributes {
    cardTemplate: pc.Entity;
    cardContainer: pc.Entity;
    sellZone: pc.Entity;
    benchSize: number;
}

// Add type definitions for UI elements
interface UIElement extends pc.Entity {
    element: pc.ElementComponent;
}

/**
 * BenchUI component for PlayCanvas
 */
export class BenchUI extends pc.ScriptType {
    // Attributes
    public cardTemplate!: pc.Entity;
    public cardContainer!: pc.Entity;
    public sellZone!: pc.Entity;
    public benchSize: number = 9;

    // Component properties
    private cards: pc.Entity[] = [];
    private cardWidth: number = 0;
    private cardHeight: number = 0;
    private spacing: number = 10;
    private isDragging: boolean = false;
    private draggedCard: pc.Entity | null = null;
    private draggedPiece: ChessPiece | null = null;
    private draggedIndex: number = -1;
    private sellZoneHighlighted: boolean = false;

    /**
     * Initialize the component
     */
    public initialize(): void {
        // Hide the card template
        this.cardTemplate.enabled = false;

        // Get card dimensions
        this.cardWidth = this.cardTemplate.element!.width;
        this.cardHeight = this.cardTemplate.element!.height;

        // Create initial cards
        this.createCards();

        // Update the bench display
        this.updateBench(state.bench);

        // Set up drag and drop
        this.setupDragDrop();

        // Listen for state changes
        this.app.on('state:bench:updated', this.onBenchUpdated, this);
    }

    /**
     * Clean up the component
     */
    public destroy(): void {
        // Remove state change listeners
        this.app.off('state:bench:updated', this.onBenchUpdated, this);

        // Destroy cards
        this.cards.forEach(card => card.destroy());
        this.cards = [];
    }

    /**
     * Creates the bench cards
     */
    private createCards(): void {
        // Create cards for the bench
        for (let i = 0; i < this.benchSize; i++) {
            const card = this.cardTemplate.clone();
            card.enabled = false; // Start with all cards hidden
            this.cardContainer.addChild(card);
            
            // Position the card
            const totalWidth = (this.cardWidth + this.spacing) * this.benchSize - this.spacing;
            const startX = -totalWidth / 2 + this.cardWidth / 2;
            card.setLocalPosition(startX + i * (this.cardWidth + this.spacing), 0, 0);
            
            // Set up mouse events for drag and drop
            const cardElement = card.element!;
            
            cardElement.on('mousedown', (event: any) => this.onCardMouseDown(i, event), this);
            cardElement.on('mouseup', (event: any) => this.onCardMouseUp(i, event), this);
            cardElement.on('mouseleave', (event: any) => this.onCardMouseLeave(i, event), this);
            
            // Store the card
            this.cards.push(card);
        }
    }

    /**
     * Updates the bench display
     * @param bench The bench pieces to display
     */
    private updateBench(bench: ChessPiece[]): void {
        // Update each card
        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            const chessPiece = bench.find(piece => piece.benchIndex === i);
            
            if (chessPiece) {
                // Show the card and update its content
                card.enabled = true;
                
                // Update card content
                const nameText = card.findByName('NameText') as UIElement;
                if (nameText && nameText.element) {
                    nameText.element.text = chessPiece.chess;
                }
                
                const levelText = card.findByName('LevelText') as UIElement;
                if (levelText && levelText.element) {
                    levelText.element.text = `★${chessPiece.level}`;
                }
                
                // Update card background based on level
                const cardBg = card.findByName('CardBackground') as UIElement;
                if (cardBg && cardBg.element) {
                    // Set background color based on level
                    const colors = [
                        new pc.Color(0.7, 0.7, 0.7), // 1-star (gray)
                        new pc.Color(0.2, 0.8, 0.2), // 2-star (green)
                        new pc.Color(0.8, 0.8, 0.2)  // 3-star (gold)
                    ];
                    
                    cardBg.element.color = colors[chessPiece.level - 1] || colors[0];
                }
                
                // Update card image
                const cardImage = card.findByName('ChessImage') as UIElement;
                if (cardImage && cardImage.element) {
                    // Set the image based on the chess name
                    // This is a placeholder, you would load actual textures
                    // cardImage.element.textureAsset = this.app.assets.find(`${chessPiece.chess}.png`);
                }
                
                // Store the chess piece ID on the card for reference
                card.tags.add('chess-id:' + chessPiece.id);
            } else {
                // Hide the card if there's no chess piece
                card.enabled = false;
                
                // Remove any chess piece ID tag
                card.tags.list().forEach(tag => {
                    if (tag.startsWith('chess-id:')) {
                        card.tags.remove(tag);
                    }
                });
            }
        }
    }

    /**
     * Sets up drag and drop functionality
     */
    private setupDragDrop(): void {
        // Set up the sell zone
        this.sellZone.element!.on('mouseenter', this.onSellZoneEnter, this);
        this.sellZone.element!.on('mouseleave', this.onSellZoneLeave, this);
        
        // Listen for mouse move events on the document
        if (this.app.mouse) {
            this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
        }
    }

    /**
     * Handles mouse down on a card
     * @param index The index of the card
     * @param event The mouse event
     */
    private onCardMouseDown(index: number, event: any): void {
        const chessPiece = state.bench.find(piece => piece.benchIndex === index);
        if (!chessPiece) {
            return;
        }
        
        // Start dragging
        this.isDragging = true;
        this.draggedCard = this.cards[index];
        this.draggedPiece = chessPiece;
        this.draggedIndex = index;
        
        // Create a visual representation of the dragged card
        // This is a placeholder, you would create a visual element for dragging
        
        // Start the drag operation in the drag drop manager
        dragDropManager.startDrag(chessPiece, { type: 'bench', index });
        
        // Prevent default behavior
        event.stopPropagation();
        event.preventDefault();
    }

    /**
     * Handles mouse up on a card
     * @param index The index of the card
     * @param event The mouse event
     */
    private onCardMouseUp(index: number, event: any): void {
        if (!this.isDragging) {
            return;
        }
        
        // Check if we're over the sell zone
        if (this.sellZoneHighlighted && this.draggedPiece) {
            // Sell the chess piece
            sendSellChess(state.playerId, this.draggedPiece.id)
                .catch(error => console.error('Error selling chess piece:', error));
        } else {
            // End the drag operation in the drag drop manager
            // The target position will be determined by the board UI or other components
            dragDropManager.endDrag();
        }
        
        // Reset dragging state
        this.resetDragState();
        
        // Prevent default behavior
        event.stopPropagation();
        event.preventDefault();
    }

    /**
     * Handles mouse leave on a card
     * @param index The index of the card
     * @param event The mouse event
     */
    private onCardMouseLeave(index: number, event: any): void {
        // We don't reset dragging here, as we want to continue dragging
        // even when the mouse leaves the card
    }

    /**
     * Handles mouse move
     * @param event The mouse event
     */
    private onMouseMove(event: any): void {
        if (!this.isDragging || !this.draggedCard) {
            return;
        }
        
        // Update the position of the dragged card visual
        // This is a placeholder, you would update the position of the visual element
        
        // Update the drag operation in the drag drop manager
        dragDropManager.moveDrag(event.x, event.y);
    }

    /**
     * Handles mouse enter on the sell zone
     */
    private onSellZoneEnter(): void {
        if (this.isDragging) {
            this.sellZoneHighlighted = true;
            
            // Highlight the sell zone
            const sellZoneBg = this.sellZone.findByName('SellZoneBackground') as UIElement;
            if (sellZoneBg && sellZoneBg.element) {
                sellZoneBg.element.color = new pc.Color(0.8, 0.2, 0.2); // Red
            }
        }
    }

    /**
     * Handles mouse leave on the sell zone
     */
    private onSellZoneLeave(): void {
        this.sellZoneHighlighted = false;
        
        // Reset the sell zone highlight
        const sellZoneBg = this.sellZone.findByName('SellZoneBackground') as UIElement;
        if (sellZoneBg && sellZoneBg.element) {
            sellZoneBg.element.color = new pc.Color(0.5, 0.5, 0.5); // Gray
        }
    }

    /**
     * Resets the dragging state
     */
    private resetDragState(): void {
        this.isDragging = false;
        this.draggedCard = null;
        this.draggedPiece = null;
        this.draggedIndex = -1;
        this.sellZoneHighlighted = false;
        
        // Reset the sell zone highlight
        const sellZoneBg = this.sellZone.findByName('SellZoneBackground') as UIElement;
        if (sellZoneBg && sellZoneBg.element) {
            sellZoneBg.element.color = new pc.Color(0.5, 0.5, 0.5); // Gray
        }
    }

    /**
     * Handles bench updates from the state
     * @param bench The updated bench pieces
     */
    private onBenchUpdated(bench: ChessPiece[]): void {
        this.updateBench(bench);
    }

    /**
     * Gets the bench position for a screen position
     * @param x The x coordinate
     * @param y The y coordinate
     * @returns The bench position, or null if the position is not on the bench
     */
    public getBenchPositionForScreenPosition(x: number, y: number): BenchPosition | null {
        const rect = this.cardContainer.element!.screenCorners;
        
        // Check if the position is within the bench container
        if (
            x >= rect[0].x && x <= rect[2].x &&
            y >= rect[0].y && y <= rect[2].y
        ) {
            // Calculate the bench index
            const relativeX = x - rect[0].x;
            const cardWidth = this.cardWidth + this.spacing;
            const index = Math.floor(relativeX / cardWidth);
            
            if (index >= 0 && index < this.benchSize) {
                return { type: 'bench', index };
            }
        }
        
        return null;
    }
}

// Register the script with PlayCanvas
pc.registerScript(BenchUI, 'benchUI');

// Define the component attributes
BenchUI.attributes!.add('cardTemplate', { type: 'entity' });
BenchUI.attributes!.add('cardContainer', { type: 'entity' });
BenchUI.attributes!.add('sellZone', { type: 'entity' });
BenchUI.attributes!.add('benchSize', { type: 'number', default: 9 });