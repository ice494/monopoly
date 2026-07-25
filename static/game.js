// ============================================
// 大富翁 Monopoly - 游戏核心引擎
// 包含全部官方规则实现
// ============================================

// === 棋盘数据 (40格) ===
const BOARD = [
    {name:"起点",type:"corner",sub:"go"},
    {name:"地中海大道",type:"property",color:"brown",price:60,rent:[2,10,30,90,160,250],housePrice:50,mortgage:30},
    {name:"公共基金",type:"chest"},
    {name:"波罗的海大道",type:"property",color:"brown",price:60,rent:[4,20,60,180,320,450],housePrice:50,mortgage:30},
    {name:"个人所得税",type:"tax",amount:200},
    {name:"雷丁铁路",type:"railroad",price:200,mortgage:100},
    {name:"东方大道",type:"property",color:"lightblue",price:100,rent:[6,30,90,270,400,550],housePrice:50,mortgage:50},
    {name:"机会",type:"chance"},
    {name:"佛蒙特大道",type:"property",color:"lightblue",price:100,rent:[6,30,90,270,400,550],housePrice:50,mortgage:50},
    {name:"康涅狄格大道",type:"property",color:"lightblue",price:120,rent:[8,40,100,300,450,600],housePrice:50,mortgage:60},
    {name:"监狱",type:"corner",sub:"jail"},
    {name:"圣查尔斯广场",type:"property",color:"pink",price:140,rent:[10,50,150,450,625,750],housePrice:100,mortgage:70},
    {name:"电力公司",type:"utility",price:150,mortgage:75},
    {name:"州大道",type:"property",color:"pink",price:140,rent:[10,50,150,450,625,750],housePrice:100,mortgage:70},
    {name:"弗吉尼亚大道",type:"property",color:"pink",price:160,rent:[12,60,180,500,700,900],housePrice:100,mortgage:80},
    {name:"宾州铁路",type:"railroad",price:200,mortgage:100},
    {name:"圣詹姆斯广场",type:"property",color:"orange",price:180,rent:[14,70,200,550,750,950],housePrice:100,mortgage:90},
    {name:"公共基金",type:"chest"},
    {name:"田纳西大道",type:"property",color:"orange",price:180,rent:[14,70,200,550,750,950],housePrice:100,mortgage:90},
    {name:"纽约大道",type:"property",color:"orange",price:200,rent:[16,80,220,600,800,1000],housePrice:100,mortgage:100},
    {name:"免费停车",type:"corner",sub:"parking"},
    {name:"肯塔基大道",type:"property",color:"red",price:220,rent:[18,90,250,700,875,1050],housePrice:150,mortgage:110},
    {name:"机会",type:"chance"},
    {name:"印第安纳大道",type:"property",color:"red",price:220,rent:[18,90,250,700,875,1050],housePrice:150,mortgage:110},
    {name:"伊利诺伊大道",type:"property",color:"red",price:240,rent:[20,100,300,750,925,1100],housePrice:150,mortgage:120},
    {name:"B&O铁路",type:"railroad",price:200,mortgage:100},
    {name:"大西洋大道",type:"property",color:"yellow",price:260,rent:[22,110,330,800,975,1150],housePrice:150,mortgage:130},
    {name:"文图诺大道",type:"property",color:"yellow",price:260,rent:[22,110,330,800,975,1150],housePrice:150,mortgage:130},
    {name:"自来水公司",type:"utility",price:150,mortgage:75},
    {name:"马文花园",type:"property",color:"yellow",price:280,rent:[24,120,360,850,1025,1200],housePrice:150,mortgage:140},
    {name:"入狱",type:"go_to_jail"},
    {name:"太平洋大道",type:"property",color:"green",price:300,rent:[26,130,390,900,1100,1275],housePrice:200,mortgage:150},
    {name:"北卡罗来纳大道",type:"property",color:"green",price:300,rent:[26,130,390,900,1100,1275],housePrice:200,mortgage:150},
    {name:"公共基金",type:"chest"},
    {name:"宾夕法尼亚大道",type:"property",color:"green",price:320,rent:[28,150,450,1000,1200,1400],housePrice:200,mortgage:160},
    {name:"短线铁路",type:"railroad",price:200,mortgage:100},
    {name:"机会",type:"chance"},
    {name:"滨海大道",type:"property",color:"darkblue",price:350,rent:[35,175,500,1100,1300,1500],housePrice:200,mortgage:175},
    {name:"奢侈税",type:"tax",amount:100},
    {name:"木板路",type:"property",color:"darkblue",price:400,rent:[50,200,600,1400,1700,2000],housePrice:200,mortgage:200},
];

