import { createServer } from 'node:http';
import { parse } from 'node:url';
import next from 'next';
import { WebSocket, WebSocketServer } from 'ws';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface ClientSession {
  id: string;
  ws: WebSocket;
  callsign: string;
  characterId: string;
  stageId: string;
  roomCode: string | null;
  role: 'host' | 'guest' | null;
}

interface MatchRoom {
  code: string;
  stageId: string;
  host: ClientSession;
  guest: ClientSession | null;
  createdAt: number;
}

const clients = new Map<string, ClientSession>();
const rooms = new Map<string, MatchRoom>();
const quickQueue: ClientSession[] = [];

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function safeSend(ws: WebSocket, payload: Record<string, unknown>): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastPresence(): void {
  const openRooms = Array.from(rooms.values()).filter((r) => !r.guest).length;
  const msg = {
    type: 'presence',
    onlineCount: clients.size,
    queueCount: quickQueue.length,
    openRooms,
  };
  for (const client of clients.values()) {
    safeSend(client.ws, msg);
  }
}

function removeFromQueue(session: ClientSession): void {
  const idx = quickQueue.findIndex((c) => c.id === session.id);
  if (idx !== -1) {
    quickQueue.splice(idx, 1);
  }
}

function leaveRoom(session: ClientSession): void {
  if (!session.roomCode) return;
  const room = rooms.get(session.roomCode);
  session.roomCode = null;
  session.role = null;
  if (!room) return;

  const peer = room.host.id === session.id ? room.guest : room.host;
  if (peer) {
    peer.roomCode = null;
    peer.role = null;
    safeSend(peer.ws, {
      type: 'opponent_disconnected',
      reason: 'Opponent left the arena.',
    });
  }
  rooms.delete(room.code);
}

function startPairedRoom(host: ClientSession, guest: ClientSession, stageId: string, existingCode?: string): void {
  const code = existingCode ?? generateRoomCode();
  const room: MatchRoom = {
    code,
    stageId,
    host,
    guest,
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  host.roomCode = code;
  host.role = 'host';
  guest.roomCode = code;
  guest.role = 'guest';

  safeSend(host.ws, {
    type: 'match_found',
    roomCode: code,
    role: 'host',
    stageId,
    opponentCallsign: guest.callsign,
    opponentCharacter: guest.characterId,
  });

  safeSend(guest.ws, {
    type: 'match_found',
    roomCode: code,
    role: 'guest',
    stageId,
    opponentCallsign: host.callsign,
    opponentCharacter: host.characterId,
  });
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || '/', true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '/', true);
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws) => {
    const session: ClientSession = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      ws,
      callsign: 'DojoFighter',
      characterId: 'kenji',
      stageId: 'kyoto_shrine',
      roomCode: null,
      role: null,
    };
    clients.set(session.id, session);
    safeSend(ws, { type: 'welcome', clientId: session.id });
    broadcastPresence();

    ws.on('message', (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      const type = String(msg.type || '');

      if (type === 'ping') {
        safeSend(ws, { type: 'pong', ts: msg.ts });
        return;
      }

      if (type === 'join_queue') {
        leaveRoom(session);
        removeFromQueue(session);
        session.callsign = String(msg.callsign || 'DojoFighter').slice(0, 18);
        session.characterId = String(msg.characterId || 'kenji');
        session.stageId = String(msg.stageId || 'kyoto_shrine');

        // Pair immediately if another fighter is waiting
        const opponent = quickQueue.shift();
        if (opponent && opponent.ws.readyState === WebSocket.OPEN) {
          startPairedRoom(opponent, session, opponent.stageId);
        } else {
          quickQueue.push(session);
          safeSend(ws, {
            type: 'queue_joined',
            position: quickQueue.length,
          });
        }
        broadcastPresence();
        return;
      }

      if (type === 'leave_queue') {
        removeFromQueue(session);
        safeSend(ws, { type: 'queue_left' });
        broadcastPresence();
        return;
      }

      if (type === 'create_room') {
        removeFromQueue(session);
        leaveRoom(session);
        session.callsign = String(msg.callsign || 'DojoFighter').slice(0, 18);
        session.characterId = String(msg.characterId || 'kenji');
        session.stageId = String(msg.stageId || 'kyoto_shrine');

        const code = generateRoomCode();
        rooms.set(code, {
          code,
          stageId: session.stageId,
          host: session,
          guest: null,
          createdAt: Date.now(),
        });
        session.roomCode = code;
        session.role = 'host';
        safeSend(ws, { type: 'room_created', roomCode: code });
        broadcastPresence();
        return;
      }

      if (type === 'join_room') {
        removeFromQueue(session);
        leaveRoom(session);
        const code = String(msg.roomCode || '').trim().toUpperCase();
        session.callsign = String(msg.callsign || 'DojoFighter').slice(0, 18);
        session.characterId = String(msg.characterId || 'kenji');

        const room = rooms.get(code);
        if (!room) {
          safeSend(ws, { type: 'room_error', message: `Room "${code}" not found.` });
          return;
        }
        if (room.guest) {
          safeSend(ws, { type: 'room_error', message: `Room "${code}" is already full.` });
          return;
        }
        startPairedRoom(room.host, session, room.stageId, code);
        broadcastPresence();
        return;
      }

      if (type === 'leave_room') {
        leaveRoom(session);
        broadcastPresence();
        return;
      }

      // Low-latency combat relay (inputs & host authoritative state sync)
      if (type === 'input' || type === 'state_sync' || type === 'rematch_request') {
        if (!session.roomCode) return;
        const room = rooms.get(session.roomCode);
        if (!room || !room.guest) return;
        const peer = room.host.id === session.id ? room.guest : room.host;
        safeSend(peer.ws, msg);
      }
    });

    ws.on('close', () => {
      removeFromQueue(session);
      leaveRoom(session);
      clients.delete(session.id);
      broadcastPresence();
    });
  });

  server.listen(port, hostname, () => {
    console.log(`> KUROGANE III server ready on http://${hostname}:${port}`);
  });
});
