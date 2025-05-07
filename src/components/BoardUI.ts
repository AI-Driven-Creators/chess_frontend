/**
 * BoardUI Component
 *
 * Responsible for displaying a hexagonal 3D game board with chess pieces.
 * Handles dragging pieces between board positions and from/to the bench.
 * Implements a Teamfight Tactics style hexagonal grid in 3D space.
 */

import { state, ChessPiece } from '../gameState.js';
import { dragDropManager, BoardPosition } from '../utils/dragDrop.js';
import * as pc from 'playcanvas';

// Define the component attributes
interface BoardUIAttributes {
    cellTemplate: pc.Entity;
    pieceTemplate: pc.Entity;
    boardContainer: pc.Entity;
    boardRadius: number;
    cellSize: number;
}

// Add type definitions for UI elements
interface UIElement extends pc.Entity {
    element: pc.ElementComponent;
}

// Hex grid coordinates (using cube coordinates)
interface HexCoord {
    q: number; // column
    r: number; // row
    s: number; // diagonal (q + r + s = 0)
}

// Mapping between hex coordinates and array indices
interface HexMapping {
    coord: HexCoord;
    index: number;
}

/**
 * BoardUI component for PlayCanvas
 */
export class BoardUI extends pc.ScriptType {
    // Attributes
    public cellTemplate!: pc.Entity;
    public pieceTemplate!: pc.Entity;
    public boardContainer!: pc.Entity;
    public boardRadius: number = 12; // Radius of the hex grid (distance from center)
    public cellSize: number = 1.2; // Size of each hexagonal cell

    // Component properties
    private cells: pc.Entity[] = []; // Flat array of cells
    private hexGrid: HexMapping[] = []; // Mapping between hex coordinates and array indices
    private pieces: Map<string, pc.Entity> = new Map();
    private isDragging: boolean = false;
    private draggedPiece: ChessPiece | null = null;
    private draggedEntity: pc.Entity | null = null;
    private draggedPosition: [number, number] | null = null;
    private highlightedCell: pc.Entity | null = null;
    private boardRotation: number = 0; // Current board rotation in radians
    private cameraEntity: pc.Entity | null = null;

    /**
     * Initialize the component
     */
    public initialize(): void {
        console.log("初始化 BoardUI 組件...");
        console.log(`棋盤半徑: ${this.boardRadius}, 單元格大小: ${this.cellSize}`);
        
        // Hide the templates
        this.cellTemplate.enabled = false;
        this.pieceTemplate.enabled = false;
        console.log("模板已隱藏");

        // Set up the camera for 3D view
        console.log("設置 3D 相機...");
        this.setupCamera();

        // Create the hexagonal board grid
        console.log("創建六角形棋盤...");
        this.createHexBoard();

        // Update the board display
        console.log("更新棋盤顯示...");
        console.log(`初始棋子數量: ${state.board.length}`);
        this.updateBoard(state.board);

        // Set up drag and drop
        console.log("設置拖放功能...");
        this.setupDragDrop();

        // Listen for state changes
        console.log("設置事件監聽器...");
        this.app.on('state:board:updated', this.onBoardUpdated, this);
        this.app.on('state:merge:notice', this.onMergeNotice, this);
        
        // Set up keyboard controls for rotating the board
        if (this.app.keyboard) {
            console.log("設置鍵盤控制 (左右箭頭旋轉棋盤)...");
            this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
        }
        
        // Set up mouse wheel for zooming
        if (this.app.mouse) {
            console.log("設置滑鼠滾輪縮放...");
            this.app.mouse.on(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this);
        }
        
        console.log("BoardUI 初始化完成");
    }

    /**
     * Clean up the component
     */
    public destroy(): void {
        // Remove state change listeners
        this.app.off('state:board:updated', this.onBoardUpdated, this);
        this.app.off('state:merge:notice', this.onMergeNotice, this);
        
        if (this.app.keyboard) {
            this.app.keyboard.off(pc.EVENT_KEYDOWN, this.onKeyDown, this);
        }
        
        if (this.app.mouse) {
            this.app.mouse.off(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this);
        }

        // Destroy pieces
        this.pieces.forEach(piece => piece.destroy());
        this.pieces.clear();

        // Destroy cells
        this.cells.forEach(cell => cell.destroy());
        this.cells = [];
        
        // Destroy camera
        if (this.cameraEntity) {
            this.cameraEntity.destroy();
            this.cameraEntity = null;
        }
    }