// === 颜色组映射 ===
const COLOR_GROUPS = {
    brown:[1,3], lightblue:[6,8,9], pink:[11,13,14], orange:[16,18,19],
    red:[21,23,24], yellow:[26,27,29], green:[31,32,34], darkblue:[37,39],
    railroad:[5,15,25,35], utility:[12,28]
};

// === 玩家颜色 ===
const PLAYER_COLORS = [
    {name:"红",hex:"#e74c3c"}, {name:"蓝",hex:"#3498db"}, {name:"绿",hex:"#27ae60"},
    {name:"黄",hex:"#f1c40f"}, {name:"紫",hex:"#9b59b6"}, {name:"橙",hex:"#e67e22"}
];

// === 机会卡 (16张) ===
const CHANCE_CARDS = [
    {text:"前进到起点，收取200元",action:{t:"move_to",pos:0}},
    {text:"前进到伊利诺伊大道",action:{t:"move_to",pos:24}},
    {text:"前进到圣查尔斯广场",action:{t:"move_to",pos:11}},
    {text:"前进到最近的公用事业公司，如已被拥有则支付10倍骰子点数",action:{t:"move_nearest",target:"utility"}},
    {text:"前进到最近的铁路，如已被拥有则支付双倍租金",action:{t:"move_nearest",target:"railroad"}},
    {text:"银行付你股息50元",action:{t:"collect",amt:50}},
    {text:"出狱卡 - 保留此卡以备后用",action:{t:"jail_free"}},
    {text:"后退三步",action:{t:"move_back",steps:3}},
    {text:"入狱！前往监狱",action:{t:"go_jail"}},
    {text:"修缮房产：每座房屋25元，每间酒店100元",action:{t:"repairs",house:25,hotel:100}},
    {text:"缴纳贫税15元",action:{t:"pay",amt:15}},
    {text:"前往雷丁铁路",action:{t:"move_to",pos:5}},
    {text:"前往木板路",action:{t:"move_to",pos:39}},
    {text:"你被选为董事长，付每位玩家50元",action:{t:"pay_each",amt:50}},
    {text:"建筑贷款到期，收取150元",action:{t:"collect",amt:150}},
    {text:"填字比赛获胜，收取100元",action:{t:"collect",amt:100}},
];

// === 公共基金卡 (16张) ===
const CHEST_CARDS = [
    {text:"前进到起点，收取200元",action:{t:"move_to",pos:0}},
    {text:"银行错误，收取200元",action:{t:"collect",amt:200}},
    {text:"医生费用，支付50元",action:{t:"pay",amt:50}},
    {text:"出售股票，收取50元",action:{t:"collect",amt:50}},
    {text:"出狱卡 - 保留此卡以备后用",action:{t:"jail_free"}},
    {text:"入狱！前往监狱",action:{t:"go_jail"}},
    {text:"度假基金到期，收取100元",action:{t:"collect",amt:100}},
    {text:"所得税退还，收取20元",action:{t:"collect",amt:20}},
    {text:"生日快乐！每位玩家付你10元",action:{t:"collect_each",amt:10}},
    {text:"人寿保险到期，收取100元",action:{t:"collect",amt:100}},
    {text:"支付医院费100元",action:{t:"pay",amt:100}},
    {text:"支付学费50元",action:{t:"pay",amt:50}},
    {text:"收取咨询费25元",action:{t:"collect",amt:25}},
    {text:"修缮街道：每座房屋40元，每间酒店115元",action:{t:"repairs",house:40,hotel:115}},
    {text:"选美比赛亚军，收取10元",action:{t:"collect",amt:10}},
    {text:"继承100元",action:{t:"collect",amt:100}},
];

