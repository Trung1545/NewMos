import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

/**
 * useProductStockWebSocket: Custom hook quản lý kết nối STOMP over WebSocket
 * Lắng nghe channel /topic/products/{productId}/stock để nhận thông báo cập nhật tồn kho real-time.
 *
 * @param {number|string} productId - ID của sản phẩm cần theo dõi tồn kho
 * @param {function} onStockUpdate - Callback nhận dữ liệu VariantStockUpdateDto { productId, variantId, size, remainingStock, isOutOfStock }
 */
export function useProductStockWebSocket(productId, onStockUpdate) {
  const clientRef = useRef(null);
  const onUpdateRef = useRef(onStockUpdate);

  // Luôn cập nhật ref của callback để subscription handler không bị stale closure
  useEffect(() => {
    onUpdateRef.current = onStockUpdate;
  }, [onStockUpdate]);

  useEffect(() => {
    if (!productId) return;

    // Tự động xác định ws:// hoặc wss:// theo giao thức hiện tại
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const brokerURL = `${protocol}${window.location.host}/ws`;

    const client = new Client({
      brokerURL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        // Đăng ký kênh cập nhật tồn kho biến thể theo productId
        client.subscribe(`/topic/products/${productId}/stock`, (message) => {
          try {
            const data = JSON.parse(message.body);
            if (onUpdateRef.current) {
              onUpdateRef.current(data);
            }
          } catch (err) {
            console.error('[WebSocket] Lỗi giải mã gói tin tồn kho:', err);
          }
        });
      },
      onStompError: (frame) => {
        console.warn('[WebSocket STOMP Warning]:', frame.headers?.message, frame.body);
      },
      onWebSocketError: () => {
        // Fallback im lặng khi server ngắt kết nối tạm thời, client sẽ tự động reconnect sau reconnectDelay
      },
    });

    client.activate();
    clientRef.current = client;

    // Tự động dọn dẹp và ngắt kết nối khi component unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [productId]);
}

export default useProductStockWebSocket;