    /**
     * Sets up the 3D camera for the board view
     */
    private setupCamera(): void {
        console.log("創建 3D 相機...");
        
        // Create a new camera entity
        this.cameraEntity = new pc.Entity('BoardCamera');
        this.cameraEntity.addComponent('camera', {
            clearColor: new pc.Color(0.1, 0.1, 0.1, 0),
            farClip: 1000,
            nearClip: 0.1
        });
        
        // Position the camera above and looking down at the board
        this.cameraEntity.setLocalPosition(0, 10, 10);
        this.cameraEntity.setLocalEulerAngles(-45, 0, 0);
        console.log(`相機位置: (0, 10, 10), 角度: (-45, 0, 0)`);
        
        // Add the camera to the board container
        this.boardContainer.addChild(this.cameraEntity);
        console.log("相機已添加到棋盤容器");
    }
    
    /**
     * Converts cube coordinates to 3D world position
     * @param q Column coordinate
     * @param r Row coordinate
     * @param s Diagonal coordinate (q + r + s = 0)
     * @returns 3D position vector
     */
    private hexToWorld(q: number, r: number, s: number): pc.Vec3 {
        // Constants for hexagon dimensions
        const sqrt3 = Math.sqrt(3);
        
        // Convert cube coordinates to world position
        const x = this.cellSize * (sqrt3 * q + sqrt3/2 * r) * 0.95;
        const z = this.cellSize * (3/2 * r) * 0.95;
        
        // Apply board rotation
        const rotatedX = x * Math.cos(this.boardRotation) - z * Math.sin(this.boardRotation);
        const rotatedZ = x * Math.sin(this.boardRotation) + z * Math.cos(this.boardRotation);
        
        const position = new pc.Vec3(rotatedX, 0, rotatedZ);
        console.log(`六角坐標 (${q},${r},${s}) 轉換為世界坐標: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
        
        return position;
    }
    
    /**
     * Creates a hexagonal board grid
     */
    private createHexBoard(): void {
        console.log("開始創建六角形棋盤...");
        console.log(`棋盤半徑: ${this.boardRadius}, 單元格大小: ${this.cellSize}`);
        
        // Clear existing cells
        this.cells = [];
        this.hexGrid = [];
        
        // Create a hexagonal grid with the given radius
        let cellIndex = 0;
        
        // Loop through all possible hex coordinates within the radius
        for (let q = -this.boardRadius; q <= this.boardRadius; q++) {
            for (let r = -this.boardRadius; r <= this.boardRadius; r++) {
                // Calculate s coordinate (in cube coordinates, q + r + s = 0)
                const s = -q - r;
                
                // Check if this hex is within the board radius
                if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= this.boardRadius) {
                    console.log(`創建六角形單元格: q=${q}, r=${r}, s=${s}, index=${cellIndex}`);
                    
                    // Create a new cell
                    const cell = this.createHexCell(q, r, s, cellIndex);
                    
                    // Store the cell and its mapping
                    this.cells.push(cell);
                    this.hexGrid.push({
                        coord: { q, r, s },
                        index: cellIndex
                    });
                    
                    cellIndex++;
                }
            }
        }
        
        console.log(`六角形棋盤創建完成，共 ${cellIndex} 個單元格`);
    }
    
    /**
     * Creates a single hexagonal cell
     * @param q Column coordinate
     * @param r Row coordinate
     * @param s Diagonal coordinate
     * @param index Cell index
     * @returns The created cell entity
     */
    private createHexCell(q: number, r: number, s: number, index: number): pc.Entity {
        console.log(`創建單元格詳情: HexCell_${q}_${r}_${s}`);
        
        // Create a new cell entity
        const cell = new pc.Entity(`HexCell_${q}_${r}_${s}`);
        this.boardContainer.addChild(cell);
        
        // Create a hexagonal model for the cell
        const hexMesh = this.createHexPrismMesh();
        
        // Add a material to the cell
        const material = new pc.StandardMaterial();
        
        // Alternate cell colors in a pattern
        const colorSum = (q + r + s) % 3;
        if (colorSum === 0) {
            material.diffuse = new pc.Color(0.8, 0.8, 0.8); // Light gray
        } else if (colorSum === 1) {
            material.diffuse = new pc.Color(0.7, 0.7, 0.7); // Medium gray
        } else {
            material.diffuse = new pc.Color(0.6, 0.6, 0.6); // Dark gray
        }
        
        material.update();
        
        // Apply material to the model
        const meshInstance = new pc.MeshInstance(hexMesh, material);

        cell.addComponent('render', {
            meshInstances: [meshInstance]
        });
        
        // Position the cell
        const position = this.hexToWorld(q, r, s);
        cell.setLocalPosition(position);
        
        // Add a collision component for mouse interaction
        cell.addComponent('collision', {
            type: 'mesh',
            asset: null
        });
        
        // Add a rigid body for collision detection
        cell.addComponent('rigidbody', {
            type: 'static',
            restitution: 0
        });
        
        // Store the hex coordinates as tags
        cell.tags.add(`hex-q:${q}`);
        cell.tags.add(`hex-r:${r}`);
        cell.tags.add(`hex-s:${s}`);
        cell.tags.add(`hex-index:${index}`);
        
        // Add event listeners for mouse interaction
        cell.collision!.on('mouseenter', () => this.onCellMouseEnter(q, r, s), this);
        cell.collision!.on('mouseleave', () => this.onCellMouseLeave(q, r, s), this);
        cell.collision!.on('mousedown', (event: any) => this.onCellMouseDown(q, r, s, event), this);
        cell.collision!.on('mouseup', (event: any) => this.onCellMouseUp(q, r, s, event), this);
        
        return cell;
    }
    
    private createHexPrismMesh(): pc.Mesh {
        const app = this.app;
        const device = app.graphicsDevice;
    
        const radius = this.cellSize * 0.9;
        const height = 0.3;
    
        const vertices: number[] = [];
        const normals: number[] = [];
        const indices: number[] = [];
        const uvs: number[] = [];
    
        // 頂部與底部六邊形，共 12 個邊緣點
        for (let y of [height / 2, -height / 2]) {
            for (let i = 0; i < 7; i++) {
                const angle = (Math.PI / 3) * i + Math.PI / 6;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                vertices.push(x, y, z);
                normals.push(0, y > 0 ? 1 : -1, 0);
                uvs.push((x / radius + 1) / 2, (z / radius + 1) / 2);
            }
            // 中心點
            vertices.push(0, y, 0);
            normals.push(0, y > 0 ? 1 : -1, 0);
            uvs.push(0.5, 0.5);
        }
    
        const topOffset = 0;
        const bottomOffset = 7;
    
        // 頂部面（三角扇）
        for (let i = 0; i < 8; i++) {
            indices.push(topOffset + 6, topOffset + i, topOffset + ((i - 1) % 6));
        }
    
        // 底部面（三角扇）
        for (let i = 0; i < 6; i++) {
            indices.push(bottomOffset + 6, bottomOffset + ((i + 1) % 6), bottomOffset + i);
        }
    
        // 側面（6 個矩形 -> 12 個三角形）
        for (let i = 0; i < 6; i++) {
            const topA = topOffset + i;
            const topB = topOffset + ((i + 1) % 6);
            const botA = bottomOffset + i;
            const botB = bottomOffset + ((i + 1) % 6);
    
            // 三角形 1
            indices.push(topA, botA, botB);
            // 三角形 2
            indices.push(topA, botB, topB);
    
            // 側面頂點法線需為水平向外（略微簡化）
            const angle = (Math.PI / 3) * (i + 0.5);
            const nx = Math.cos(angle);
            const nz = Math.sin(angle);
            for (let j = 0; j < 2; j++) {
                normals.push(nx, 0, nz); // botA
                normals.push(nx, 0, nz); // botB
            }
            // 這裡簡化：未針對側面額外產生頂點，而是與上下共用，若要精準光照可額外建邊緣頂點群
        }
    
        const mesh = new pc.Mesh(device);
        mesh.setPositions(vertices);
        mesh.setNormals(normals);
        mesh.setUvs(0, uvs);
        mesh.setIndices(indices);
        mesh.update();
    
        return mesh;
    }
    
    /**
     * Creates a hexagonal mesh for the cell
     * @returns The created mesh
     */
    private createHexagonMesh(): pc.Mesh {
        console.log("創建六角形網格...");
        
        const app = this.app;
        const device = app.graphicsDevice;
        
        // Create vertices for a hexagon
        const vertices: number[] = [];
        const indices: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        
        // Center vertex
        vertices.push(0, 0, 0);
        normals.push(0, 1, 0);
        uvs.push(0.5, 0.5);
        
        // Outer vertices
        const numVertices = 6;
        for (let i = 0; i < numVertices; i++) {
            const angle = (i / numVertices) * Math.PI * 2;
            const x = Math.cos(angle) * this.cellSize * 0.9;
            const z = Math.sin(angle) * this.cellSize * 0.9;
            
            vertices.push(x, 0, z);
            normals.push(0, 1, 0);
            
            // Calculate UVs
            const u = 0.5 + Math.cos(angle) * 0.5;
            const v = 0.5 + Math.sin(angle) * 0.5;
            uvs.push(u, v);
            
            // Create triangles
            if (i < numVertices - 1) {
                indices.push(0, i + 1, i + 2);
            } else {
                indices.push(0, i + 1, 1);
            }
        }
        
        console.log(`六角形網格頂點數: ${vertices.length / 3}, 三角形數: ${indices.length / 3}`);
        
        // Create the mesh
        const mesh = new pc.Mesh(device);
        mesh.setPositions(vertices);
        mesh.setNormals(normals);
        mesh.setUvs(0, uvs);
        mesh.setIndices(indices);
        mesh.update();
        
        console.log("六角形網格創建完成");
        return mesh;
    }
    
    /**
     * Handles keyboard input for rotating the board
     * @param event The keyboard event
     */
    private onKeyDown(event: any): void {
        console.log(`鍵盤按下: ${event.key}`);
        
        // Rotate the board with arrow keys
        if (event.key === pc.KEY_LEFT) {
            console.log("向左旋轉棋盤");
            this.rotateBoard(-0.1); // Rotate left
        } else if (event.key === pc.KEY_RIGHT) {
            console.log("向右旋轉棋盤");
            this.rotateBoard(0.1); // Rotate right
        }
    }
    
    /**
     * Handles mouse wheel for zooming
     * @param event The mouse wheel event
     */
    private onMouseWheel(event: any): void {
        if (!this.cameraEntity) return;
        
        console.log(`滑鼠滾輪: ${event.wheel > 0 ? '向上' : '向下'}`);
        
        // Get current camera position
        const position = this.cameraEntity.getLocalPosition();
        console.log(`當前相機位置: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
        
        // Zoom in/out based on wheel direction
        const zoomFactor = 0.5;
        const newY = position.y - event.wheel * zoomFactor;
        const newZ = position.z - event.wheel * zoomFactor;
        
        // Limit zoom range
        const minZoom = 5;
        const maxZoom = 20;
        const newPosition = new pc.Vec3(
            position.x,
            Math.max(minZoom, Math.min(maxZoom, newY)),
            Math.max(minZoom, Math.min(maxZoom, newZ))
        );
        
        console.log(`新相機位置: (${newPosition.x.toFixed(2)}, ${newPosition.y.toFixed(2)}, ${newPosition.z.toFixed(2)})`);
        
        // Update camera position
        this.cameraEntity.setLocalPosition(newPosition);
    }
    
    /**
     * Rotates the board
     * @param angle The angle to rotate by (in radians)
     */
    private rotateBoard(angle: number): void {
        console.log(`旋轉棋盤: ${angle > 0 ? '順時針' : '逆時針'} ${Math.abs(angle).toFixed(2)} 弧度`);
        
        // Update the board rotation
        this.boardRotation += angle;
        console.log(`新的棋盤旋轉角度: ${this.boardRotation.toFixed(2)} 弧度`);
        
        // Update the positions of all cells
        console.log(`更新 ${this.hexGrid.length} 個單元格的位置...`);
        for (let i = 0; i < this.hexGrid.length; i++) {
            const { coord, index } = this.hexGrid[i];
            const { q, r, s } = coord;
            
            // Calculate the new position
            const position = this.hexToWorld(q, r, s);
            
            // Update the cell position
            this.cells[index].setLocalPosition(position);
        }
        
        // Update the positions of all pieces
        console.log(`更新 ${this.pieces.size} 個棋子的位置...`);
        this.pieces.forEach((pieceEntity, pieceId) => {
            // Get the hex coordinates from the tags
            const qTag = pieceEntity.tags.list().find(tag => tag.startsWith('hex-q:'));
            const rTag = pieceEntity.tags.list().find(tag => tag.startsWith('hex-r:'));
            const sTag = pieceEntity.tags.list().find(tag => tag.startsWith('hex-s:'));
            
            if (qTag && rTag && sTag) {
                const q = parseInt(qTag.substring(6));
                const r = parseInt(rTag.substring(6));
                const s = parseInt(sTag.substring(6));
                
                // Calculate the new position
                const position = this.hexToWorld(q, r, s);
                
                // Update the piece position (keeping the y coordinate)
                pieceEntity.setLocalPosition(position.x, pieceEntity.getLocalPosition().y, position.z);
            }
        });
        
        console.log("棋盤旋轉完成");
    }

    /**
     * Updates the board display
     * @param board The board pieces to display
     */
    private updateBoard(board: ChessPiece[]): void {
        console.log("更新棋盤顯示...");
        console.log(`棋子數量: ${board.length}`);
        
        // Track which pieces are still on the board
        const remainingPieceIds = new Set<string>();

        // Update or create pieces for each board piece
        board.forEach(chessPiece => {
            if (!chessPiece.position) {
                return; // Skip pieces without a position
            }

            const [x, y] = chessPiece.position;
            remainingPieceIds.add(chessPiece.id);
            
            console.log(`處理棋子: ${chessPiece.id}, 位置: [${x}, ${y}], 類型: ${chessPiece.chess}, 等級: ${chessPiece.level}`);

            // Convert 2D grid position to hex grid position
            const hexCoord = this.gridToHex(x, y);
            
            if (!hexCoord) {
                console.warn(`無效位置: 棋子 ${chessPiece.id}: [${x}, ${y}]`);
                return;
            }
            
            console.log(`轉換為六角坐標: q=${hexCoord.q}, r=${hexCoord.r}, s=${hexCoord.s}`);

            // Check if the piece already exists
            if (this.pieces.has(chessPiece.id)) {
                console.log(`更新現有棋子: ${chessPiece.id}`);
                // Update the existing piece
                const pieceEntity = this.pieces.get(chessPiece.id)!;
                this.updatePieceEntity(pieceEntity, chessPiece);

                // Move the piece to the correct position
                this.movePieceToHexCell(pieceEntity, hexCoord.q, hexCoord.r, hexCoord.s);
            } else {
                console.log(`創建新棋子: ${chessPiece.id}`);
                // Create a new piece
                this.createPieceEntity3D(chessPiece, hexCoord.q, hexCoord.r, hexCoord.s);
            }
        });

        // Remove pieces that are no longer on the board
        this.pieces.forEach((pieceEntity, pieceId) => {
            if (!remainingPieceIds.has(pieceId)) {
                console.log(`移除棋子: ${pieceId}`);
                pieceEntity.destroy();
                this.pieces.delete(pieceId);
            }
        });
        
        console.log("棋盤更新完成");
    }
    
    /**
     * Converts 2D grid coordinates to hex coordinates
     * @param x The x coordinate in the 2D grid
     * @param y The y coordinate in the 2D grid
     * @returns The hex coordinates, or null if the position is invalid
     */
    private gridToHex(x: number, y: number): HexCoord | null {
        console.log(`轉換網格坐標 [${x}, ${y}] 為六角坐標`);
        
        // Simple mapping from 2D grid to hex grid
        // This is a basic implementation that maps the 8x3 grid to a hex grid
        
        // Calculate q and r based on the 2D grid position
        let q = x - Math.floor(this.boardRadius);
        let r = y - Math.floor(this.boardRadius / 2);
        
        // Calculate s to satisfy q + r + s = 0
        let s = -q - r;
        
        console.log(`計算的六角坐標: q=${q}, r=${r}, s=${s}`);
        
        // Check if the hex coordinates are within the board radius
        if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= this.boardRadius) {
            console.log(`六角坐標在棋盤範圍內`);
            return { q, r, s };
        }
        
        console.log(`六角坐標超出棋盤範圍`);
        return null;
    }
    
