export interface TalkbackCapabilities {
  audioOut: boolean;
  codec: string;
  sampleRate: number;
  channels: number;
}

export interface TalkbackSession {
  _id: string;
  cameraId: string | { _id: string; name: string };
  operatorId: string | { _id: string; name: string };
  status: 'active' | 'completed';
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
}

export interface TalkbackStartResponse {
  session: TalkbackSession;
  whipUrl: string;
}

export interface TalkbackStatusResponse {
  isActive: boolean;
  session: TalkbackSession | null;
}
