// ============================================
// 大富翁 Monopoly - UI 控制器
// ============================================

const DICE_DOTS = {
    1:[0,0,0,0,1,0,0,0,0], 2:[1,0,0,0,0,0,0,0,1],
    3:[1,0,0,0,1,0,0,0,1], 4:[1,0,1,0,0,0,1,0,1],
    5:[1,0,1,0,1,0,1,0,1], 6:[1,0,1,1,0,1,1,0,1]
};

class GameUI {
    constructor() {
        this.engine = new GameEngine();
        this.aiPlayers = [];
        this.network = null;
        this.mode = 'local';
        this.turnNumber = 1;
        this.setupPlayers = [
            {name:'玩家1', isAI:false},
            {name:'电脑AI', isAI:true}
        ];
        this.pendingCard = null;
        this.diceAnimating = false;
    }

    init() {
        // 分两步分别 try，确保按钮绑定至少能成功
        try {
            this.renderSetupScreen();
        } catch (err) {
            console.error('渲染设置界面失败:', err);
            // 失败时手动写一份保底玩家列表
            const list = document.getElementById('player-list');
            if (list) {
                list.innerHTML = '<div class="player-row"><span style="padding:8px;color:#636e72;">玩家1</span></div><div class="player-row"><span style="padding:8px;color:#636e72;">电脑AI</span></div>';
            }
        }
        try {
            this.bindSetupEvents();
        } catch (err) {
            console.error('绑定事件失败:', err);
        }
    }

    // ========== 设置界面 ==========
    renderSetupScreen() {
        const list = document.getElementById('player-list');
        if (!list) return;
        list.innerHTML = '';
        const colors = (typeof PLAYER_COLORS !== 'undefined' && PLAYER_COLORS.length) ? PLAYER_COLORS : [
            {hex:'#e74c3c'}, {hex:'#3498db'}, {hex:'#2ecc71'}, {hex:'#f1c40f'}, {hex:'#9b59b6'}, {hex:'#e67e22'}
        ];
        this.setupPlayers.forEach((p, i) => {
            const color = colors[i % colors.length];
            const row = document.createElement('div');
            row.className = 'player-row';
            row.innerHTML = `
                <div class="player-color-dot" style="background:${color.hex}"></div>
                <input class="player-name-input" type="text" value="${p.name}" data-idx="${i}" maxlength="10">
                <label class="ai-toggle"><input type="checkbox" data-idx="${i}" ${p.isAI?'checked':''}>电脑</label>
                ${this.setupPlayers.length > 2 ? `<button class="btn-remove-player" data-idx="${i}">-</button>` : ''}
            `;
            list.appendChild(row);
        });
        document.getElementById('add-player-btn').style.display = this.setupPlayers.length >= 6 ? 'none' : 'block';

        list.querySelectorAll('.player-name-input').forEach(inp => {
            inp.oninput = e => { this.setupPlayers[+e.target.dataset.idx].name = e.target.value; };
        });
        list.querySelectorAll('.ai-toggle input').forEach(cb => {
            cb.onchange = e => { this.setupPlayers[+e.target.dataset.idx].isAI = e.target.checked; };
        });
        list.querySelectorAll('.btn-remove-player').forEach(btn => {
            btn.onclick = e => {
                this.setupPlayers.splice(+e.target.dataset.idx, 1);
                this.renderSetupScreen();
            };
        });
    }

    _bindClick(el, handler) {
        if (!el) return;
        // 同时绑定 click 和 touchstart，保证移动端和桌面端都能触发
        el.addEventListener('click', handler);
        el.addEventListener('touchend', (e) => {
            e.preventDefault();
            handler(e);
        });
    }

    bindSetupEvents() {
        this._bindClick(document.getElementById('add-player-btn'), () => {
            if (this.setupPlayers.length < 6) {
                this.setupPlayers.push({name:`玩家${this.setupPlayers.length+1}`, isAI:true});
                this.renderSetupScreen();
            }
        });
        this._bindClick(document.getElementById('start-game-btn'), () => this.startLocalGame());
        this._bindClick(document.getElementById('online-btn'), () => {
            document.getElementById('online-panel').classList.toggle('active');
        });
        this._bindClick(document.getElementById('host-game-btn'), () => this.startHostGame());
        this._bindClick(document.getElementById('join-game-btn'), () => this.joinOnlineGame());
    }

    startLocalGame() {
        if (!this.setupPlayers || this.setupPlayers.length < 2) {
            alert('至少需要 2 名玩家才能开始游戏，请先点击「+ 添加玩家」。');
            return;
        }
        this.mode = 'local';
        try {
            this.engine.init(this.setupPlayers);
            this.aiPlayers = this.setupPlayers
                .map((p, i) => p.isAI ? new AIPlayer(this.engine, i) : null)
                .filter(a => a !== null);
            this.turnNumber = 1;
            this.showGameScreen();
            this.renderBoard();
            this.updateAll();
            this.handlePhase();
        } catch (err) {
            console.error('开始游戏失败:', err);
            alert('开始游戏失败: ' + err.message);
        }
    }

