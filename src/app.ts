/**
 * Main Application Entry Point
 * 
 * Initializes the PlayCanvas application and sets up the game components.
 */

import { webSocketManager } from './websocket.js';
import { state, updateState } from './gameState.js';
import { setupEventListeners, sendCreateGame } from './utils/apiHelpers.js';
import { setDragDropPlayerId } from './utils/dragDrop.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

/**
 * Initializes the PlayCanvas application
 */
function initializeApp(): void {
    // The PlayCanvas application is already created in index.html
    // This function will set up the WebSocket connection and event listeners
    
    // Hide the inline script from index.html and move it here
    // The UI components are already created in index.html
    
    // Set up WebSocket connection when ready
    setupWebSocket();
    
    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBarProgress = document.getElementById('loading-bar-progress');
    
    if (loadingScreen && loadingBarProgress) {
        // Simulate loading progress
        let progress = 0;
        const loadingInterval = setInterval(() => {
            progress += 5;
            loadingBarProgress.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(loadingInterval);
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 100);
    }
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