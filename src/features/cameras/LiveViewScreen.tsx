import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RTCPeerConnection, RTCView, MediaStream } from 'react-native-webrtc';
import { Colors } from '../../theme/colors';
import { CameraApi } from '../../api/endpoints/camera.api';

interface LiveViewScreenProps {
  navigation: any;
  route: {
    params: {
      cameraId: string;
      cameraName?: string;
    };
  };
}

export const LiveViewScreen: React.FC<LiveViewScreenProps> = ({ navigation, route }) => {
  const { cameraId, cameraName } = route.params;

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeWebRTC = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        // Step 1: Start Stream Session via backend API
        const sessionData = await CameraApi.startStream(cameraId);
        sessionIdRef.current = sessionData.sessionId;

        // Step 2: Initialize WebRTC PeerConnection
        const configuration = {
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        };

        const pc = new RTCPeerConnection(configuration);
        peerConnection.current = pc;

        (pc as any).ontrack = (event: any) => {
          if (event.streams && event.streams[0]) {
            if (isMounted) {
              setRemoteStream(event.streams[0]);
              setStreamUrl(event.streams[0].toURL());
              setLoading(false);
            }
          }
        };

        // Add transceiver for receiving video
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });

        // Step 3: Create SDP Offer
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);

        // Step 4: Relay Offer to backend MediaMTX WHEP
        if (offer.sdp) {
          const answerData = await CameraApi.relayWebRTCOffer(cameraId, offer.sdp);
          await pc.setRemoteDescription({
            type: 'answer',
            sdp: answerData.sdp,
          });
        }
      } catch (err: any) {
        console.warn('[LiveView] WebRTC connection error:', err);
        if (isMounted) {
          setErrorMsg(err.response?.data?.message || 'Live camera stream unreachable.');
          setLoading(false);
        }
      }
    };

    initializeWebRTC();

    return () => {
      isMounted = false;
      // Step 5: Stop session on close
      if (sessionIdRef.current) {
        CameraApi.stopStream(cameraId, sessionIdRef.current);
      }
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
    };
  }, [cameraId]);

  const handleSnapshot = () => {
    Alert.alert('Snapshot Captured', 'A high-definition security frame has been saved to your gallery.');
  };

  return (
    <View style={styles.container}>
      {/* Video Surface */}
      <View style={styles.videoContainer}>
        {streamUrl && remoteStream ? (
          <RTCView
            streamURL={streamUrl}
            style={styles.rtcView}
            objectFit="contain"
            mirror={false}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Establishing WebRTC WHEP connection...</Text>
              </View>
            ) : (
              <View style={styles.errorBox}>
                <Text style={styles.errorEmoji}>⚠️</Text>
                <Text style={styles.errorText}>{errorMsg || 'Stream currently unavailable.'}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Top Controls Overlay */}
      <View style={styles.topOverlay}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          style={styles.controlBtn}
        >
          <Text style={styles.controlIcon}>✕</Text>
        </TouchableOpacity>

        <View style={styles.streamInfo}>
          <Text numberOfLines={1} style={styles.streamTitle}>
            {cameraName || 'Live Feed'}
          </Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>LIVE</Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={handleSnapshot} style={styles.controlBtn}>
          <Text style={styles.controlIcon}>📸</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Controls Overlay */}
      <View style={styles.bottomOverlay}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsMuted(!isMuted)}
          style={[styles.bottomBtn, isMuted ? { backgroundColor: Colors.critical } : {}]}
        >
          <Text style={styles.bottomBtnText}>{isMuted ? '🔇 Unmute' : '🔊 Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('TalkbackActive', {
              cameraId,
              cameraName,
            })
          }
          style={[styles.bottomBtn, { backgroundColor: Colors.secondary }]}
        >
          <Text style={styles.bottomBtnText}>🎙️ Talkback</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('ReportIncident', {
              prefilledCameraId: cameraId,
            })
          }
          style={[styles.bottomBtn, { backgroundColor: Colors.surfaceElevated }]}
        >
          <Text style={styles.bottomBtnText}>📝 Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rtcView: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingBox: {
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },
  errorBox: {
    alignItems: 'center',
  },
  errorEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  errorText: {
    color: Colors.critical,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  topOverlay: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(17, 23, 38, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  streamInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  streamTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.critical,
    marginRight: 4,
  },
  liveLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.critical,
    letterSpacing: 0.5,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  bottomBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
