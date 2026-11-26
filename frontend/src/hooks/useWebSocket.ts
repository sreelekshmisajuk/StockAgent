import { useState, useEffect, useRef, useCallback } from 'react';

export interface WsMessage {
  event: string;
  simulation_id?: string;
  data: any;
  timestamp?: string;
}

export function useSimulationWebSocket(simulationId: string | null) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    if (!simulationId) return;

    // Build WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In dev, if using Vite proxy or direct port
    const wsUrl = `${protocol}//${window.location.host}/ws/${simulationId}`;

    try {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setLastMessage(parsed);
        } catch {
          // ignore ping or text frame
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        // Attempt reconnection after 3 seconds if simulationId is still active
        reconnectTimeoutRef.current = setTimeout(() => {
          if (simulationId) {
            connect();
          }
        }, 3000);
      };

      socket.onerror = (e) => {
        setError('WebSocket connection error');
      };
    } catch (err: any) {
      setError(err?.message || 'WebSocket creation failed');
    }
  }, [simulationId]);

  useEffect(() => {
    if (!simulationId) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [simulationId, connect]);

  const send = useCallback((msg: object) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { isConnected, lastMessage, error, send };
}
