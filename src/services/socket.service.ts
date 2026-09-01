import { io, Socket } from 'socket.io-client';
import { ENV } from '../config/env';
import { StorageService } from './storage.service';

type EventHandler = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private attachedSocketEvents: Set<string> = new Set();
  private joinedRooms: Set<string> = new Set();
  private currentUserId: string | null = null;

  /**
   * Connect to Socket.IO with JWT authentication
   */
  async connect(userId?: string, franchiseId?: string | null): Promise<void> {
    if (this.socket?.connected) {
      if (franchiseId) {
        this.joinRoom(`franchise_${franchiseId}`);
      }
      if (userId && userId !== this.currentUserId) {
        this.currentUserId = userId;
        this.setupUserNotifications(userId);
      }
      return;
    }

    const { accessToken } = await StorageService.getTokens();
    if (!accessToken) {
      console.warn('[SocketService] No access token available to connect');
      return;
    }

    this.currentUserId = userId || null;

    this.socket = io(ENV.SOCKET_URL, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.attachedSocketEvents.clear();

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected to WebSocket server');

      // Join franchise room if available
      if (franchiseId) {
        this.joinRoom(`franchise_${franchiseId}`);
      }

      // Re-join any previously registered camera rooms
      this.joinedRooms.forEach((room) => {
        this.socket?.emit('join', room);
      });
    });

    this.socket.on('connect_error', (error) => {
      console.warn('[SocketService] Connection error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Disconnected:', reason);
    });

    // Wire up global and standard event broadcasts
    this.setupInternalListeners();
  }

  private setupInternalListeners() {
    if (!this.socket) return;

    const standardEvents = [
      'new_alert',
      'alert_acknowledged',
      'alert_resolved',
      'alert_escalated',
      'sos_triggered',
      'sos_acknowledged',
      'sos_resolved',
      'shift_handover',
      'talkback_started',
      'talkback_stopped',
      'camera_status',
      'incident_created',
      'incident_updated',
    ];

    standardEvents.forEach((event) => {
      this.attachSocketListener(event);
    });

    // Re-attach any custom events already registered by UI listeners
    this.listeners.forEach((_, event) => {
      this.attachSocketListener(event);
    });

    // User-specific notification event
    if (this.currentUserId) {
      this.setupUserNotifications(this.currentUserId);
    }
  }

  private setupUserNotifications(userId: string) {
    if (!this.socket) return;
    const userNotifEvent = `notification:${userId}`;
    if (!this.attachedSocketEvents.has(userNotifEvent)) {
      this.attachedSocketEvents.add(userNotifEvent);
      this.socket.on(userNotifEvent, (data) => {
        this.notifyListeners(userNotifEvent, data);
        this.notifyListeners('user_notification', data);
      });
    }
  }

  private attachSocketListener(event: string) {
    if (!this.socket || this.attachedSocketEvents.has(event)) return;

    this.attachedSocketEvents.add(event);
    this.socket.on(event, (data) => {
      this.notifyListeners(event, data);
    });
  }

  /**
   * Subscribe to a camera room (e.g. camera_<id>)
   */
  joinCamera(cameraId: string) {
    if (!cameraId) return;
    const room = `camera_${cameraId}`;
    this.joinRoom(room);
    this.socket?.emit('join_camera', cameraId);
  }

  /**
   * Leave a camera room
   */
  leaveCamera(cameraId: string) {
    if (!cameraId) return;
    const room = `camera_${cameraId}`;
    this.leaveRoom(room);
    this.socket?.emit('leave_camera', cameraId);
  }

  private joinRoom(room: string) {
    this.joinedRooms.add(room);
    if (this.socket?.connected) {
      this.socket.emit('join', room);
    }
  }

  private leaveRoom(room: string) {
    this.joinedRooms.delete(room);
    if (this.socket?.connected) {
      this.socket.emit('leave', room);
    }
  }

  /**
   * Register a listener for an event
   */
  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Dynamically hook into the live socket if connected
    if (this.socket) {
      this.attachSocketListener(event);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  private notifyListeners(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (e) {
          console.error(`[SocketService] Error executing listener for ${event}:`, e);
        }
      });
    }
  }

  /**
   * Check if socket is currently connected
   */
  isConnected(): boolean {
    return !!(this.socket?.connected);
  }

  /**
   * Clear all registered event listeners
   */
  clearListeners() {
    this.listeners.clear();
  }

  /**
   * Disconnect socket connection
   */
  disconnect(clearListeners: boolean = false) {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.joinedRooms.clear();
    this.attachedSocketEvents.clear();
    if (clearListeners) {
      this.listeners.clear();
    }
    this.currentUserId = null;
  }
}

export const socketService = new SocketService();

