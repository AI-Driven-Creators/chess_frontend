
# 🧠 自走棋模擬器 WebSocket API 文件

本文件為自走棋模擬器的前後端 WebSocket 溝通協定。所有事件皆以 JSON 格式傳輸，透過 `type` 欄位表示事件類型，`payload` 為具體資料。

## ✅ 已完整涵蓋的核心功能

| 類別         | 是否齊全 | 說明 |
|--------------|----------|------|
| 建立與初始化 | ✅       | `CreateGame`, `GameCreated` |
| 狀態查詢     | ✅       | `GetGameState`, `GameState`, `ListChess`, `ListChessResult` |
| 商店操作     | ✅       | `RefreshShop`, `BuyChess`, `LockShop`，並包含失敗情境 |
| 棋子操作     | ✅       | `MoveChess`（含 5 種情境）、`SellChess`（含 fail）、`MergeNotice` |
| 經驗與升級   | ✅       | `BuyXP`, `XPUpdatedNotice`, `LevelUpNotice`，並補上失敗情境 |
| 戰鬥觸發     | ✅       | `BattleNotice`（單機中僅需通知 client） |


---

## 🎮 遊戲流程 API

### `CreateGame`

```json
{
  "type": "CreateGame",
  "payload": {
    "playerId": "p1",
    "seed": 42
  }
}
```

### `CreateGameResult`

```json
{
  "type": "CreateGameResult",
  "payload": {
    "success": true,
    "playerId": "p1",
    "gameId": "abc123",
    "round": 1,
    "seed": 42
  }
}
{
  "type": "CreateGameResult",
  "payload": {
    "success": false,
    "playerId": "p1",
    "reason": "game already exists"
  }
}
```

---

### `GetGameState`

```json
{
  "type": "GetGameState",
  "payload": {
    "gameId": "abc123",
    "playerId": "p1"
  }
}
```

### `GetGameStateResult`

```json
{
  "type": "GetGameStateResult",
  "payload": {
    "success": true,
    "gameId": "abc123",
    "playerId": "p1",
    "state": {
      "round": 1,
      "money": 10,
      "board": [
        { "id": "u001", "chess": "Knight", "level": 1, "position": [2, 3] }
      ],
      "bench": [
        { "id": "u002", "chess": "Archer", "level": 1 }
      ],
      "shop": [
        { "chess": "Mage", "level": 1 },
        { "chess": "Tank", "level": 1 },
        { "chess": "Knight", "level": 2 },
        { "chess": "Priest", "level": 1 },
        { "chess": "Hunter", "level": 1 }
      ],
      "synergies": [
        { "name": "Warrior", "count": 3, "bonusLevel": 1 }
      ],
      "level": 4,
      "xp": { "current": 2, "required": 6 }
    }
  }
}
{
  "type": "GetGameStateResult",
  "payload": {
    "success": false,
    "playerId": "p1",
    "reason": "game not found"
  }
}
{
  "type": "GetGameStateResult",
  "payload": {
    "success": false,
    "playerId": "p1",
    "reason": "player not in game"
  }
}
```

### `ListChess`

```json
{
  "type": "ListChess",
  "payload": {
    "playerId": "p1"
  }
}

```

### `ListChessResult`

```json
{
  "type": "ListChessResult",
  "payload": {
    "success": true,
    "playerId": "p1",
    "board": [
      {
        "id": "u001",
        "chess": "Knight",
        "level": 2,
        "position": [2, 3],
        "hp": 850,
        "maxHp": 1000,
        "mp": 20,
        "maxMp": 100,
        "attack": 120,
        "attackSpeed": 1.0,
        "synergies": ["Warrior", "Human"],
        "status": ["Frozen"]
      }
    ],
    "bench": [
      {
        "id": "u002",
        "chess": "Archer",
        "level": 1,
        "benchIndex": 0,
        "hp": 500,
        "maxHp": 500,
        "attack": 90,
        "attackSpeed": 1.5,
        "synergies": ["Elf", "Hunter"],
        "status": []
      }
    ]
  }
}
{
  "type": "ListChessResult",
  "payload": {
    "success": false,
    "playerId": "p1",
    "reason": "player not found"
  }
}
{
  "type": "ListChessResult",
  "payload": {
    "success": false,
    "playerId": "p1",
    "reason": "game not started"
  }
}
```

---

## 🛍 商店相關 API