// ============================================
// 游戏引擎 - 核心规则实现
// ============================================
class GameEngine {
    constructor() {
        this.players = [];
        this.currentIdx = 0;
        this.boardState = [];
        this.chanceDeck = [];
        this.chestDeck = [];
        this.phase = 'setup';
        this.dice = [0, 0];
        this.doublesCount = 0;
        this.log = [];
        this.auction = null;
        this.pendingTax = false;
        this.networkMode = false;
        this.jailExitThisTurn = false;
        this.doubleRentNext = false;
        this.tenTimesDice = false;
    }

    init(playerConfigs) {
        this.boardState = [];
        for (let i = 0; i < 40; i++) {
            this.boardState.push({owner: -1, houses: 0, mortgaged: false});
        }
        this.players = playerConfigs.map((cfg, i) => ({
            id: i, name: cfg.name || `玩家${i+1}`,
            colorIdx: i, money: 1500, position: 0,
            properties: [], inJail: false, jailTurns: 0,
            getOutCards: 0, isAI: cfg.isAI || false, bankrupt: false
        }));
        this.chanceDeck = this._shuffle([...Array(16).keys()]);
        this.chestDeck = this._shuffle([...Array(16).keys()]);
        this.currentIdx = 0;
        this.phase = 'rolling';
        this.doublesCount = 0;
        this.jailExitThisTurn = false;
        this.doubleRentNext = false;
        this.tenTimesDice = false;
        this.log = [];
        this._addLog("游戏开始！");
    }

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    _addLog(msg) { this.log.push(msg); if (this.log.length > 50) this.log.shift(); }

    currentPlayer() { return this.players[this.currentIdx]; }
    alivePlayers() { return this.players.filter(p => !p.bankrupt); }

    rollDice() {
        if (this.phase !== 'rolling') return null;
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        this.dice = [d1, d2];
        const isDoubles = d1 === d2;
        const player = this.currentPlayer();

        if (player.inJail) {
            if (isDoubles) {
                this.jailExitThisTurn = true;
                player.inJail = false;
                player.jailTurns = 0;
                this._addLog(`${player.name} 掷出双${d1}，出狱！`);
                this._movePlayer(player, d1 + d2);
                this.phase = 'landed';
            } else {
                player.jailTurns++;
                if (player.jailTurns >= 3) {
                    player.money -= 50;
                    player.inJail = false;
                    player.jailTurns = 0;
                    this._addLog(`${player.name} 在狱中3轮，支付50元出狱`);
                    this._movePlayer(player, d1 + d2);
                    this.phase = 'landed';
                } else {
                    this._addLog(`${player.name} 未掷出双数，留在狱中 (${player.jailTurns}/3)`);
                    this.phase = 'end_turn';
                }
            }
            return {dice: this.dice, doubles: isDoubles};
        }

        if (isDoubles) {
            this.doublesCount++;
            if (this.doublesCount === 3) {
                this._addLog(`${player.name} 连续三次双数，入狱！`);
                this.sendToJail(player);
                this.doublesCount = 0;
                this.phase = 'end_turn';
                return {dice: this.dice, doubles: true, jail: true};
            }
        } else {
            this.doublesCount = 0;
        }

        this._movePlayer(player, d1 + d2);
        this.phase = 'landed';
        return {dice: this.dice, doubles: isDoubles};
    }

    _movePlayer(player, steps) {
        const oldPos = player.position;
        const newPos = (oldPos + steps) % 40;
        if (newPos < oldPos) {
            player.money += 200;
            this._addLog(`${player.name} 经过起点，收取200元`);
        }
        player.position = newPos;
        this._addLog(`${player.name} 移动到 ${BOARD[newPos].name}`);
    }

    movePlayerTo(player, pos) {
        const oldPos = player.position;
        if (pos < oldPos) {
            player.money += 200;
            this._addLog(`${player.name} 经过起点，收取200元`);
        }
        player.position = pos;
        this._addLog(`${player.name} 移动到 ${BOARD[pos].name}`);
    }

