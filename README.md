# 自走棋模擬器前端框架 (Auto Chess Simulator Frontend)

使用 TypeScript 與 PlayCanvas 2.7 開發的多人 Web 自走棋模擬器前端框架。本專案專為連接 WebSocket API、顯示商店/棋盤/板凳狀態、處理拖曳與玩家互動而設計，並方便前端 UI 成員協作開發。

## 專案概述

本框架實現了以下功能：

1. 支援 GameRule.txt 中列出的 Use Cases（UC1~UC8）
2. 對應 `GAME_API.md` 中所有 WebSocket 傳輸協議
3. 將 UI 元件模組化拆分（Shop、Bench、Board 等）
4. 實現拖曳與合成功能（DragDrop、Merge）
5. 使用 PlayCanvas 標準元件化方式進行組織
6. 提供 `WebSocketManager` 類別處理事件註冊與傳送
7. 提供 `gameState.ts` 用來集中管理整體狀態與同步更新

## 開發環境設置

### 必要條件
- Node.js (建議使用 LTS 版本)
- npm 或 yarn

### 安裝依賴
```bash
npm install
```

### 開發專案
```bash
npx vite
```

### 測試建置結果
使用 `build.bat` 腳本可以快速測試建置結果：
```bash
build.bat
```

## 專案結構

```
src/
├── websocket.ts              # WebSocket 連接管理
├── gameState.ts              # 遊戲狀態管理
├── components/
│   ├── ShopUI.ts             # 商店 UI 元件
│   ├── BenchUI.ts            # 板凳 UI 元件
│   ├── BoardUI.ts            # 棋盤 UI 元件
│   ├── InfoPanel.ts          # 玩家資訊面板
│   └── ActionButtonPanel.ts  # 動作按鈕面板
├── utils/
│   ├── dragDrop.ts           # 拖曳功能
│   └── apiHelpers.ts         # API 輔助函數
└── types/
    └── playcanvas.d.ts       # PlayCanvas 類型定義
```

## 核心元件說明

### WebSocket 管理 (websocket.ts)

`WebSocketManager` 類別提供了完整的 WebSocket 連接管理，包括：
- 自動重連機制
- 事件監聽系統 (.on/.off)
- 訊息發送 (.send)
- JSON 自動序列化/反序列化

```typescript
// 使用範例
import { webSocketManager } from './src/websocket';

// 連接到伺服器
webSocketManager.connect();

// 註冊事件監聽
webSocketManager.on('GameStateResult', (payload) => {
  console.log('Received game state:', payload);
});

// 發送訊息
webSocketManager.send('GetGameState', { playerId: 'p1', gameId: 'game1' });
```

### 遊戲狀態管理 (gameState.ts)

`GameState` 提供了集中式的狀態管理，包含：
- 玩家資訊 (金錢、等級、經驗值)
- 商店狀態與鎖定功能
- 棋盤和板凳上的棋子
- 羈絆資訊
- 各種輔助函數用於更新狀態

```typescript
// 使用範例
import { state, updateMoney, updateBoard, updateBench } from './src/gameState';

// 讀取當前狀態
console.log(`Player money: ${state.money}`);

// 更新狀態
updateMoney(100);
updateBoard(newBoardPieces);
updateBench(newBenchPieces);
```

### UI 元件

所有 UI 元件都是 PlayCanvas 腳本元件，可以直接附加到實體上：

1. **ShopUI (components/ShopUI.ts)**: 
   - 顯示商店的 5 個角色卡
   - 處理購買角色功能
   - 實現刷新商店按鈕
   - 實現鎖定商店按鈕
   - 顯示金錢變化

2. **BenchUI (components/BenchUI.ts)**: 
   - 顯示板凳上最多 9 隻角色
   - 支援拖曳角色上場
   - 支援拖曳角色售出
   - 自動更新顯示

3. **BoardUI (components/BoardUI.ts)**: 
   - 顯示 3x8 棋盤
   - 支援棋子間換位
   - 支援 Bench ↔ Board 拖曳
   - 顯示合成動畫

4. **InfoPanel (components/InfoPanel.ts)**: 
   - 顯示玩家金錢、XP、等級
   - 顯示羈絆列表與效果
   - 自動更新顯示

