import * as pc from 'playcanvas';

/**
 * LobbyUI - 簡化版本
 * 只包含標題和開始遊戲按鈕
 */
export class LobbyUI extends pc.Entity {
  private app: pc.Application;
  private fontAsset: pc.Asset | null = null;
  private htmlButton: HTMLButtonElement | null = null;
  
  /**
   * 創建大廳UI
   * @param app PlayCanvas應用實例
   */
  constructor(app: pc.Application) {
    super('LobbyUI');
    
    this.app = app;
    
    // 等待字體資源加載完成後初始化UI
    this.loadFontAsset()
      .then(() => this.initialize())
      .catch(err => console.error('加載字體資源失敗:', err));
  }
  
  /**
   * 加載字體資源
   */
  private loadFontAsset(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 檢查是否已有字體資源
      const fontAsset = this.app.assets.find('chinese.json', 'font');
      if (fontAsset) {
        this.fontAsset = fontAsset;
        resolve();
        return;
      }
      
      // 加載字體資源
      this.app.assets.loadFromUrl('assets/fonts/chinese.json', 'font', (err, asset) => {
        if (err) {
          reject(err);
          return;
        }
        
        this.fontAsset = asset as pc.Asset;
        resolve();
      });
    });
  }
  
  /**
   * 初始化大廳UI
   */
  private initialize(): void {
    if (!this.fontAsset) {
      console.error('字體資源未加載');
      return;
    }
    
    // 創建屏幕元素組件
    this.addComponent('screen', {
      referenceResolution: new pc.Vec2(1920, 1080),
      screenSpace: true
    });
    
    // 創建框框容器 - 增加尺寸
    const container = new pc.Entity('Container');
    container.addComponent('element', {
      type: 'image',
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5), // 置中
      pivot: new pc.Vec2(0.5, 0.5),
      width: 1000,    // 從 600 增加到 800
      height: 700,   // 從 400 增加到 600
      color: new pc.Color(0.1, 0.15, 0.3, 0.7), // 半透明深藍色
      margin: new pc.Vec4(0, 0, 0, 0)
    });

    // 添加邊框
    const border = new pc.Entity('Border');
    border.addComponent('element', {
      type: 'image',
      anchor: new pc.Vec4(0, 0, 1, 1),
      pivot: new pc.Vec2(0.5, 0.5),
      margin: new pc.Vec4(2, 2, 2, 2),
      color: new pc.Color(0.5, 0.5, 0.8, 0.5) // 淺藍色邊框
    });
    container.addChild(border);

    this.addChild(container);

    // 創建標題 - 更靠上
    const title = new pc.Entity('Title');
    title.addComponent('element', {
      type: 'text',
      anchor: new pc.Vec4(0.5, 0.85, 0.5, 0.85),  // 從 0.8 調整到 0.85
      pivot: new pc.Vec2(0.5, 0.5),
      width: 600,  // 增加寬度以適應更大的容器
      height: 100,
      fontAsset: this.fontAsset,
      fontSize: 64,
      color: new pc.Color(1, 1, 1),
      text: '自走棋模擬器',
      textAlign: 'center',
      autoWidth: false,
      autoHeight: true
    });
    container.addChild(title); // 添加到容器內
    
    // 在標題和按鈕之間添加遊戲簡介 - 加大行距
    const gameIntro = new pc.Entity('GameIntro');
    gameIntro.addComponent('element', {
      type: 'text',
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),  // 位於容器中央
      pivot: new pc.Vec2(0.5, 0.5),
      width: 800,
      height: 320,  // 適度調整高度
      fontAsset: this.fontAsset,
      fontSize: 22,
      lineHeight: 28,  // 適度調整行高，從32降到28
      color: new pc.Color(0.9, 0.9, 0.9),
      text: '《自走棋模擬器》是一款策略性回合制棋盤遊戲，您將收集、升級各種角色棋子，\n' + 
            '並在六角形棋盤上合理佈陣，與其他玩家進行對戰。\n\n' +
            '遊戲特色：\n' + 
            '• 豐富多樣的角色陣容\n' + // 減少列表項之間的額外空行
            '• 深度策略的戰術組合\n' +
            '• 即時對戰的競技體驗\n' +
            '• 獨特的協同效果系統\n\n' +
            '準備好挑戰了嗎？點擊下方按鈕，開始您的自走棋之旅！',
      textAlign: 'center',
      autoWidth: false,
      autoHeight: false,
      wrapLines: true
    });
    container.addChild(gameIntro);
    
    // HTML按鈕 - 更溫和的藍色調
    const button = document.createElement('button');
    button.textContent = '開始遊戲';
    button.style.position = 'absolute';
    button.style.left = '50%';
    button.style.top = '77%'; 
    button.style.transform = 'translate(-50%, -50%)';
    button.style.width = '200px';
    button.style.height = '70px';
    button.style.backgroundColor = '#3377cc'; // 將紅色 (#ff0000) 改為舒適的藍色
    button.style.color = 'white';
    button.style.fontSize = '22px';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.zIndex = '9999';
    button.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.7)';
    
    // 添加事件監聽
    button.addEventListener('click', () => {
      console.log('開始遊戲按鈕被點擊');
      this.app.fire('switchToGame');
    });
    
    // 添加到文檔
    document.body.appendChild(button);
    this.htmlButton = button;
  }
  
  /**
   * 銷毀方法 - 清理資源
   */
  public destroy(): void {
    // 移除 HTML 按鈕
    if (this.htmlButton && document.body.contains(this.htmlButton)) {
      document.body.removeChild(this.htmlButton);
      this.htmlButton = null;
    }
  }
}
