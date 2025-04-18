## 專案目標

![應用程式預覽圖](/demo-screenshot.png)

建立一個線上的分軌音檔播放器 Web 應用程式。

## 核心功能

1.  **基於 `waveform-playlist` 套件：** 利用其多軌波形顯示與編輯能力 ([https://www.npmjs.com/package/waveform-playlist](https://www.npmjs.com/package/waveform-playlist))。
2.  **播放專案內音檔：** 能夠讀取並播放在伺服器端指定資料夾內的音檔。
3.  **使用者上傳播放：**
    *   允許使用者同時上傳多個音檔。
    *   上傳的音檔**僅儲存於瀏覽器記憶體**中進行處理與播放，不儲存至伺服器。
4.  **分軌播放控制：** 應用 `waveform-playlist` 提供各音軌獨立的播放、靜音、獨奏、音量調整等控制。

## 目前進度

*   **基礎架構：** 使用 Next.js 建立專案。
*   **核心整合：** 成功將 `waveform-playlist` v6.0.0-alpha.14 整合至 React 元件中。
*   **使用者上傳 (純前端)：**
    *   實現了讓使用者透過瀏覽器選擇多個音訊檔案的功能。
    *   利用 `URL.createObjectURL()` 在瀏覽器端直接載入並處理音檔，**不上傳至伺服器**，符合核心功能要求。
    *   顯示檔案載入進度。
    *   自動管理及釋放 Blob URL 記憶體。
*   **播放器功能：**
    *   透過 `waveform-playlist` 的事件發射器 (EventEmitter) 實現了主要播放控制 (播放、暫停、停止、倒轉、快進) 和主音量調整。
    *   `waveform-playlist` 內建的各軌控制 (靜音、獨奏、音量) 已啟用。
    *   實現了可切換的波形自動捲動功能。
*   **移除/停用：** 移除了先前版本中的縮放控制、錄音和匯出功能相關程式碼。

## 未來規劃

*   支援播放來自公開 Google Drive 連結的音檔。 