5. **ActionButtonPanel (components/ActionButtonPanel.ts)**: 
   - 提供購買 XP 按鈕
   - 顯示 XP 條與等級進度
   - 視覺化等級提升效果

### 拖曳系統 (utils/dragDrop.ts)

`DragDropManager` 提供了完整的拖曳功能：
- 支援 Bench ↔ Board 拖曳
- 支援 Board ↔ Board 拖曳
- 提供回調函數用於自定義拖曳行為
- 處理拖曳過程中的視覺反饋

```typescript
// 使用範例
import { dragDropManager } from './src/utils/dragDrop';

// 註冊拖曳事件
dragDropManager.onDragStart((data) => {
  console.log('Started dragging piece:', data.chessPiece);
});

dragDropManager.onDrop((data, success) => {
  if (success) {
    console.log('Piece dropped successfully');
  }
});
```

### API 輔助函數 (utils/apiHelpers.ts)

`apiHelpers.ts` 提供了包裝函數，簡化 API 呼叫：
- sendBuyChess - 購買棋子
- sendMoveChess - 移動棋子
- sendBuyXP - 購買經驗值
- sendRefreshShop - 刷新商店
- sendLockShop - 鎖定商店
- sendSellChess - 售出棋子
- setupEventListeners - 設置事件監聽

```typescript
// 使用範例
import { sendBuyChess, sendRefreshShop, setupEventListeners } from './src/utils/apiHelpers';

// 發送 API 請求
sendBuyChess('p1', 'Knight');
sendRefreshShop('p1');

// 設置事件監聽
setupEventListeners({
  onBuyChessResult: (payload) => {
    if (payload.success) {
      console.log('Chess purchased successfully');
    }
  }
});
```

## 在 PlayCanvas 中使用元件

將腳本附加到相應的實體上，並設置屬性：

```javascript
// 在 PlayCanvas 編輯器中
const shopEntity = new pc.Entity('Shop');
shopEntity.addComponent('script');
shopEntity.script.create('shopUI', {
  cardTemplate: cardTemplateEntity,
  refreshButton: refreshButtonEntity,
  lockButton: lockButtonEntity,
  cardContainer: cardContainerEntity,
  moneyText: moneyTextEntity
});

// 添加到場景
app.root.addChild(shopEntity);
```

## 擴展指南

### 添加新的 UI 元件

1. 在 `src/components/` 目錄下創建新的 TypeScript 文件
2. 定義一個繼承自 `pc.ScriptType` 的類
3. 實現 `initialize()` 和 `destroy()` 方法
4. 使用 `pc.registerScript()` 註冊腳本
5. 定義元件屬性

```typescript
export class NewComponent extends pc.ScriptType {
  // 屬性定義
  public someProperty!: pc.Entity;
  
  // 初始化
  public initialize(): void {
    // 初始化代碼
  }
  
  // 清理
  public destroy(): void {
    // 清理代碼
  }
}

// 註冊腳本
pc.registerScript(NewComponent, 'newComponent');

// 定義屬性
NewComponent.attributes!.add('someProperty', { type: 'entity' });
```

### 擴展遊戲狀態

如果需要添加新的狀態字段：

1. 在 `src/gameState.ts` 中的 `GameState` 接口添加新字段
2. 在 `initialState` 對象中添加默認值
3. 添加新的更新函數

```typescript
// 添加新字段
export interface GameState {
  // 現有字段
  // ...
  
  // 新字段
  newFeature: boolean;
}

// 更新初始狀態
const initialState: GameState = {
  // 現有字段
  // ...
  
  // 新字段默認值
  newFeature: false
};

// 添加更新函數
export function updateNewFeature(value: boolean): void {
  state.newFeature = value;
  // 可選：觸發事件通知 UI 更新
  app.fire('state:newFeature:updated', value);
}
```

## 給 AI 助手的指南

如果您是 AI 助手，正在幫助開發者處理這個專案，以下是一些有用的提示：

1. **專案結構**：這是一個使用 TypeScript 和 PlayCanvas 的自走棋模擬器前端框架。核心文件包括 WebSocket 管理、遊戲狀態管理、UI 元件和工具函數。