    /**
     * Converts hex coordinates to 2D grid coordinates
     * @param q The q coordinate in the hex grid
     * @param r The r coordinate in the hex grid
     * @param s The s coordinate in the hex grid
     * @returns The 2D grid coordinates, or null if the position is invalid
     */
    private hexToGrid(q: number, r: number, s: number): [number, number] | null {
        console.log(`轉換六角坐標 q=${q}, r=${r}, s=${s} 為網格坐標`);
        
        // Simple mapping from hex grid to 2D grid
        // This is the inverse of gridToHex
        
        const x = q + Math.floor(this.boardRadius);
        const y = r + Math.floor(this.boardRadius / 2);
        
        console.log(`計算的網格坐標: [${x}, ${y}]`);
        return [x, y];
    }

    /**
     * Creates a new 3D piece entity
     * @param chessPiece The chess piece data
     * @param q The q coordinate in the hex grid
     * @param r The r coordinate in the hex grid
     * @param s The s coordinate in the hex grid
     */
    private createPieceEntity3D(chessPiece: ChessPiece, q: number, r: number, s: number): void {
        console.log(`創建3D棋子: ${chessPiece.id}, 類型: ${chessPiece.chess}, 等級: ${chessPiece.level}`);
        console.log(`位置: q=${q}, r=${r}, s=${s}`);
        
        // Create a new piece entity
        const pieceEntity = new pc.Entity(`Piece_${chessPiece.id}`);
        
        // Create a 3D model for the piece
        pieceEntity.addComponent('model', {
            type: 'box',
            castShadows: true
        });
        
        // Add a material to the piece
        const material = new pc.StandardMaterial();
        
        // Set color based on level
        const colors = [
            new pc.Color(0.7, 0.7, 0.7), // 1-star (gray)
            new pc.Color(0.2, 0.8, 0.2), // 2-star (green)
            new pc.Color(0.8, 0.8, 0.2)  // 3-star (gold)
        ];
        
        material.diffuse = colors[chessPiece.level - 1] || colors[0];
        material.update();
        
        if (pieceEntity.model && pieceEntity.model.meshInstances && pieceEntity.model.meshInstances.length > 0) {
            pieceEntity.model.meshInstances[0].material = material;
            console.log(`已應用材質到棋子: ${chessPiece.level}星級`);
        } else {
            console.warn(`無法應用材質到棋子: ${chessPiece.id}, meshInstances 不可用`);
        }
        
        // Scale the piece based on level
        const scale = 0.5 + (chessPiece.level * 0.1);
        pieceEntity.setLocalScale(scale, scale, scale);
        
        // Add a text entity for the chess name
        const nameEntity = new pc.Entity('NameText');
        nameEntity.addComponent('element', {
            type: 'text',
            width: 2,
            height: 0.5,
            pivot: new pc.Vec2(0.5, 0.5),
            alignment: new pc.Vec2(0.5, 0.5),
            fontSize: 8,
            color: new pc.Color(1, 1, 1),
            text: chessPiece.chess
        });
        
        // Position the text above the piece
        nameEntity.setLocalPosition(0, 1.2, 0);
        
        // Make the text face the camera
        if (!nameEntity.script) {
            nameEntity.addComponent('script');
            nameEntity.script!.create('billboard', {
                attributes: {
                    camera: this.cameraEntity
                }
            });
        }
        
        pieceEntity.addChild(nameEntity);
        
        // Add a level indicator
        const levelEntity = new pc.Entity('LevelText');
        levelEntity.addComponent('element', {
            type: 'text',
            width: 1,
            height: 0.3,
            pivot: new pc.Vec2(0.5, 0.5),
            alignment: new pc.Vec2(0.5, 0.5),
            fontSize: 6,
            color: new pc.Color(1, 1, 0),
            text: `★${chessPiece.level}`
        });
        
        // Position the level text above the name
        levelEntity.setLocalPosition(0, 1.5, 0);
        
        // Make the level text face the camera
        if (!levelEntity.script) {
            levelEntity.addComponent('script');
            levelEntity.script!.create('billboard', {
                attributes: {
                    camera: this.cameraEntity
                }
            });
        }
        
        pieceEntity.addChild(levelEntity);
        
        // Position the piece
        this.movePieceToHexCell(pieceEntity, q, r, s);
        
        // Add the piece to the board container
        this.boardContainer.addChild(pieceEntity);
        
        // Store the piece
        this.pieces.set(chessPiece.id, pieceEntity);
        
        // Store the hex coordinates as tags
        pieceEntity.tags.add(`hex-q:${q}`);
        pieceEntity.tags.add(`hex-r:${r}`);
        pieceEntity.tags.add(`hex-s:${s}`);
        pieceEntity.tags.add(`chess-id:${chessPiece.id}`);
    }