### `RefreshShop`

```json
{
  "type": "RefreshShop",
  "payload": {"playerId": "p1"}
}
```

### `RefreshShopResult`

```json
{
  "type": "RefreshShopResult",
  "payload": {
    "success": true,
    "playerId": "p1",
    "shop": [
      { "chess": "Mage", "level": 1 },
      { "chess": "Tank", "level": 1 },
      { "chess": "Knight", "level": 2 },
      { "chess": "Priest", "level": 1 },
      { "chess": "Hunter", "level": 1 }
    ],
    "money": 8
  }
}
{
  "type": "RefreshShopResult",
  "payload": {
    "success": false,
    "playerId": "p1",
    "reason": "not enough money"
  }
}
{
  "type": "RefreshShopResult",
  "payload": {
    "success": false,
    "playerId": "p1",
    "reason": "shop is locked"
  }
}
```

---

### `BuyChess`

```json
{
  "type": "BuyChess",
  "payload": { 
      "playerId": "p1",
      "chessName": "Knight" 
  }
}
```

### `BuyChessResult`

```json
{
  "type": "BuyChessResult",
  "payload": {
    "playerId": "p1",
    "success": true,
    "money": 7,
    "bench": [
      { "id": "u003", "chess": "Knight", "level": 1 }
    ]
  }
}
{
  "type": "BuyChessResult",
  "payload": {
    "playerId": "p1",
    "success": false,
    "reason": "not enough money"
  }
}
{
  "type": "BuyChessResult",
  "payload": {
    "playerId": "p1",
    "success": false,
    "reason": "bench full"
  }
}

```

---

### `LockShop`

```json
{
  "type": "LockShop",
  "payload": {
    "playerId": "p1",
    "locked": true
  }
}
```

### `LockShopResult`

```json
{
  "type": "LockShopResult",
  "payload": {
    "playerId": "p1",
    "success": true,
    "locked": true
  }
}
{
  "type": "LockShopResult",
  "payload": {
    "playerId": "p1",
    "success": false,
    "reason": "game not started"
  }
}

```

---

## ♟ 棋子操作 API

### `MoveChess`

```json
// 從 bench 移到 board（單純放上去）
{
  "type": "MoveChess",
  "payload": {
    "playerId": "p1",
    "from": "bench-0",
    "to": [2, 3]
  }
}
{
  "type": "MoveChessResult",
  "payload": {
    "success": true,
    "playerId": "p1",
    "board": [
      { "id": "u010", "chess": "Mage", "level": 1, "position": [2, 3] }
    ]
  }
}

// board ↔ board（兩格交換）
{
  "type": "MoveChess",
  "payload": {
    "playerId": "p1",
    "from": [2, 3],
    "to": [1, 1]
  }
}
{
  "type": "MoveChessResult",
  "payload": {
    "success": true,
    "playerId": "p1",
    "board": [
      { "id": "u011", "chess": "Knight", "level": 1, "position": [1, 1] },
      { "id": "u012", "chess": "Tank", "level": 2, "position": [2, 3] }
    ]
  }
}
// bench ↔ board（互換）
{
  "type": "MoveChess",
  "payload": {
    "playerId": "p1",
    "from": "bench-1",
    "to": [3, 3]
  }
}
{
  "type": "MoveChessResult",
  "payload": {
    "success": true,
    "playerId": "p1",
    "bench": [
      { "id": "u013", "chess": "Priest", "level": 1 }
    ],
    "board": [
      { "id": "u014", "chess": "Hunter", "level": 1, "position": [3, 3] }
    ]
  }
}
// board → bench（拉回板凳）
{
  "type": "MoveChess",
  "payload": {
    "playerId": "p1",
    "from": [2, 2],
    "to": "bench"
  }
}
{
  "type": "MoveChessResult",
  "payload": {
    "success": true,
    "playerId": "p1",
    "bench": [
      { "id": "u015", "chess": "Mage", "level": 2 }
    ]
  }
}
// 操作失敗（位置錯誤或場上已滿）
{
  "type": "MoveChess",
  "payload": {
    "playerId": "p1",
    "from": "bench-0",
    "to": [5, 5]
  }
}
{
  "type": "MoveChessResult",
  "payload": {
    "success": false,
    "playerId": "p1",
    "reason": "invalid move"
  }
}
{
  "type": "MoveChessResult",
  "payload": {
    "success": false,
    "playerId": "p1",
    "reason": "board is full"
  }
}
{
  "type": "MoveChessResult",
  "payload": {
    "success": false,
    "playerId": "p1",
    "reason": "invalid unit"
  }
}

```

