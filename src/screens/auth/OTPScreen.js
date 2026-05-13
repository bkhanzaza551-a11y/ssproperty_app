import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Alert,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 6 boxes + 5 gaps, fit within screen with 48px horizontal padding
const BOX_SIZE = Math.min(48, Math.floor((SCREEN_WIDTH - 48 - 5 * 10) / 6));
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/colors';
import CustomButton from '../../components/CustomButton';
import Icon from 'react-native-vector-icons/Ionicons';
import { verifyOtp, resetPassword, forgotPassword } from '../../api/authApi';
import authStore from '../../store/authStore';

const OTP_LENGTH = 6;

const OTPScreen = ({ route, navigation }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { email, mode, prefillOtp } = route.params || {};
    const buildOtpArray = (val) => {
        if (!val) return ['', '', '', '', '', ''];
        const str = val.toString().slice(0, 6);
        const arr = str.split('');
        while (arr.length < 6) arr.push('');
        return arr;
    };
    const [otp, setOtp] = useState(buildOtpArray(prefillOtp));
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(30);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(t => t - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const handleChange = (text, index) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (text && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length < OTP_LENGTH) {
            Alert.alert(t('auth.invalidOTP'), t('auth.invalidOTPDesc'));
            return;
        }

        setLoading(true);
        try {
            if (mode === 'forgot') {
                if (!password || password !== confirmPassword) {
                    Alert.alert(t('auth.passwordError'), t('auth.passwordErrorDesc'));
                    setLoading(false);
                    return;
                }
                await resetPassword({ email, otp: otpString, password, confirmPassword });
                Alert.alert(t('common.submit'), t('auth.verifiedDesc'), [
                    { text: t('auth.login'), onPress: () => navigation.navigate('Login') }
                ]);
            } else {
                const response = await verifyOtp(email, otpString);
                const token = response.data?.data?.token || response.data?.token;
                const userData = response.data?.data?.user || response.data?.data;
                if (token && userData) {
                    await authStore.saveAuthData(token, userData);
                    
                    // Upload notification token now that we have user data
                    try {
                        const notificationService = require('../../services/notificationService').default;
                        notificationService.uploadToken();
                    } catch (err) {
                        console.log('Token upload deferred:', err);
                    }

                    // Navigate to Dashboard (Sell tab)
                    navigation.replace('MainApp', {
                        screen: 'Home'
                    });
                } else {
                    Alert.alert(t('auth.verified'), t('auth.verifiedDesc'), [
                        { text: t('auth.login'), onPress: () => navigation.navigate('Login') }
                    ]);
                }
            }
        } catch (error) {
            Alert.alert(
                t('auth.verificationFailed'),
                error?.response?.data?.message || t('auth.invalidOTPDesc'),
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await forgotPassword(email);
            setTimer(30);
            Alert.alert(t('auth.otpSent'), t('auth.otpSentDesc'));
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to resend OTP. Please try again later.';
            Alert.alert('Error', message);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}>
                        <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.titleSection}>
                    <View style={styles.lockIconWrapper}>
                        <Icon
                            name={mode === 'forgot' ? "key-outline" : "mail-open-outline"}
                            size={40}
                            color={Colors.primary}
                        />
                    </View>
                    <Text style={styles.title}>
                        {mode === 'forgot' ? t('auth.resetPassword') : t('auth.verifyEmail')}
                    </Text>
                    <Text style={styles.subtitle}>
                        {t('auth.otpSubtitle')}{'\n'}
                        <Text style={styles.phoneText}>{email}</Text>
                    </Text>
                </View>

                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={ref => (inputRefs.current[index] = ref)}
                            style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                            value={digit}
                            onChangeText={text => handleChange(text, index)}
                            onKeyPress={e => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            autoFocus={index === 0}
                            selectionColor={Colors.primary}
                        />
                    ))}
                </View>

                {mode === 'forgot' && (
                    <View style={styles.forgotFields}>
                        <Text style={styles.label}>{t('auth.password')}</Text>
                        <TextInput
                            style={styles.fieldInput}
                            placeholder="••••••••"
                            placeholderTextColor={Colors.textLight}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                        <Text style={[styles.label, { marginTop: 15 }]}>{t('auth.confirmPassword')}</Text>
                        <TextInput
                            style={styles.fieldInput}
                            placeholder="••••••••"
                            placeholderTextColor={Colors.textLight}
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                    </View>
                )}

                <CustomButton
                    title={mode === 'forgot' ? t('auth.resetAndContinue') : t('auth.verifyAndLogin')}
                    onPress={handleVerify}
                    loading={loading}
                    size="large"
                    style={styles.verifyButton}
                    icon="checkmark-circle-outline"
                />

                <View style={styles.resendSection}>
                    {timer > 0 ? (
                        <Text style={styles.timerText}>
                            {t('auth.resendIn')}<Text style={styles.timerBold}>{timer}s</Text>
                        </Text>
                    ) : (
                        <TouchableOpacity onPress={handleResend}>
                            <Text style={styles.resendText}>{t('auth.resendCode')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: Colors.surfaceSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    lockIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    phoneText: {
        color: Colors.primary,
        fontWeight: '700',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginBottom: 30,
        paddingHorizontal: 24,
    },
    otpInput: {
        width: BOX_SIZE,
        height: BOX_SIZE,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.border,
        backgroundColor: Colors.surfaceSecondary,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    otpInputFilled: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primarySoft,
    },
    forgotFields: {
        marginBottom: 30,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    fieldInput: {
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: 15,
        height: 55,
        paddingHorizontal: 16,
        fontSize: 16,
        color: Colors.textPrimary,
        fontWeight: '600',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    verifyButton: {
        marginBottom: 24,
    },
    resendSection: {
        alignItems: 'center',
    },
    timerText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    timerBold: {
        fontWeight: '700',
        color: Colors.primary,
    },
    resendText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.primary,
    },
});

export default OTPScreen;
