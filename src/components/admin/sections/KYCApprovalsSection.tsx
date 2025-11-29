/**
 * KYC Approvals Section
 * Admin interface for reviewing and approving KYC documents
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { ds } from '../../../constants/theme';
import { GlassCard } from '../../ui/GlassCard';
import { PremiumButton } from '../../ui/PremiumButton';
import { CustomIcon } from '../../ui/CustomIcon';
import { type KYCDocument } from '../../../api/auth';

 
interface KYCApprovalsSectionProps {
  // Props can be added later for callbacks
}

export const KYCApprovalsSection: React.FC<KYCApprovalsSectionProps> = () => {
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [_selectedDocument, _setSelectedDocument] = useState<KYCDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Mock KYC documents for development
    const mockDocuments: KYCDocument[] = [
      {
        id: '1',
        type: 'id_card',
        url: 'https://example.com/id-card.jpg',
        status: 'pending',
        uploadedAt: '2024-01-20T10:00:00Z',
      },
      {
        id: '2',
        type: 'passport',
        url: 'https://example.com/passport.jpg',
        status: 'pending',
        uploadedAt: '2024-01-20T11:00:00Z',
      },
      {
        id: '3',
        type: 'selfie',
        url: 'https://example.com/selfie.jpg',
        status: 'approved',
        uploadedAt: '2024-01-19T15:00:00Z',
        reviewedAt: '2024-01-19T16:00:00Z',
      },
    ];
    setDocuments(mockDocuments);
  }, []);

  const handleApprove = async (documentId: string) => {
    Alert.alert(
      'Approve Document',
      'Are you sure you want to approve this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setIsLoading(true);
            try {
              setDocuments(prev => prev.map(doc =>
                doc.id === documentId
                  ? { ...doc, status: 'approved', reviewedAt: new Date().toISOString() }
                  : doc
              ));
            } catch (error) {
              Alert.alert('Error', 'Failed to approve document');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (documentId: string) => {
    Alert.alert(
      'Reject Document',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              setDocuments(prev => prev.map(doc =>
                doc.id === documentId
                  ? { ...doc, status: 'rejected', reviewedAt: new Date().toISOString(), rejectionReason: 'Poor image quality' }
                  : doc
              ));
            } catch (error) {
              Alert.alert('Error', 'Failed to reject document');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return ds.colors.success;
      case 'rejected': return ds.colors.error;
      case 'pending': return ds.colors.warning;
      default: return ds.colors.textSecondary;
    }
  };

  const pendingDocuments = documents.filter(doc => doc.status === 'pending');

  const renderDocumentCard = (document: KYCDocument) => (
    <GlassCard key={document.id} intensity={15} style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <View style={styles.documentInfo}>
          <Text style={styles.documentType}>
            {getDocumentTypeLabel(document.type)}
          </Text>
          <Text style={styles.documentDate}>
            Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
          </Text>
          {document.reviewedAt && (
            <Text style={styles.reviewDate}>
              Reviewed: {new Date(document.reviewedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(document.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(document.status) }]}>
            {document.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Document Preview */}
      <View style={styles.documentPreview}>
        <Image 
          source={{ uri: document.url }} 
          style={styles.documentImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay}>
          <CustomIcon name="profile" size={20} color={ds.colors.textPrimary} />
          <Text style={styles.overlayText}>Tap to view</Text>
        </View>
      </View>

      {/* Actions for pending documents */}
      {document.status === 'pending' && (
        <View style={styles.documentActions}>
          <PremiumButton
            variant="secondary"
            size="sm"
            onPress={() => handleReject(document.id)}
            style={styles.actionButton}
          >
            <CustomIcon name="settings" size={16} />
            Reject
          </PremiumButton>
          
          <PremiumButton
            variant="primary"
            size="sm"
            onPress={() => handleApprove(document.id)}
            style={styles.actionButton}
          >
            <CustomIcon name="activity" size={16} />
            Approve
          </PremiumButton>
        </View>
      )}

      {/* Rejection reason */}
      {document.status === 'rejected' && document.rejectionReason && (
        <View style={styles.rejectionReason}>
          <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
          <Text style={styles.rejectionText}>{document.rejectionReason}</Text>
        </View>
      )}
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      {/* Stats */}
      <GlassCard intensity={15} style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{pendingDocuments.length}</Text>
            <Text style={styles.statLabel}>Pending Review</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {documents.filter(d => d.status === 'approved').length}
            </Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {documents.filter(d => d.status === 'rejected').length}
            </Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
        </View>
      </GlassCard>

      {/* Quick Actions */}
      {pendingDocuments.length > 0 && (
        <GlassCard intensity={15} style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <PremiumButton
              variant="primary"
              size="md"
              onPress={() => {
                pendingDocuments.forEach(doc => handleApprove(doc.id));
              }}
              style={styles.quickAction}
            >
              Approve All Pending
            </PremiumButton>
          </View>
        </GlassCard>
      )}

      {/* Documents List */}
      <ScrollView style={styles.documentsList} showsVerticalScrollIndicator={false}>
        {documents.length > 0 ? (
          documents.map(renderDocumentCard)
        ) : (
          <GlassCard intensity={15} style={styles.emptyCard}>
            <CustomIcon name="settings" size={48} color={ds.colors.textSecondary} />
            <Text style={styles.emptyText}>No documents found</Text>
            <Text style={styles.emptySubtext}>
              KYC documents will appear here for review
            </Text>
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: ds.typography.size.display,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
  },
  statLabel: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.xs,
  },
  quickActionsCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.md,
  },
  sectionTitle: {
    fontSize: ds.typography.size.title,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.md,
  },
  quickActions: {
    gap: ds.spacing.sm,
  },
  quickAction: {
    // Uses PremiumButton defaults
  },
  documentsList: {
    flex: 1,
  },
  documentCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.sm,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentType: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.xs,
  },
  documentDate: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.xs,
  },
  reviewDate: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    borderRadius: ds.radius.xs,
  },
  statusText: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold,
  },
  documentPreview: {
    position: 'relative',
    height: 120,
    borderRadius: ds.radius.md,
    overflow: 'hidden',
    marginBottom: ds.spacing.md,
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
  documentActions: {
    flexDirection: 'row',
    gap: ds.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  rejectionReason: {
    padding: ds.spacing.sm,
    backgroundColor: ds.colors.error + '10',
    borderRadius: ds.radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: ds.colors.error,
  },
  rejectionLabel: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.error,
    marginBottom: ds.spacing.xs,
  },
  rejectionText: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
  },
  emptyCard: {
    padding: ds.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: ds.typography.size.title,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    marginTop: ds.spacing.md,
    marginBottom: ds.spacing.sm,
  },
  emptySubtext: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textMuted,
    textAlign: 'center',
  },
});
