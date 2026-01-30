// src/services/websocketService.ts

export type WebSocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp?: number;
}

type MessageHandler<T> = (message: WebSocketMessage<T>) => void;
type StatusHandler = (status: WebSocketStatus) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectInterval = 3000;
  private shouldReconnect = true;

  private messageHandlers: Set<MessageHandler<any>> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

    this.updateStatus("connecting");
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      this.updateStatus("connected");
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const parsed: WebSocketMessage = JSON.parse(event.data);
        this.notifyMessage(parsed);
      } catch (err) {
        console.error("Invalid WebSocket message format", err);
      }
    };

    this.socket.onerror = () => {
      this.updateStatus("error");
    };

    this.socket.onclose = () => {
      this.updateStatus("disconnected");

      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    this.socket?.close();
    this.socket = null;
  }

  send<T>(message: WebSocketMessage<T>) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  subscribe(handler: MessageHandler<any>) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatusChange(handler: StatusHandler) {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  private notifyMessage(message: WebSocketMessage) {
    this.messageHandlers.forEach((handler) => handler(message));
  }

  private updateStatus(status: WebSocketStatus) {
    this.statusHandlers.forEach((handler) => handler(status));
  }
}

export default WebSocketService;
