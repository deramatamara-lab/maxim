/**
 * Document Review Step
 * Shows uploaded documents for final review before submission
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { ds } from '../../../constants/theme';
import { GlassCard } from '../../ui/GlassCard';
import { PremiumButton } from '../../ui/PremiumButton';
import { CustomIcon, type CustomIconProps } from '../../ui/CustomIcon';
import { useOnboardingStore } from '../../../store/useOnboardingStore';

interface DocumentReviewStepProps {
  onComplete: () => void;
  onBack: () => void;
  canGoBack: boolean;
  isLastStep: boolean;
}

export const DocumentReviewStep: React.FC<DocumentReviewStepProps> = ({
  onComplete,
  onBack,
  canGoBack,
  isLastStep: _isLastStep,
}) => {
  const { data } = useOnboardingStore();
  const documents = data.documentsUploaded || [];

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      id_card: 'ID Card',
      passport: 'Passport',
      driver_license: 'Driver License',
      selfie: 'Selfie',
      proof_of_address: 'Proof of Address',
    };
    return labels[type] || type;
  };

  const getDocumentTypeIcon = (type: string): CustomIconProps['name'] => {
    const icons: Record<string, CustomIconProps['name']> = {
      id_card: 'profile',
      passport: 'profile',
      driver_license: 'profile',
      selfie: 'search',
      proof_of_address: 'location',
    };
    return icons[type] || 'profile';
  };

  const handleContinue = () => {
    // All documents are ready for submission
    onComplete();
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <GlassCard intensity={20} style={styles.iconContainer}>
            <CustomIcon name="activity" size={32} color={ds.colors.primary} />
          </GlassCard>
          
          <Text style={styles.title}>Review Your Documents</Text>
          <Text style={styles.subtitle}>
            Please verify all information is correct before submission
          </Text>
        </View>

        {/* Documents List */}
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>Uploaded Documents ({documents.length})</Text>
          
          {documents.map((doc, _index) => (
            <GlassCard key={doc.id} intensity={15} style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <View style={styles.documentIcon}>
                  <CustomIcon 
                    name={getDocumentTypeIcon(doc.type)} 
                    size={24} 
                    color={ds.colors.primary} 
                  />
                </View>
                
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle}>
                    {getDocumentTypeLabel(doc.type)}
                  </Text>
                  <Text style={styles.documentStatus}>
                    Status: {doc.status === 'pending' ? 'Ready for review' : doc.status}
                  </Text>
                  <Text style={styles.documentDate}>
                    Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.statusBadge}>
                  <CustomIcon name="activity" size={16} color={ds.colors.secondary} />
                  <Text style={styles.statusText}>Pending</Text>
                </View>
              </View>
              
              {/* Document Preview */}
              <View style={styles.documentPreview}>
                <Image 
                  source={{ uri: doc.url }} 
                  style={styles.documentImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  <CustomIcon name="profile" size={20} color={ds.colors.textPrimary} />
                  <Text style={styles.overlayText}>Tap to view</Text>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* Profile Summary */}
        <GlassCard intensity={15} style={styles.profileCard}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name:</Text>
            <Text style={styles.infoValue}>{data.fullName || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{data.phone || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date of Birth:</Text>
            <Text style={styles.infoValue}>{data.dateOfBirth || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>{data.address || 'Not provided'}</Text>
          </View>
        </GlassCard>

        {/* Submission Notice */}
        <GlassCard intensity={15} style={styles.noticeCard}>
          <CustomIcon name="settings" size={20} color={ds.colors.warning} />
          <Text style={styles.noticeText}>
            Once submitted, your documents will be securely reviewed by our verification team. This typically takes 1-2 business days. You&apos;ll receive a notification when the review is complete.
          </Text>
        </GlassCard>

        {/* Terms Confirmation */}
        <GlassCard intensity={15} style={styles.termsCard}>
          <View style={styles.termsRow}>
            <CustomIcon name="activity" size={16} color={ds.colors.success} />
            <Text style={styles.termsText}>
              ✓ Terms of Service accepted
            </Text>
          </View>
          
          <View style={styles.termsRow}>
            <CustomIcon name="activity" size={16} color={ds.colors.success} />
            <Text style={styles.termsText}>
              ✓ Privacy Policy consented
            </Text>
          </View>
          
          <View style={styles.termsRow}>
            <CustomIcon name="activity" size={16} color={ds.colors.success} />
            <Text style={styles.termsText}>
              ✓ Identity verification agreed
            </Text>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {canGoBack && (
          <PremiumButton
            variant="ghost"
            size="lg"
            onPress={onBack}
            style={styles.backButton}
          >
            Back to Upload
          </PremiumButton>
        )}
        
        <PremiumButton
          variant="primary"
          size="lg"
          onPress={handleContinue}
          style={styles.continueButton}
        >
          Submit Documents
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
  headerSection: {
    alignItems: 'center',
    paddingTop: ds.spacing.lg,
    paddingBottom: ds.spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing.lg,
  },
  title: {
    fontSize: ds.typography.size.display,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
    textAlign: 'center',
    marginBottom: ds.spacing.sm,
  },
  subtitle: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    lineHeight: ds.typography.lineHeight.body,
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
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing.md,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
    marginLeft: ds.spacing.md,
  },
  documentTitle: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.xs,
  },
  documentStatus: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.xs,
  },
  documentDate: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    backgroundColor: ds.colors.secondary + '20',
    borderRadius: ds.radius.xs,
  },
  statusText: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.secondary,
  },
  documentPreview: {
    position: 'relative',
    height: 120,
    borderRadius: ds.radius.md,
    overflow: 'hidden',
  },
  documentImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
    marginTop: ds.spacing.xs,
  },
  profileCard: {
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ds.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.border,
  },
  infoLabel: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textSecondary,
  },
  infoValue: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: ds.spacing.md,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.spacing.sm,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.lg,
  },
  noticeText: {
    flex: 1,
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    lineHeight: ds.typography.lineHeight.caption,
  },
  termsCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.xl,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.sm,
  },
  termsText: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textPrimary,
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
});