    // ========== 联机 ==========
    startHostGame() {
        this.mode = 'host';
        const url = document.getElementById('server-url-input').value;
        if (!url) {
            document.getElementById('online-status').textContent = '请在游戏页面顶部查看服务器地址';
        }
        // 在实际使用中，主机运行Flask服务器
        this.startLocalGame();
        document.getElementById('online-status').textContent = '主机模式：其他玩家可通过浏览器加入';
    }

    joinOnlineGame() {
        const url = document.getElementById('server-url-input').value;
        if (!url) {
            document.getElementById('online-status').textContent = '请输入服务器地址';
            return;
        }
        this.mode = 'client';
        this.network = new NetworkClient();
        this.network.onStateUpdate = (state) => {
            this.engine.loadState(state);
            this.updateAll();
        };
        this.network.onMessage = (msg) => {
            document.getElementById('online-status').textContent = msg;
        };
        this.network.connect(url,
            () => {
                document.getElementById('online-status').textContent = '连接成功！等待主机开始游戏...';
                document.getElementById('game-screen').classList.add('active');
                document.getElementById('setup-screen').style.display = 'none';
                this.renderBoard();
            },
            () => {
                document.getElementById('online-status').textContent = '连接失败，请检查地址';
            }
        );
    }

    // ========== 游戏界面 ==========
    showGameScreen() {
        document.getElementById('setup-screen').style.display = 'none';
        document.getElementById('game-screen').classList.add('active');
    }

    renderBoard() {
        const board = document.getElementById('board');
        board.innerHTML = '';
        for (let i = 0; i < 40; i++) {
            board.appendChild(this.createCell(i));
        }
        const center = document.createElement('div');
        center.className = 'board-center';
        center.id = 'board-center';
        center.innerHTML = `
            <div class="center-logo">大富翁</div>
            <div class="dice-area" id="dice-area"></div>
            <div class="dice-result" id="dice-result"></div>
            <div class="center-message" id="center-message">准备开始</div>
        `;
        board.appendChild(center);
        this.renderDice(0, 0);
    }

    createCell(idx) {
        const space = BOARD[idx];
        const cell = document.createElement('div');
        const [row, col] = this._spaceToGrid(idx);
        cell.style.gridRow = row + 1;
        cell.style.gridColumn = col + 1;
        cell.dataset.space = idx;
        cell.id = `cell-${idx}`;

        let classes = ['cell'];
        const side = this._getCellSide(idx);
        if (side === 'corner') {
            classes.push('cell-corner');
            if (space.sub === 'go') classes.push('go');
            if (space.sub === 'jail') classes.push('jail');
            if (space.sub === 'parking') classes.push('parking');
        } else {
            classes.push(`cell-${side}`);
        }
        if (space.type === 'chance') classes.push('cell-chance');
        if (space.type === 'chest') classes.push('cell-chest');
        if (space.type === 'tax') classes.push('cell-tax');
        if (space.type === 'go_to_jail') classes.push('cell-go-to-jail');
        if (space.type === 'property') classes.push('cell-property');
        if (space.type === 'railroad') classes.push('cell-railroad');
        if (space.type === 'utility') classes.push('cell-utility');
        cell.className = classes.join(' ');

        let html = '';
        if (space.color) {
            html += `<div class="color-bar color-${space.color}"></div>`;
        }
        html += `<div class="cell-name">${this._shortName(space.name)}</div>`;
        if (space.price) {
            html += `<div class="cell-price">¥${space.price}</div>`;
        }
        html += `<div class="cell-houses" id="houses-${idx}"></div>`;
        html += `<div class="token-container" id="tokens-${idx}"></div>`;
        cell.innerHTML = html;
        cell.onclick = () => this.onCellClick(idx);
        return cell;
    }

    // ========== 更新界面 ==========
    updateAll() {
        this.updateBoard();
        this.updatePlayersPanel();
        this.updateActionPanel();
        this.updateLog();
        this.updateTurnIndicator();
    }

