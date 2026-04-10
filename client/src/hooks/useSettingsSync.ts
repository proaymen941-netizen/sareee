import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useSettingsSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "settings_changed") {
            const key = msg.payload?.changedKey;
            if (key === "restaurants" || key === "delivery_fee_settings" || !key) {
              queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
              queryClient.invalidateQueries({ queryKey: ["/api/admin/restaurants"] });
              queryClient.invalidateQueries({ queryKey: ["/api/delivery-fees/settings"] });
            }
          }
        } catch (_) {}
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [queryClient]);
}