    movePlayerBack(player, steps) {
        const newPos = player.position - steps;
        player.position = newPos < 0 ? newPos + 40 : newPos;
        this._addLog(`${player.name} 后退${steps}步到 ${BOARD[player.position].name}`);
    }

    handleLanding() {
        const player = this.currentPlayer();
        const space = BOARD[player.position];
        const state = this.boardState[player.position];

        switch (space.type) {
            case 'corner':
                if (space.sub === 'go') {
                    // Already collected $200 when passing
                }
                // Jail/just visiting, free parking - nothing happens
                this.phase = 'end_turn';
                break;

            case 'go_to_jail':
                this.sendToJail(player);
                this.phase = 'end_turn';
                break;

            case 'tax':
                if (space.name === '个人所得税') {
                    this.pendingTax = true;
                    this.phase = 'tax_choice';
                } else {
                    player.money -= space.amount;
                    this._addLog(`${player.name} 支付奢侈税${space.amount}元`);
                    this._checkBankruptcy(player, null);
                    this.phase = this.currentPlayer().bankrupt ? 'end_turn' : 'end_turn';
                }
                break;

            case 'chest':
            case 'chance':
                this.phase = 'card';
                break;

            case 'property':
            case 'railroad':
            case 'utility':
                if (state.owner === -1) {
                    // Unowned - can buy
                    this.phase = 'buy_or_auction';
                } else if (state.owner === player.id) {
                    // Own property
                    this.phase = 'end_turn';
                } else if (state.mortgaged) {
                    // Mortgaged - no rent
                    this._addLog(`${BOARD[player.position].name} 已抵押，无需付租金`);
                    this.phase = 'end_turn';
                } else {
                    // Pay rent
                    this._payRent(player, state);
                    this.phase = 'end_turn';
                }
                break;
        }
    }

    _payRent(player, state) {
        const space = BOARD[player.position];
        const owner = this.players[state.owner];
        let rent = 0;

        if (space.type === 'property') {
            rent = space.rent[state.houses];
            if (state.houses === 0 && this._hasColorGroup(owner, space.color)) {
                rent *= 2;
            }
        } else if (space.type === 'railroad') {
            const count = this._countType(owner, 'railroad');
            const rents = [0, 25, 50, 100, 200];
            rent = rents[count];
            if (this.doubleRentNext) {
                rent *= 2;
                this.doubleRentNext = false;
            }
        } else if (space.type === 'utility') {
            const count = this._countType(owner, 'utility');
            let mult = count === 2 ? 10 : 4;
            if (this.tenTimesDice) {
                mult = 10;
                this.tenTimesDice = false;
            }
            rent = (this.dice[0] + this.dice[1]) * mult;
        }

        player.money -= rent;
        owner.money += rent;
        this._addLog(`${player.name} 向 ${owner.name} 支付租金${rent}元`);
        this._checkBankruptcy(player, owner);
    }

    _hasColorGroup(player, color) {
        const group = COLOR_GROUPS[color];
        return group.every(idx => this.boardState[idx].owner === player.id);
    }

    _countType(player, type) {
        return player.properties.filter(idx => BOARD[idx].type === type).length;
    }

    buyProperty(player, spaceIdx) {
        const space = BOARD[spaceIdx];
        const state = this.boardState[spaceIdx];
        if (state.owner !== -1 || player.money < space.price) return false;
        player.money -= space.price;
        state.owner = player.id;
        player.properties.push(spaceIdx);
        this._addLog(`${player.name} 购买 ${space.name}，花费${space.price}元`);
        return true;
    }

    buildHouse(player, spaceIdx) {
        const space = BOARD[spaceIdx];
        const state = this.boardState[spaceIdx];
        if (state.owner !== player.id || space.type !== 'property') return false;
        if (state.houses >= 5) return false;
        if (!this._hasColorGroup(player, space.color)) return false;
        if (!this._canBuildEvenly(spaceIdx, 1)) return false;
        if (player.money < space.housePrice) return false;
        player.money -= space.housePrice;
        state.houses++;
        this._addLog(`${player.name} 在 ${space.name} 上建造${state.houses === 5 ? '酒店' : '房屋'}，花费${space.housePrice}元`);
        return true;
    }

