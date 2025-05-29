/**
 * ShopUI Component
 * 
 * Responsible for displaying the shop with 5 character cards.
 * Handles buying chess pieces, refreshing the shop, and locking the shop.
 */

import { state, ShopItem } from '../gameState.js';
import { sendBuyChess, sendRefreshShop, sendLockShop } from '../utils/apiHelpers.js';
import { webSocketManager } from '../websocket.js';

import * as pc from 'playcanvas';

// Define the component attributes
interface ShopUIAttributes {
    cardTemplate: pc.Entity;
    refreshButton: pc.Entity;
    lockButton: pc.Entity;
    cardContainer: pc.Entity;
    moneyText: pc.Entity;
}

// Add type definitions for UI elements
interface UIElement extends pc.Entity {
    element: pc.ElementComponent;
}

/**
 * ShopUI component for PlayCanvas
 */
export class ShopUI extends pc.ScriptType {
    // Attributes
    public cardTemplate!: pc.Entity;
    public refreshButton!: pc.Entity;
    public lockButton!: pc.Entity;
    public cardContainer!: pc.Entity;
    public moneyText!: pc.Entity;

    // Component properties
    private cards: pc.Entity[] = [];
    private isLocked: boolean = false;

    /**
     * Initialize the component
     */
    public initialize(): void {
        // Set up event listeners
        this.refreshButton.element!.on('click', this.onRefreshClick, this);
        this.lockButton.element!.on('click', this.onLockClick, this);

        // Hide the card template
        this.cardTemplate.enabled = false;

        // Create initial cards
        this.createCards();

        // Update the shop display
        this.updateShop(state.shop);

        // Update money display
        this.updateMoney(state.money);

        // Update lock status
        this.updateLockStatus(state.shopLocked);

        // Listen for state changes
        this.app.on('state:shop:updated', this.onShopUpdated, this);
        this.app.on('state:money:updated', this.onMoneyUpdated, this);
        this.app.on('state:shop:locked', this.onShopLockUpdated, this);

        // Listen to WebSocket RefreshShopResult
        webSocketManager.on('RefreshShopResult', this.onRefreshShopResult);
    }

    /**
     * Clean up the component
     */
    public destroy(): void {
        // Remove event listeners
        this.refreshButton.element!.off('click', this.onRefreshClick, this);
        this.lockButton.element!.off('click', this.onLockClick, this);

        // Remove state change listeners
        this.app.off('state:shop:updated', this.onShopUpdated, this);
        this.app.off('state:money:updated', this.onMoneyUpdated, this);
        this.app.off('state:shop:locked', this.onShopLockUpdated, this);

        // Destroy cards
        this.cards.forEach(card => card.destroy());
        this.cards = [];

        webSocketManager.off('RefreshShopResult', this.onRefreshShopResult);
    }

    /**
     * Creates the shop cards
     */
    private createCards(): void {
        // Create 5 cards
        for (let i = 0; i < 5; i++) {
            const card = this.cardTemplate.clone();
            card.enabled = true;
            this.cardContainer.addChild(card);
            
            // Position the card
            const cardWidth = card.element!.width;
            const spacing = 10;
            const totalWidth = (cardWidth + spacing) * 5 - spacing;
            const startX = -totalWidth / 2 + cardWidth / 2;
            card.setLocalPosition(startX + i * (cardWidth + spacing), 0, 0);
            
            // Set up click event
            card.element!.on('click', () => this.onCardClick(i), this);
            
            // Store the card
            this.cards.push(card);
        }
    }

