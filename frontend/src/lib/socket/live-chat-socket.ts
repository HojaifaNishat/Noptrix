"use client";

import { io, type Socket } from "socket.io-client";
import { tokenStorage } from "@/lib/auth/token-storage";

let sharedSocket: Socket | null = null;
let connectedToken: string | null = null;

export function getLiveChatSocket(): Socket | null {
  const token = tokenStorage.get();

  if (!token) return null;

  if (
    sharedSocket &&
    connectedToken === token
  ) {
    return sharedSocket;
  }

  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }

  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim();

  let origin: string;

  try {
    origin = new URL(
      configuredUrl || window.location.origin,
      window.location.origin,
    ).origin;
  } catch {
    origin = window.location.origin;
  }

  connectedToken = token;

  sharedSocket = io(origin, {
    auth: { token },
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1000,
  });

  return sharedSocket;
}

export function disconnectLiveChatSocket(): void {
  sharedSocket?.disconnect();
  sharedSocket = null;
  connectedToken = null;
}