    updateBoard() {
        const player = this.engine.currentPlayer();
        // 清除高亮
        document.querySelectorAll('.cell.current-pos').forEach(c => c.classList.remove('current-pos'));
        // 高亮当前位置
        const currCell = document.getElementById(`cell-${player.position}`);
        if (currCell) currCell.classList.add('current-pos');

        // 更新所有权和房屋
        for (let i = 0; i < 40; i++) {
            const state = this.engine.boardState[i];
            const cell = document.getElementById(`cell-${i}`);
            if (!cell) continue;

            // 所有权边框
            if (state.owner >= 0) {
                const pColor = PLAYER_COLORS[this.engine.players[state.owner].colorIdx];
                cell.style.borderColor = pColor.hex;
                cell.classList.add('owned');
            } else {
                cell.classList.remove('owned');
                cell.style.borderColor = '';
            }

            // 抵押
            if (state.mortgaged) cell.classList.add('mortgaged');
            else cell.classList.remove('mortgaged');

            // 房屋
            const housesEl = document.getElementById(`houses-${i}`);
            if (housesEl) {
                housesEl.innerHTML = '';
                if (state.houses > 0) {
                    if (state.houses === 5) {
                        housesEl.innerHTML = '<div class="hotel"></div>';
                    } else {
                        for (let h = 0; h < state.houses; h++) {
                            housesEl.innerHTML += '<div class="house"></div>';
                        }
                    }
                }
            }

            // 玩家标记
            const tokensEl = document.getElementById(`tokens-${i}`);
            if (tokensEl) {
                tokensEl.innerHTML = '';
                this.engine.players.forEach((p, pi) => {
                    if (!p.bankrupt && p.position === i) {
                        const token = document.createElement('div');
                        token.className = 'token';
                        if (pi === this.engine.currentIdx) token.classList.add('current');
                        token.style.background = PLAYER_COLORS[p.colorIdx].hex;
                        tokensEl.appendChild(token);
                    }
                });
            }
        }
    }

    updatePlayersPanel() {
        const panel = document.getElementById('players-panel');
        panel.innerHTML = '';
        this.engine.players.forEach((p, i) => {
            const card = document.createElement('div');
            card.className = 'player-card';
            if (i === this.engine.currentIdx) card.classList.add('current');
            if (p.bankrupt) card.classList.add('bankrupt');
            let meta = '';
            if (p.properties.length > 0) meta += `地产${p.properties.length}处`;
            if (p.getOutCards > 0) meta += ` 出狱卡×${p.getOutCards}`;
            card.innerHTML = `
                <div class="player-token-mini" style="background:${PLAYER_COLORS[p.colorIdx].hex}"></div>
                <div class="player-info">
                    <div class="player-name-text">${p.name}${p.isAI?' 🤖':''}${p.inJail?'<span class="player-jail-badge">狱中</span>':''}</div>
                    <div class="player-money">¥${p.money}</div>
                    ${meta ? `<div class="player-meta">${meta}</div>` : ''}
                </div>
            `;
            panel.appendChild(card);
        });
    }

    updateActionPanel() {
        const panel = document.getElementById('action-panel');
        const player = this.engine.currentPlayer();
        if (player.isAI || player.bankrupt) {
            panel.innerHTML = `<div style="text-align:center;color:#74b9ff;padding:10px;font-size:13px;">${player.name} 思考中...</div>`;
            return;
        }

        let html = '';
        switch (this.engine.phase) {
            case 'rolling':
                if (player.inJail) {
                    html = `<button class="btn-action btn-roll" onclick="ui.onRollDice()">掷骰子</button>`;
                    if (player.money >= 50) {
                        html += `<button class="btn-action btn-jail-pay" onclick="ui.onPayJailFine()">支付50元出狱</button>`;
                    }
                    if (player.getOutCards > 0) {
                        html += `<button class="btn-action btn-jail-card" onclick="ui.onUseJailCard()">使用出狱卡</button>`;
                    }
                } else {
                    html = `<button class="btn-action btn-roll" onclick="ui.onRollDice()">🎲 掷骰子</button>`;
                }
                break;
            case 'end_turn':
                html = `<button class="btn-action btn-end-turn" onclick="ui.onEndTurn()">结束回合</button>`;
                html += `<button class="btn-action btn-build" onclick="ui.showBuildDialog()">建造房屋</button>`;
                html += `<button class="btn-action btn-mortgage" onclick="ui.showMortgageDialog()">抵押地产</button>`;
                break;
            case 'auction':
                // 在拍卖界面单独处理
                break;
            default:
                // 其他阶段由弹窗处理
                break;
        }
        panel.innerHTML = html;
    }

    updateLog() {
        const panel = document.getElementById('log-panel');
        panel.innerHTML = '';
        const logs = this.engine.log.slice(-15);
        logs.forEach((msg, i) => {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            if (i === logs.length - 1) entry.classList.add('highlight');
            entry.textContent = msg;
            panel.appendChild(entry);
        });
        panel.scrollTop = panel.scrollHeight;
    }

    updateTurnIndicator() {
        const player = this.engine.currentPlayer();
        document.getElementById('turn-indicator').textContent = `${player.name}的回合`;
    }

