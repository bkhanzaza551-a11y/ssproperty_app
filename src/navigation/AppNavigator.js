import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../constants/colors';
import { getNotifications } from '../api/notificationApi';

// ... existing screens imports ...
import HomeScreen from '../screens/home/HomeScreen';
import BuyPropertyScreen from '../screens/property/BuyPropertyScreen';
import PropertyDetailScreen from '../screens/property/PropertyDetailScreen';
import AddPropertyScreen from '../screens/property/AddPropertyScreen';
import MyPropertiesScreen from '../screens/property/MyPropertiesScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import GalleryScreen from '../screens/corporate/GalleryScreen';
import FranchiseScreen from '../screens/corporate/FranchiseScreen';
import AboutContactScreen from '../screens/corporate/AboutContactScreen';
import PrivacyPolicyScreen from '../screens/corporate/PrivacyPolicyScreen';
import EnquiryFormScreen from '../screens/home/EnquiryFormScreen';
import LiveTourScreen from '../screens/home/LiveTourScreen';
import PostRequirementScreen from '../screens/home/PostRequirementScreen';
import AdminDashboardScreen from '../screens/profile/AdminDashboardScreen';
import NotificationScreen from '../screens/profile/NotificationScreen';
import ManagementListScreen from '../screens/profile/ManagementListScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import LocationManagerScreen from '../screens/profile/LocationManagerScreen';

import FranchiseDashboardScreen from '../screens/profile/FranchiseDashboardScreen';
import LeadsScreen from '../screens/agent/LeadsScreen';
import AgentsScreen from '../screens/agent/AgentsScreen';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

// Create SEPARATE stack instances
const HomeStackNav = createNativeStackNavigator();
const BuyStackNav = createNativeStackNavigator();
const SellStackNav = createNativeStackNavigator();
const EnquiryStackNav = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();

// Premium Tab icon component
const TabIcon = ({ label, icon, focused, badge }) => {
    const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.9)).current;
    const translateYAnim = useRef(new Animated.Value(focused ? -5 : 0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: focused ? 1.05 : 1,
                friction: 6,
                useNativeDriver: true,
            }),
            Animated.spring(translateYAnim, {
                toValue: focused ? -6 : 0,
                friction: 6,
                useNativeDriver: true,
            })
        ]).start();
    }, [focused, scaleAnim, translateYAnim]);

    return (
        <Animated.View style={[
            styles.tabItemContainer,
            { transform: [{ scale: scaleAnim }, { translateY: translateYAnim }] }
        ]}>
            <View style={{
                backgroundColor: focused ? Colors.primary : 'transparent',
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: focused ? Colors.primary : 'transparent',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: focused ? 0.3 : 0,
                shadowRadius: 8,
                elevation: focused ? 6 : 0,
            }}>
                <Icon
                    name={focused ? icon : `${icon}-outline`}
                    size={20}
                    color={focused ? Colors.textWhite : Colors.textLight}
                />
                {badge > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                    </View>
                )}
            </View>
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive, { marginTop: 4, opacity: focused ? 1 : 0.5 }]}>
                {label}
            </Text>
        </Animated.View>
    );
};

// ... existing stack components ...
const HomeStack = () => (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
        <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
        <HomeStackNav.Screen name="PropertyDetail" component={PropertyDetailScreen} />
        <HomeStackNav.Screen name="Enquiry" component={EnquiryFormScreen} />
        <HomeStackNav.Screen name="MyProperties" component={MyPropertiesScreen} />
        <HomeStackNav.Screen name="AddProperty" component={AddPropertyScreen} />
        <HomeStackNav.Screen name="Gallery" component={GalleryScreen} />
        <HomeStackNav.Screen name="Franchise" component={FranchiseScreen} />
        <HomeStackNav.Screen name="AboutContact" component={AboutContactScreen} />
        <HomeStackNav.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <HomeStackNav.Screen name="LiveTour" component={LiveTourScreen} />
        <HomeStackNav.Screen name="Agents" component={AgentsScreen} />
        <HomeStackNav.Screen name="PostRequirement" component={PostRequirementScreen} />
    </HomeStackNav.Navigator>
);

const BuyStack = () => (
    <BuyStackNav.Navigator screenOptions={{ headerShown: false }}>
        <BuyStackNav.Screen name="BuyMain" component={BuyPropertyScreen} />
        <BuyStackNav.Screen name="PropertyDetail" component={PropertyDetailScreen} />
    </BuyStackNav.Navigator>
);