---

### `MergeNotice`

```json
{
  "type": "MergeNotice",
  "payload": {
    "success": true,
    "unitIds": ["u001", "u002", "u003"],
    "newUnit": {
      "id": "u009",
      "chess": "Knight",
      "level": 2
    }
  }
}
```

---

### `SellChess`

```json
{
  "type": "SellChess",
  "payload": { 
    "playerId": "p1",
    "unitId": "u003" 
  }
}
```

### `SellChessResult`

```json
{
  "type": "SellChessResult",
  "payload": {
    "playerId": "p1",
    "success": true,
    "money": 6,
    "bench": [
      { "id": "u004", "chess": "Mage", "level": 1 }
    ],
    "board": [
      { "id": "u002", "chess": "Knight", "level": 1, "position": [1, 2] },
      { "id": "u003", "chess": "Archer", "level": 1, "position": [2, 2] }
    ]
  }
}
{
  "type": "SellChessResult",
  "payload": {
    "playerId": "p1",
    "success": false,
    "reason": "invalid unitId"
  }
}

```

---

## ⬆️ 等級與經驗 API

### `BuyXP`

```json
{
  "type": "BuyXP",
  "payload": {"playerId": "p1"}
}
```

### `BuyXPResult`

```json
{
  "type": "BuyXPResult",
  "payload": {
    "playerId": "p1",
    "success": true,
    "money": 4,
    "xp": { "current": 6, "required": 8 }
  }
}
{
  "type": "BuyXPResult",
  "payload": {
    "playerId": "p1",
    "success": false,
    "reason": "not enough money"
  }
}

```

---

### `XPUpdatedNotice` (Server 推播)

```json
{
  "type": "XPUpdatedNotice",
  "payload": {
    "playerId": "p1",
    "level": 4,
    "money": 5,
    "xp": { "current": 4, "required": 6 }
  }
}
```

---

### `LevelUpNotice` (Server 推播)

```json
{
  "type": "LevelUpNotice",
  "payload": {
    "playerId": "p1",
    "level": 5,
    "money": 3,
    "xp": { "current": 0, "required": 8 }
  }
}
```

### `BattleNotice` (Server 推播)

```json
{
  "type": "BattleNotice",
  "payload": {
    "playerId": "p1"
  }
}

```

## ⚔️ 戰鬥過程推播 API（Battle Phase Events）

這些事件皆為 Server-to-Client 單向推播，Client 僅需顯示，不需發送任何回應。

---

### `UnitMoved`

```json
{
  "type": "UnitMoved",
  "payload": {
    "unitId": "u001",
    "from": [2, 3],
    "to": [2, 4]
  }
}
```

---

### `UnitAttacked`

```json
{
  "type": "UnitAttacked",
  "payload": {
    "attackerId": "u001",
    "targetId": "u002",
    "damage": {
      "physical": 80,
      "magical": 40,
      "true": 0
    },
    "isCritical": true
  }
}
```

---

### `DamageTaken`

```json
{
  "type": "DamageTaken",
  "payload": {
    "unitId": "u002",
    "sourceId": "u001",
    "damage": {
      "physical": 80,
      "magical": 40,
      "true": 0
    },
    "isCritical": true,
    "remainingHp": 250
  }
}
```

---

### `AttackSpeedChanged`

```json
{
  "type": "AttackSpeedChanged",
  "payload": {
    "unitId": "u003",
    "oldSpeed": 1.2,
    "newSpeed": 0.8,
    "reason": "Buff: Berserk"
  }
}
```

---

### `SkillCasted`

```json
{
  "type": "SkillCasted",
  "payload": {
    "unitId": "u004",
    "skillName": "Fireball",
    "targets": ["u002", "u005"],
    "damage": 200,
    "mpUsed": 100
  }
}
```

---

### `UnitDied`

```json
{
  "type": "UnitDied",
  "payload": {
    "unitId": "u005"
  }
}
```

---

### `BattleEnded`

```json
{
  "type": "BattleEnded",
  "payload": {
    "result": "win",
    "playerId": "p1",
    "round": 3,
    "remainingUnits": ["u001", "u003"]
  }
}
```