    renderDice(d1, d2, rolling) {
        const area = document.getElementById('dice-area');
        if (!area) return;
        const makeDie = (val, rolling) => {
            const die = document.createElement('div');
            die.className = 'die' + (rolling ? ' rolling' : '');
            const face = document.createElement('div');
            face.className = 'die-face';
            const dots = DICE_DOTS[val] || DICE_DOTS[0];
            dots.forEach(d => {
                const dot = document.createElement('div');
                dot.className = 'die-dot' + (d ? '' : ' empty');
                face.appendChild(dot);
            });
            die.appendChild(face);
            return die;
        };
        area.innerHTML = '';
        area.appendChild(makeDie(d1, rolling));
        area.appendChild(makeDie(d2, rolling));
        const result = document.getElementById('dice-result');
        if (result) {
            if (d1 > 0 && d2 > 0) {
                result.textContent = `${d1} + ${d2} = ${d1 + d2}${d1 === d2 ? ' (双数!)' : ''}`;
            } else {
                result.textContent = '';
            }
        }
    }

    showMessage(msg) {
        const el = document.getElementById('center-message');
        if (el) el.textContent = msg;
    }

    // ========== 玩家操作 ==========
    onRollDice() {
        if (this.diceAnimating) return;
        this.diceAnimating = true;
        // 动画
        let count = 0;
        const interval = setInterval(() => {
            this.renderDice(Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1, true);
            count++;
            if (count >= 8) {
                clearInterval(interval);
                const result = this.engine.rollDice();
                this.renderDice(result.dice[0], result.dice[1], false);
                this.diceAnimating = false;
                this.updateAll();

                if (result.jail) {
                    this.showMessage('连续三次双数，入狱！');
                }

                setTimeout(() => {
                    if (this.engine.phase === 'landed') {
                        this.engine.handleLanding();
                        this.handlePhase();
                    } else if (this.engine.phase === 'end_turn') {
                        this.handlePhase();
                    }
                }, 500);
            }
        }, 80);
    }

    onEndTurn() {
        this.engine.endTurn();
        if (this.engine.phase === 'game_over') {
            this.showGameOverModal();
            return;
        }
        if (this.engine.dice[0] === this.engine.dice[1] && !this.engine.currentPlayer().inJail) {
            this.showMessage('双数！再掷一次');
        }
        this.handlePhase();
    }

    onPayJailFine() {
        const player = this.engine.currentPlayer();
        if (this.engine.payJailFine(player)) {
            this.updateAll();
            this.showMessage('已支付50元出狱');
        }
    }

    onUseJailCard() {
        const player = this.engine.currentPlayer();
        if (this.engine.useJailCard(player)) {
            this.updateAll();
            this.showMessage('使用了出狱卡');
        }
    }

    onCellClick(idx) {
        this.showPropertyCard(idx);
    }

    // ========== 阶段处理 ==========
    handlePhase() {
        this.updateAll();

        if (this.engine.phase === 'game_over') {
            this.showGameOverModal();
            return;
        }

        const player = this.engine.currentPlayer();
        if (player.isAI && !player.bankrupt) {
            this.processAITurn();
            return;
        }

        // 人类玩家
        switch (this.engine.phase) {
            case 'rolling':
                if (player.inJail) {
                    this.showMessage(`${player.name} 在狱中，掷双数出狱或支付50元`);
                } else {
                    this.showMessage(`${player.name} 的回合，掷骰子吧！`);
                }
                break;
            case 'buy_or_auction':
                this.showBuyDialog();
                break;
            case 'card':
                this.showCardDialog();
                break;
            case 'tax_choice':
                this.showTaxDialog();
                break;
            case 'auction':
                this.showAuctionDialog();
                break;
            case 'end_turn':
                const space = BOARD[player.position];
                if (space.type === 'corner') {
                    this.showMessage(`${player.name} 在 ${space.name}`);
                }
                break;
        }
    }

    // ========== AI 回合 ==========
    processAITurn() {
        const player = this.engine.currentPlayer();
        if (!player.isAI || player.bankrupt || this.engine.phase === 'game_over') {
            this.updateAll();
            return;
        }

        const ai = this.aiPlayers.find(a => a.playerIdx === player.id);
        if (!ai) { this.updateAll(); return; }

        const playerId = player.id;

        // 显示骰子动画
        if (this.engine.phase === 'rolling') {
            this.diceAnimating = true;
            let count = 0;
            const interval = setInterval(() => {
                this.renderDice(Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1, true);
                count++;
                if (count >= 6) {
                    clearInterval(interval);
                    this.diceAnimating = false;
                    this._executeAIAction(ai, playerId);
                }
            }, 80);
        } else {
            setTimeout(() => this._executeAIAction(ai, playerId), 600);
        }
    }

