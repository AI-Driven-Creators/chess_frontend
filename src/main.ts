/**
 * Main Application Entry Point
 * 
 * Initializes the PlayCanvas application and sets up the game components.
 */

import { webSocketManager } from './websocket.js';
import { state, updateState } from './gameState.js';
import { setupEventListeners, sendCreateGame } from './utils/apiHelpers.js';
import { setDragDropPlayerId } from './utils/dragDrop.js';
import * as pc from 'playcanvas';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

/**
 * Initializes the PlayCanvas application
 */
function initializeApp(): void {
    // Get canvas element
    const canvas = document.getElementById('application-canvas');
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
        throw new Error('Canvas element not found or is not a valid HTMLCanvasElement');
    }

    // Create PlayCanvas application
    const app = new pc.Application(canvas, {});
    app.keyboard = new pc.Keyboard(window);
    app.mouse = new pc.Mouse(canvas);
    app.touch = new pc.TouchDevice(canvas);
    
    // Set canvas to fill window
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    
    // Ensure canvas is resized when window changes size
    window.addEventListener('resize', function() {
        app.resizeCanvas();
    });
    
    // Set background color to dark gray
    app.scene.ambientLight = new pc.Color(0.5, 0.5, 0.5);
    
    // Create camera entity
    const camera = new pc.Entity('Camera');
    camera.addComponent('camera', {
        clearColor: new pc.Color(0.1, 0.1, 0.1)
    });
    camera.setPosition(0, 0, 10);
    app.root.addChild(camera);
    
    // Create light entity
    const light = new pc.Entity('Light');
    light.addComponent('light', {
        type: 'directional',
        color: new pc.Color(1, 1, 1),
        castShadows: true,
        intensity: 1.5
    });
    light.setEulerAngles(45, 0, 0);
    app.root.addChild(light);

    // Load Font
    const fntUrl = 'assets/fonts/chinese.json';
    app.assets.loadFromUrl(fntUrl, 'font', (err, fontAsset) => {
        if (err) {
            console.error('Failed to load chinese.json', err);
            return;
        }
        // Create UI root entity
        const uiRoot = new pc.Entity('UI Root');
        uiRoot.addComponent('screen', {
            referenceResolution: new pc.Vec2(1920, 1080),
            screenSpace: true
        });
        app.root.addChild(uiRoot);
        
        // Create UI containers
        // Create UI containers with visible borders and labels
        const shopContainer = new pc.Entity('Shop Container');
        shopContainer.addComponent('element', {
            type: 'image',
            anchor: new pc.Vec4(0.5, 0, 0.5, 0),
            pivot: new pc.Vec2(0.5, 0),
            width: 800,
            height: 150,
            margin: new pc.Vec4(0, 10, 0, 10),
            color: new pc.Color(0.2, 0.2, 0.2, 0.5),
            useInput: true
        });
        
        // Add label to shop container
        const shopLabel = new pc.Entity('Shop Label');
        shopLabel.addComponent('element', {
            type: 'text',
            anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
            pivot: new pc.Vec2(0.5, 0.5),
            width: 200,
            height: 50,
            fontSize: 24,
            color: new pc.Color(1, 1, 1),
            text: '商店 (Shop)',
            fontAsset: fontAsset,
            textAlign: 'center',
            autoWidth: false,
            autoHeight: false,
            enabled: true
        });

        shopContainer.addChild(shopLabel);
        uiRoot.addChild(shopContainer);
        
        const boardContainer = new pc.Entity('Board Container');
        boardContainer.addComponent('element', {
            type: 'image',
            anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
            pivot: new pc.Vec2(0.5, 0.5),
            width: 800,
            height: 400,
            color: new pc.Color(0.3, 0.3, 0.3, 0.5),
            useInput: true
        });
        
        // Add label to board container
        const boardLabel = new pc.Entity('Board Label');
        boardLabel.addComponent('element', {
            type: 'text',
            anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
            pivot: new pc.Vec2(0.5, 0.5),
            width: 200,
            height: 50,
            fontSize: 24,
            color: new pc.Color(1, 1, 1),
            text: '棋盤 (Board)',
            fontAsset: fontAsset,
            textAlign: 'center',
            autoWidth: false,
            autoHeight: false,
            enabled: true
        });
        boardContainer.addChild(boardLabel);
        uiRoot.addChild(boardContainer);
        
        const benchContainer = new pc.Entity('Bench Container');
        benchContainer.addComponent('element', {
            type: 'image',
            anchor: new pc.Vec4(0.5, 1, 0.5, 1),
            pivot: new pc.Vec2(0.5, 1),
            width: 800,
            height: 150,
            margin: new pc.Vec4(0, 10, 0, 10),
            color: new pc.Color(0.2, 0.2, 0.2, 0.5),
            useInput: true
        });
        
        // Add label to bench container
        const benchLabel = new pc.Entity('Bench Label');
        benchLabel.addComponent('element', {
            type: 'text',
            anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
            pivot: new pc.Vec2(0.5, 0.5),
            width: 200,
            height: 50,
            fontSize: 24,
            color: new pc.Color(1, 1, 1),
            text: '板凳 (Bench)',
            fontAsset: fontAsset,
            textAlign: 'center',
            autoWidth: false,
            autoHeight: false,
            enabled: true
        });
        benchContainer.addChild(benchLabel);
        uiRoot.addChild(benchContainer);
        
        const infoPanelContainer = new pc.Entity('Info Panel Container');
        infoPanelContainer.addComponent('element', {
            type: 'image',
            anchor: new pc.Vec4(0, 0, 0, 1),
            pivot: new pc.Vec2(0, 0.5),
            width: 250,
            height: 600,
            margin: new pc.Vec4(10, 0, 0, 0),
            color: new pc.Color(0.2, 0.2, 0.4, 0.5),
            useInput: true
        });
        
        // Add label to info panel container
        const infoPanelLabel = new pc.Entity('Info Panel Label');
        infoPanelLabel.addComponent('element', {
            type: 'text',
            anchor: new pc.Vec4(0.5, 0.9, 0.5, 0.9),
            pivot: new pc.Vec2(0.5, 0.5),
            width: 200,
            height: 50,
            fontSize: 20,
            color: new pc.Color(1, 1, 1),
            text: '資訊面板 (Info Panel)',
            fontAsset: fontAsset,
            textAlign: 'center',
            autoWidth: false,
            autoHeight: false,
            enabled: true
        });
        infoPanelContainer.addChild(infoPanelLabel);
        uiRoot.addChild(infoPanelContainer);
        
        const actionButtonContainer = new pc.Entity('Action Button Container');
        actionButtonContainer.addComponent('element', {
            type: 'image',
            anchor: new pc.Vec4(1, 0, 1, 1),
            pivot: new pc.Vec2(1, 0.5),
            width: 250,
            height: 600,
            margin: new pc.Vec4(0, 0, 10, 0),
            color: new pc.Color(0.4, 0.2, 0.2, 0.5),
            useInput: true
        });
        
        // Add label to action button container
        const actionButtonLabel = new pc.Entity('Action Button Label');
        actionButtonLabel.addComponent('element', {
            type: 'text',
            anchor: new pc.Vec4(0.5, 0.9, 0.5, 0.9),
            pivot: new pc.Vec2(0.5, 0.5),
            width: 200,
            height: 50,
            fontSize: 20,
            color: new pc.Color(1, 1, 1),
            text: '動作按鈕 (Action Buttons)',
            fontAsset: fontAsset,
            textAlign: 'center',
            autoWidth: false,
            autoHeight: false,
            enabled: true
        });
        actionButtonContainer.addChild(actionButtonLabel);
        uiRoot.addChild(actionButtonContainer);
        
        // Function to create templates with better visibility
        function createCardTemplate(name: string, width: number, height: number, color: pc.Color) {
            const template = new pc.Entity(name);
            template.addComponent('element', {
                type: 'image',
                width: width,
                height: height,
                color: color
            });
            
            // Add border to make the card more visible
            const border = new pc.Entity('Border');
            border.addComponent('element', {
                type: 'image',
                anchor: new pc.Vec4(0, 0, 1, 1),
                pivot: new pc.Vec2(0.5, 0.5),
                margin: new pc.Vec4(2, 2, 2, 2),
                color: new pc.Color(1, 1, 1, 0.8)
            });
            template.addChild(border);
            
            // Add card background inside the border
            const background = new pc.Entity('Background');
            background.addComponent('element', {
                type: 'image',
                anchor: new pc.Vec4(0, 0, 1, 1),
                pivot: new pc.Vec2(0.5, 0.5),
                margin: new pc.Vec4(4, 4, 4, 4),
                color: color
            });
            border.addChild(background);
            
            const nameText = new pc.Entity('NameText');
            nameText.addComponent('element', {
                type: 'text',
                width: width - 10,
                height: 30,
                anchor: new pc.Vec4(0.5, 0, 0.5, 0),
                pivot: new pc.Vec2(0.5, 0),
                fontSize: 16,
                color: new pc.Color(1, 1, 1),
                text: 'Chess Name',
                fontAsset: fontAsset,
                textAlign: 'center',
                autoWidth: false,
                autoHeight: false,
                enabled: true
            });
            template.addChild(nameText);
            
            const levelText = new pc.Entity('LevelText');
            levelText.addComponent('element', {
                type: 'text',
                width: width - 10,
                height: 20,
                anchor: new pc.Vec4(1, 0, 1, 0),
                pivot: new pc.Vec2(1, 0),
                fontSize: 14,
                color: new pc.Color(1, 1, 0),
                text: '★1',
                fontAsset: fontAsset,
                textAlign: 'right',
                autoWidth: false,
                autoHeight: false,
                enabled: true
            });
            template.addChild(levelText);
            
            return template;
        }
        
        // Create templates
        const shopCardTemplate = createCardTemplate('ShopCardTemplate', 120, 160, new pc.Color(0.3, 0.3, 0.3));
        shopCardTemplate.enabled = false;
        shopContainer.addChild(shopCardTemplate);
        
        const benchCardTemplate = createCardTemplate('BenchCardTemplate', 80, 120, new pc.Color(0.3, 0.3, 0.3));
        benchCardTemplate.enabled = false;
        benchContainer.addChild(benchCardTemplate);
        
        const boardCellTemplate = new pc.Entity('BoardCellTemplate');
        boardCellTemplate.addComponent('element', {
            type: 'image',
            width: 80,
            height: 80,
            color: new pc.Color(0.5, 0.5, 0.5)
        });
        
        // Add border to make the cell more visible
        const cellBorder = new pc.Entity('CellBorder');
        cellBorder.addComponent('element', {
            type: 'image',
            anchor: new pc.Vec4(0, 0, 1, 1),
            pivot: new pc.Vec2(0.5, 0.5),
            margin: new pc.Vec4(1, 1, 1, 1),
            color: new pc.Color(0.8, 0.8, 0.8, 0.5)
        });
        boardCellTemplate.addChild(cellBorder);
        
        // Add cell coordinates text
        const cellCoordinates = new pc.Entity('CellCoordinates');
        cellCoordinates.addComponent('element', {
            type: 'text',
            anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
            pivot: new pc.Vec2(0.5, 0.5),
            fontSize: 12,
            color: new pc.Color(1, 1, 1, 0.7),
            text: 'X,Y',
            fontAsset: fontAsset,
            textAlign: 'center',
            autoWidth: false,
            autoHeight: false,
            enabled: true
        });
        boardCellTemplate.addChild(cellCoordinates);
        
        boardCellTemplate.enabled = false;
        boardContainer.addChild(boardCellTemplate);
        
        const boardPieceTemplate = createCardTemplate('BoardPieceTemplate', 70, 70, new pc.Color(0.3, 0.6, 0.3));
        boardPieceTemplate.enabled = false;
        boardContainer.addChild(boardPieceTemplate);
        
        // Create UI components with visible elements
        
        // Create shop buttons and money text
        const refreshButton = new pc.Entity('RefreshButton');
        refreshButton.addComponent('element', {
            type: 'image',
            anchor: new pc.Vec4(0.1, 0.2, 0.1, 0.2),
            pivot: new pc.Vec2(0.5, 0.5),
            width: 100,
            height: 40,
            color: new pc.Color(0.2, 0.6, 0.2, 0.8)
        });
        
        const refreshText = new pc.Entity('RefreshText');
        refreshText.addComponent('element', {
            type: 'text',
            anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
            pivot: new pc.Vec2(0.5, 0.5),
            fontSize: 16,
            color: new pc.Color(1, 1, 1),
            text: '刷新 (2G)',
            fontAsset: fontAsset,
            textAlign: 'center',
            autoWidth: false,
            autoHeight: false,
            enabled: true
        });
        refreshButton.addChild(refreshText);
        shopContainer.addChild(refreshButton);
        
        const lockButton = new pc.Entity('LockButton');
        lockButton.addComponent('element', {
            type: 'image',
            anchor: new pc.Vec4(0.9, 0.2, 0.9, 0.2),
            pivot: new pc.Vec2(0.5, 0.5),
            width: 100,
            height: 40,
            color: new pc.Color(0.6, 0.2, 0.2, 0.8)
        });
        
        const lockText = new pc.Entity('LockText');
        lockText.addComponent('element', {
            type: 'text',
            anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
            pivot: new pc.Vec2(0.5, 0.5),
            fontSize: 16,
            color: new pc.Color(1, 1, 1),
            text: '鎖定',
            fontAsset: fontAsset,
            textAlign: 'center',
            autoWidth: false,
            autoHeight: false,
            enabled: true
        });
        lockButton.addChild(lockText);
        shopContainer.addChild(lockButton);
        
        const moneyText = new pc.Entity('MoneyText');
        moneyText.addComponent('element', {
            type: 'text',
            anchor: new pc.Vec4(0.5, 0.2, 0.5, 0.2),
            pivot: new pc.Vec2(0.5, 0.5),
            fontSize: 20,
            color: new pc.Color(1, 0.8, 0.2),
            text: '10G',
            fontAsset: fontAsset,
            textAlign: 'center',
            autoWidth: false,
            autoHeight: false,
            enabled: true
        });
        shopContainer.addChild(moneyText);
        
        // Create sell zone for bench
        const sellZone = new pc.Entity('SellZone');
        sellZone.addComponent('element', {
            type: 'image',
            anchor: new pc.Vec4(0.5, 0.3, 0.5, 0.3),
            pivot: new pc.Vec2(0.5, 0.5),
            width: 120,
            height: 40,
            color: new pc.Color(0.8, 0.2, 0.2, 0.6)
        });
        
        const sellZoneText = new pc.Entity('SellZoneText');
        sellZoneText.addComponent('element', {
            type: 'text',
            anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
            pivot: new pc.Vec2(0.5, 0.5),
            fontSize: 16,
            color: new pc.Color(1, 1, 1),
            text: '售出區域',
            fontAsset: fontAsset,
            textAlign: 'center',
            autoWidth: false,
            autoHeight: false,
            enabled: true
        });
        sellZone.addChild(sellZoneText);
        benchContainer.addChild(sellZone);
        
        // Create buy XP button for action panel
        const buyXPButton = new pc.Entity('BuyXPButton');
        buyXPButton.addComponent('element', {
            type: 'image',
            anchor: new pc.Vec4(0.5, 0.8, 0.5, 0.8),
            pivot: new pc.Vec2(0.5, 0.5),
            width: 150,
            height: 50,
            color: new pc.Color(0.2, 0.4, 0.8, 0.8)
        });
        
        const buyXPText = new pc.Entity('BuyXPText');
        buyXPText.addComponent('element', {
            type: 'text',
            anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
            pivot: new pc.Vec2(0.5, 0.5),
            fontSize: 18,
            color: new pc.Color(1, 1, 1),
            text: '購買 XP (4G)',
            fontAsset: fontAsset,
            textAlign: 'center',
            autoWidth: false,
            autoHeight: false,
            enabled: true
        });
        buyXPButton.addChild(buyXPText);
        actionButtonContainer.addChild(buyXPButton);
        
        // Create XP progress bar
        const xpProgressBarBg = new pc.Entity('XPProgressBarBg');
        xpProgressBarBg.addComponent('element', {
            type: 'image',
            anchor: new pc.Vec4(0.5, 0.7, 0.5, 0.7),
            pivot: new pc.Vec2(0.5, 0.5),
            width: 200,
            height: 20,
            color: new pc.Color(0.3, 0.3, 0.3, 0.8)
        });
        actionButtonContainer.addChild(xpProgressBarBg);
        
        const xpProgressBar = new pc.Entity('XPProgressBar');
        xpProgressBar.addComponent('element', {
            type: 'image',
            anchor: new pc.Vec4(0, 0, 0.5, 1),
            pivot: new pc.Vec2(0, 0.5),
            width: 200,
            height: 20,
            color: new pc.Color(0.2, 0.8, 0.2, 0.8)
        });
        xpProgressBarBg.addChild(xpProgressBar);
        
        const xpText = new pc.Entity('XPText');
        xpText.addComponent('element', {
            type: 'text',
            anchor: new pc.Vec4(0.5, 0.65, 0.5, 0.65),
            pivot: new pc.Vec2(0.5, 0.5),
            fontSize: 16,
            color: new pc.Color(1, 1, 1),
            text: '0/0 XP',
            fontAsset: fontAsset,
            textAlign: 'center',
            autoWidth: false,
            autoHeight: false,
            enabled: true
        });
        actionButtonContainer.addChild(xpText);
        
        const levelText = new pc.Entity('LevelText');
        levelText.addComponent('element', {
            type: 'text',
            anchor: new pc.Vec4(0.5, 0.6, 0.5, 0.6),
            pivot: new pc.Vec2(0.5, 0.5),
            fontSize: 20,
            color: new pc.Color(1, 0.8, 0.2),
            text: 'Level 1',
            fontAsset: fontAsset,
            textAlign: 'center',
            autoWidth: false,
            autoHeight: false,
            enabled: true
        });
        actionButtonContainer.addChild(levelText);
        
        // Create UI components with script components
        const shopUI = new pc.Entity('ShopUI');
        const shopScript = shopUI.addComponent('script');
        if (shopScript) {
            shopScript.enabled = true;
            (shopScript as any).attributes = {
                cardTemplate: shopCardTemplate,
                refreshButton: refreshButton,
                lockButton: lockButton,
                cardContainer: shopContainer,
                moneyText: moneyText
            };
        }
        
        const benchUI = new pc.Entity('BenchUI');
        const benchScript = benchUI.addComponent('script');
        if (benchScript) {
            benchScript.enabled = true;
            (benchScript as any).attributes = {
                cardTemplate: benchCardTemplate,
                cardContainer: benchContainer,
                sellZone: sellZone,
                benchSize: 9
            };
        }
        
        const boardUI = new pc.Entity('BoardUI');
        const boardScript = boardUI.addComponent('script');
        if (boardScript) {
            boardScript.enabled = true;
            (boardScript as any).attributes = {
                cellTemplate: boardCellTemplate,
                pieceTemplate: boardPieceTemplate,
                boardContainer: boardContainer,
                boardWidth: 8,
                boardHeight: 3,
                cellSize: 80
            };
        }
        
        // Create synergy template for info panel
        const synergyTemplate = new pc.Entity('SynergyTemplate');
        synergyTemplate.addComponent('element', {
            type: 'image',
            width: 200,
            height: 30,
            color: new pc.Color(0.3, 0.3, 0.6, 0.8)
        });
        
        const synergyNameText = new pc.Entity('NameText');
        synergyNameText.addComponent('element', {
            type: 'text',
            anchor: new pc.Vec4(0, 0, 0.7, 1),
            pivot: new pc.Vec2(0, 0.5),
            fontSize: 14,
            color: new pc.Color(1, 1, 1),
            text: '',
            fontAsset: fontAsset,
            textAlign: 'left',
            autoWidth: false,
            autoHeight: false,
            enabled: true
        });
        synergyTemplate.addChild(synergyNameText);
        
        const synergyCountText = new pc.Entity('CountText');
        synergyCountText.addComponent('element', {
            type: 'text',
            anchor: new pc.Vec4(0.7, 0, 0.85, 1),
            pivot: new pc.Vec2(0.5, 0.5),
            fontSize: 14,
            color: new pc.Color(1, 1, 0),
            text: '',
            fontAsset: fontAsset,
            textAlign: 'center',
            autoWidth: false,
            autoHeight: false,
            enabled: true
        });
        synergyTemplate.addChild(synergyCountText);
        
        const synergyBonusText = new pc.Entity('BonusText');
        synergyBonusText.addComponent('element', {
            type: 'text',
            anchor: new pc.Vec4(0.85, 0, 1, 1),
            pivot: new pc.Vec2(0.5, 0.5),
            fontSize: 14,
            color: new pc.Color(0, 1, 0),
            text: '',
            fontAsset: fontAsset,
            textAlign: 'center',
            autoWidth: false,
            autoHeight: false,
            enabled: true
        });
        synergyTemplate.addChild(synergyBonusText);
        
        synergyTemplate.enabled = false;
        infoPanelContainer.addChild(synergyTemplate);
        
        // Create info panel UI
        const infoPanel = new pc.Entity('InfoPanel');
        const infoScript = infoPanel.addComponent('script');
        if (infoScript) {
            infoScript.enabled = true;
            (infoScript as any).attributes = {
                moneyText: moneyText,
                levelText: levelText,
                xpText: xpText,
                synergiesContainer: infoPanelContainer,
                synergyTemplate: synergyTemplate
            };
        }
        
        // Create action button panel UI
        const actionButtonPanel = new pc.Entity('ActionButtonPanel');
        const actionScript = actionButtonPanel.addComponent('script');
        if (actionScript) {
            actionScript.enabled = true;
            (actionScript as any).attributes = {
                buyXPButton: buyXPButton,
                xpProgressBar: xpProgressBar,
                xpText: xpText,
                levelText: levelText
            };
        }

        // Start the application
        app.start();
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    });
}