2. **核心概念**：
   - 使用 WebSocket 與後端通信
   - 集中式狀態管理 (gameState.ts)
   - 基於 PlayCanvas 的 UI 元件系統
   - 拖放系統用於棋子移動

3. **常見任務**：
   - **添加新 UI 元件**：參考現有元件結構，繼承 pc.ScriptType
   - **擴展遊戲狀態**：在 gameState.ts 中添加新字段和更新函數
   - **添加新 API 調用**：在 apiHelpers.ts 中添加新的包裝函數
   - **修改拖放行為**：在 dragDrop.ts 中調整拖放邏輯

4. **TypeScript 類型**：專案使用自定義的 PlayCanvas 類型定義 (playcanvas.d.ts)，如果需要使用未定義的 PlayCanvas API，可能需要擴展此文件。

5. **事件系統**：
   - WebSocket 事件通過 webSocketManager.on() 註冊
   - 內部狀態變更事件通過 app.on() 註冊，格式通常為 'state:xxx:updated'

6. **調試提示**：
   - 使用 console.log 輸出 state 對象查看當前遊戲狀態
   - 檢查 WebSocket 連接狀態：webSocketManager.isConnected()
   - 監聽特定事件進行調試：webSocketManager.on('EventName', console.log)

希望這些信息能幫助您更快地理解和擴展這個專案！

## 使用案例 (Use Cases)

本框架支持 GameRule.txt 中定義的所有使用案例：

1. **UC1：刷新商店** - 通過 ShopUI 和 RefreshShop API 實現
2. **UC2：鎖定商店** - 通過 ShopUI 和 LockShop API 實現
3. **UC3：購買角色** - 通過 ShopUI 和 BuyChess API 實現
4. **UC4：售出角色** - 通過 BenchUI 和 SellChess API 實現
5. **UC5：移動角色** - 通過 BoardUI、BenchUI 和 MoveChess API 實現
6. **UC6：購買經驗值** - 通過 ActionButtonPanel 和 BuyXP API 實現
7. **UC7：查看羈絆與隊伍資訊** - 通過 InfoPanel 實現
8. **UC8：拖曳與合成機制** - 通過 dragDrop 系統和 MergeNotice 事件實現

## 編譯與運行專案

### 方法一：使用自動構建腳本（推薦）

我們提供了自動構建腳本，可以一鍵完成安裝、編譯和啟動伺服器的過程：

- **Windows 用戶**：雙擊運行 `build.bat`
- **Mac/Linux 用戶**：在終端中執行 `chmod +x build.sh && ./build.sh`

### 方法二：手動步驟

如果您想手動執行各個步驟，請按照以下操作：

1. **安裝依賴**

```bash
npm install
```

2. **編譯 TypeScript 檔案** (這一步非常重要！)

```bash
npm run build
```

3. **啟動開發伺服器**

```bash
npm run start
```

4. **在瀏覽器中訪問**

打開瀏覽器並訪問 http://localhost:8080

### 開發模式

如果您想在開發過程中自動重新編譯 TypeScript 檔案，可以使用：

```bash
npm run dev
```

這將同時啟動 TypeScript 編譯器的監視模式和開發伺服器。

### 常見問題

- **找不到 dist 目錄中的檔案**：確保您已經運行了 `npm run build` 來編譯 TypeScript 檔案
- **修改後沒有看到變化**：如果您修改了 TypeScript 檔案，需要重新編譯（使用 `npm run build` 或 `npm run watch`）
- **編譯錯誤**：檢查 TypeScript 錯誤訊息，修復代碼中的問題後重新編譯

## 專案結構說明

- `src/` - 源代碼目錄
- `dist/` - 編譯後的 JavaScript 檔案（自動生成）
- `index.html` - 主頁面
- `tsconfig.json` - TypeScript 配置
- `package.json` - 專案依賴和腳本

## 開發注意事項

- 本專案使用 ES 模組系統，所有 import/export 語句都會在編譯後保留
- 修改 TypeScript 檔案後需要重新編譯（使用 `npm run build` 或 `npm run watch`）
- 在開發模式下（`npm run dev`），TypeScript 檔案會被自動監視並重新編譯