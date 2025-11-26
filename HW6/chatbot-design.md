# Emoji Maze Puzzle – Chatbot Design

## Theme & Concept
Emoji Maze Puzzle 是一款以 LINE 文本對話為介面的小型解謎冒險。玩家必須在 7×7 的迷宮中探索、拾取 🔑 鑰匙、觸發 ❓ 謎題並成功解開，最後才能到達 🚪 出口逃脫。整個地圖與人物狀態都透過 emoji 文本顯示，以減少設計 Flex 的成本，同時保留豐富的遊戲感。

## Game Rules
1. 每回合可執行一個動作（上/下/左/右/地圖/提示/重來/狀態）。  
2. 玩家初始座標固定在 (1,1)。  
3. 需要撿到 🔑 並至少解完一次 ❓ 才能通過 🚪。  
4. 走到 ❓ 會觸發 LLM 產生的謎語或提示，成功後 `riddlesSolved` 會記錄一次。  
5. 當 LLM 無法使用（quota 或錯誤）時，提示會退回固定文字，遊戲仍可持續。

## Conversation Flow
| 使用者 | Bot |
| --- | --- |
| 「開始」或加入好友 | 說明遊戲規則並送出地圖 + 快速回覆 |
| 「⬆️」或「往上走」 | 更新位置、描述事件（例如撞牆） |
| 走到 🔑 | 系統訊息「撿起鑰匙！」並更新地圖 |
| 走到 ❓ | 呼叫 Gemini 產生 60 字內的提示；若 LLM Down 則顯示 fallback |
| 「提示」 | 強制呼叫 Gemini，回傳額外的 flavor text |
| 取得鑰匙 + 解謎後到 🚪 | 宣布勝利、可輸入「重來」重新開始 |

### Templates & UI 元件
- **Text**：主要敘事、遊戲結果、錯誤訊息。  
- **Quick Replies**：⬆️⬇️⬅️➡️🧭💡🔄，讓玩家即使在 LLM 停擺時也可繼續遊戲。  
- **Flex Bubble**：`help` / `說明` 指令會推送 legend 與操作說明，對應 HW 要求示範不同 UI。  

## Gemini Prompts
1. **Command Parsing**  
   - 系統提示限制輸出 JSON，欄位為 `action`, `confidence`, `reason`，只允許 8 種行為。  
   - 提供 session summary（座標、是否有鍵、謎題次數、步數）。  
   - 不確定時必須輸出 `STATUS`，避免亂跑。
2. **Hint / Flavor**  
   - 角色扮演「謎題守護者」，60 字內，繁體中文，不直接透漏答案。  
   - 輸入同樣的 session summary，使提示依據玩家進度調整。  
3. **Rate Limit Handling**  
   - wrapper 偵測 429 or fetch error，丟出 `LLMRateLimitError`，webhook 會把 `llmDisabledUntil` 設定為 10 分鐘後並改用固定提示：「提示系統正在冷卻」。  

## Error & Fallback
- **LLM 失敗**：改用關鍵字 parser + 固定提示。  
- **Mongo 連線失敗**：throw 500，LINE 使用者收到「系統忙碌」訊息。  
- **未授權的 Admin**：回應 401 並要求 Basic Auth。  

## Admin Backoffice
- `/admin` 需 Basic Auth。  
- Stats 卡片顯示使用者、場次、完成數、訊息量。  
- 表格支援搜尋（LINE ID/暱稱）與日期篩選；SWR 每 3 秒輪詢。  
- `/admin/sessions/[id]` 顯示單場資訊、即時迷宮地圖（renderMap），以及 `MessageLog` transcript。  
- API routes：`/api/admin/stats`, `/api/admin/sessions`, `/api/admin/session/[id]/messages` 皆在 server 端加上 Basic Auth 驗證。  

## Data Model & Logging
- `User`：儲存 LINE userId/暱稱。  
- `GameSession`：紀錄座標、鑰匙、謎題數、狀態。  
- `MessageLog`：保存使用者/機器人訊息、是否使用 LLM、原始 LINE event。  
- 所有 webhook event 都會紀錄 user/bot 雙向訊息，方便後台顯示與除錯。  

## Deployment Notes
- Next.js 14 App Router + Vercel。  
- MongoDB Atlas (Mongoose connection singleton)。  
- 所有 secrets 放在 `.env.local`。  
- 若 LLM 長時間不可用，遊戲仍可 100% 完成（只是不會有動態提示），確保 HW6 要求的回覆可靠性。

