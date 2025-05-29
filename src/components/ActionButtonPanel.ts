/**
 * ActionButtonPanel Component
 * 
 * Displays action buttons like buying XP and shows the XP progress.
 * Handles button clicks and updates the display when the game state changes.
 */

import { state } from '../gameState.js';
import { sendBuyXP } from '../utils/apiHelpers.js';
import * as pc from 'playcanvas';
import { webSocketManager } from '../websocket.js';

// Define the component attributes
interface ActionButtonPanelAttributes {
    buyXPButton: pc.Entity;
    xpProgressBar: pc.Entity;
    xpText: pc.Entity;
    levelText: pc.Entity;
}

// Add type definitions for UI elements
interface UIElement extends pc.Entity {
    element: pc.ElementComponent;
}

/**
 * ActionButtonPanel component for PlayCanvas
 */
export class ActionButtonPanel extends pc.ScriptType {
    // Attributes
    public buyXPButton!: pc.Entity;
    public xpProgressBar!: pc.Entity;
    public xpText!: pc.Entity;
    public levelText!: pc.Entity;

    // Component properties
    private xpProgressBarWidth: number = 200; // Default width of the full XP bar

    /**
     * Initialize the component
     */
    public initialize(): void {
        console.log('ActionButtonPanel: 初始化開始');
        
        // 檢查按鈕元素是否存在
        if (!this.buyXPButton) {
            console.error('ActionButtonPanel: buyXPButton 未定義');
            return;
        }

        // 確保按鈕有 element 組件
        if (!this.buyXPButton.element) {
            console.error('ActionButtonPanel: buyXPButton 沒有 element 組件');
            return;
        }

        // 設置按鈕屬性
        this.buyXPButton.element.useInput = true;
        this.buyXPButton.element.enabled = true;

        // 設置按鈕點擊事件
        this.buyXPButton.element.on('click', () => {
            console.log('BuyXP 按鈕被點擊！ 準備發送 BuyXP 訊息...');
            webSocketManager.send('BuyXP', { playerId: state.playerId })
              .then(() => {
                console.log('BuyXP 訊息已送出！');
              })
              .catch(err => {
                console.error('BuyXP 發送失敗:', err);
              });
        });
        console.log('ActionButtonPanel: 按鈕點擊事件已設置');

        console.log('ActionButtonPanel: 按鈕狀態:', {
            exists: !!this.buyXPButton,
            hasElement: !!this.buyXPButton?.element,
            useInput: this.buyXPButton?.element?.useInput,
            enabled: this.buyXPButton?.element?.enabled,
            position: this.buyXPButton?.getLocalPosition(),
            children: this.buyXPButton?.children?.length
        });

        // 更新顯示
        this.updateXP(state.xp, state.level);

        // 監聽狀態變化
        this.app.on('state:xp:updated', this.onXPUpdated, this);
        this.app.on('state:level:updated', this.onLevelUpdated, this);

        console.log('ActionButtonPanel: 初始化完成');
    }

    /**
     * Clean up the component
     */
    public destroy(): void {
        // Remove button click handlers
        this.buyXPButton.element!.off('click');

        // Remove state change listeners
        this.app.off('state:xp:updated', this.onXPUpdated, this);
        this.app.off('state:level:updated', this.onLevelUpdated, this);
    }

    /**
     * Updates the XP display
     * @param xp The current XP values
     * @param level The current level
     */
    private updateXP(xp: { current: number; required: number }, level: number): void {
        console.log('ActionButtonPanel: 更新 UI 顯示:', { xp, level });

        // Update XP text
        if (this.xpText && this.xpText.element) {
            this.xpText.element.text = `${xp.current}/${xp.required} XP`;
            console.log('ActionButtonPanel: 經驗值文字已更新');
        }

        // Update level text
        if (this.levelText && this.levelText.element) {
            this.levelText.element.text = `Level ${level}`;
            console.log('ActionButtonPanel: 等級文字已更新');
        }

        // Update XP progress bar
        if (this.xpProgressBar && this.xpProgressBar.element) {
            const progressPercent = xp.current / xp.required;
            const progressWidth = this.xpProgressBarWidth * progressPercent;
            this.xpProgressBar.element.width = progressWidth;
            console.log('ActionButtonPanel: 進度條已更新:');


            // Update color based on progress
            if (progressPercent < 0.3) {
                this.xpProgressBar.element.color = new pc.Color(0.8, 0.2, 0.2); // Red
            } else if (progressPercent < 0.7) {
                this.xpProgressBar.element.color = new pc.Color(0.8, 0.8, 0.2); // Yellow
            } else {
                this.xpProgressBar.element.color = new pc.Color(0.2, 0.8, 0.2); // Green
            }
        }

        // Update button state based on money
        if (this.buyXPButton && this.buyXPButton.element) {
            // Assuming XP costs 4 gold
            const xpCost = 4;
            const canAfford = state.money >= xpCost;
            
            // Visual feedback for affordability
            const buttonBg = this.buyXPButton.findByName('ButtonBackground') as UIElement;
            if (buttonBg && buttonBg.element) {
                buttonBg.element.opacity = canAfford ? 1.0 : 0.5;
            }
            
            // Disable button if can't afford
            this.buyXPButton.element.useInput = canAfford;
        }
    }

    /**
     * Handles XP updates from the state
     * @param xp The updated XP values
     */
    private onXPUpdated(xp: { current: number; required: number }): void {
        this.updateXP(xp, state.level);
    }

    /**
     * Handles level updates from the state
     * @param level The updated level
     */
    private onLevelUpdated(level: number): void {
        this.updateXP(state.xp, level);
    }

    /**
     * Plays a level up animation
     */
    private playLevelUpAnimation(): void {
        // 創建等級提升動畫效果
        const levelUpEffect = new pc.Entity('LevelUpEffect');
        levelUpEffect.addComponent('element', {
            type: 'image',
            anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
            pivot: new pc.Vec2(0.5, 0.5),
            width: 300,
            height: 300,
            color: new pc.Color(1, 0.8, 0.2, 0.8),
            opacity: 0
        });
        
        // 添加到場景
        this.entity.addChild(levelUpEffect);
        
        // 使用 requestAnimationFrame 實現動畫
        let startTime = Date.now();
        const duration = 600; // 動畫持續時間（毫秒）
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 0.5) {
                // 淡入階段
                const opacity = progress * 2;
                if (levelUpEffect.element) {
                    levelUpEffect.element.opacity = opacity;
                }
            } else {
                // 淡出階段
                const opacity = (1 - progress) * 2;
                if (levelUpEffect.element) {
                    levelUpEffect.element.opacity = opacity;
                }
                
                // 更新等級文字
                if (this.levelText?.element) {
                    this.levelText.element.text = `Level ${state.level}`;
                    this.levelText.element.color = new pc.Color(1, 0.8, 0.2);
                    
                    // 文字縮放動畫
                    const scale = 1 + Math.sin(progress * Math.PI) * 0.5;
                    this.levelText.setLocalScale(scale, scale, 1);
                }
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 動畫結束，清理
                if (this.levelText?.element) {
                    this.levelText.element.color = new pc.Color(1, 1, 1);
                    this.levelText.setLocalScale(1, 1, 1);
                }
                levelUpEffect.destroy();
            }
        };
        
        // 開始動畫
        requestAnimationFrame(animate);
    }
}
