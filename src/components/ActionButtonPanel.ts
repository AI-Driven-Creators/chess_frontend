/**
 * ActionButtonPanel Component
 * 
 * Displays action buttons like buying XP and shows the XP progress.
 * Handles button clicks and updates the display when the game state changes.
 */

import { state } from '../gameState.js';
import { sendBuyXP } from '../utils/apiHelpers.js';

// Define the component attributes
interface ActionButtonPanelAttributes {
    buyXPButton: pc.Entity;
    xpProgressBar: pc.Entity;
    xpText: pc.Entity;
    levelText: pc.Entity;
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
        // Set up button click handlers
        this.buyXPButton.element!.on('click', this.onBuyXPClick, this);

        // Get the full width of the XP progress bar
        if (this.xpProgressBar && this.xpProgressBar.element) {
            this.xpProgressBarWidth = this.xpProgressBar.element.width;
        }

        // Update the display
        this.updateXP(state.xp, state.level);

        // Listen for state changes
        this.app.on('state:xp:updated', this.onXPUpdated, this);
        this.app.on('state:level:updated', this.onLevelUpdated, this);
    }

    /**
     * Clean up the component
     */
    public destroy(): void {
        // Remove button click handlers
        this.buyXPButton.element!.off('click', this.onBuyXPClick, this);

        // Remove state change listeners
        this.app.off('state:xp:updated', this.onXPUpdated, this);
        this.app.off('state:level:updated', this.onLevelUpdated, this);
    }

    /**
     * Handles clicking on the Buy XP button
     */
    private onBuyXPClick(): void {
        // Buy XP
        sendBuyXP(state.playerId)
            .catch(error => console.error('Error buying XP:', error));
    }

    /**
     * Updates the XP display
     * @param xp The current XP values
     * @param level The current level
     */
    private updateXP(xp: { current: number; required: number }, level: number): void {
        // Update XP text
        if (this.xpText && this.xpText.element) {
            this.xpText.element.text = `${xp.current}/${xp.required} XP`;
        }

        // Update level text
        if (this.levelText && this.levelText.element) {
            this.levelText.element.text = `Level ${level}`;
        }

        // Update XP progress bar
        if (this.xpProgressBar && this.xpProgressBar.element) {
            const progressPercent = xp.current / xp.required;
            const progressWidth = this.xpProgressBarWidth * progressPercent;
            this.xpProgressBar.element.width = progressWidth;

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
            const buttonBg = this.buyXPButton.findByName('ButtonBackground');
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
        // This is a placeholder for the level up animation
        // In a real implementation, you would create visual effects and animations
        
        // For now, we'll just log the level up
        console.log(`Leveled up to ${state.level}!`);
        
        // You could add particle effects, screen flash, or other visual feedback here
    }
}

// Register the script with PlayCanvas
pc.registerScript(ActionButtonPanel, 'actionButtonPanel');

// Define the component attributes
ActionButtonPanel.attributes!.add('buyXPButton', { type: 'entity' });
ActionButtonPanel.attributes!.add('xpProgressBar', { type: 'entity' });
ActionButtonPanel.attributes!.add('xpText', { type: 'entity' });
ActionButtonPanel.attributes!.add('levelText', { type: 'entity' });