# 大富翁 Monopoly 游戏使用说明

## 一、在电脑上运行游戏

### 方法1：直接运行（推荐）

1. 双击 `run.bat` 文件
2. 浏览器会自动打开游戏页面
3. 如果没有自动打开，手动访问 http://127.0.0.1:5000

### 方法2：命令行运行

```bash
python app.py
```

然后在浏览器打开 http://127.0.0.1:5000

---

## 二、在手机/平板上游玩

### 局域网游玩（同一WiFi下）

1. 在电脑上启动游戏服务器（运行 `run.bat`）
2. 记住终端显示的局域网地址（如 `http://192.168.1.100:5000`）
3. 手机/平板连接**同一WiFi**
4. 在手机浏览器输入上面的地址即可游玩
5. 建议横屏操作

### 安装APK（离线游玩）

见下方「构建APK」部分

---

## 三、游戏模式

### 单人 vs 电脑
- 开始界面设置1个人类玩家 + 1~5个电脑玩家
- 电脑AI会自动决策（购买、建造、拍卖）

### 多人同设备
- 2~6人轮流在同一设备上操作
- 每人轮到自己时掷骰子、做决策

### 多设备联机
1. 一台电脑运行服务器（主机）
2. 其他设备用浏览器连接
3. 主机创建房间，其他设备加入
4. 所有操作通过服务器同步

---

## 四、构建APK（获取安装包）

### 方法A：GitHub Actions 自动构建（推荐）

**步骤：**

1. 注册 GitHub 账号（https://github.com，免费）
2. 点击右上角 `+` → `New repository`
3. 填写仓库名（如 `monopoly`），选择 `Public`，点击 `Create repository`
4. 点击 `uploading an existing file` 链接
5. 将 `monopoly` 文件夹内的**所有文件**拖入上传区域
   - 包括：`app.py`、`build_standalone.py`、`requirements.txt`、`run.bat`
   - `static/` 文件夹（game.js、ui.js、style.css）
   - `templates/` 文件夹（index.html）
   - `cordova/` 文件夹
   - `.github/workflows/` 文件夹
6. 点击 `Commit changes`
7. 点击页面上方的 `Actions` 标签
8. 如果看到「开始使用 GitHub Actions」的模板页面，说明 `.github/workflows/build-apk.yml` 还没上传成功，请检查是否包含该文件
9. 等待构建完成（约10~15分钟）
10. 构建完成后，点击对应的构建记录
11. 在页面底部 `Artifacts` 区域下载 `monopoly-android-apk` 文件
12. 解压后得到 `.apk` 文件
13. 在手机上安装（需开启「允许安装未知来源应用」）

> **提示**：如果构建失败（显示红色 ❌），通常是 Android SDK 没装好。请把 `.github/workflows/build-apk.yml` 文件内容换成项目里最新版本，然后重新提交。

### 方法B：Google Colab 构建

1. 打开 https://colab.research.google.com
2. 新建笔记本
3. 复制以下代码运行：

```python
# 安装依赖
!apt-get update && apt-get install -y openjdk-17-jdk
!npm install -g cordova@12
!pip install flask flask-socketio

# 上传项目文件
from google.colab import files
uploaded = files.upload()  # 上传 standalone.html 和 config.xml

# 创建 Cordova 项目
!cordova create monopoly-app com.monopoly.game "Monopoly"
!cp standalone.html monopoly-app/www/index.html
!cp config.xml monopoly-app/config.xml
%cd monopoly-app
!cordova platform add android
!cordova build android --debug

# 下载 APK
from google.colab import files
files.download('platforms/android/app/build/outputs/apk/debug/app-debug.apk')
```

4. 上传 `standalone.html` 和 `cordova/config.xml` 两个文件
5. 等待构建完成（约15分钟）
6. APK 会自动下载

---

## 五、游戏规则速览

### 基本规则
- 每人初始资金 ¥1500
- 掷骰子前进，经过起点收 ¥200
- 双数可再掷一次（连续3次双数入狱）

### 购买地产
- 落在无主地产上可选择购买或拍卖
- 拥有同色全部地产时，无建筑地产租金翻倍

### 建造房屋
- 需集齐同色全部地产
- 建造需均匀（不能差距超过1座）
- 5座房屋 = 酒店

### 监狱
- 入狱方式：踩到「入狱」格、连续3次双数、抽到入狱卡
- 出狱方式：掷双数、支付¥50、使用出狱卡
- 最多关3轮，第3轮必须支付¥50出狱

### 抵押
- 无建筑的地产可抵押（获得抵押价值）
- 赎回需支付抵押价值的110%

### 破产
- 负债超过总资产即破产
- 破产者资产转给债权人或银行

---

## 六、文件结构

```
monopoly/
├── app.py                 # Flask 服务器（联机+静态文件）
├── build_standalone.py    # 生成独立版HTML
├── run.bat                 # Windows 启动脚本
├── requirements.txt        # Python 依赖
├── standalone.html         # 独立版游戏（可直接打开）
├── templates/
│   └── index.html         # 游戏页面
├── static/
│   ├── game.js            # 游戏核心引擎
│   ├── ui.js              # 界面交互逻辑
│   └── style.css          # 样式表
├── cordova/
│   ├── config.xml         # Cordova 配置
│   └── www/
│       └── index.html     # APK 用独立版
└── .github/workflows/
    └── build-apk.yml      # APK 自动构建
```