    _canBuildEvenly(spaceIdx, delta) {
        const space = BOARD[spaceIdx];
        const group = COLOR_GROUPS[space.color];
        const newHouses = this.boardState[spaceIdx].houses + delta;
        for (const idx of group) {
            if (idx === spaceIdx) continue;
            if (this.boardState[idx].houses < newHouses - 1) return false;
        }
        return true;
    }

    demolishHouse(player, spaceIdx) {
        const space = BOARD[spaceIdx];
        const state = this.boardState[spaceIdx];
        if (state.owner !== player.id || state.houses <= 0) return false;
        // Check even demolition - can't demolish if another in group has more houses
        const group = COLOR_GROUPS[space.color];
        for (const idx of group) {
            if (idx === spaceIdx) continue;
            if (this.boardState[idx].houses > state.houses) return false;
        }
        state.houses--;
        const refund = space.housePrice / 2;
        player.money += refund;
        this._addLog(`${player.name} 拆除 ${space.name} 上的建筑，获得${refund}元`);
        return true;
    }

    mortgage(player, spaceIdx) {
        const space = BOARD[spaceIdx];
        const state = this.boardState[spaceIdx];
        if (state.owner !== player.id || state.mortgaged) return false;
        if (state.houses > 0) return false;
        state.mortgaged = true;
        player.money += space.mortgage;
        this._addLog(`${player.name} 抵押 ${space.name}，获得${space.mortgage}元`);
        return true;
    }

    unmortgage(player, spaceIdx) {
        const space = BOARD[spaceIdx];
        const state = this.boardState[spaceIdx];
        if (state.owner !== player.id || !state.mortgaged) return false;
        const cost = Math.ceil(space.mortgage * 1.1);
        if (player.money < cost) return false;
        player.money -= cost;
        state.mortgaged = false;
        this._addLog(`${player.name} 赎回 ${space.name}，花费${cost}元`);
        return true;
    }

    sendToJail(player) {
        player.position = 10;
        player.inJail = true;
        player.jailTurns = 0;
        this.doublesCount = 0;
        this._addLog(`${player.name} 入狱！`);
    }

    payJailFine(player) {
        if (!player.inJail || player.money < 50) return false;
        player.money -= 50;
        player.inJail = false;
        player.jailTurns = 0;
        this._addLog(`${player.name} 支付50元出狱`);
        return true;
    }

    useJailCard(player) {
        if (!player.inJail || player.getOutCards <= 0) return false;
        player.getOutCards--;
        player.inJail = false;
        player.jailTurns = 0;
        this._addLog(`${player.name} 使用出狱卡`);
        return true;
    }

    drawCard(type) {
        const deck = type === 'chance' ? this.chanceDeck : this.chestDeck;
        const cards = type === 'chance' ? CHANCE_CARDS : CHEST_CARDS;
        const idx = deck.shift();
        deck.push(idx);
        return cards[idx];
    }

