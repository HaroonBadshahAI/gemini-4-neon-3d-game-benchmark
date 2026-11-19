import type { CharacterId, StageId } from './characters';
import type { PlayerInputState } from './combatEngine';

export interface OnlineMatchFoundPayload {
  roomCode: string;
  role: 'host' | 'guest';
  stageId: StageId;
  opponentCallsign: string;
  opponentCharacter: CharacterId;
}

export interface OnlinePresence {
  onlineCount: number;
  queueCount: number;
  openRooms: number;
}

export interface OnlineStateSync {
  roundNumber: number;
  roundTimer: number;
  phase: string;
  bannerText: string;
  bannerSubtext: string;
  winnerIndex: 0 | 1 | null;
  f0: {
    x: number;
    y: number;
    z: number;
    facing: 1 | -1;
    hp: number;
    ki: number;
    action: string;
    currentMove: string | null;
    roundsWon: number;
  };
  f1: {
    x: number;
    y: number;
    z: number;
    facing: 1 | -1;
    hp: number;
    ki: number;
    action: string;
    currentMove: string | null;
    roundsWon: number;
  };
}

export interface OnlineClientHandlers {
  onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected') => void;
  onPresence?: (presence: OnlinePresence) => void;
  onPing?: (rttMs: number) => void;
  onQueueJoined?: (position: number) => void;
  onRoomCreated?: (roomCode: string) => void;
  onRoomError?: (message: string) => void;
  onMatchFound?: (payload: OnlineMatchFoundPayload) => void;
  onRemoteInput?: (input: PlayerInputState) => void;
  onStateSync?: (sync: OnlineStateSync) => void;
  onOpponentDisconnected?: (reason: string) => void;
}

export class OnlineMatchClient {
  private ws: WebSocket | null = null;
  private handlers: OnlineClientHandlers = {};
  private pingTimer: number | null = null;
  private status: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  public setHandlers(handlers: OnlineClientHandlers): void {
    this.handlers = handlers;
  }

  public getStatus() {
    return this.status;
  }

  public connect(): void {
    if (typeof window === 'undefined') return;
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.status = 'connecting';
    this.handlers.onStatusChange?.('connecting');

    try {
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        this.status = 'connected';
        this.handlers.onStatusChange?.('connected');
        this.sendPing();
        if (this.pingTimer) window.clearInterval(this.pingTimer);
        this.pingTimer = window.setInterval(() => this.sendPing(), 4000);
      };

      ws.onmessage = (event) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(String(event.data));
        } catch {
          return;
        }

        switch (msg.type) {
          case 'pong': {
            const ts = Number(msg.ts || 0);
            if (ts > 0) {
              this.handlers.onPing?.(Math.max(1, Math.round(performance.now() - ts)));
            }
            break;
          }
          case 'presence':
            this.handlers.onPresence?.({
              onlineCount: Number(msg.onlineCount || 1),
              queueCount: Number(msg.queueCount || 0),
              openRooms: Number(msg.openRooms || 0),
            });
            break;
          case 'queue_joined':
            this.handlers.onQueueJoined?.(Number(msg.position || 1));
            break;
          case 'room_created':
            this.handlers.onRoomCreated?.(String(msg.roomCode || ''));
            break;
          case 'room_error':
            this.handlers.onRoomError?.(String(msg.message || 'Room unavailable.'));
            break;
          case 'match_found':
            this.handlers.onMatchFound?.({
              roomCode: String(msg.roomCode || ''),
              role: msg.role === 'guest' ? 'guest' : 'host',
              stageId: (msg.stageId as StageId) || 'kyoto_shrine',
              opponentCallsign: String(msg.opponentCallsign || 'Challenger'),
              opponentCharacter: (msg.opponentCharacter as CharacterId) || 'hwojin',
            });
            break;
          case 'input':
            if (msg.input && typeof msg.input === 'object') {
              this.handlers.onRemoteInput?.(msg.input as PlayerInputState);
            }
            break;
          case 'state_sync':
            if (msg.sync && typeof msg.sync === 'object') {
              this.handlers.onStateSync?.(msg.sync as OnlineStateSync);
            }
            break;
          case 'opponent_disconnected':
            this.handlers.onOpponentDisconnected?.(
              String(msg.reason || 'Opponent disconnected.'),
            );
            break;
        }
      };

      ws.onclose = () => {
        this.status = 'disconnected';
        this.handlers.onStatusChange?.('disconnected');
        if (this.pingTimer) {
          window.clearInterval(this.pingTimer);
          this.pingTimer = null;
        }
      };

      ws.onerror = () => {
        // Error leads into onclose cleanly
      };
    } catch {
      this.status = 'disconnected';
      this.handlers.onStatusChange?.('disconnected');
    }
  }

  private send(payload: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private sendPing(): void {
    this.send({ type: 'ping', ts: performance.now() });
  }

  public joinQueue(callsign: string, characterId: CharacterId, stageId: StageId): void {
    this.connect();
    this.send({ type: 'join_queue', callsign, characterId, stageId });
  }

  public leaveQueue(): void {
    this.send({ type: 'leave_queue' });
  }

  public createRoom(callsign: string, characterId: CharacterId, stageId: StageId): void {
    this.connect();
    this.send({ type: 'create_room', callsign, characterId, stageId });
  }

  public joinRoom(roomCode: string, callsign: string, characterId: CharacterId): void {
    this.connect();
    this.send({ type: 'join_room', roomCode, callsign, characterId });
  }

  public leaveRoom(): void {
    this.send({ type: 'leave_room' });
  }

  public sendInput(input: PlayerInputState): void {
    this.send({ type: 'input', input });
  }

  public sendStateSync(sync: OnlineStateSync): void {
    this.send({ type: 'state_sync', sync });
  }

  public disconnect(): void {
    if (this.pingTimer) {
      window.clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status = 'disconnected';
  }
}
