import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAvatarStore } from '../state/avatarStore';
import { rpmAPI } from '../lib/readyPlayerMe';
import type { AvatarTemplate } from '../lib/readyPlayerMe';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { User, Sparkles } from 'lucide-react-native';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'CharacterCreator'>;

export const CharacterCreatorScreen = () => {
  const navigation = useNavigation<NavProp>();

  const {
    selectedGender,
    selectedTemplate,
    currentAvatar,
    setSelectedGender,
    setSelectedTemplate,
    createDraftAvatar,
    saveAvatar,
  } = useAvatarStore();

  const [templates, setTemplates] = useState<AvatarTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'gender' | 'template' | 'customize'>('gender');

  useEffect(() => {
    initializeAPI();
  }, []);

  const initializeAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[CharacterCreator] Initializing RPM API...');

      await rpmAPI.createAnonymousUser();
      console.log('[CharacterCreator] Anonymous user created');

      const fetchedTemplates = await rpmAPI.getAvatarTemplates();
      console.log('[CharacterCreator] Templates fetched:', fetchedTemplates.length);

      setTemplates(fetchedTemplates);
      setLoading(false);
    } catch (err) {
      console.error('[CharacterCreator] Initialization failed:', err);
      setError(`Failed to initialize: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  const handleGenderSelect = (gender: 'male' | 'female') => {
    setSelectedGender(gender);
    setStep('template');
  };

  const handleTemplateSelect = async (template: AvatarTemplate) => {
    try {
      setLoading(true);
      setSelectedTemplate(template);
      await createDraftAvatar(template.id, 'fullbody');
      setStep('customize');
      setLoading(false);
    } catch (err) {
      setError('Failed to create avatar');
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    try {
      setLoading(true);
      await saveAvatar();
      navigation.replace('Tabs');
    } catch (err) {
      setError('Failed to save avatar');
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t => t.gender === selectedGender);

  if (loading && templates.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#334155']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#4A9EFF" />
        <Text className="text-white text-lg mt-4">Loading Character Creator...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Sparkles size={32} color="#FFD700" />
          <Text className="text-white text-3xl font-bold ml-3">Character Creator</Text>
        </View>

        {/* Progress Steps */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step !== 'gender' && styles.stepDotComplete]} />
          <View style={styles.stepLine} />
          <View
            style={[
              styles.stepDot,
              step === 'customize' && styles.stepDotComplete,
              step === 'template' && styles.stepDotActive,
            ]}
          />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step === 'customize' && styles.stepDotActive]} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Step 1: Gender Selection */}
          {step === 'gender' && (
            <Animated.View entering={FadeIn} style={styles.section}>
              <Text className="text-white text-2xl font-bold mb-6 text-center">
                Choose Your Gender
              </Text>

              <View style={styles.genderContainer}>
                <Pressable
                  style={styles.genderCard}
                  onPress={() => handleGenderSelect('male')}
                >
                  <LinearGradient
                    colors={['#1E3A5C', '#0D1A2E']}
                    style={styles.genderCardGradient}
                  >
                    <User size={64} color="#4A9EFF" strokeWidth={1.5} />
                    <Text className="text-white text-xl font-semibold mt-4">Male</Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  style={styles.genderCard}
                  onPress={() => handleGenderSelect('female')}
                >
                  <LinearGradient
                    colors={['#3D1E5C', '#1A0D2E']}
                    style={styles.genderCardGradient}
                  >
                    <User size={64} color="#9D5CFF" strokeWidth={1.5} />
                    <Text className="text-white text-xl font-semibold mt-4">Female</Text>
                  </LinearGradient>
                </Pressable>
              </View>

              <Text className="text-gray-400 text-center mt-4 italic text-sm">
                &ldquo;really? It&rsquo;s 2026 and I can only pick 2 genders...&rdquo; - Someone somewhere probably
              </Text>
            </Animated.View>
          )}

          {/* Step 2: Template Selection */}
          {step === 'template' && (
            <Animated.View entering={SlideInRight} style={styles.section}>
              <Text className="text-white text-2xl font-bold mb-6 text-center">
                Choose Your Style
              </Text>

              <View style={styles.templateGrid}>
                {filteredTemplates.map(template => (
                  <Pressable
                    key={template.id}
                    style={styles.templateCard}
                    onPress={() => handleTemplateSelect(template)}
                    disabled={loading}
                  >
                    <Image
                      source={{ uri: template.imageUrl }}
                      style={styles.templateImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      style={styles.templateOverlay}
                    />
                  </Pressable>
                ))}
              </View>

              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#4A9EFF" />
                  <Text className="text-white mt-2">Creating your avatar...</Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* Step 3: Customization */}
          {step === 'customize' && currentAvatar && (
            <Animated.View entering={SlideInRight} style={styles.section}>
              <Text className="text-white text-2xl font-bold mb-6 text-center">
                Customize Your Character
              </Text>

              <View style={styles.previewContainer}>
                <Text className="text-gray-400 text-center mb-4">
                  Avatar ID: {currentAvatar.id.substring(0, 8)}...
                </Text>
                <Text className="text-gray-300 text-center mb-4">
                  Your character is ready! You can customize it further in the loadout screen.
                </Text>
              </View>

              <Pressable
                style={styles.finishButton}
                onPress={handleFinish}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#4A9EFF', '#2E5CFF']}
                  style={styles.finishButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white text-lg font-bold">Enter Game</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text className="text-red-400 text-center mb-4">{error}</Text>
              <Pressable
                style={styles.retryButton}
                onPress={() => {
                  setError(null);
                  initializeAPI();
                }}
              >
                <Text className="text-white font-semibold">Retry</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepDotActive: {
    backgroundColor: '#4A9EFF',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stepDotComplete: {
    backgroundColor: '#10B981',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: 20,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  genderCard: {
    flex: 1,
    maxWidth: 160,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  genderCardGradient: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  templateCard: {
    width: 150,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#4A9EFF',
  },
  templateImage: {
    width: '100%',
    height: '100%',
  },
  templateOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    marginBottom: 24,
  },
  finishButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
  },
  finishButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: '#4A9EFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
});
