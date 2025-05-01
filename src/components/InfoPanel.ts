/**
 * InfoPanel Component
 * 
 * Displays player information: money, XP, level, and synergies.
 * Updates automatically when the game state changes.
 */

import { state, Synergy } from '../gameState.js';

// Define the component attributes
interface InfoPanelAttributes {
    moneyText: pc.Entity;
    levelText: pc.Entity;
    xpText: pc.Entity;
    synergiesContainer: pc.Entity;
    synergyTemplate: pc.Entity;
}

/**
 * InfoPanel component for PlayCanvas
 */
export class InfoPanel extends pc.ScriptType {
    // Attributes
    public moneyText!: pc.Entity;
    public levelText!: pc.Entity;
    public xpText!: pc.Entity;
    public synergiesContainer!: pc.Entity;
    public synergyTemplate!: pc.Entity;

    // Component properties
    private synergies: pc.Entity[] = [];

    /**
     * Initialize the component
     */
    public initialize(): void {
        // Hide the synergy template
        this.synergyTemplate.enabled = false;

        // Update the display
        this.updateMoney(state.money);
        this.updateLevel(state.level);
        this.updateXP(state.xp);
        this.updateSynergies(state.synergies);

        // Listen for state changes
        this.app.on('state:money:updated', this.updateMoney, this);
        this.app.on('state:level:updated', this.updateLevel, this);
        this.app.on('state:xp:updated', this.updateXP, this);
        this.app.on('state:synergies:updated', this.updateSynergies, this);
    }

    /**
     * Clean up the component
     */
    public destroy(): void {
        // Remove state change listeners
        this.app.off('state:money:updated', this.updateMoney, this);
        this.app.off('state:level:updated', this.updateLevel, this);
        this.app.off('state:xp:updated', this.updateXP, this);
        this.app.off('state:synergies:updated', this.updateSynergies, this);

        // Destroy synergy entities
        this.synergies.forEach(synergy => synergy.destroy());
        this.synergies = [];
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
     * Updates the level display
     * @param level The current level
     */
    private updateLevel(level: number): void {
        if (this.levelText && this.levelText.element) {
            this.levelText.element.text = `Level ${level}`;
        }
    }

    /**
     * Updates the XP display
     * @param xp The current XP values
     */
    private updateXP(xp: { current: number; required: number }): void {
        if (this.xpText && this.xpText.element) {
            this.xpText.element.text = `XP: ${xp.current}/${xp.required}`;
        }
    }

    /**
     * Updates the synergies display
     * @param synergies The current synergies
     */
    private updateSynergies(synergies: Synergy[]): void {
        // Remove existing synergies
        this.synergies.forEach(synergy => synergy.destroy());
        this.synergies = [];

        // Create new synergies
        synergies.forEach((synergyData, index) => {
            const synergy = this.synergyTemplate.clone();
            synergy.enabled = true;
            this.synergiesContainer.addChild(synergy);

            // Position the synergy
            const synergyHeight = synergy.element!.height;
            const spacing = 5;
            synergy.setLocalPosition(0, -index * (synergyHeight + spacing), 0);

            // Update synergy content
            const nameText = synergy.findByName('NameText');
            if (nameText && nameText.element) {
                nameText.element.text = synergyData.name;
            }

            const countText = synergy.findByName('CountText');
            if (countText && countText.element) {
                countText.element.text = `${synergyData.count}`;
            }

            const bonusText = synergy.findByName('BonusText');
            if (bonusText && bonusText.element) {
                bonusText.element.text = `Lv${synergyData.bonusLevel}`;
            }

            // Update synergy color based on bonus level
            const synergyBg = synergy.findByName('SynergyBackground');
            if (synergyBg && synergyBg.element) {
                // Set background color based on bonus level
                const colors = [
                    new pc.Color(0.7, 0.7, 0.7), // Level 0 (gray, inactive)
                    new pc.Color(0.2, 0.8, 0.2), // Level 1 (green)
                    new pc.Color(0.2, 0.2, 0.8), // Level 2 (blue)
                    new pc.Color(0.8, 0.2, 0.8)  // Level 3 (purple)
                ];

                synergyBg.element.color = colors[synergyData.bonusLevel] || colors[0];
            }

            // Store the synergy
            this.synergies.push(synergy);
        });
    }
}

// Register the script with PlayCanvas
pc.registerScript(InfoPanel, 'infoPanel');

// Define the component attributes
InfoPanel.attributes!.add('moneyText', { type: 'entity' });
InfoPanel.attributes!.add('levelText', { type: 'entity' });
InfoPanel.attributes!.add('xpText', { type: 'entity' });
InfoPanel.attributes!.add('synergiesContainer', { type: 'entity' });
InfoPanel.attributes!.add('synergyTemplate', { type: 'entity' });