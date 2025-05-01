@echo off
echo === 自走棋模擬器前端框架構建腳本 ===
echo.

echo 1. 檢查 Node.js 安裝...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [錯誤] 未找到 Node.js，請先安裝 Node.js: https://nodejs.org/
    exit /b 1
)
echo [成功] 已找到 Node.js

echo 2. 安裝依賴...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [錯誤] 安裝依賴失敗
    exit /b 1
)
echo [成功] 依賴安裝完成

echo 3. 編譯 TypeScript 檔案...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [錯誤] TypeScript 編譯失敗
    exit /b 1
)
echo [成功] TypeScript 編譯完成

echo 4. 啟動開發伺服器...
echo [提示] 按 Ctrl+C 可停止伺服器
echo [提示] 伺服器啟動後，請訪問 http://localhost:8080
echo.
call npm run start