    /**
     * Updates a piece entity with chess piece data
     * @param pieceEntity The piece entity to update
     * @param chessPiece The chess piece data
     */
    private updatePieceEntity(pieceEntity: pc.Entity, chessPiece: ChessPiece): void {
        // Update piece content
        const nameText = pieceEntity.findByName('NameText') as UIElement;
        if (nameText && nameText.element) {
            nameText.element.text = chessPiece.chess;
        }

        const levelText = pieceEntity.findByName('LevelText') as UIElement;
        if (levelText && levelText.element) {
            levelText.element.text = `★${chessPiece.level}`;
        }

        // Update piece background based on level
        const pieceBg = pieceEntity.findByName('PieceBackground') as UIElement;
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
        const pieceImage = pieceEntity.findByName('ChessImage') as UIElement;
        if (pieceImage && pieceImage.element) {
            // Set the image based on the chess name
            // This is a placeholder, you would load actual textures
            // pieceImage.element.textureAsset = this.app.assets.find(`${chessPiece.chess}.png`);
        }

        // Update health bar if available
        if (chessPiece.hp !== undefined && chessPiece.maxHp !== undefined) {
            const healthBar = pieceEntity.findByName('HealthBar') as UIElement;
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
     * Moves a piece entity to a hex cell
     * @param pieceEntity The piece entity to move
     * @param q The q coordinate in the hex grid
     * @param r The r coordinate in the hex grid
     * @param s The s coordinate in the hex grid
     */
    private movePieceToHexCell(pieceEntity: pc.Entity, q: number, r: number, s: number): void {
        // Calculate the world position for the hex coordinates
        const position = this.hexToWorld(q, r, s);
        
        // Set the piece position (slightly above the cell)
        pieceEntity.setLocalPosition(position.x, 0.5, position.z);
        
        // Update the hex coordinate tags
        pieceEntity.tags.remove(pieceEntity.tags.list().filter(tag => tag.startsWith('hex-q:') || tag.startsWith('hex-r:') || tag.startsWith('hex-s:')));
        pieceEntity.tags.add(`hex-q:${q}`);
        pieceEntity.tags.add(`hex-r:${r}`);
        pieceEntity.tags.add(`hex-s:${s}`);
    }

    /**
     * Sets up drag and drop functionality
     */
    private setupDragDrop(): void {
        // Listen for mouse move events on the document
        if (this.app.mouse) {
            this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
        }
    }

    /**
     * Handles mouse enter on a cell
     * @param q The q coordinate in the hex grid
     * @param r The r coordinate in the hex grid
     * @param s The s coordinate in the hex grid
     */
    private onCellMouseEnter(q: number, r: number, s: number): void {
        // Find the cell index from the hex coordinates
        const cellMapping = this.hexGrid.find(mapping =>
            mapping.coord.q === q &&
            mapping.coord.r === r &&
            mapping.coord.s === s
        );
        
        if (!cellMapping) return;
        
        // Highlight the cell if we're dragging
        if (this.isDragging) {
            const cell = this.cells[cellMapping.index];
            this.highlightCell(cell);
        }
    }

    /**
     * Handles mouse leave on a cell
     * @param q The q coordinate in the hex grid
     * @param r The r coordinate in the hex grid
     * @param s The s coordinate in the hex grid
     */
    private onCellMouseLeave(q: number, r: number, s: number): void {
        // Remove the highlight
        this.unhighlightCell();
    }

    /**
     * Handles mouse down on a cell
     * @param q The q coordinate in the hex grid
     * @param r The r coordinate in the hex grid
     * @param s The s coordinate in the hex grid
     * @param event The mouse event
     */
    private onCellMouseDown(q: number, r: number, s: number, event: any): void {
        // Convert hex coordinates to 2D grid coordinates
        const gridPos = this.hexToGrid(q, r, s);
        
        if (!gridPos) return;
        
        const [x, y] = gridPos;
        
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
     * @param q The q coordinate in the hex grid
     * @param r The r coordinate in the hex grid
     * @param s The s coordinate in the hex grid
     * @param event The mouse event
     */
    private onCellMouseUp(q: number, r: number, s: number, event: any): void {
        if (!this.isDragging) {
            return;
        }

        // Convert hex coordinates to 2D grid coordinates
        const gridPos = this.hexToGrid(q, r, s);
        
        if (!gridPos) return;
        
        const [x, y] = gridPos;

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
        
        // For 3D cells, we need to change the material color
        if (cell.model && cell.model.meshInstances && cell.model.meshInstances.length > 0) {
            const material = cell.model.meshInstances[0].material as pc.StandardMaterial;
            
            // Store the original color if not already stored
            if (!cell.tags.has('original-color')) {
                const color = material.diffuse;
                cell.tags.add(`original-color:${color.r},${color.g},${color.b}`);
            }
            
            // Create a new material with highlight color
            const highlightMaterial = material.clone();
            highlightMaterial.diffuse = new pc.Color(0.2, 0.6, 0.9); // Blue highlight
            highlightMaterial.update();
            
            // Apply the highlight material
            cell.model.meshInstances[0].material = highlightMaterial;
        }
    }

    /**
     * Removes the highlight from the currently highlighted cell
     */
    private unhighlightCell(): void {
        if (!this.highlightedCell) {
            return;
        }

        // For 3D cells, restore the original material color
        if (this.highlightedCell && this.highlightedCell.model &&
            this.highlightedCell.model.meshInstances &&
            this.highlightedCell.model.meshInstances.length > 0) {
            // Restore the original color
            const originalColorTag = this.highlightedCell.tags.list().find(tag => tag.startsWith('original-color:'));
            if (originalColorTag) {
                const [r, g, b] = originalColorTag.substring(15).split(',').map(Number);
                
                // Create a new material with the original color
                const material = (this.highlightedCell.model.meshInstances[0].material as pc.StandardMaterial).clone();
                material.diffuse = new pc.Color(r, g, b);
                material.update();
                
                // Apply the original material
                this.highlightedCell.model.meshInstances[0].material = material;
                
                // Remove the tag
                this.highlightedCell.tags.remove(originalColorTag);
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
     * Gets the board position for a screen position using raycasting
     * @param x The x coordinate
     * @param y The y coordinate
     * @returns The board position, or null if the position is not on the board
     */
    public getBoardPositionForScreenPosition(x: number, y: number): BoardPosition | null {
        if (!this.cameraEntity) return null;
        
        // Create a ray from the camera through the screen position
        const camera = this.cameraEntity.camera!;
        
        // Convert screen coordinates to normalized device coordinates
        const width = this.app.graphicsDevice.width;
        const height = this.app.graphicsDevice.height;
        const nx = (x / width) * 2 - 1;
        const ny = (y / height) * -2 + 1;
        
        // Create ray from camera
        const rayStart = new pc.Vec3();
        const rayEnd = new pc.Vec3();
        camera.screenToWorld(nx, ny, 0, rayStart);
        camera.screenToWorld(nx, ny, 1, rayEnd);
        
        const rayDir = new pc.Vec3();
        rayDir.sub2(rayEnd, rayStart).normalize();
        
        // Find the closest cell that intersects with the ray
        let closestCell: pc.Entity | null = null;
        let closestDistance = Infinity;
        
        for (let i = 0; i < this.cells.length; i++) {
            const cell = this.cells[i];
            
            // Skip cells without collision components
            if (!cell.collision) continue;
            
            // Check for intersection
            const scaledRayDir = new pc.Vec3(
                rayDir.x * camera.farClip,
                rayDir.y * camera.farClip,
                rayDir.z * camera.farClip
            );
            const result = this.app.systems.rigidbody!.raycastFirst(
                rayStart,
                scaledRayDir
            );
            
            if (result && result.entity === cell) {
                const distance = result.point.distance(rayStart);
                
                if (distance < closestDistance) {
                    closestCell = cell;
                    closestDistance = distance;
                }
            }
        }
        
        // If we found a cell, convert its hex coordinates to 2D grid coordinates
        if (closestCell) {
            const qTag = closestCell.tags.list().find(tag => tag.startsWith('hex-q:'));
            const rTag = closestCell.tags.list().find(tag => tag.startsWith('hex-r:'));
            const sTag = closestCell.tags.list().find(tag => tag.startsWith('hex-s:'));
            
            if (qTag && rTag && sTag) {
                const q = parseInt(qTag.substring(6));
                const r = parseInt(rTag.substring(6));
                const s = parseInt(sTag.substring(6));
                
                const gridPos = this.hexToGrid(q, r, s);
                
                if (gridPos) {
                    const [x, y] = gridPos;
                    return { type: 'board', x, y };
                }
            }
        }
        
        return null;
    }
}
