// src/hooks/useWebSocket.ts

import { useEffect, useRef, useState } from "react";
import WebSocketService, {
  WebSocketMessage,
  WebSocketStatus,
} from "../services/websocketService";

export function useWebSocket<T = any>(url: string) {
  const serviceRef = useRef<WebSocketService | null>(null);

  const [status, setStatus] = useState<WebSocketStatus>("idle");
  const [lastMessage, setLastMessage] =
    useState<WebSocketMessage<T> | null>(null);

  useEffect(() => {
    const service = new WebSocketService(url);
    serviceRef.current = service;

    const unsubscribeMessage = service.subscribe((message) => {
      setLastMessage(message);
    });

    const unsubscribeStatus = service.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    service.connect();

    return () => {
      unsubscribeMessage();
      unsubscribeStatus();
      service.disconnect();
    };
  }, [url]);

  const sendMessage = (message: WebSocketMessage<T>) => {
    serviceRef.current?.send(message);
  };

  return {
    status,
    lastMessage,
    sendMessage,
  };
}
