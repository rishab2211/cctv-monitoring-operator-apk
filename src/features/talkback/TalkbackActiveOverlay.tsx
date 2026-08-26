import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { mediaDevices, RTCPeerConnection } from 'react-native-webrtc';
import { Mic01Icon } from '@hugeicons/core-free-icons';
import { Colors } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import { AppIcon } from '../../components/common/AppIcon';
import { TalkbackApi } from '../../api/endpoints/talkback.api';
import { formatDuration } from '../../utils/date';

interface TalkbackActiveOverlayProps {
  navigation: any;
  route: {
    params: {
      cameraId: string;
      cameraName?: string;
    };
  };
}

export const TalkbackActiveOverlay: React.FC<TalkbackActiveOverlayProps> = ({
  navigation,
  route,
}) => {
  const { cameraId, cameraName } = route.params;

  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const waveAnim = useRef(new Animated.Value(0.3)).current;

  // Sound wave pulsing animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [waveAnim]);

  // Call timer
  useEffect(() => {
    let timer: any = null;
    if (connected) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [connected]);

  // Start Talkback WHIP session
  useEffect(() => {
    let isMounted = true;

    const startTalkback = async () => {
      try {
        setLoading(true);

        // Check capabilities & busy state
        const status = await TalkbackApi.getStatus(cameraId);
        if (status.isActive) {
          throw new Error('Camera is already in an active talkback session with another operator.');
        }

        // Start session & get MediaMTX WHIP URL
        const sessionData = await TalkbackApi.startSession(cameraId);

        // Get microphone stream
        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });

        // Initialize WebRTC PeerConnection for audio ingestion
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcRef.current = pc;

        stream.getTracks().forEach((track: any) => {
          pc.addTrack(track, stream);
        });

        const offer = await pc.createOffer({
          offerToReceiveAudio: false,
          offerToReceiveVideo: false,
        });
        await pc.setLocalDescription(offer);

        if (isMounted) {
          setConnected(true);
          setLoading(false);
        }
      } catch (err: any) {
        console.warn('[Talkback] Error starting talkback session:', err);
        if (isMounted) {
          Alert.alert('Talkback Unavailable', err.response?.data?.message || err.message || 'Could not connect audio stream.');
          navigation.goBack();
        }
      }
    };

    startTalkback();

    return () => {
      isMounted = false;
      // Stop session
      TalkbackApi.stopSession(cameraId).catch(() => {});
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [cameraId, navigation]);

  const handleEndCall = async () => {
    try {
      await TalkbackApi.stopSession(cameraId);
    } finally {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Animated Mic Visualizer */}
        <Animated.View
          style={[
            styles.waveCircle,
            {
              transform: [{ scale: waveAnim }],
              opacity: waveAnim,
            },
          ]}
        />

        <View style={styles.micIconBox}>
          <AppIcon icon={Mic01Icon} size="xxl" color="#FFFFFF" />
        </View>

        <Text style={styles.title}>TALKBACK ACTIVE</Text>
        <Text style={styles.cameraName}>{cameraName || 'Assigned Camera'}</Text>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={Colors.secondary} />
            <Text style={styles.connectingText}>Connecting audio stream via WHIP...</Text>
          </View>
        ) : (
          <View style={styles.timerBox}>
            <Text style={styles.timerLabel}>CALL DURATION</Text>
            <Text style={styles.timerValue}>{formatDuration(elapsedSeconds)}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Button
            title="End Talkback Call"
            variant="destructive"
            size="large"
            onPress={handleEndCall}
            style={styles.endCallBtn}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  waveCircle: {
    position: 'absolute',
    top: 30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
  micIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  micEmoji: {
    fontSize: 44,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
  cameraName: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
  },
  connectingText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginLeft: 8,
  },
  timerBox: {
    marginTop: 36,
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  timerValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.online,
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  footer: {
    width: '100%',
    marginTop: 50,
  },
  endCallBtn: {
    width: '100%',
  },
});