    executeCard(card, player) {
        const a = card.action;
        switch (a.t) {
            case 'move_to':
                this.movePlayerTo(player, a.pos);
                this.phase = 'landed';
                break;
            case 'move_nearest':
                this._moveToNearest(player, a.target);
                this.phase = 'landed';
                break;
            case 'move_back':
                this.movePlayerBack(player, a.steps);
                this.phase = 'landed';
                break;
            case 'collect':
                player.money += a.amt;
                this._addLog(`${player.name} 收取${a.amt}元`);
                this.phase = 'end_turn';
                break;
            case 'pay':
                player.money -= a.amt;
                this._addLog(`${player.name} 支付${a.amt}元`);
                this._checkBankruptcy(player, null);
                this.phase = 'end_turn';
                break;
            case 'jail_free':
                player.getOutCards++;
                this._addLog(`${player.name} 获得出狱卡`);
                this.phase = 'end_turn';
                break;
            case 'go_jail':
                this.sendToJail(player);
                this.phase = 'end_turn';
                break;
            case 'repairs':
                let cost = 0;
                for (const idx of player.properties) {
                    const h = this.boardState[idx].houses;
                    if (h === 5) cost += a.hotel;
                    else cost += h * a.house;
                }
                player.money -= cost;
                this._addLog(`${player.name} 支付修缮费${cost}元`);
                this._checkBankruptcy(player, null);
                this.phase = 'end_turn';
                break;
            case 'pay_each':
                let total = 0;
                for (const p of this.alivePlayers()) {
                    if (p.id !== player.id) {
                        p.money += a.amt;
                        total += a.amt;
                    }
                }
                player.money -= total;
                this._addLog(`${player.name} 付每位玩家${a.amt}元，共${total}元`);
                this._checkBankruptcy(player, null);
                this.phase = 'end_turn';
                break;
            case 'collect_each':
                let collected = 0;
                for (const p of this.alivePlayers()) {
                    if (p.id !== player.id) {
                        const amt = Math.min(a.amt, p.money);
                        p.money -= amt;
                        collected += amt;
                    }
                }
                player.money += collected;
                this._addLog(`${player.name} 从每位玩家收取${a.amt}元，共${collected}元`);
                this.phase = 'end_turn';
                break;
        }
    }

    _moveToNearest(player, target) {
        let nearest = -1;
        let minDist = 40;
        for (let i = 0; i < 40; i++) {
            if (BOARD[i].type === target) {
                let dist = i - player.position;
                if (dist <= 0) dist += 40;
                if (dist < minDist) { minDist = dist; nearest = i; }
            }
        }
        if (nearest >= 0) {
            if (nearest < player.position) {
                player.money += 200;
                this._addLog(`${player.name} 经过起点，收取200元`);
            }
            player.position = nearest;
            if (target === 'railroad') this.doubleRentNext = true;
            if (target === 'utility') this.tenTimesDice = true;
            this._addLog(`${player.name} 移动到 ${BOARD[nearest].name}`);
        }
    }

    chooseTax(player, choice) {
        if (choice === 'flat') {
            player.money -= 200;
            this._addLog(`${player.name} 选择支付200元所得税`);
        } else {
            const worth = this._calculateWorth(player);
            const tax = Math.floor(worth * 0.1);
            player.money -= tax;
            this._addLog(`${player.name} 选择支付10%财产税${tax}元`);
        }
        this._checkBankruptcy(player, null);
        this.pendingTax = false;
        this.phase = 'end_turn';
    }

    _calculateWorth(player) {
        let worth = player.money;
        for (const idx of player.properties) {
            const space = BOARD[idx];
            const state = this.boardState[idx];
            worth += space.mortgage || 0;
            if (!state.mortgaged) {
                worth += space.price || 0;
            }
            if (space.housePrice) {
                worth += state.houses * space.housePrice;
            }
        }
        return worth;
    }

    startAuction(spaceIdx) {
        this.auction = {
            spaceIdx: spaceIdx,
            currentBid: 0,
            highestBidder: -1,
            bidders: this.alivePlayers().map(p => p.id),
            currentBidderIdx: 0,
            finished: false
        };
        this.phase = 'auction';
        this._addLog(`${BOARD[spaceIdx].name} 开始拍卖！`);
    }

    auctionBid(amount) {
        if (!this.auction || this.auction.finished) return;
        const player = this.players[this.auction.bidders[this.auction.currentBidderIdx]];
        if (amount > 0 && amount <= player.money && amount > this.auction.currentBid) {
            this.auction.currentBid = amount;
            this.auction.highestBidder = player.id;
            this._addLog(`${player.name} 出价${amount}元`);
            this.auction.currentBidderIdx = (this.auction.currentBidderIdx + 1) % this.auction.bidders.length;
        }
    }

