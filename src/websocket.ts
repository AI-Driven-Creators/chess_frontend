/**
 * WebSocketManager
 * 
 * Handles WebSocket connections and provides methods to send and receive messages.
 * Automatically converts messages to/from JSON according to the GAME_API.md format.
 */

type MessageCallback = (payload: any) => void;

export class WebSocketManager {
  private socket: WebSocket | null = null;
  private eventListeners: Map<string, MessageCallback[]> = new Map();
  private url: string;
  private autoReconnect: boolean;
  private reconnectInterval: number;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number;

  /**
   * Creates a new WebSocketManager instance
   * @param url The WebSocket server URL
   * @param autoReconnect Whether to automatically reconnect on disconnect
   * @param reconnectInterval The interval between reconnect attempts (ms)
   * @param maxReconnectAttempts The maximum number of reconnect attempts
   */
  constructor(
    url: string,
    autoReconnect: boolean = true,
    reconnectInterval: number = 3000,
    maxReconnectAttempts: number = 5
  ) {
    this.url = url;
    this.autoReconnect = autoReconnect;
    this.reconnectInterval = reconnectInterval;
    this.maxReconnectAttempts = maxReconnectAttempts;
  }

  /**
   * Connects to the WebSocket server
   * @returns A promise that resolves when the connection is established
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          console.log('WebSocket connection established');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const { type, payload } = message;
            
            if (type && this.eventListeners.has(type)) {
              const callbacks = this.eventListeners.get(type) || [];
              callbacks.forEach(callback => callback(payload));
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onclose = (event) => {
          console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
          this.socket = null;

          if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`Attempting to reconnect in ${this.reconnectInterval}ms...`);
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), this.reconnectInterval);
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnects from the WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Sends a message to the WebSocket server
   * @param type The message type
   * @param payload The message payload
   * @returns A promise that resolves when the message is sent
   */
  public send(type: string, payload: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      try {
        const message = JSON.stringify({ type, payload });
        this.socket.send(message);
        resolve();
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        reject(error);
      }
    });
  }

  /**
   * Registers an event listener for a specific message type
   * @param type The message type to listen for
   * @param callback The callback function to execute when a message of this type is received
   */
  public on(type: string, callback: MessageCallback): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    
    const callbacks = this.eventListeners.get(type) || [];
    callbacks.push(callback);
    this.eventListeners.set(type, callbacks);
  }

  /**
   * Removes an event listener for a specific message type
   * @param type The message type to remove the listener from
   * @param callback The callback function to remove
   */
  public off(type: string, callback: MessageCallback): void {
    if (!this.eventListeners.has(type)) {
      return;
    }
    
    const callbacks = this.eventListeners.get(type) || [];
    const index = callbacks.indexOf(callback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.eventListeners.set(type, callbacks);
    }
  }

  /**
   * Checks if the WebSocket is connected
   * @returns True if the WebSocket is connected, false otherwise
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

// Create a singleton instance for global use
export const webSocketManager = new WebSocketManager('ws://localhost:8080');