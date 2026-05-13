import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';

const NOTIFICATION_TOKEN_KEY = 'fcm_token';

class NotificationService {
    constructor() {
        this.token = null;
        this.initialized = false;
    }

    /**
     * Initialize notification service
     * Call this in App.tsx on app start
     */
    async initialize() {
        if (this.initialized) return;

        console.log('[NotificationService] Initializing...');

        try {
            // Create notification channel for Android
            await this.createNotificationChannel();

            // Request permissions
            const hasPermission = await this.requestPermission();
            if (!hasPermission) {
                console.log('[NotificationService] Permission denied');
                return;
            }

            // Get FCM token
            await this.getFCMToken();

            // Setup notification handlers
            this.setupNotificationHandlers();

            this.initialized = true;
            console.log('[NotificationService] Initialized successfully');
        } catch (error) {
            console.error('[NotificationService] Initialization error:', error);
            // Don't throw - just log and continue
        }
    }

    /**
     * Create Android notification channel
     */
    async createNotificationChannel() {
        if (Platform.OS === 'android') {
            await notifee.createChannel({
                id: 'default',
                name: 'Default Notifications',
                importance: AndroidImportance.HIGH,
                sound: 'default',
                vibration: true,
            });

            await notifee.createChannel({
                id: 'property',
                name: 'Property Notifications',
                importance: AndroidImportance.HIGH,
                sound: 'default',
                vibration: true,
            });

            console.log('[NotificationService] Notification channels created');
        }
    }

    /**
     * Request notification permissions
     */
    async requestPermission() {
        try {
            if (Platform.OS === 'android') {
                if (Platform.Version >= 33) {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                    );
                    return granted === PermissionsAndroid.RESULTS.GRANTED;
                }
                return true;
            } else {
                // iOS
                const authStatus = await messaging().requestPermission();
                return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
            }
        } catch (error) {
            console.error('[NotificationService] Permission error:', error);
            return false;
        }
    }

    /**
     * Get FCM token and save to backend
     */
    async getFCMToken() {
        try {
            const token = await messaging().getToken();
            console.log('[NotificationService] FCM Token:', token);

            this.token = token;
            await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);

            // Send token to backend
            await this.sendTokenToBackend(token);

            return token;
        } catch (error) {
            console.error('[NotificationService] Get token error:', error);
            return null;
        }
    }

    /**
     * Upload current FCM token to backend
     * Call this after login to ensure token is saved
     */
    async uploadToken() {
        try {
            const token = this.token || await messaging().getToken();
            if (!token) {
                console.log('[NotificationService] No token available to upload');
                return;
            }
            
            this.token = token;
            await this.sendTokenToBackend(token);
        } catch (error) {
            console.error('[NotificationService] Upload token error:', error);
        }
    }

    /**
     * Send FCM token to backend
     */
    async sendTokenToBackend(token) {
        try {
            const userDataStr = await AsyncStorage.getItem('userData');
            if (!userDataStr) {
                console.log('[NotificationService] No user logged in, skipping token upload to backend');
                return;
            }

            // Import API function
            const { saveFCMToken } = require('../api/userApi');

            const response = await saveFCMToken(token);
            console.log('[NotificationService] Token uploaded to backend:', response.data?.message || 'Success');
        } catch (error) {
            console.error('[NotificationService] Send token error:', error.message);
        }
    }

    /**
     * Setup notification handlers
     */
    setupNotificationHandlers() {
        // Handle notifications when app is in foreground
        messaging().onMessage(async remoteMessage => {
            console.log('[NotificationService] Foreground notification:', remoteMessage);
            this.showLocalNotification(remoteMessage);
        });

        // Handle notification when app is opened from background
        messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('[NotificationService] Notification opened app:', remoteMessage);
            this.handleNotificationNavigation(remoteMessage);
        });

        // Handle notification when app is opened from quit state
        messaging()
            .getInitialNotification()
            .then(remoteMessage => {
                if (remoteMessage) {
                    console.log('[NotificationService] Notification opened app from quit state:', remoteMessage);
                    this.handleNotificationNavigation(remoteMessage);
                }
            });
    }

    /**
     * Show local notification (for foreground notifications)
     */
    async showLocalNotification(remoteMessage) {
        const { notification, data } = remoteMessage;
        
        try {
            // Display notification using Notifee
            await notifee.displayNotification({
                title: notification?.title || '🏠 SS Property Guru',
                body: notification?.body || 'New update available',
                android: {
                    channelId: data?.type === 'new_property' ? 'property' : 'default',
                    importance: AndroidImportance.HIGH,
                    pressAction: {
                        id: 'default',
                        launchActivity: 'default',
                    },
                    smallIcon: 'ic_launcher',
                    color: '#16A085',
                    sound: 'default',
                    vibrationPattern: [300, 500],
                    style: {
                        type: AndroidStyle.BIGTEXT,
                        text: notification?.body || '',
                    },
                },
                ios: {
                    sound: 'default',
                    foregroundPresentationOptions: {
                        alert: true,
                        badge: true,
                        sound: true,
                    },
                },
                data: data || {},
            });

            console.log('[NotificationService] Local notification displayed');
        } catch (error) {
            console.error('[NotificationService] Display notification error:', error);
            
            // Fallback to Alert if Notifee fails
            Alert.alert(
                notification?.title || 'New Notification',
                notification?.body || '',
                [
                    { text: 'Dismiss', style: 'cancel' },
                    { 
                        text: 'View', 
                        onPress: () => this.handleNotificationNavigation(remoteMessage)
                    }
                ]
            );
        }
    }

    /**
     * Handle notification navigation
     */
    handleNotificationNavigation(remoteMessage) {
        const { data } = remoteMessage;
        console.log('[NotificationService] Navigation data:', data);
        
        // Store navigation data for later use
        if (data?.type === 'new_property' && data?.propertyId) {
            this.pendingNavigation = {
                screen: 'Buy',
                params: { propertyId: data.propertyId }
            };
        }
    }

    /**
     * Get and clear pending navigation
     */
    getPendingNavigation() {
        const nav = this.pendingNavigation;
        this.pendingNavigation = null;
        return nav;
    }

    /**
     * Get stored FCM token
     */
    async getStoredToken() {
        try {
            const token = await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
            return token;
        } catch (error) {
            console.error('[NotificationService] Get stored token error:', error);
            return null;
        }
    }

    /**
     * Clear FCM token (on logout)
     */
    async clearToken() {
        try {
            await messaging().deleteToken();
            await AsyncStorage.removeItem(NOTIFICATION_TOKEN_KEY);
            this.token = null;
            console.log('[NotificationService] Token cleared');
        } catch (error) {
            console.error('[NotificationService] Clear token error:', error);
        }
    }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