    auctionPass() {
        if (!this.auction || this.auction.finished) return;
        const player = this.players[this.auction.bidders[this.auction.currentBidderIdx]];
        this._addLog(`${player.name} 弃权`);
        this.auction.bidders.splice(this.auction.currentBidderIdx, 1);
        if (this.auction.currentBidderIdx >= this.auction.bidders.length) {
            this.auction.currentBidderIdx = 0;
        }
        if (this.auction.bidders.length <= 1) {
            this._finishAuction();
        }
    }

    _finishAuction() {
        if (this.auction.highestBidder >= 0) {
            const player = this.players[this.auction.highestBidder];
            player.money -= this.auction.currentBid;
            this.boardState[this.auction.spaceIdx].owner = player.id;
            player.properties.push(this.auction.spaceIdx);
            this._addLog(`${player.name} 以${this.auction.currentBid}元拍得 ${BOARD[this.auction.spaceIdx].name}`);
        } else {
            this._addLog(`${BOARD[this.auction.spaceIdx].name} 拍卖流拍`);
        }
        this.auction = null;
        this.phase = 'end_turn';
    }

    _checkBankruptcy(player, creditor) {
        if (player.money >= 0) return;
        const debt = -player.money;
        const worth = this._calculateWorth(player);
        if (worth < debt) {
            player.bankrupt = true;
            this._addLog(`${player.name} 破产！`);
            if (creditor) {
                creditor.money += Math.max(0, player.money + worth);
                for (const idx of player.properties) {
                    this.boardState[idx].owner = creditor.id;
                    creditor.properties.push(idx);
                }
                creditor.getOutCards += player.getOutCards;
            } else {
                for (const idx of player.properties) {
                    this.boardState[idx].owner = -1;
                    this.boardState[idx].houses = 0;
                    this.boardState[idx].mortgaged = false;
                }
            }
            player.properties = [];
            player.money = 0;
        }
    }

    endTurn() {
        const alive = this.alivePlayers();
        if (alive.length <= 1) {
            this.phase = 'game_over';
            return;
        }
        const shouldRollAgain = this.dice[0] === this.dice[1] &&
                               !this.currentPlayer().inJail &&
                               !this.jailExitThisTurn;
        this.jailExitThisTurn = false;
        if (!shouldRollAgain) {
            this.doublesCount = 0;
            do {
                this.currentIdx = (this.currentIdx + 1) % this.players.length;
            } while (this.currentPlayer().bankrupt);
        }
        this.phase = 'rolling';
    }

    isGameOver() {
        return this.alivePlayers().length <= 1;
    }

    winner() {
        const alive = this.alivePlayers();
        return alive.length === 1 ? alive[0] : null;
    }

    serialize() {
        return JSON.stringify({
            players: this.players,
            boardState: this.boardState,
            currentIdx: this.currentIdx,
            phase: this.phase,
            dice: this.dice,
            doublesCount: this.doublesCount,
            log: this.log.slice(-20),
            auction: this.auction
        });
    }

    loadState(data) {
        const s = JSON.parse(data);
        this.players = s.players;
        this.boardState = s.boardState;
        this.currentIdx = s.currentIdx;
        this.phase = s.phase;
        this.dice = s.dice;
        this.doublesCount = s.doublesCount;
        this.log = s.log;
        this.auction = s.auction;
    }
}

// ============================================
// AI 玩家决策
// ============================================
class AIPlayer {
    constructor(engine, playerIdx) {
        this.engine = engine;
        this.playerIdx = playerIdx;
    }

    takeAction(callback) {
        const player = this.engine.players[this.playerIdx];
        if (player.bankrupt) { callback(); return; }

        switch (this.engine.phase) {
            case 'rolling':
                setTimeout(() => {
                    this.engine.rollDice();
                    callback();
                }, 800);
                break;

            case 'buy_or_auction':
                this._decideBuy(player, callback);
                break;

            case 'tax_choice':
                const worth = this.engine._calculateWorth(player);
                if (worth * 0.1 < 200) {
                    this.engine.chooseTax(player, 'percent');
                } else {
                    this.engine.chooseTax(player, 'flat');
                }
                callback();
                break;

            case 'card':
                const isChance = BOARD[player.position].type === 'chance';
                const card = this.engine.drawCard(isChance ? 'chance' : 'chest');
                this.engine._addLog(`${player.name} 抽到: ${card.text}`);
                setTimeout(() => {
                    this.engine.executeCard(card, player);
                    if (this.engine.phase === 'landed') {
                        this.engine.handleLanding();
                    }
                    callback();
                }, 1500);
                break;

            case 'landed':
                this.engine.handleLanding();
                callback();
                break;

            case 'end_turn':
                this._tryBuild(player);
                setTimeout(() => {
                    this.engine.endTurn();
                    callback();
                }, 500);
                break;

            case 'auction':
                this._decideAuction(player, callback);
                break;

            default:
                callback();
                break;
        }
    }