    /**
     * Updates the shop display
     * @param shop The shop items to display
     */
    private updateShop(shop: ShopItem[]): void {
        // Update each card
        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            const shopItem = shop[i];
            
            if (shopItem) {
                // Show the card and update its content
                card.enabled = true;
                
                // Update card content
                const nameText = card.findByName('NameText') as UIElement;
                if (nameText && nameText.element) {
                    nameText.element.text = shopItem.chess;
                }
                
                const levelText = card.findByName('LevelText') as UIElement;
                if (levelText && levelText.element) {
                    levelText.element.text = `★${shopItem.level}`;
                }
                
                // Set cost based on level (1-5 gold)
                const costText = card.findByName('CostText') as UIElement;
                if (costText && costText.element) {
                    costText.element.text = `${shopItem.level}G`;
                }
                
                // Update card background based on level
                const cardBg = card.findByName('CardBackground') as UIElement;
                if (cardBg && cardBg.element) {
                    // Set background color based on level
                    // This is just a placeholder, you would use actual textures
                    const colors = [
                        new pc.Color(0.7, 0.7, 0.7), // 1-cost (gray)
                        new pc.Color(0.2, 0.8, 0.2), // 2-cost (green)
                        new pc.Color(0.2, 0.2, 0.8), // 3-cost (blue)
                        new pc.Color(0.8, 0.2, 0.8), // 4-cost (purple)
                        new pc.Color(0.8, 0.8, 0.2)  // 5-cost (gold)
                    ];
                    
                    cardBg.element.color = colors[shopItem.level - 1] || colors[0];
                }
                
                // Update card image
                const cardImage = card.findByName('ChessImage') as UIElement;
                if (cardImage && cardImage.element) {
                    // Set the image based on the chess name
                    // This is a placeholder, you would load actual textures
                    // cardImage.element.textureAsset = this.app.assets.find(`${shopItem.chess}.png`);
                }
            } else {
                // Hide the card if there's no shop item
                card.enabled = false;
            }
        }
    }

    /**
     * Updates the money display
     * @param money The current money amount
     */
    private updateMoney(money: number): void {
        if (this.moneyText && this.moneyText.element) {
            this.moneyText.element.text = `${money}G`;
        }
    }

    /**
     * Updates the lock status display
     * @param locked Whether the shop is locked
     */
    private updateLockStatus(locked: boolean): void {
        this.isLocked = locked;
        
        // Update lock button appearance
        if (this.lockButton && this.lockButton.element) {
            // This is a placeholder, you would use actual textures
            const lockIcon = this.lockButton.findByName('LockIcon') as UIElement;
            if (lockIcon && lockIcon.element) {
                lockIcon.element.opacity = locked ? 1 : 0.5;
            }
            
            const lockText = this.lockButton.findByName('LockText') as UIElement;
            if (lockText && lockText.element) {
                lockText.element.text = locked ? 'Unlock' : 'Lock';
            }
        }
    }

    /**
     * Handles clicking on a shop card
     * @param index The index of the clicked card
     */
    private onCardClick(index: number): void {
        const shopItem = state.shop[index];
        if (!shopItem) {
            return;
        }
        
        // Buy the chess piece
        sendBuyChess(state.playerId, shopItem.chess)
            .catch(error => console.error('Error buying chess piece:', error));
    }

    /**
     * Handles clicking on the refresh button
     */
    private onRefreshClick(): void {
        if (!this.refreshButton || !this.refreshButton.element) return;
        this.refreshButton.element!.enabled = false;

        webSocketManager.send('RefreshShop', {
            playerId: state.playerId
        }).catch((err) => {
            console.error('發送 RefreshShop 失敗:', err);
            this.refreshButton.element!.enabled = true;
        });
    }

    private onRefreshShopResult = (payload: any) => {
        if (payload.playerId !== state.playerId) return;
        if (payload.success) {
            this.updateShop(payload.shop);
            this.updateMoney(payload.money);
            this.app.fire('state:money:updated', payload.money);
            this.app.fire('state:shop:updated', payload.shop);
        } else {
            console.error('刷新商店失敗');
        }
    }

    /**
     * Handles clicking on the lock button
     */
    private onLockClick(): void {
        // Toggle the lock status
        sendLockShop(state.playerId, !this.isLocked)
            .catch(error => console.error('Error locking shop:', error));
    }

    /**
     * Handles shop updates from the state
     * @param shop The updated shop items
     */
    private onShopUpdated(shop: ShopItem[]): void {
        this.updateShop(shop);
        // 重新啟用刷新按鈕
        if (this.refreshButton && this.refreshButton.element) {
            this.refreshButton.element.enabled = true;
        }
    }

    /**
     * Handles money updates from the state
     * @param money The updated money amount
     */
    private onMoneyUpdated(money: number): void {
        this.updateMoney(money);
    }

    /**
     * Handles shop lock updates from the state
     * @param locked Whether the shop is locked
     */
    private onShopLockUpdated(locked: boolean): void {
        this.updateLockStatus(locked);
    }
}
