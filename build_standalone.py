"""
构建独立版 HTML 文件 - 用于 APK 打包
将所有 CSS/JS 合并为单个 HTML 文件，无需服务器即可运行
"""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def build_standalone():
    # 读取各文件内容
    with open(os.path.join(BASE_DIR, 'static', 'style.css'), 'r', encoding='utf-8') as f:
        css = f.read()
    with open(os.path.join(BASE_DIR, 'static', 'game.js'), 'r', encoding='utf-8') as f:
        game_js = f.read()
    with open(os.path.join(BASE_DIR, 'static', 'ui.js'), 'r', encoding='utf-8') as f:
        ui_js = f.read()

    # 修改 ui.js：禁用联机模式（独立版无服务器）
    ui_js_modified = ui_js.replace(
        "startHostGame()",
        "alert('独立版不支持联机模式。请使用电脑版（运行 app.py）进行联机对战。')"
    ).replace(
        "joinOnlineGame()",
        "alert('独立版不支持联机模式。请使用电脑版（运行 app.py）进行联机对战。')"
    )

    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="theme-color" content="#1a1a2e">
    <title>大富翁 Monopoly</title>
    <style>
{css}
    </style>
</head>
<body>
    <!-- 设置界面 -->
    <div id="setup-screen">
        <div class="setup-card">
            <div class="setup-title">大富翁</div>
            <div class="setup-subtitle">经典地产经营游戏 · 官方规则</div>
            <div id="player-list"></div>
            <div style="display:flex; gap:8px; margin-top:10px;">
                <button class="btn-add-player" id="add-player-btn" style="flex:1; padding:8px; font-size:14px;">+ 添加玩家</button>
            </div>
            <button class="btn-start-game" id="start-game-btn">开始游戏</button>
            <button class="btn-online" id="online-btn">联机对战</button>
            <div class="online-panel" id="online-panel">
                <div class="online-status" id="online-status" style="padding:10px;text-align:center;color:#636e72;">
                    独立版不支持联机模式<br>请使用电脑版进行联机对战
                </div>
            </div>
            <div class="setup-info">
                单人 vs 电脑 AI<br>
                多人同设备轮流游玩<br>
                横屏操作 · 官方规则<br>
                建造房屋酒店·抵押·拍卖
            </div>
        </div>
    </div>

    <!-- 游戏界面 -->
    <div id="game-screen">
        <div class="game-container">
            <div class="board-wrapper">
                <div class="board" id="board"></div>
            </div>
            <div class="sidebar">
                <div class="sidebar-header">
                    <span>大富翁</span>
                    <span class="turn-indicator" id="turn-indicator">回合 1</span>
                </div>
                <div class="players-panel" id="players-panel"></div>
                <div class="action-panel" id="action-panel"></div>
                <div class="log-panel" id="log-panel"></div>
            </div>
        </div>
    </div>

    <!-- 弹窗 -->
    <div class="modal-overlay" id="modal-overlay">
        <div class="modal-card" id="modal-content"></div>
    </div>

    <script>
{game_js}

{ui_js_modified}
    </script>
</body>
</html>'''

    output_path = os.path.join(BASE_DIR, 'cordova', 'www', 'index.html')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    size_kb = os.path.getsize(output_path) / 1024
    print(f"独立版 HTML 已生成: {output_path}")
    print(f"文件大小: {size_kb:.1f} KB")

    # 同时生成一份在项目根目录
    root_path = os.path.join(BASE_DIR, 'standalone.html')
    with open(root_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"根目录副本: {root_path}")

if __name__ == '__main__':
    build_standalone()
