import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Image, StatusBar, KeyboardAvoidingView,
    Platform, ScrollView, Alert, Dimensions, TouchableOpacity, Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import Colors from '../../constants/colors';
import FloatingLabelInput from '../../components/FloatingLabelInput';
import AnimatedButton from '../../components/AnimatedButton';
import { signin } from '../../api/authApi';
import authStore from '../../store/authStore';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Staggered Animations
    const logoAnim = useRef(new Animated.Value(0)).current;
    const logoSlide = useRef(new Animated.Value(-50)).current;
    const titleAnim = useRef(new Animated.Value(0)).current;
    const titleSlide = useRef(new Animated.Value(20)).current;
    const formAnim = useRef(new Animated.Value(0)).current;
    const formSlide = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.stagger(150, [
            Animated.parallel([
                Animated.timing(logoAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.spring(logoSlide, { toValue: 0, tension: 20, friction: 6, useNativeDriver: true })
            ]),
            Animated.parallel([
                Animated.timing(titleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.spring(titleSlide, { toValue: 0, tension: 20, friction: 6, useNativeDriver: true })
            ]),
            Animated.parallel([
                Animated.timing(formAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.spring(formSlide, { toValue: 0, tension: 20, friction: 7, useNativeDriver: true })
            ]),
        ]).start();
    }, []);

    const handleLogin = async () => {
        const trimmedPhone = (phone || '').trim();
        const trimmedPassword = (password || '').trim();

        if (!trimmedPhone || trimmedPhone.length < 10) {
            Alert.alert(t('auth.invalidPhone'), t('auth.invalidPhoneDesc'));
            return;
        }
        if (!trimmedPassword || trimmedPassword.length < 6) {
            Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const response = await signin(trimmedPhone, trimmedPassword);
            const token = response.data?.data?.token || response.data?.token;
            const userData = response.data?.data?.user || response.data?.data;

            if (token && userData) {
                await authStore.saveAuthData(token, userData);

                // Upload FCM notification token
                try {
                    const notificationService = require('../../services/notificationService').default;
                    notificationService.uploadToken();
                } catch (err) {
                    console.log('Token upload deferred:', err);
                }

                navigation.replace('MainApp', { screen: 'Home' });
            } else {
                Alert.alert(t('common.error'), 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('[LOGIN] Error:', error.response?.data);
            let message = 'Failed to login. Please check your credentials.';
            if (error.response?.status === 404) message = t('auth.phoneNotFound');
            else if (error.response?.status === 401) message = 'Incorrect password. Please try again.';
            else if (error.response?.status === 403) message = error.response?.data?.message || 'Your account is inactive. Contact admin.';
            else if (error.response?.data?.message) message = error.response.data.message;
            Alert.alert(t('common.error'), message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* Decorative Background */}
                <View style={styles.topDecoration}>
                    <LinearGradient colors={[Colors.primarySoft, Colors.background]} style={styles.decorCircle} />
                    <LinearGradient colors={[Colors.accentSoft, Colors.background]} style={styles.decorCircleSmall} />
                </View>

                {/* Animated Header */}
                <View style={styles.header}>
                    <Animated.View style={[styles.logoContainer, { opacity: logoAnim, transform: [{ translateY: logoSlide }] }]}>
                        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                    </Animated.View>
                    <Animated.View style={{ opacity: titleAnim, transform: [{ translateY: titleSlide }], alignItems: 'center' }}>
                        <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
                        <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
                    </Animated.View>
                </View>

                {/* Animated Form */}
                <Animated.View style={[styles.card, { opacity: formAnim, transform: [{ translateY: formSlide }] }]}>

                    <FloatingLabelInput
                        label={t('auth.phone')}
                        value={phone}
                        onChangeText={setPhone}
                        icon="call-outline"
                        prefix="+91"
                        keyboardType="phone-pad"
                        maxLength={10}
                        style={{ marginBottom: 20 }}
                    />

                    <FloatingLabelInput
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        icon="lock-closed-outline"
                        secureTextEntry
                        style={{ marginBottom: 24 }}
                    />

                    <AnimatedButton
                        title={t('auth.signIn')}
                        onPress={handleLogin}
                        loading={loading}
                        icon="log-in-outline"
                    />

                    <View style={styles.signupContainer}>
                        <Text style={styles.noAccountText}>{t('auth.noAccount')}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Signup')} activeOpacity={0.7}>
                            <Text style={styles.signupLink}>{t('auth.signup')}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                <Animated.View style={[styles.footer, { opacity: formAnim }]}>
                    <Text style={styles.footerText}>
                        {t('auth.agreeTo')}{' '}
                        <Text style={styles.link}>{t('auth.terms')}</Text>{t('auth.and')}{' '}
                        <Text style={styles.link} onPress={() => navigation.navigate('PrivacyPolicy')}>{t('auth.privacyPolicy')}</Text>
                    </Text>
                </Animated.View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
    topDecoration: { position: 'absolute', top: -100, right: -100, zIndex: -1 },
    decorCircle: { width: 300, height: 300, borderRadius: 150, opacity: 0.6 },
    decorCircleSmall: { width: 150, height: 150, borderRadius: 75, position: 'absolute', bottom: 50, left: -50, opacity: 0.4 },
    header: { alignItems: 'center', marginTop: 30, marginBottom: 40 },
    logoContainer: {
        width: 100, height: 100, borderRadius: 28, padding: 15,
        backgroundColor: Colors.surfaceSecondary, elevation: 15,
        shadowColor: Colors.shadowPremium, shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15, shadowRadius: 24, marginBottom: 25,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
    },
    logo: { width: '100%', height: '100%' },
    title: { fontSize: 32, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: 8 },
    subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 20, lineHeight: 22 },
    card: {
        backgroundColor: Colors.surface, borderRadius: 32, padding: 28, elevation: 6,
        shadowColor: Colors.shadowPremium, shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1, shadowRadius: 32, borderWidth: 1, borderColor: Colors.borderLight,
    },
    signupContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
    noAccountText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
    signupLink: { color: Colors.primary, fontSize: 14, fontWeight: '800' },
    footer: { marginTop: 40, marginBottom: 40, paddingHorizontal: 40 },
    footerText: { fontSize: 12, color: Colors.textLight, textAlign: 'center', lineHeight: 18 },
    link: { color: Colors.primary, fontWeight: '700' },
});

export default LoginScreen;
