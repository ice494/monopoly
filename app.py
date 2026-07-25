"""
大富翁 Monopoly - Flask 服务器
支持单机游戏和联机对战
"""
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
import uuid
import socket
import os

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SECRET_KEY'] = 'monopoly-game-secret-2024'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# 房间管理
rooms = {}


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/rooms')
def list_rooms():
    """列出可用房间"""
    room_list = []
    for rid, info in rooms.items():
        room_list.append({
            'room_id': rid,
            'player_count': len(info['clients']),
            'max_players': 6
        })
    return jsonify(room_list)


# ========== WebSocket 事件 ==========

@socketio.on('connect')
def on_connect():
    emit('connected', {'message': '已连接到服务器'})


@socketio.on('disconnect')
def on_disconnect():
    # 从所有房间中移除
    for rid, info in list(rooms.items()):
        if request.sid in info['clients']:
            info['clients'].remove(request.sid)
            leave_room(rid)
            if request.sid == info['host']:
                # 主机离开，通知其他玩家
                emit('host_left', {'message': '主机已离开'}, room=rid)
                del rooms[rid]
            else:
                emit('player_left', {'sid': request.sid}, room=rid)
            break


@socketio.on('create_room')
def on_create_room(data):
    """创建房间"""
    room_id = str(uuid.uuid4())[:6].upper()
    rooms[room_id] = {
        'host': request.sid,
        'clients': [request.sid],
        'player_names': {request.sid: data.get('name', '主机')},
        'game_state': None
    }
    join_room(room_id)
    emit('room_created', {
        'room_id': room_id,
        'ws_url': f'ws://{request.host}/socket.io'
    })


@socketio.on('join_room_event')
def on_join_room(data):
    """加入房间"""
    room_id = data.get('room_id', '').upper()
    player_name = data.get('name', '玩家')

    if room_id not in rooms:
        emit('error', {'message': '房间不存在'})
        return

    if len(rooms[room_id]['clients']) >= 6:
        emit('error', {'message': '房间已满'})
        return

    rooms[room_id]['clients'].append(request.sid)
    rooms[room_id]['player_names'][request.sid] = player_name
    join_room(room_id)

    # 通知所有玩家
    player_list = list(rooms[room_id]['player_names'].values())
    emit('room_joined', {
        'room_id': room_id,
        'players': player_list
    }, room=room_id)

    # 如果游戏已开始，发送当前状态
    if rooms[room_id]['game_state']:
        emit('state_update', {'state': rooms[room_id]['game_state']}, room=request.sid)


@socketio.on('game_state_update')
def on_state_update(data):
    """主机广播游戏状态"""
    room_id = data.get('room_id', '').upper()
    state = data.get('state')
    if room_id in rooms:
        rooms[room_id]['game_state'] = state
        emit('state_update', {'state': state}, room=room_id, include_self=False)


@socketio.on('player_action')
def on_player_action(data):
    """客户端发送操作到主机"""
    room_id = data.get('room_id', '').upper()
    if room_id in rooms:
        emit('player_action', data, room=rooms[room_id]['host'])


@socketio.on('chat_message')
def on_chat(data):
    """聊天消息"""
    room_id = data.get('room_id', '').upper()
    msg = data.get('message', '')
    name = data.get('name', '玩家')
    if room_id in rooms:
        emit('chat_message', {'name': name, 'message': msg}, room=room_id)


def get_local_ip():
    """获取本机局域网IP"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


if __name__ == '__main__':
    local_ip = get_local_ip()
    port = int(os.environ.get('PORT', 5000))

    print()
    print("=" * 55)
    print("     大富翁 Monopoly 服务器已启动！")
    print("=" * 55)
    print()
    print(f"  本机访问:   http://127.0.0.1:{port}")
    print(f"  局域网访问: http://{local_ip}:{port}")
    print()
    print("  手机/平板连接同一WiFi后:")
    print(f"  在浏览器打开 http://{local_ip}:{port}")
    print()
    print("  按 Ctrl+C 停止服务器")
    print("=" * 55)
    print()

    socketio.run(app, host='0.0.0.0', port=port, debug=False, allow_unsafe_werkzeug=True)