    _decideBuy(player, callback) {
        const space = BOARD[player.position];
        const state = this.engine.boardState[player.position];
        if (space.price && player.money > space.price * 1.5) {
            // Buy if can afford with some buffer
            if (space.type === 'property') {
                // Check if completing a color group
                const group = COLOR_GROUPS[space.color];
                const owned = group.filter(idx => this.engine.boardState[idx].owner === player.id).length;
                if (owned === group.length - 1) {
                    // Completing a set - definitely buy
                    this.engine.buyProperty(player, player.position);
                    this.engine.phase = 'end_turn';
                    callback();
                    return;
                }
            }
            // Buy with 70% probability
            if (Math.random() < 0.75) {
                this.engine.buyProperty(player, player.position);
            } else {
                this.engine.startAuction(player.position);
            }
        } else {
            // Can't afford or too expensive - auction
            this.engine.startAuction(player.position);
        }
        callback();
    }

    _tryBuild(player) {
        // Try to build houses on owned color groups
        const colorGroups = {};
        for (const idx of player.properties) {
            const space = BOARD[idx];
            if (space.type === 'property') {
                if (!colorGroups[space.color]) colorGroups[space.color] = [];
                colorGroups[space.color].push(idx);
            }
        }
        for (const [color, indices] of Object.entries(colorGroups)) {
            if (indices.length === COLOR_GROUPS[color].length) {
                // Own full set - try to build
                for (const idx of indices) {
                    if (player.money > BOARD[idx].housePrice * 2) {
                        this.engine.buildHouse(player, idx);
                    }
                }
            }
        }
    }

    _decideAuction(player, callback) {
        if (!this.engine.auction) { callback(); return; }
        const space = BOARD[this.engine.auction.spaceIdx];
        const maxBid = space.price * 0.8;
        const shouldBid = player.money > maxBid && Math.random() < 0.6;
        if (shouldBid) {
            const bid = this.engine.auction.currentBid + 10;
            if (bid <= maxBid && bid <= player.money) {
                this.engine.auctionBid.call(this.engine, bid);
            } else {
                this.engine.auctionPass();
            }
        } else {
            this.engine.auctionPass();
        }
        callback();
    }
}

// ============================================
// 网络客户端 - 联机对战
// ============================================
class NetworkClient {
    constructor() {
        this.socket = null;
        this.roomId = null;
        this.isHost = false;
        this.onStateUpdate = null;
        this.onMessage = null;
    }

    connect(serverUrl, onOpen, onError) {
        try {
            this.socket = new WebSocket(serverUrl);
            this.socket.onopen = onOpen;
            this.socket.onerror = onError;
            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'state' && this.onStateUpdate) {
                    this.onStateUpdate(data.state);
                } else if (data.type === 'message' && this.onMessage) {
                    this.onMessage(data.message);
                }
            };
        } catch (e) {
            if (onError) onError(e);
        }
    }

    send(action) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(action));
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

// 导出供使用
if (typeof window !== 'undefined') {
    window.BOARD = BOARD;
    window.COLOR_GROUPS = COLOR_GROUPS;
    window.PLAYER_COLORS = PLAYER_COLORS;
    window.CHANCE_CARDS = CHANCE_CARDS;
    window.CHEST_CARDS = CHEST_CARDS;
    window.GameEngine = GameEngine;
    window.AIPlayer = AIPlayer;
    window.NetworkClient = NetworkClient;
}
