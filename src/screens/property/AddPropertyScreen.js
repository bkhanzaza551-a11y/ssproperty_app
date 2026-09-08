import React, { useState, useEffect } from 'react';
import { Picker } from '@react-native-picker/picker';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    StatusBar,
    Platform,
    Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import Icon from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
// Payment removed — free property listing
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import CustomButton from '../../components/CustomButton';
import { Picker } from '@react-native-picker/picker';
import { addProperty, updateProperty } from '../../api/propertyApi';
import { Picker } from '@react-native-picker/picker';
import { getDistricts, getAreas } from '../../api/districtApi';
import { Picker } from '@react-native-picker/picker';
import { propertyTypes } from '../../constants/appConstants';
import authStore from '../../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddPropertyScreen = ({ navigation, route }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const editMode = route.params?.editMode || false;
    const propertyData = route.params?.propertyData || null;

    const [currentStep, setCurrentStep] = useState(1);
    const [form, setForm] = useState({
        title: propertyData?.title || '',
        price: propertyData?.price?.toString() || '',
        city: propertyData?.city || '',
        area: propertyData?.area || '',
        description: propertyData?.description || '',
        category: propertyData?.category || 'Residential',
        sellingType: propertyData?.sellingType || 'Sale',
        bedrooms: propertyData?.bedrooms?.toString() || '',
        bathrooms: propertyData?.bathrooms?.toString() || '',
        sqft: propertyData?.sqft?.toString() || '',
        features: propertyData?.features || [],
    });
    const [images, setImages] = useState(propertyData?.images || []);
    const [video, setVideo] = useState(propertyData?.video || null);
    const [loading, setLoading] = useState(false);
    const [newFeature, setNewFeature] = useState('');

    // Dynamic Location States
    const [districts, setDistricts] = useState([]);
    const [areas, setAreas] = useState([]); // This state is still here but not used in the provided diff for step 3. Keeping it for now.
    const [locLoading, setLocLoading] = useState(false); // This state is still here but not used in the provided diff for step 3. Keeping it for now.

    useEffect(() => {
        const checkAuth = async () => {
            const loggedIn = await authStore.isLoggedIn();
            if (!loggedIn) {
                navigation.navigate('Login');
            }
        };
        checkAuth();

        const loadInitialData = async () => {
            try {
                const res = await getDistricts();
                setDistricts(res.data?.data || res.data?.districts || res.data || []);
            } catch (e) {
                console.error('AddProperty Init Error:', e);
            }
        };
        loadInitialData();
    }, [navigation]);

    // handleDistrictChange and related logic removed as per instruction implying removal of area selection based on district.
    // If area selection is still needed, this function would need to be re-added and adapted.

    const updateField = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const addFeature = () => {
        if (newFeature.trim()) {
            setForm(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
            setNewFeature('');
        }
    };

    const removeFeature = (idx) => {
        setForm(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handlePickImage = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            selectionLimit: 4 - images.length,
            quality: 0.8,
        });

        if (result.assets) {
            const newImages = result.assets.map(asset => asset.uri);
            setImages(prev => [...prev, ...newImages].slice(0, 4));
        }
    };

    const handlePickVideo = async () => {
        const result = await launchImageLibrary({
            mediaType: 'video',
            selectionLimit: 1,
        });

        if (result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            if (asset.fileSize > 30 * 1024 * 1024) {
                Alert.alert(t('common.error'), t('property.uploadVideoDesc'));
                return;
            }
            setVideo(asset.uri);
        }
    };

    const handlePayment = async () => {
        // Validation
        if (!form.title || !form.price || !form.city || !form.area || !form.description) {
            Alert.alert(t('auth.missingFields'), t('auth.missingFieldsDesc'));
            return;
        }
        if (images.length === 0) {
            Alert.alert(t('common.error'), t('property.imagesLabel'));
            return;
        }

        // Direct submit — no payment required
        handleSubmit();
    };


    const handleSubmit = async (paymentId = null) => {
        console.log('[AddProperty] Starting submission...');
        console.log('[AddProperty] Form data:', form);
        console.log('[AddProperty] Images count:', images.length);
        console.log('[AddProperty] PaymentId:', paymentId);
        
        // Validation
        if (!form.title || !form.price || !form.city || !form.area || !form.description) {
            console.log('[AddProperty] Validation failed - missing fields');
            Alert.alert(t('auth.missingFields'), t('auth.missingFieldsDesc'));
            return;
        }
        if (images.length === 0) {
            console.log('[AddProperty] Validation failed - no images');
            Alert.alert(t('common.notice'), t('property.imagesLabel'));
            return;
        }

        setLoading(true);
        try {
            // Get user ID from AsyncStorage
            const userDataStr = await AsyncStorage.getItem('userData');
            const userData = userDataStr ? JSON.parse(userDataStr) : null;
            const userId = userData?.id || userData?._id;
            
            console.log('[AddProperty] User ID:', userId);
            
            if (!userId) {
                console.log('[AddProperty] No user ID found - redirecting to login');
                Alert.alert(t('common.error'), 'Please login again');
                navigation.navigate('Login');
                setLoading(false);
                return;
            }

            const formData = new FormData();

            // Append agent ID first
            formData.append('agent', userId);
            console.log('[AddProperty] Agent ID added:', userId);

            // Append basic info
            Object.keys(form).forEach(key => {
                if (key === 'features') {
                    formData.append(key, JSON.stringify(form[key]));
                } else if (form[key]) {
                    formData.append(key, form[key].toString());
                }
            });

            if (paymentId) {
                formData.append('paymentId', paymentId);
                console.log('[AddProperty] Payment ID added:', paymentId);
            } else {
                console.log('[AddProperty] No payment ID - free listing');
            }

            // Append images
            images.forEach((uri, index) => {
                const fileName = `property_img_${Date.now()}_${index}.jpg`;
                formData.append('images', {
                    uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                    type: 'image/jpeg',
                    name: fileName,
                });
            });
            console.log('[AddProperty] Images appended:', images.length);

            // Append video if exists
            if (video) {
                formData.append('video', {
                    uri: Platform.OS === 'android' ? video : video.replace('file://', ''),
                    type: 'video/mp4',
                    name: `property_video_${Date.now()}.mp4`,
                });
                console.log('[AddProperty] Video appended');
            }

            console.log('[AddProperty] Sending request to backend...');
            
            let response;
            if (editMode) {
                response = await updateProperty(propertyData.id || propertyData._id, formData);
                console.log('[AddProperty] Property updated successfully:', response.data);
            } else {
                response = await addProperty(formData);
                console.log('[AddProperty] Property added successfully:', response.data);
            }

            // Stop loading before showing alert
            setLoading(false);

            // Show success alert and navigate
            setTimeout(() => {
                Alert.alert(
                    t('common.success'),
                    editMode 
                        ? t('property.updateSuccess', { title: form.title }) 
                        : t('property.addSuccess', { title: form.title, category: form.category }),
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                console.log('[AddProperty] Navigating back after success');
                                // Use replace to avoid back navigation issues
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Sell', params: { screen: 'MyProperties' } }],
                                });
                            },
                        },
                    ],
                    { cancelable: false }
                );
            }, 100);
        } catch (error) {
            console.error('[AddProperty] Error:', error);
            console.error('[AddProperty] Error response:', error?.response);
            console.error('[AddProperty] Error data:', error?.response?.data);
            console.error('[AddProperty] Error message:', error?.message);
            
            setLoading(false);
            
            const errorMessage = error?.response?.data?.message 
                || error?.response?.data?.error 
                || error?.message 
                || 'Failed to add property. Please try again.';
            
            Alert.alert(
                t('common.error'),
                errorMessage
            );
        }
    };

    const types = propertyTypes.filter(t => t !== 'All Types');

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 50) : insets.top + 10 }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{editMode ? t('property.editTitle') : t('property.addTitle')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled">

                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    {[1, 2, 3].map(step => (
                        <View key={step} style={styles.stepWrapper}>
                            <View style={[
                                styles.stepCircle,
                                currentStep >= step && styles.stepCircleActive
                            ]}>
                                {currentStep > step ? (
                                    <Icon name="checkmark" size={16} color={Colors.textWhite} />
                                ) : (
                                    <Text style={[
                                        styles.stepNumber,
                                        currentStep >= step && styles.stepNumberActive
                                    ]}>{step}</Text>
                                )}
                            </View>
                            {step < 3 && <View style={[
                                styles.stepLine,
                                currentStep > step && styles.stepLineActive
                            ]} />}
                        </View>
                    ))}
                </View>

                {currentStep === 1 && (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>{t('property.mediaBasics')}</Text>
                        <Text style={styles.stepDesc}>{t('property.mediaBasicsDesc')}</Text>

                        {/* Image Upload */}
                        <Text style={styles.sectionLabel}>{t('property.imagesLabel')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                            <TouchableOpacity
                                style={styles.addImageButton}
                                onPress={handlePickImage}
                                disabled={images.length >= 4}
                            >
                                <Icon name="camera-outline" size={28} color={images.length >= 4 ? Colors.textLight : Colors.primary} />
                                <Text style={[styles.addImageText, images.length >= 4 && { color: Colors.textLight }]}>{t('property.addPhoto')}</Text>
                            </TouchableOpacity>
                            {images.map((img, index) => (
                                <View key={index} style={styles.imagePreview}>
                                    <Image source={{ uri: img }} style={styles.previewImage} />
                                    <TouchableOpacity style={styles.removeImageButton} onPress={() => setImages(prev => prev.filter((_, i) => i !== index))}>
                                        <Icon name="close" size={16} color={Colors.textWhite} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Video Upload Section */}
                        <Text style={styles.sectionLabel}>{t('property.videoLabel')}</Text>
                        <TouchableOpacity style={styles.videoUploadBox} onPress={handlePickVideo}>
                            {video ? (
                                <View style={styles.videoSelected}>
                                    <Icon name="checkmark-circle" size={32} color={Colors.primary} />
                                    <Text style={styles.videoSelectedText}>{t('property.videoSelected')}</Text>
                                    <TouchableOpacity onPress={() => setVideo(null)}>
                                        <Text style={{ color: Colors.error, fontWeight: '700', marginTop: 5 }}>{t('common.delete')}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <Icon name="videocam-outline" size={32} color={Colors.primary} />
                                    <Text style={styles.videoUploadText}>{t('property.uploadVideoDesc')}</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.sectionLabel}>{t('property.sellingType')} *</Text>
                        <View style={styles.typeContainer}>
                            {['Sale', 'Rent', 'Lease'].map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.typeChip, form.sellingType === type && styles.typeChipActive]}
                                    onPress={() => updateField('sellingType', type)}
                                >
                                    <Text style={[styles.typeChipText, form.sellingType === type && styles.typeChipTextActive]}>{t(`common.${type.toLowerCase()}`)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <CustomButton title={t('property.nextDetails')} onPress={nextStep} style={styles.nextButton} />
                    </View>
                )}

                {currentStep === 2 && (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>{t('property.basicInfo')}</Text>
                        <Text style={styles.stepDesc}>{t('property.detailsDesc')}</Text>

                        <Text style={styles.sectionLabel}>{t('property.category')} *</Text>
                        <View style={styles.typeContainer}>
                            {propertyTypes.filter(c => c !== 'All Types').map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.typeChip, form.category === cat && styles.typeChipActive]}
                                    onPress={() => updateField('category', cat)}
                                >
                                    <Text style={[styles.typeChipText, form.category === cat && styles.typeChipTextActive]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.sectionLabel}>{t('property.titleLabel')} *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('property.titlePlaceholder')}
                            value={form.title}
                            onChangeText={v => updateField('title', v)}
                        />

                        <Text style={styles.sectionLabel}>{t('property.priceLabel')} (₹) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('property.pricePlaceholder')}
                            keyboardType="numeric"
                            value={form.price}
                            onChangeText={v => updateField('price', v)}
                        />

                        <Text style={styles.sectionLabel}>{t('property.areaLabel')} (Sq.Ft) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('property.areaPlaceholder')}
                            keyboardType="numeric"
                            value={form.sqft}
                            onChangeText={v => updateField('sqft', v)}
                        />

                        <Text style={styles.sectionLabel}>{t('property.featuresLabel')}</Text>
                        <View style={styles.featureInputRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                placeholder={t('property.featurePlaceholder')}
                                value={newFeature}
                                onChangeText={setNewFeature}
                            />
                            <TouchableOpacity style={styles.addFeatureBtn} onPress={addFeature}>
                                <Icon name="add" size={24} color={Colors.textWhite} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.featureChips}>
                            {form.features.map((f, i) => (
                                <View key={i} style={styles.featureChip}>
                                    <Text style={styles.featureChipText}>{f}</Text>
                                    <TouchableOpacity onPress={() => removeFeature(i)}>
                                        <Icon name="close" size={14} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
                                <Text style={styles.prevButtonText}>{t('common.back')}</Text>
                            </TouchableOpacity>
                            <CustomButton title={t('property.nextLocation')} onPress={nextStep} style={{ flex: 1 }} />
                        </View>
                    </View>
                )}

                {currentStep === 3 && (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>{t('property.locationFinish')}</Text>
                        <Text style={styles.stepDesc}>{t('property.locationFinishDesc')}</Text>

                        <Text style={styles.sectionLabel}>{t('property.cityDistrict')} *</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={form.city}
                                onValueChange={(itemValue) => updateField('city', itemValue)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select City" value="" color={Colors.textSecondary} />
                                {districts.map((district, index) => (
                                    <Picker.Item 
                                        key={index} 
                                        label={district.name || district.city || district.district || district} 
                                        value={district.name || district.city || district.district || district} 
                                    />
                                ))}
                            </Picker>
                        </View>

                        <Text style={styles.sectionLabel}>{t('property.area')} *</Text>
                        <TextInput style={styles.input} placeholder={t('property.areaPlaceholder')} value={form.area} onChangeText={v => updateField('area', v)} />

                        <Text style={styles.sectionLabel}>{t('property.descLabel')} *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder={t('property.descPlaceholder')}
                            multiline
                            numberOfLines={4}
                            value={form.description}
                            onChangeText={v => updateField('description', v)}
                        />

                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
                                <Text style={styles.prevButtonText}>{t('common.back')}</Text>
                            </TouchableOpacity>
                            <CustomButton
                                title={editMode ? t('common.save') : t('common.submit')}
                                onPress={handlePayment}
                                loading={loading}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                )}

                <View style={{ height: 120 + insets.bottom }} />
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
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
    scrollContent: { padding: 20 },
    // Progress Indicator
    progressContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
    stepWrapper: { flexDirection: 'row', alignItems: 'center' },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center'
    },
    stepCircleActive: { backgroundColor: Colors.primary },
    stepNumber: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
    stepNumberActive: { color: Colors.textWhite },
    stepLine: { width: 40, height: 2, backgroundColor: Colors.border, marginHorizontal: 5 },
    stepLineActive: { backgroundColor: Colors.primary },
    // Step Content
    stepContent: { animationDuration: '400ms' },
    stepTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
    stepDesc: { fontSize: 14, color: Colors.textSecondary, marginBottom: 25 },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12, marginTop: 10 },
    input: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: Colors.textPrimary,
        fontFamily: 'Inter-Regular',
        marginBottom: 20,
    },
    pickerContainer: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        width: '100%',
        color: Colors.textPrimary,
    },
    textArea: { height: 120, paddingTop: 14 },
    typeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    typeChip: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: Colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: Colors.border
    },
    typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    typeChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
    typeChipTextActive: { color: Colors.textWhite, fontWeight: '600' },
    threeColumn: { flexDirection: 'row', gap: 10 },
    thirdField: { flex: 1 },
    imageScroll: { marginBottom: 25 },
    addImageButton: {
        width: 100,
        height: 100,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(27, 94, 32, 0.05)',
        marginRight: 15,
    },
    addImageText: { fontSize: 11, color: Colors.primary, fontWeight: '600', marginTop: 5 },
    imagePreview: { width: 100, height: 100, borderRadius: 14, marginRight: 15, position: 'relative' },
    previewImage: { width: '100%', height: '100%', borderRadius: 14 },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoUploadBox: {
        height: 120,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        backgroundColor: Colors.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        gap: 10,
    },
    videoUploadText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
    videoSelected: { alignItems: 'center' },
    paymentNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 145, 0, 0.08)',
        borderRadius: 14,
        padding: 15,
        marginBottom: 25,
        gap: 12
    },
    paymentTitle: { fontSize: 16, fontWeight: '700', color: Colors.accent },
    buttonRow: { flexDirection: 'row', gap: 15, marginTop: 20 },
    prevButton: {
        flex: 0.4,
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center'
    },
    prevButtonText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
    nextButton: { marginTop: 10 },
    // Feature List
    featureInputRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    addFeatureBtn: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    featureChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    featureChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: Colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    featureChipText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
});

export default AddPropertyScreen;
