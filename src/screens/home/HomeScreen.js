import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity, TouchableWithoutFeedback,
    StatusBar, Dimensions, FlatList, ScrollView, Platform, Animated, Alert,
    RefreshControl, TextInput, KeyboardAvoidingView, Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import Colors from '../../constants/colors';
import { propertyTypes } from '../../constants/appConstants';
import SearchBar from '../../components/SearchBar';
import LanguageSelector from '../../components/LanguageSelector';
import PropertyCard, { normalizeProperty } from '../../components/PropertyCard';
import { PropertyCardSkeleton } from '../../components/SkeletonLoader';
import { getProperties } from '../../api/propertyApi';
import { createEnquiry } from '../../api/enquiryApi';
import { getCurrentStream } from '../../api/streamApi';

const { width } = Dimensions.get('window');

const ActionCard = ({ title, desc, icon, color, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true }).start();
    };
    const handlePressOut = () => {
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();
    };

    return (
        <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
            <Animated.View style={[styles.actionCard, { transform: [{ scale: scaleAnim }] }]}>
                <View style={[styles.actionIconBox, { backgroundColor: color }]}>
                    <Icon name={icon} size={24} color={Colors.primary} />
                </View>
                <Text style={styles.actionTitle}>{title}</Text>
                <Text style={styles.actionDesc}>{desc}</Text>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

const HomeScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [search, setSearch] = useState('');
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [enquiryForm, setEnquiryForm] = useState({ name: '', phone: '', requirement: '', city: '' });
    const [enquiryLoading, setEnquiryLoading] = useState(false);
    const [showLivePopup, setShowLivePopup] = useState(false);
    const [liveUrl, setLiveUrl] = useState('');
    const [isLiveActive, setIsLiveActive] = useState(false);
    const liveUrlRef = useRef('');

    // Premium Staggered Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;

    // Ref for Auto-Scroll
    const scrollViewRef = useRef(null);
    const resultsRef = useRef(null);

    // Animate sections independently
    const actionsFade = useRef(new Animated.Value(0)).current;
    const contentFade = useRef(new Animated.Value(0)).current;

    const scrollResults = () => {
        if (scrollViewRef.current) {
            // Scroll to properties section (approx 450 - 500 offset or dynamic)
            // We'll scroll past the header and quick actions
            scrollViewRef.current.scrollTo({ y: 460, animated: true });
        }
    };

    const fetchHomeData = useCallback(async (isRefreshing = false) => {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);

        try {
            const propRes = await getProperties({});
            const listings = propRes.data?.data || propRes.data?.properties || propRes.data || [];
            setProperties(Array.isArray(listings) ? listings : []);
        } catch (error) {
            console.error('Home Data Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);

            // Trigger staggered entry animations when loading finishes
            Animated.stagger(150, [
                Animated.timing(actionsFade, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(contentFade, { toValue: 1, duration: 600, useNativeDriver: true })
            ]).start();
        }
    }, [actionsFade, contentFade]);

    const checkLiveStream = useCallback(async () => {
        try {
            const res = await getCurrentStream();
            const streamData = res.data?.data || res.data?.stream || res.data;
            const isStreamActive = streamData?.isActive === true || streamData?.active === true;
            const youtubeUrl = streamData?.youtubeUrl;

            if (youtubeUrl && isStreamActive) {
                setLiveUrl(youtubeUrl);
                setIsLiveActive(true);

                if (liveUrlRef.current !== youtubeUrl) {
                    liveUrlRef.current = youtubeUrl;
                    setShowLivePopup(true);
                }
                return;
            }

            liveUrlRef.current = '';
            setLiveUrl('');
            setIsLiveActive(false);
            setShowLivePopup(false);
        } catch (error) {
            // Silently fail - don't block UI
        }
    }, []);

    useEffect(() => {
        fetchHomeData();
        // Initial Header Animation
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 30, friction: 8, useNativeDriver: true })
        ]).start();
        
        // Check live stream in background after UI loads
        setTimeout(() => {
            checkLiveStream();
        }, 2000);
    }, [fadeAnim, slideAnim, fetchHomeData, checkLiveStream]);

    useFocusEffect(
        useCallback(() => {
            checkLiveStream();
            const interval = setInterval(checkLiveStream, 30000);
            return () => clearInterval(interval);
        }, [checkLiveStream])
    );

    const handleWatchLive = () => {
        setShowLivePopup(false);
        navigation.navigate('LiveTour');
    };

    const handleEnquirySubmit = async () => {
        if (!enquiryForm.name || !enquiryForm.phone || !enquiryForm.requirement) {
            Alert.alert(t('common.submit'), t('auth.missingFieldsDesc'));
            return;
        }
        setEnquiryLoading(true);
        try {
            await createEnquiry({
                name: enquiryForm.name,
                contact: enquiryForm.phone,
                message: enquiryForm.requirement,
                city: enquiryForm.city || 'General',
            });
            Alert.alert(t('common.submit'), t('home.enquirySuccess'));
            setEnquiryForm({ name: '', phone: '', requirement: '', city: '' });
        } catch (e) {
            Alert.alert(t('common.error'), t('home.enquiryError'));
        } finally {
            setEnquiryLoading(false);
        }
    };

    const filteredProperties = properties.filter(p => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            p.title?.toLowerCase().includes(s) ||
            p.category?.toLowerCase().includes(s) ||
            p.district?.toLowerCase().includes(s) ||
            p.area?.toLowerCase().includes(s)
        );
    });

    const featured = filteredProperties.filter(p => p.featured || p.isFeatured).map(p => normalizeProperty(p, t));
    
    // Category-wise latest properties
    const plots = filteredProperties
        .filter(p => p.category === 'Plot')
        .slice(0, 4)
        .map(p => normalizeProperty(p, t));
    
    const agricultural = filteredProperties
        .filter(p => p.category === 'Agricultural Land')
        .slice(0, 4)
        .map(p => normalizeProperty(p, t));
    
    const houses = filteredProperties
        .filter(p => p.category === 'House' || p.category === 'Residential')
        .slice(0, 4)
        .map(p => normalizeProperty(p, t));

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <Animated.ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { fetchHomeData(true); checkLiveStream(); }} tintColor={Colors.primary} />
                }
                style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

                {/* Premium Gradient Header */}
                <LinearGradient
                    colors={Colors.gradientPrimary}
                    style={[styles.header, { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 50) : insets.top + 20 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}>
                    <View style={styles.headerTop}>
                        <View style={styles.headerLeft}>
                            <Image source={require('../../assets/logo.png')} style={styles.headerLogo} resizeMode="contain" />
                            <View>
                                <Text style={styles.welcomeText}>{t('home.welcomeTo')}</Text>
                                <Text style={styles.appName}>{t('common.appName')}</Text>
                            </View>
                        </View>
                        <LanguageSelector />
                    </View>
                    <Text style={styles.headerTitle}>{t('home.greeting')}</Text>

                    <View style={styles.searchContainer}>
                        <SearchBar
                            value={search}
                            onChangeText={(v) => {
                                setSearch(v);
                                if (v.length > 2) scrollResults();
                            }}
                            onFilterPress={() => navigation.navigate('Buy')}
                            placeholder={t('common.search')}
                        />
                    </View>

                    {/* Category Filter */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryScroll}
                        contentContainerStyle={styles.categoryContent}>
                        {propertyTypes.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.categoryChip, search === cat && styles.categoryChipActive]}
                                onPress={() => {
                                    setSearch(cat === 'All Types' ? '' : cat);
                                    scrollResults();
                                }}>
                                <Text style={[styles.categoryChipText, search === cat && styles.categoryChipTextActive]}>
                                    {cat === 'All Types' ? t('common.all') : cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </LinearGradient>

                {/* Quick Actions with Animation */}
                <Animated.View style={[styles.actionsSection, { opacity: actionsFade }]}>
                    <ActionCard title={t('common.buy')} desc={t('home.buyDesc')} icon="home" color={Colors.primarySoft} onPress={() => navigation.navigate('Buy')} />
                    <ActionCard title={t('home.sell')} desc={t('home.sellDesc')} icon="cash" color={Colors.accentSoft} onPress={() => navigation.navigate('Sell')} />
                    <ActionCard title={t('home.enquiry')} desc={t('home.enquiryDescShort')} icon="chatbubble-ellipses" color="#F1F5F9" onPress={() => navigation.navigate('Enquiry')} />
                    <ActionCard title={t('home.franchise')} desc={t('home.franchiseDesc')} icon="business" color="#ECFDF5" onPress={() => navigation.navigate('Franchise')} />
                    <ActionCard title={isLiveActive ? 'Live Now' : 'Live Program'} desc={isLiveActive ? 'Tap to watch the live tour' : 'Watch property tours live'} icon="videocam" color="#FEF3C7" onPress={() => navigation.navigate('LiveTour')} />
                    <ActionCard title="Gallery" desc="View property photos" icon="images" color="#EDE9FE" onPress={() => navigation.navigate('Gallery')} />
                </Animated.View>

                {/* Content Section */}
                <Animated.View style={{ opacity: contentFade, paddingBottom: 80 }}>
                    {loading && !refreshing ? (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>{t('home.loadingProps')}</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                                <PropertyCardSkeleton horizontal />
                                <PropertyCardSkeleton horizontal />
                            </ScrollView>
                        </View>
                    ) : (
                        <>
                            {featured.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <View style={styles.sectionTitleRow}>
                                            <Icon name="star" size={20} color={Colors.accentLight} />
                                            <Text style={styles.sectionTitle}>{t('common.featured')}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => navigation.navigate('Buy')}>
                                            <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <FlatList
                                        data={featured}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{ paddingHorizontal: 20 }}
                                        renderItem={({ item }) => (
                                            <PropertyCard property={item} horizontal onPress={() => navigation.navigate('PropertyDetail', { property: item })} />
                                        )}
                                        keyExtractor={item => String(item._id || item.id || Math.random())}
                                    />
                                </View>
                            )}

                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionTitleRow}>
                                        <Icon name="grid" size={20} color={Colors.primary} />
                                        <Text style={styles.sectionTitle}>Plots</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => {
                                        setSearch('Plot');
                                        navigation.navigate('Buy');
                                    }}>
                                        <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ paddingHorizontal: 20 }}>
                                    {plots.length === 0 ? (
                                        <View style={styles.emptyContainer}>
                                            <Icon name="documents-outline" size={48} color={Colors.textLight} />
                                            <Text style={styles.emptyText}>No plots available</Text>
                                        </View>
                                    ) : (
                                        plots.map((property, idx) => (
                                            <PropertyCard key={String(property._id || property.id || idx)} property={property} onPress={() => navigation.navigate('PropertyDetail', { property })} />
                                        ))
                                    )}
                                </View>
                            </View>

                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionTitleRow}>
                                        <Icon name="leaf" size={20} color="#10B981" />
                                        <Text style={styles.sectionTitle}>Agricultural Land</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => {
                                        setSearch('Agricultural Land');
                                        navigation.navigate('Buy');
                                    }}>
                                        <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ paddingHorizontal: 20 }}>
                                    {agricultural.length === 0 ? (
                                        <View style={styles.emptyContainer}>
                                            <Icon name="documents-outline" size={48} color={Colors.textLight} />
                                            <Text style={styles.emptyText}>No agricultural land available</Text>
                                        </View>
                                    ) : (
                                        agricultural.map((property, idx) => (
                                            <PropertyCard key={String(property._id || property.id || idx)} property={property} onPress={() => navigation.navigate('PropertyDetail', { property })} />
                                        ))
                                    )}
                                </View>
                            </View>

                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionTitleRow}>
                                        <Icon name="home" size={20} color="#F59E0B" />
                                        <Text style={styles.sectionTitle}>Houses</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => {
                                        setSearch('House');
                                        navigation.navigate('Buy');
                                    }}>
                                        <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ paddingHorizontal: 20 }}>
                                    {houses.length === 0 ? (
                                        <View style={styles.emptyContainer}>
                                            <Icon name="documents-outline" size={48} color={Colors.textLight} />
                                            <Text style={styles.emptyText}>No houses available</Text>
                                        </View>
                                    ) : (
                                        houses.map((property, idx) => (
                                            <PropertyCard key={String(property._id || property.id || idx)} property={property} onPress={() => navigation.navigate('PropertyDetail', { property })} />
                                        ))
                                    )}
                                </View>
                            </View>

                            {/* Premium Quick Enquiry Form */}
                            <View style={[styles.section, styles.enquirySection]}>
                                <View style={styles.enquiryCard}>
                                    <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.enquiryDecoration} />
                                    <Text style={styles.enquiryTitle}>{t('home.premiumEnquiry')}</Text>
                                    <Text style={styles.enquirySubtitle}>{t('home.enquirySubtitle')}</Text>

                                    <TextInput style={styles.enquiryInput} placeholder={t('home.fullName')} placeholderTextColor={Colors.textLight} value={enquiryForm.name} onChangeText={(v) => setEnquiryForm(prev => ({ ...prev, name: v }))} />
                                    <TextInput style={styles.enquiryInput} placeholder={t('home.phoneNumber')} placeholderTextColor={Colors.textLight} keyboardType="phone-pad" value={enquiryForm.phone} onChangeText={(v) => setEnquiryForm(prev => ({ ...prev, phone: v }))} />
                                    <TextInput style={[styles.enquiryInput, { height: 90, paddingTop: 14 }]} placeholder={t('home.lookingFor')} placeholderTextColor={Colors.textLight} multiline value={enquiryForm.requirement} onChangeText={(v) => setEnquiryForm(prev => ({ ...prev, requirement: v }))} />

                                    <TouchableOpacity style={styles.enquirySubmitBtn} onPress={handleEnquirySubmit} disabled={enquiryLoading}>
                                        <LinearGradient colors={Colors.gradientAccent} style={styles.enquiryBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                            <Text style={styles.enquirySubmitText}>{t('home.requestCallback')}</Text>
                                            <Icon name="arrow-forward" size={18} color="#FFF" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                </Animated.View>
            </Animated.ScrollView>

            {/* Live Tour Popup */}
            <Modal
                visible={showLivePopup}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLivePopup(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.liveIndicator}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE NOW</Text>
                        </View>
                        
                        <Icon name="videocam" size={60} color="#FF0000" style={{ marginVertical: 20 }} />
                        
                        <Text style={styles.modalTitle}>Property Tour is Live!</Text>
                        <Text style={styles.modalDesc}>
                            Watch our live property tour happening right now
                        </Text>

                        <TouchableOpacity style={styles.watchButton} onPress={handleWatchLive}>
                            <Text style={styles.watchButtonText}>Watch Live</Text>
                            <Icon name="arrow-forward" size={20} color="#FFF" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.cancelButton} 
                            onPress={() => setShowLivePopup(false)}
                        >
                            <Text style={styles.cancelButtonText}>Maybe Later</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
    scrollContent: { paddingBottom: 120 },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        elevation: 15,
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 25,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    welcomeText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 },
    appName: { fontSize: 20, fontWeight: '800', color: Colors.textWhite, letterSpacing: 0.5 },
    headerLogo: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.textWhite },
    profileButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 34, fontWeight: '900', color: Colors.textWhite, lineHeight: 42, marginBottom: 20 },
    searchContainer: { marginTop: 10 },
    actionsSection: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, paddingTop: 30, gap: 14, justifyContent: 'center' },
    actionCard: {
        width: (width - 54) / 2,
        backgroundColor: Colors.backgroundCard,
        borderRadius: 24,
        padding: 16,
        alignItems: 'center',
        elevation: 8,
        shadowColor: Colors.shadowPremium,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    actionIconBox: { width: 50, height: 50, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    actionTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4, textAlign: 'center' },
    actionDesc: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', fontWeight: '500' },
    section: { marginTop: 35 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sectionTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
    viewAllText: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
    enquirySection: { paddingHorizontal: 20, marginTop: 40 },
    enquiryCard: { backgroundColor: Colors.backgroundCard, borderRadius: 32, padding: 28, elevation: 12, shadowColor: Colors.shadowPremium, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 30, overflow: 'hidden' },
    enquiryDecoration: { position: 'absolute', top: 0, left: 0, right: 0, height: 6 },
    enquiryTitle: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary, marginBottom: 8 },
    enquirySubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24, lineHeight: 22 },
    enquiryInput: { backgroundColor: Colors.surfaceSecondary, borderRadius: 16, padding: 18, marginBottom: 14, fontSize: 15, color: Colors.textPrimary },
    enquirySubmitBtn: { marginTop: 10, borderRadius: 16, overflow: 'hidden', elevation: 6 },
    enquiryBtnGradient: { paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    enquirySubmitText: { color: Colors.textWhite, fontSize: 17, fontWeight: '800' },
    emptyContainer: { alignItems: 'center', paddingVertical: 40, backgroundColor: Colors.surfaceSecondary, borderRadius: 20 },
    emptyText: { color: Colors.textSecondary, fontSize: 15, marginTop: 12, fontWeight: '500' },
    // Category Filter Styles
    categoryScroll: {
        marginTop: 15,
        marginHorizontal: -24, // Pull out of parent padding
    },
    categoryContent: {
        paddingHorizontal: 24,
        gap: 10,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    categoryChipActive: {
        backgroundColor: Colors.textWhite,
    },
    categoryChipText: {
        color: Colors.textWhite,
        fontSize: 13,
        fontWeight: '600',
    },
    categoryChipTextActive: {
        color: Colors.primary,
        fontWeight: '700',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF0000',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFF',
    },
    liveText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalDesc: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
    },
    watchButton: {
        backgroundColor: '#FF0000',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        gap: 10,
        elevation: 4,
        shadowColor: '#FF0000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    watchButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '800',
    },
    cancelButton: {
        marginTop: 15,
        paddingVertical: 12,
    },
    cancelButtonText: {
        color: '#6B7280',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default HomeScreen;
