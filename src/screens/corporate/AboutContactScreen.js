import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Linking, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import Colors from '../../constants/colors';
import Icon from 'react-native-vector-icons/Ionicons';
import { createEnquiry } from '../../api/enquiryApi';
import CustomButton from '../../components/CustomButton';

const AboutContactScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [form, setForm] = useState({ name: '', phone: '', details: '' });
    const [loading, setLoading] = useState(false);

    const handleEmail = () => Linking.openURL('mailto:sspropertyguru1@gmail.com');
    const handleCall = () => Linking.openURL('tel:+917400763089');

    const handleEnquiry = async () => {
        if (!form.name || !form.phone || !form.details) {
            Alert.alert(t('corporate.incomplete'), t('corporate.fillMandatory'));
            return;
        }
        setLoading(true);
        try {
            await createEnquiry({
                name: form.name,
                contact: form.phone,
                email: `${form.phone}@noemail.com`,
                city: 'General',
                message: form.details,
            });
            Alert.alert(t('common.success'), t('corporate.teamContactSoon'));
            setForm({ name: '', phone: '', details: '' });
        } catch (e) {
            Alert.alert(t('common.error'), t('home.enquiryError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('corporate.supportAbout')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('corporate.aboutTitle')}</Text>
                    <Text style={styles.paragraph}>
                        {t('corporate.aboutDesc')}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('corporate.contactUs')}</Text>
                    <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
                        <View style={styles.iconBox}>
                            <Icon name="call-outline" size={24} color={Colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.contactLabel}>{t('corporate.mobileNumber')}</Text>
                            <Text style={styles.contactValue}>+91 7400763089</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
                        <View style={styles.iconBox}>
                            <Icon name="mail-outline" size={24} color={Colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.contactLabel}>{t('corporate.emailAddress')}</Text>
                            <Text style={styles.contactValue}>sspropertyguru1@gmail.com</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={[styles.section, styles.enquiryCard]}>
                    <Text style={styles.sectionTitle}>{t('corporate.submitRequirement')}</Text>
                    <Text style={styles.paragraph}>{t('corporate.cantFind')}</Text>

                    <TextInput
                        style={styles.input}
                        placeholder={t('corporate.fullName')}
                        value={form.name}
                        onChangeText={(v) => setForm({ ...form, name: v })}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder={t('corporate.mobileNumber')}
                        keyboardType="phone-pad"
                        value={form.phone}
                        onChangeText={(v) => setForm({ ...form, phone: v })}
                    />
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder={t('corporate.requirementDetails')}
                        multiline
                        numberOfLines={4}
                        value={form.details}
                        onChangeText={(v) => setForm({ ...form, details: v })}
                    />

                    <CustomButton
                        title={t('common.submit')}
                        onPress={handleEnquiry}
                        loading={loading}
                        style={styles.submitBtn}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('corporate.legal')}</Text>
                    <TouchableOpacity style={styles.legalItem} onPress={() => navigation.navigate('PrivacyPolicy')}>
                        <Text style={styles.legalText}>{t('auth.privacyPolicy')}</Text>
                        <Icon name="chevron-forward" size={18} color={Colors.textLight} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.legalItem}>
                        <Text style={styles.legalText}>{t('auth.terms')}</Text>
                        <Icon name="chevron-forward" size={18} color={Colors.textLight} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
    content: {
        padding: 25,
        paddingBottom: 120,
    },
    section: { marginBottom: 35 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 15 },
    paragraph: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24 },
    contactItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 15 },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: Colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center'
    },
    contactLabel: { fontSize: 13, color: Colors.textSecondary },
    contactValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
    legalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    legalText: { fontSize: 16, color: Colors.textPrimary, fontWeight: '500' },
    enquiryCard: {
        backgroundColor: Colors.surfaceSecondary,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    input: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 15,
        marginTop: 15,
        fontSize: 15,
        color: Colors.textPrimary,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitBtn: {
        marginTop: 20,
    },
});

export default AboutContactScreen;
