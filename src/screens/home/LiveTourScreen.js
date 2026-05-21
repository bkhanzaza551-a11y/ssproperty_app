import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import Colors from '../../constants/colors';
import { getCurrentStream } from '../../api/streamApi';

const { width, height } = Dimensions.get('window');
const YOUTUBE_REFERRER = 'https://com.project.sspropertyguru';

const getYoutubeVideoId = (url) => {
    if (!url) return null;

    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, '');

        if (host === 'youtu.be') {
            return parsed.pathname.split('/').filter(Boolean)[0] || null;
        }

        if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
            if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
            if (parsed.pathname.startsWith('/live/') || parsed.pathname.startsWith('/embed/') || parsed.pathname.startsWith('/shorts/')) {
                return parsed.pathname.split('/').filter(Boolean)[1] || null;
            }
        }
    } catch (error) {
        const match = url.match(/(?:v=|youtu\.be\/|\/live\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/);
        return match?.[1] || null;
    }

    return null;
};

const buildYoutubeEmbedUrl = (videoId) => {
    const params = new URLSearchParams({
        autoplay: '1',
        modestbranding: '1',
        rel: '0',
        controls: '1',
        fs: '1',
        playsinline: '1',
        iv_load_policy: '3',
        cc_load_policy: '0',
        enablejsapi: '1',
        origin: YOUTUBE_REFERRER,
        widget_referrer: YOUTUBE_REFERRER,
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

const buildYoutubeHtml = (embedUrl) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #000;
      }
      iframe {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        border: 0;
        background: #000;
      }
    </style>
  </head>
  <body>
    <iframe
      src="${embedUrl}"
      title="SS Property Guru Live Tour"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen>
    </iframe>
  </body>
</html>`;

const LiveTourScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [streamUrl, setStreamUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        fetchStream();
    }, []);

    const fetchStream = async () => {
        try {
            const res = await getCurrentStream();
            const streamData = res.data?.data || res.data?.stream || res.data;
            const isStreamActive = streamData?.isActive === true || streamData?.active === true;
            
            if (streamData?.youtubeUrl && isStreamActive) {
                const videoId = getYoutubeVideoId(streamData.youtubeUrl);
                let embedUrl = streamData.youtubeUrl;

                if (videoId) {
                    embedUrl = buildYoutubeEmbedUrl(videoId);
                }
                
                setStreamUrl(embedUrl);
                setIsActive(true);
            } else {
                setIsActive(false);
            }
        } catch (error) {
            setIsActive(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#000" barStyle="light-content" />

            {/* Header */}
            <View style={[styles.header, { top: Math.max(insets.top, 20) }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="close" size={28} color="#FFF" />
                </TouchableOpacity>
                {isActive && (
                    <View style={styles.liveBadge}>
                        <View style={styles.dot} />
                        <Text style={styles.liveText}>LIVE</Text>
                    </View>
                )}
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>{t('home.connectingToTour')}</Text>
                </View>
            ) : isActive && streamUrl ? (
                <WebView
                    originWhitelist={['*']}
                    source={{ html: buildYoutubeHtml(streamUrl), baseUrl: YOUTUBE_REFERRER }}
                    style={styles.webview}
                    allowsFullscreenVideo={true}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    thirdPartyCookiesEnabled={true}
                    sharedCookiesEnabled={true}
                    mixedContentMode="always"
                    mediaPlaybackRequiresUserAction={false}
                    allowsInlineMediaPlayback={true}
                    scalesPageToFit={true}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color="#FF0000" />
                        </View>
                    )}
                />
            ) : (
                <View style={styles.centerContainer}>
                    <Icon name="videocam-off-outline" size={80} color={Colors.textLight} />
                    <Text style={styles.noLiveTitle}>{t('home.noLiveTour')}</Text>
                    <Text style={styles.noLiveText}>
                        No live tour is available right now. Please check back later.
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    webview: { flex: 1, backgroundColor: '#000' },
    header: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 10,
        alignItems: 'center'
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF0000',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFF'
    },
    liveText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.5
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40
    },
    loadingText: {
        color: '#FFF',
        marginTop: 15,
        fontSize: 14,
        opacity: 0.8
    },
    noLiveTitle: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '800',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center'
    },
    noLiveText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22
    }
});

export default LiveTourScreen;