    _executeAIAction(ai, playerId) {
        ai.takeAction(() => {
            this.updateAll();
            const result = this.engine.dice;
            if (result[0] > 0) this.renderDice(result[0], result[1], false);

            if (this.engine.phase === 'game_over') {
                this.showGameOverModal();
                return;
            }

            // 如果同一个AI玩家还在回合中，继续处理
            if (this.engine.currentPlayer().id === playerId &&
                this.engine.currentPlayer().isAI &&
                !this.engine.currentPlayer().bankrupt) {
                setTimeout(() => this.processAITurn(), 500);
            } else {
                this.handlePhase();
            }
        });
    }

    // ========== 弹窗 ==========
    showModal(html) {
        document.getElementById('modal-content').innerHTML = html;
        document.getElementById('modal-overlay').classList.add('active');
    }

    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    }

    showPropertyCard(idx) {
        const space = BOARD[idx];
        const state = this.engine.boardState[idx];
        let ownerName = '无主';
        if (state.owner >= 0) {
            ownerName = this.engine.players[state.owner].name;
        }

        let html = '<div class="property-card-display">';
        if (space.color) {
            html += `<div class="property-card-header color-${space.color}">${space.name}</div>`;
        } else {
            html += `<div class="property-card-header" style="background:#2d3436">${space.name}</div>`;
        }
        html += '<div class="property-card-body">';

        if (space.price) {
            html += `<div class="property-card-row"><span>购买价格</span><span class="property-card-price">¥${space.price}</span></div>`;
        }
        if (space.type === 'property') {
            html += `<div class="property-card-row"><span>基础租金</span><span>¥${space.rent[0]}</span></div>`;
            html += `<div class="property-card-row"><span>1座房屋</span><span>¥${space.rent[1]}</span></div>`;
            html += `<div class="property-card-row"><span>2座房屋</span><span>¥${space.rent[2]}</span></div>`;
            html += `<div class="property-card-row"><span>3座房屋</span><span>¥${space.rent[3]}</span></div>`;
            html += `<div class="property-card-row"><span>4座房屋</span><span>¥${space.rent[4]}</span></div>`;
            html += `<div class="property-card-row"><span>酒店</span><span>¥${space.rent[5]}</span></div>`;
            html += `<div class="property-card-row"><span>房屋造价</span><span>¥${space.housePrice}</span></div>`;
            html += `<div class="property-card-row"><span>抵押价值</span><span>¥${space.mortgage}</span></div>`;
            html += `<div class="property-card-row"><span>当前建筑</span><span>${state.houses===5?'酒店':state.houses+'座房屋'}</span></div>`;
        } else if (space.type === 'railroad') {
            html += `<div class="property-card-row"><span>1条铁路租金</span><span>¥25</span></div>`;
            html += `<div class="property-card-row"><span>2条铁路租金</span><span>¥50</span></div>`;
            html += `<div class="property-card-row"><span>3条铁路租金</span><span>¥100</span></div>`;
            html += `<div class="property-card-row"><span>4条铁路租金</span><span>¥200</span></div>`;
            html += `<div class="property-card-row"><span>抵押价值</span><span>¥${space.mortgage}</span></div>`;
        } else if (space.type === 'utility') {
            html += `<div class="property-card-row"><span>1个公用事业</span><span>4倍骰子</span></div>`;
            html += `<div class="property-card-row"><span>2个公用事业</span><span>10倍骰子</span></div>`;
            html += `<div class="property-card-row"><span>抵押价值</span><span>¥${space.mortgage}</span></div>`;
        }

        html += `<div class="property-card-row"><span>所有者</span><span>${ownerName}</span></div>`;
        if (state.mortgaged) {
            html += `<div class="property-card-row"><span>状态</span><span style="color:#e17055">已抵押</span></div>`;
        }
        html += '</div></div>';

        // 操作按钮
        const player = this.engine.currentPlayer();
        let actions = '<div class="modal-actions"><button class="modal-btn modal-btn-secondary" onclick="ui.closeModal()">关闭</button></div>';

        if (this.engine.phase === 'end_turn' && state.owner === player.id && !state.mortgaged) {
            if (space.type === 'property' && state.houses < 5) {
                actions = `<div class="modal-actions">
                    <button class="modal-btn modal-btn-primary" onclick="ui.buildHouse(${idx}); ui.showPropertyCard(${idx})">建造房屋 ¥${space.housePrice}</button>
                    <button class="modal-btn modal-btn-secondary" onclick="ui.closeModal()">关闭</button>
                </div>`;
            }
            if (state.houses === 0) {
                actions = `<div class="modal-actions">
                    <button class="modal-btn modal-btn-primary" onclick="ui.mortgageProperty(${idx}); ui.closeModal()">抵押 ¥${space.mortgage}</button>
                    <button class="modal-btn modal-btn-secondary" onclick="ui.closeModal()">关闭</button>
                </div>`;
            }
        }
        if (this.engine.phase === 'end_turn' && state.owner === player.id && state.mortgaged) {
            const cost = Math.ceil(space.mortgage * 1.1);
            if (player.money >= cost) {
                actions = `<div class="modal-actions">
                    <button class="modal-btn modal-btn-primary" onclick="ui.unmortgageProperty(${idx}); ui.closeModal()">赎回 ¥${cost}</button>
                    <button class="modal-btn modal-btn-secondary" onclick="ui.closeModal()">关闭</button>
                </div>`;
            }
        }

        this.showModal(html + actions);
    }

    showBuyDialog() {
        const player = this.engine.currentPlayer();
        const space = BOARD[player.position];
        const state = this.engine.boardState[player.position];
        const canAfford = player.money >= space.price;

        let html = '<div class="property-card-display">';
        if (space.color) {
            html += `<div class="property-card-header color-${space.color}">${space.name}</div>`;
        } else {
            html += `<div class="property-card-header" style="background:#2d3436">${space.name}</div>`;
        }
        html += `<div class="property-card-body">
            <div class="property-card-row"><span>价格</span><span class="property-card-price">¥${space.price}</span></div>
            <div class="property-card-row"><span>你的余额</span><span>¥${player.money}</span></div>
        </div></div>`;

        html += '<div class="modal-body">你要购买此地盘吗？不购买则进入拍卖。</div>';
        let actions = '';
        if (canAfford) {
            actions = `<div class="modal-actions">
                <button class="modal-btn modal-btn-primary" onclick="ui.buyProperty()">购买 ¥${space.price}</button>
                <button class="modal-btn modal-btn-secondary" onclick="ui.startAuction()">拍卖</button>
            </div>`;
        } else {
            actions = `<div class="modal-actions">
                <button class="modal-btn modal-btn-secondary" onclick="ui.startAuction()">拍卖 (余额不足)</button>
            </div>`;
        }
        this.showModal(html + actions);
    }

    buyProperty() {
        const player = this.engine.currentPlayer();
        this.engine.buyProperty(player, player.position);
        this.engine.phase = 'end_turn';
        this.closeModal();
        this.handlePhase();
    }

    startAuction() {
        this.closeModal();
        const player = this.engine.currentPlayer();
        this.engine.startAuction(player.position);
        this.handlePhase();
    }

    showCardDialog() {
        const player = this.engine.currentPlayer();
        const isChance = BOARD[player.position].type === 'chance';
        const card = this.engine.drawCard(isChance ? 'chance' : 'chest');
        this.pendingCard = card;

        const title = isChance ? '🃏 机会卡' : '📦 公共基金';
        const bg = isChance ? 'linear-gradient(135deg,#ffeaa7,#fdcb6e)' : 'linear-gradient(135deg,#74b9ff,#a29bfe)';
        this.showModal(`
            <div style="background:${bg};padding:20px;border-radius:12px;margin-bottom:15px;text-align:center;">
                <div style="font-size:24px;margin-bottom:10px;">${title}</div>
                <div style="font-size:16px;color:#2d3436;font-weight:bold;">${card.text}</div>
            </div>
            <div class="modal-actions">
                <button class="modal-btn modal-btn-primary" onclick="ui.executeCardAndContinue()">执行</button>
            </div>
        `);
    }

    executeCardAndContinue() {
        this.closeModal();
        const player = this.engine.currentPlayer();
        this.engine.executeCard(this.pendingCard, player);
        this.pendingCard = null;
        this.updateAll();

        if (this.engine.phase === 'landed') {
            this.engine.handleLanding();
        }
        this.handlePhase();
    }

    showTaxDialog() {
        const player = this.engine.currentPlayer();
        const worth = this.engine._calculateWorth(player);
        const tenPercent = Math.floor(worth * 0.1);
        this.showModal(`
            <div class="modal-title">个人所得税</div>
            <div class="modal-body">
                你的总资产价值：¥${worth}<br>
                请选择缴税方式：<br>
                <b>固定税</b>：支付 ¥200<br>
                <b>比例税</b>：支付 ¥${tenPercent} (总资产的10%)
            </div>
            <div class="modal-actions">
                <button class="modal-btn modal-btn-primary" onclick="ui.chooseTax('flat')">支付 ¥200</button>
                <button class="modal-btn modal-btn-secondary" onclick="ui.chooseTax('percent')">支付 ¥${tenPercent}</button>
            </div>
        `);
    }

    chooseTax(choice) {
        this.closeModal();
        const player = this.engine.currentPlayer();
        this.engine.chooseTax(player, choice);
        this.handlePhase();
    }

    showAuctionDialog() {
        if (!this.engine.auction) { this.handlePhase(); return; }
        const auc = this.engine.auction;
        const space = BOARD[auc.spaceIdx];
        const bidder = this.engine.players[auc.bidders[auc.currentBidderIdx]];
        const isHuman = !bidder.isAI;

        let html = `<div class="modal-title">拍卖：${space.name}</div>`;
        html += `<div class="auction-info">
            <div class="auction-bid">¥${auc.currentBid}</div>
            <div class="auction-bidder">${auc.highestBidder >= 0 ? this.engine.players[auc.highestBidder].name + ' 领先' : '暂无出价'}</div>
            <div style="margin-top:8px;color:#636e72;">当前出价者：${bidder.name} (余额 ¥${bidder.money})</div>
        </div>`;

        if (isHuman) {
            html += `<input class="auction-input" type="number" id="auction-bid-amount" value="${auc.currentBid + 10}" min="${auc.currentBid + 1}" max="${bidder.money}">`;
            html += '<div class="auction-bid-btns">';
            [10, 50, 100].forEach(amt => {
                const bid = auc.currentBid + amt;
                if (bid <= bidder.money) {
                    html += `<button class="auction-bid-btn" onclick="ui.auctionBid(${bid})">+${amt}</button>`;
                }
            });
            html += '</div>';
            html += '<div class="modal-actions" style="margin-top:10px;">';
            html += `<button class="modal-btn modal-btn-primary" onclick="ui.auctionBidAmount()">出价</button>`;
            html += `<button class="modal-btn modal-btn-secondary" onclick="ui.auctionPass()">弃权</button>`;
            html += '</div>';
        } else {
            html += `<div class="modal-body" style="text-align:center;">${bidder.name} 思考中...</div>`;
        }

        this.showModal(html);

        if (!isHuman) {
            setTimeout(() => {
                const ai = this.aiPlayers.find(a => a.playerIdx === bidder.id);
                if (ai) {
                    ai._decideAuction(bidder, () => {
                        this.showAuctionDialog();
                    });
                }
            }, 800);
        }
    }

    auctionBid(amount) {
        this.engine.auctionBid(amount);
        if (this.engine.auction && this.engine.auction.finished === undefined) {
            this.showAuctionDialog();
        } else if (!this.engine.auction) {
            this.closeModal();
            this.handlePhase();
        }
    }

    auctionBidAmount() {
        const input = document.getElementById('auction-bid-amount');
        if (input) {
            const amount = parseInt(input.value);
            if (amount > this.engine.auction.currentBid) {
                this.auctionBid(amount);
            }
        }
    }

    auctionPass() {
        this.engine.auctionPass();
        if (!this.engine.auction) {
            this.closeModal();
            this.handlePhase();
        } else {
            this.showAuctionDialog();
        }
    }

    showBuildDialog() {
        const player = this.engine.currentPlayer();
        let html = '<div class="modal-title">🔨 建造房屋</div>';
        let hasBuildable = false;

        for (const idx of player.properties) {
            const space = BOARD[idx];
            const state = this.engine.boardState[idx];
            if (space.type !== 'property') continue;
            if (state.houses >= 5) {
                html += `<div class="trade-item"><span style="color:${this._colorHex(space.color)}">■</span>
                    <span style="flex:1">${space.name}</span><span>已有酒店</span></div>`;
                continue;
            }
            if (!this.engine._hasColorGroup(player, space.color)) {
                html += `<div class="trade-item"><span style="color:${this._colorHex(space.color)}">■</span>
                    <span style="flex:1">${space.name}</span><span style="color:#b2bec3">未集齐同色</span></div>`;
                continue;
            }
            const canBuild = player.money >= space.housePrice;
            hasBuildable = true;
            html += `<div class="trade-item">
                <span style="color:${this._colorHex(space.color)}">■</span>
                <span style="flex:1">${space.name}</span>
                <span style="font-size:11px;color:#636e72;">${state.houses}座</span>
                <button class="modal-btn ${canBuild?'modal-btn-primary':'modal-btn-secondary'}" style="padding:4px 8px;min-width:auto;font-size:12px;"
                    ${canBuild?`onclick="ui.buildHouse(${idx})"`:'disabled'}>建造 ¥${space.housePrice}</button>
            </div>`;
        }

        if (!hasBuildable) {
            html += '<div class="modal-body" style="text-align:center;">暂无可建造的房屋<br><small>需集齐同色地产并持有足够资金</small></div>';
        }
        html += '<div class="modal-actions"><button class="modal-btn modal-btn-secondary" onclick="ui.closeModal(); ui.handlePhase()">关闭</button></div>';
        this.showModal(html);
    }

    buildHouse(idx) {
        const player = this.engine.currentPlayer();
        if (this.engine.buildHouse(player, idx)) {
            this.updateAll();
            this.showBuildDialog();
        }
    }

    showMortgageDialog() {
        const player = this.engine.currentPlayer();
        let html = '<div class="modal-title">💰 抵押/赎回地产</div>';
        let hasAny = false;

        for (const idx of player.properties) {
            const space = BOARD[idx];
            const state = this.engine.boardState[idx];
            hasAny = true;
            if (state.mortgaged) {
                const cost = Math.ceil(space.mortgage * 1.1);
                const canUnmortgage = player.money >= cost;
                html += `<div class="trade-item">
                    <span style="color:${this._colorHex(space.color)}">■</span>
                    <span style="flex:1">${space.name}</span>
                    <span style="color:#e17055;font-size:11px;">已抵押</span>
                    <button class="modal-btn ${canUnmortgage?'modal-btn-primary':'modal-btn-secondary'}" style="padding:4px 8px;min-width:auto;font-size:12px;"
                        ${canUnmortgage?`onclick="ui.unmortgageProperty(${idx})"`:'disabled'}>赎回 ¥${cost}</button>
                </div>`;
            } else if (state.houses > 0) {
                html += `<div class="trade-item">
                    <span style="color:${this._colorHex(space.color)}">■</span>
                    <span style="flex:1">${space.name}</span>
                    <span style="color:#b2bec3;font-size:11px;">有建筑，需先拆除</span>
                </div>`;
            } else {
                html += `<div class="trade-item">
                    <span style="color:${this._colorHex(space.color)}">■</span>
                    <span style="flex:1">${space.name}</span>
                    <button class="modal-btn modal-btn-primary" style="padding:4px 8px;min-width:auto;font-size:12px;"
                        onclick="ui.mortgageProperty(${idx})">抵押 ¥${space.mortgage}</button>
                </div>`;
            }
        }

        if (!hasAny) {
            html += '<div class="modal-body" style="text-align:center;">暂无地产</div>';
        }
        html += '<div class="modal-actions"><button class="modal-btn modal-btn-secondary" onclick="ui.closeModal(); ui.handlePhase()">关闭</button></div>';
        this.showModal(html);
    }

    mortgageProperty(idx) {
        const player = this.engine.currentPlayer();
        if (this.engine.mortgage(player, idx)) {
            this.updateAll();
            this.showMortgageDialog();
        }
    }

    unmortgageProperty(idx) {
        const player = this.engine.currentPlayer();
        if (this.engine.unmortgage(player, idx)) {
            this.updateAll();
            this.showMortgageDialog();
        }
    }

    showGameOverModal() {
        const winner = this.engine.winner();
        const html = `
            <div class="game-over-card">
                <div class="winner-trophy">🏆</div>
                <div class="modal-title">游戏结束！</div>
                <div class="winner-name">${winner ? winner.name : '无'}</div>
                <div class="modal-body">恭喜成为最终赢家！<br>资产：¥${winner ? winner.money : 0}</div>
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-primary" onclick="location.reload()">再来一局</button>
                </div>
            </div>
        `;
        this.showModal(html);
        document.getElementById('modal-overlay').onclick = null;
    }

    // ========== 工具方法 ==========
    _spaceToGrid(space) {
        if (space <= 10) return [10, 10 - space];
        if (space <= 20) return [10 - (space - 10), 0];
        if (space <= 30) return [0, space - 20];
        return [space - 30, 10];
    }

    _getCellSide(idx) {
        if ([0,10,20,30].includes(idx)) return 'corner';
        if (idx < 10) return 'bottom';
        if (idx < 20) return 'left';
        if (idx < 30) return 'top';
        return 'right';
    }

    _shortName(name) {
        if (name.length <= 4) return name;
        return name.substring(0, 3) + '…';
    }

    _colorHex(color) {
        const map = {
            brown:'#8B4513', lightblue:'#87CEEB', pink:'#FF69B4',
            orange:'#FFA500', red:'#FF4757', yellow:'#FFD700',
            green:'#2ed573', darkblue:'#1e3a5f'
        };
        return map[color] || '#2d3436';
    }
}

// 初始化——使用 DOMContentLoaded 替代 load，避免手机 WebView 兼容问题
const ui = new GameUI();
function _tryInit() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ui.init());
    } else {
        ui.init();
    }
}
_tryInit();
// 兜底：如果 DOMContentLoaded 也没触发，1.5 秒后强制初始化
setTimeout(() => {
    if (!document.getElementById('player-list') || !document.getElementById('player-list').children.length) {
        ui.init();
    }
}, 1500);