/**
 * Sets up the WebSocket connection
 */
function setupWebSocket(): void {
    // In a real application, you would connect to a real WebSocket server
    // For now, we'll just simulate a connection
    
    console.log('Setting up WebSocket connection...');
    
    // Uncomment this to connect to a real WebSocket server
    /*
    webSocketManager.connect()
        .then(() => {
            console.log('Connected to server');
            
            // Set the player ID for drag and drop
            setDragDropPlayerId('p1');
            
            // Set up event listeners
            setupEventListeners({
                onGetGameStateResult: (payload) => {
                    if (payload.success) {
                        updateState(payload.state);
                    }
                },
                // Add more event handlers here
            });
            
            // Create a game
            sendCreateGame('p1', 42);
        })
        .catch(error => {
            console.error('Connection failed:', error);
        });
    */
    
    // For demo purposes, simulate a successful connection
    setTimeout(() => {
        console.log('Simulated connection successful');
        
        // Set the player ID for drag and drop
        setDragDropPlayerId('p1');
        
        // Simulate a game state
        simulateGameState();
    }, 1000);
}

/**
 * Simulates a game state for demo purposes
 */
function simulateGameState(): void {
    // Simulate a game state update
    const simulatedState = {
        gameId: 'game1',
        playerId: 'p1',
        round: 1,
        money: 10,
        level: 3,
        xp: { current: 2, required: 6 },
        shop: [
            { chess: 'Knight', level: 1 },
            { chess: 'Mage', level: 1 },
            { chess: 'Archer', level: 2 },
            { chess: 'Tank', level: 1 },
            { chess: 'Priest', level: 1 }
        ],
        bench: [
            { id: 'b1', chess: 'Knight', level: 1, benchIndex: 0 },
            { id: 'b2', chess: 'Mage', level: 1, benchIndex: 1 }
        ],
        board: [
            { id: 'p1', chess: 'Archer', level: 2, position: [2, 1] as [number, number] },
            { id: 'p2', chess: 'Tank', level: 1, position: [3, 1] as [number, number] }
        ],
        synergies: [
            { name: 'Warrior', count: 1, bonusLevel: 0 },
            { name: 'Mage', count: 1, bonusLevel: 0 }
        ],
        shopLocked: false,
        isInBattle: false
    };
    
    // Update the game state
    updateState(simulatedState);
    
    console.log('Simulated game state:', state);
}