const SellStack = () => (
    <SellStackNav.Navigator screenOptions={{ headerShown: false }}>
        <SellStackNav.Screen name="Dashboard" component={DashboardScreen} />
        <SellStackNav.Screen name="AddProperty" component={AddPropertyScreen} />
        <SellStackNav.Screen name="MyProperties" component={MyPropertiesScreen} />
        <SellStackNav.Screen name="PropertyDetail" component={PropertyDetailScreen} />
    </SellStackNav.Navigator>
);

const EnquiryStack = () => (
    <EnquiryStackNav.Navigator screenOptions={{ headerShown: false }}>
        <EnquiryStackNav.Screen name="EnquiryMain" component={EnquiryFormScreen} />
        <EnquiryStackNav.Screen name="PropertyDetail" component={PropertyDetailScreen} />
    </EnquiryStackNav.Navigator>
);

const ProfileStack = () => (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
        <ProfileStackNav.Screen name="ProfileMain" component={ProfileScreen} />
        <ProfileStackNav.Screen name="EditProfile" component={EditProfileScreen} />
        <ProfileStackNav.Screen name="Notification" component={NotificationScreen} />
        <ProfileStackNav.Screen name="MyProperties" component={MyPropertiesScreen} />
        <ProfileStackNav.Screen name="AddProperty" component={AddPropertyScreen} />
        <ProfileStackNav.Screen name="Enquiry" component={EnquiryFormScreen} />
        <ProfileStackNav.Screen name="PropertyDetail" component={PropertyDetailScreen} />
        <ProfileStackNav.Screen name="Gallery" component={GalleryScreen} />
        <ProfileStackNav.Screen name="Franchise" component={FranchiseScreen} />
        <ProfileStackNav.Screen name="AboutContact" component={AboutContactScreen} />
        <ProfileStackNav.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <ProfileStackNav.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <ProfileStackNav.Screen name="FranchiseDashboard" component={FranchiseDashboardScreen} />
        <ProfileStackNav.Screen name="LocationManager" component={LocationManagerScreen} />
        <ProfileStackNav.Screen name="ManagementList" component={ManagementListScreen} />
        <ProfileStackNav.Screen name="Leads" component={LeadsScreen} />
        <ProfileStackNav.Screen name="Agents" component={AgentsScreen} />
        <ProfileStackNav.Screen name="PostRequirement" component={PostRequirementScreen} />
    </ProfileStackNav.Navigator>
);

const Stack = createNativeStackNavigator();

// Bottom Tabs with Premium Floating UI
const AppNavigator = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch unread notification count
    const fetchUnreadCount = async () => {
        try {
            const response = await getNotifications();
            const notifications = response.data?.data || response.data || [];
            const unread = notifications.filter(n => !n.isRead).length;
            setUnreadCount(unread);
        } catch (error) {
            console.log('[AppNavigator] Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        // Refresh every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarShowLabel: false,
                tabBarIcon: ({ focused }) => {
                    let iconName;
                    let label;
                    let badge = 0;
                    
                    if (route.name === 'Home') { iconName = 'home'; label = t('common.home'); }
                    else if (route.name === 'Buy') { iconName = 'search'; label = t('common.searchTab'); }
                    else if (route.name === 'Sell') { iconName = 'add-circle'; label = t('common.sellTab'); }
                    else if (route.name === 'Enquiry') { iconName = 'chatbubble-ellipses'; label = t('home.enquiry'); }
                    else if (route.name === 'Profile') { 
                        iconName = 'person'; 
                        label = t('common.profileTab');
                        badge = unreadCount; // Show notification badge on Profile tab
                    }
                    
                    return <TabIcon label={label} icon={iconName} focused={focused} badge={badge} />;
                },
                tabBarStyle: {
                    position: 'absolute',
                    bottom: insets.bottom > 0 ? insets.bottom : 20,
                    left: 24,
                    right: 24,
                    height: 70,
                    backgroundColor: Colors.backgroundCard,
                    borderRadius: 35,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.8)',
                    paddingBottom: 0,
                    paddingTop: 0,
                    elevation: 15,
                    shadowColor: Colors.shadowDark,
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.15,
                    shadowRadius: 24,
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Buy" component={BuyStack} />
            <Tab.Screen name="Sell" component={SellStack} />
            <Tab.Screen name="Enquiry" component={EnquiryStack} />
            <Tab.Screen name="Profile" component={ProfileStack} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        flexDirection: 'row',
    },
    tabItemContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: Colors.textLight,
        marginTop: 4,
    },
    tabLabelActive: {
        fontWeight: '700',
        color: Colors.primary,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: Colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: Colors.backgroundCard,
    },
    badgeText: {
        color: Colors.textWhite,
        fontSize: 10,
        fontWeight: '900',
    },
});


export default AppNavigator;
