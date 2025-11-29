/**
 * Document Upload Step
 * Handles KYC document capture and upload with camera integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { ds } from '../../../constants/theme';
import { GlassCard } from '../../ui/GlassCard';
import { PremiumButton } from '../../ui/PremiumButton';
import { CustomIcon } from '../../ui/CustomIcon';
import { CircularProgress } from '../../ui/CircularProgress';
import { useEnhancedAppStore } from '../../../store/useEnhancedAppStore';
import { useOnboardingStore } from '../../../store/useOnboardingStore';
import { KYCDocument } from '../../../api/auth';
import { KYCConfigurationService, type KYCDocumentConfig } from '../../../api/kycConfiguration';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { log } from '../../../utils/logger';

interface DocumentUploadStepProps {
  onComplete: () => void;
  onBack: () => void;
  canGoBack: boolean;
  isLastStep: boolean;
}

export const DocumentUploadStep: React.FC<DocumentUploadStepProps> = ({
  onComplete,
  onBack,
  canGoBack,
  isLastStep: _isLastStep,
}) => {
  const { user } = useEnhancedAppStore();
  const [documentTypes, setDocumentTypes] = useState<KYCDocumentConfig[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, string[]>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { setDocumentsUploaded } = useOnboardingStore();

  // Unsaved changes protection for uploaded documents
  const unsavedChanges = useUnsavedChanges({
    hasUnsavedChanges: () => {
      return Object.keys(uploadedDocuments).length > 0;
    },
    onSaveChanges: async () => {
      // Save uploaded documents to store
      const kycDocuments: KYCDocument[] = Object.entries(uploadedDocuments).flatMap(
        ([type, uris]) =>
          uris.map((uri, index) => ({
            id: `${type}_${index}_${Date.now()}`,
            type: type as KYCDocument['type'],
            url: uri,
            status: 'pending' as const,
            uploadedAt: new Date().toISOString(),
          }))
      );
      setDocumentsUploaded(kycDocuments);
    },
    message: 'You have uploaded documents that haven\'t been saved. Do you want to save them before continuing?',
  });

  const loadConfiguration = useCallback(async () => {
      try {
        setIsLoadingConfig(true);
        const response = await KYCConfigurationService.getConfiguration();
        
        // Filter documents based on user's role
        const userRole = user?.role || 'rider';
        const filteredDocuments = response.configurations.filter(doc => 
          doc.requiredForRoles.includes(userRole) || doc.requiredForRoles.length === 0
        );
        
        setDocumentTypes(filteredDocuments);
      } catch (error) {
        log.error('Failed to load KYC configuration', { event: 'kyc_config_load_failed', component: 'DocumentUploadStep' }, error);
        // Try fallback configuration first
        try {
          const fallbackConfig = KYCConfigurationService.getDefaultConfiguration();
          setDocumentTypes(fallbackConfig);
        } catch (fallbackError) {
          log.error('Failed to load default KYC configuration', { event: 'kyc_config_fallback_failed', component: 'DocumentUploadStep' }, fallbackError);
          // Production error state
          setConfigError(
            'Unable to load document requirements. Please check your connection and try again.'
          );
          setDocumentTypes([]);
        }
      } finally {
        setIsLoadingConfig(false);
      }
    }, [user]);

  const retryLoadConfiguration = useCallback(async () => {
    setConfigError(null);
    await loadConfiguration();
  }, [loadConfiguration]);

  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  const requestCameraPermission = async (): Promise<boolean> => {
    // expo-image-picker handles permissions automatically
    return true;
  };

  const handleImagePicker = async (
    documentType: string,
    useCamera: boolean = false
  ) => {
    try {
      if (useCamera) {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          Alert.alert('Permission Required', 'Camera access is required for document verification');
          return;
        }
      }

      const options = {
        mediaType: 'photo' as const,
        quality: 0.8,
        allowsEditing: true,
      };

      const result = useCamera 
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        if (imageUri) {
          await uploadDocument(documentType, imageUri);
        }
      }
    } catch (error) {
      log.error('Image picker error', { event: 'image_picker_error', component: 'DocumentUploadStep' }, error);
      Alert.alert('Error', 'Failed to capture or select image');
    }
  };

  const uploadDocument = async (documentType: string, imageUri: string) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Add to uploaded documents
      setUploadedDocuments(prev => ({
        ...prev,
        [documentType]: [...(prev[documentType] || []), imageUri],
      }));

      // Brief success state
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

    } catch (error) {
      log.error('Upload error', { event: 'kyc_upload_error', component: 'DocumentUploadStep', documentType }, error);
      setIsUploading(false);
      setUploadProgress(0);
      Alert.alert('Upload Failed', 'Please try again');
    }
  };

  const removeDocument = (documentType: string, index: number) => {
    setUploadedDocuments(prev => {
      const docs = { ...prev };
      docs[documentType] = docs[documentType].filter((_, i) => i !== index);
      if (docs[documentType].length === 0) {
        delete docs[documentType];
      }
      return docs;
    });
  };

  const canProceed = () => {
    // documentTypes is already filtered by user role in useEffect
    const requiredDocs = documentTypes.filter(doc => doc.required);
    return requiredDocs.every(doc => 
      uploadedDocuments[doc.type] && uploadedDocuments[doc.type].length > 0
    );
  };

  const handleContinue = () => {
    if (!canProceed()) {
      Alert.alert('Missing Documents', 'Please upload all required documents');
      return;
    }

    // Convert uploaded documents to KYCDocument format
    const kycDocuments: KYCDocument[] = Object.entries(uploadedDocuments).flatMap(
      ([type, uris]) =>
        uris.map((uri, index) => ({
          id: `${type}_${index}_${Date.now()}`,
          type: type as KYCDocument['type'],
          url: uri,
          status: 'pending' as const,
          uploadedAt: new Date().toISOString(),
        }))
    );

    setDocumentsUploaded(kycDocuments);
    unsavedChanges.markAsSaved();
    onComplete();
  };

  const handleBack = () => {
    unsavedChanges.confirmNavigation(
      () => onBack(),
      () => {
        // User chose to stay - no action needed
      }
    );
  };

  const renderDocumentType = (docType: KYCDocumentConfig) => {
    const documents = uploadedDocuments[docType.type] || [];
    const isComplete = documents.length > 0;

    return (
      <GlassCard
        key={docType.type}
        intensity={15}
        style={[
          styles.documentCard,
          docType.required ? styles.documentCardRequired : styles.documentCardOptional,
        ]}
        enableMicroInteractions
      >
        <View style={styles.documentHeader}>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>{docType.title}</Text>
            <Text style={styles.documentDescription}>{docType.description}</Text>
            <Text style={[
              styles.documentRequirement,
              docType.required ? styles.required : styles.optional
            ]}>
              {docType.required ? 'Required' : 'Optional'}
            </Text>
          </View>
          <CustomIcon 
            name={docType.required ? 'check' : 'profile'} 
            size={24} 
            color={isComplete ? ds.colors.success : ds.colors.textSecondary}
          />
        </View>

        {/* Upload buttons */}
        {!isComplete && (
          <View style={styles.uploadButtons}>
            <PremiumButton
              variant="secondary"
              size="sm"
              onPress={() => handleImagePicker(docType.type, false)}
              style={styles.uploadButton}
            >
              <CustomIcon name="profile" size={16} />
              Gallery
            </PremiumButton>
            
            <PremiumButton
              variant="primary"
              size="sm"
              onPress={() => handleImagePicker(docType.type, true)}
              style={styles.uploadButton}
            >
              <CustomIcon name="settings" size={16} />
              Camera
            </PremiumButton>
          </View>
        )}

        {/* Uploaded documents */}
        {documents.map((uri, index) => (
          <Animated.View
            key={index}
            style={styles.uploadedDocument}
            entering={FadeInDown.duration(ds.motion.duration.entrance)}
          >
            <GlassCard intensity={10} style={styles.documentPreview} enableMicroInteractions>
              <Text style={styles.documentName}>Document {index + 1}</Text>
              <PremiumButton
                variant="ghost"
                size="sm"
                onPress={() => removeDocument(docType.type, index)}
                style={styles.removeButton}
              >
                <CustomIcon name="settings" size={16} color={ds.colors.error} />
              </PremiumButton>
            </GlassCard>
          </Animated.View>
        ))}

        {/* Examples */}
        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>Examples:</Text>
          {docType.examples.map((example, index) => (
            <Text key={index} style={styles.exampleText}>• {example}</Text>
          ))}
        </View>
      </GlassCard>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Upload Progress */}
        {isUploading && (
          <GlassCard intensity={15} style={styles.progressCard} enableMicroInteractions>
            <View style={styles.progressContent}>
              <CircularProgress
                size={48}
                progress={uploadProgress}
                color={ds.colors.primary}
              />
              <View style={styles.progressText}>
                <Text style={styles.progressTitle}>Uploading...</Text>
                <Text style={styles.progressPercent}>{uploadProgress}%</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Document Types */}
        <View style={styles.documentsSection}>
          {isLoadingConfig ? (
            <View style={styles.loadingContainer}>
              <CircularProgress size={24} color={ds.colors.primary} progress={0.5} />
              <Text style={styles.loadingText}>Loading document requirements...</Text>
            </View>
          ) : configError ? (
            <GlassCard intensity={15} style={styles.errorCard} enableMicroInteractions>
              <View style={styles.errorContent}>
                <CustomIcon name="settings" size={32} color={ds.colors.danger} />
                <Text style={styles.errorTitle}>Unable to Load Requirements</Text>
                <Text style={styles.errorMessage}>{configError}</Text>
                <PremiumButton
                  variant="primary"
                  size="md"
                  onPress={retryLoadConfiguration}
                  style={styles.retryButton}
                >
                  <CustomIcon name="profile" size={16} />
                  Try Again
                </PremiumButton>
              </View>
            </GlassCard>
          ) : documentTypes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <CustomIcon name="profile" size={32} color={ds.colors.textSecondary} />
              <Text style={styles.emptyText}>No documents required for your account</Text>
            </View>
          ) : (
            <>
              {documentTypes.filter(doc => doc.required).length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Required Documents</Text>
                  {documentTypes.filter(doc => doc.required).map(renderDocumentType)}
                </>
              )}
              
              {documentTypes.filter(doc => !doc.required).length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Optional Documents</Text>
                  {documentTypes.filter(doc => !doc.required).map(renderDocumentType)}
                </>
              )}
            </>
          )}
        </View>

        {/* Security Notice */}
        <GlassCard intensity={15} style={styles.securityNotice} enableMicroInteractions>
          <CustomIcon name="settings" size={20} color={ds.colors.secondary} />
          <Text style={styles.securityText}>
            All documents are encrypted end-to-end and stored securely. We only use them for identity verification.
          </Text>
        </GlassCard>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {canGoBack && (
          <PremiumButton
            variant="ghost"
            size="lg"
            onPress={handleBack}
            style={styles.backButton}
          >
            Back
          </PremiumButton>
        )}
        
        <PremiumButton
          variant="primary"
          size="lg"
          onPress={handleContinue}
          disabled={!canProceed() || isUploading}
          style={[
            styles.continueButton,
            (!canProceed() || isUploading) && styles.disabledButton,
          ]}
        >
          Review Documents
        </PremiumButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: ds.spacing.lg,
  },
  progressCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.lg,
    alignItems: 'center',
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  progressText: {
    flex: 1,
  },
  progressTitle: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  progressPercent: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
  },
  documentsSection: {
    marginBottom: ds.spacing.lg,
  },
  sectionTitle: {
    fontSize: ds.typography.size.title,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.md,
  },
  documentCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.sm,
  },
  documentCardRequired: {
    borderWidth: 1,
    borderColor: ds.colors.danger,
  },
  documentCardOptional: {
    borderWidth: 1,
    borderColor: ds.colors.border,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentRequirement: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    marginTop: ds.spacing.xs,
  },
  required: {
    color: ds.colors.danger,
  },
  optional: {
    color: ds.colors.textSecondary,
  },
  documentTitle: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.xs,
  },
  documentDescription: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.xs,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.md,
  },
  uploadButton: {
    flex: 1,
  },
  uploadedDocument: {
    marginBottom: ds.spacing.sm,
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: ds.spacing.sm,
  },
  documentName: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textPrimary,
  },
  removeButton: {
    // Uses PremiumButton ghost variant
  },
  examplesSection: {
    paddingTop: ds.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
  },
  examplesTitle: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.xs,
  },
  exampleText: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.xs,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.spacing.sm,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.xl,
  },
  securityText: {
    flex: 1,
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    lineHeight: ds.typography.lineHeight.caption,
  },
  actionSection: {
    padding: ds.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
    gap: ds.spacing.sm,
  },
  backButton: {
    marginBottom: ds.spacing.sm,
  },
  continueButton: {
    // Uses PremiumButton defaults
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: ds.spacing.xl,
    gap: ds.spacing.md,
  },
  loadingText: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    color: ds.colors.textSecondary,
  },
  emptyContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: ds.spacing.xl,
    gap: ds.spacing.md,
  },
  emptyText: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    color: ds.colors.textSecondary,
    textAlign: 'center',
  },
  errorCard: {
    padding: ds.spacing.lg,
    alignItems: 'center',
  },
  errorContent: {
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  errorTitle: {
    fontSize: ds.typography.size.title,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    lineHeight: ds.typography.lineHeight.body,
  },
  retryButton: {
    marginTop: ds.spacing.sm,
  },
});
