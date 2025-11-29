/**
 * Unsaved Changes Hook
 * Provides consistent unsaved changes detection and confirmation dialogs
 * for onboarding steps to prevent accidental data loss
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { log } from '../utils/logger';

interface UseUnsavedChangesOptions {
  /** Function to check if there are unsaved changes */
  hasUnsavedChanges: () => boolean;
  /** Function to save changes before navigation */
  onSaveChanges?: () => Promise<void> | void;
  /** Custom message for the confirmation dialog */
  message?: string;
  /** Whether to auto-save when navigating away */
  autoSave?: boolean;
}

interface UseUnsavedChangesReturn {
  /** Function to call before navigation that checks for unsaved changes */
  confirmNavigation: (onConfirm: () => void, onCancel?: () => void) => void;
  /** Function to mark changes as saved */
  markAsSaved: () => void;
  /** Function to manually trigger save */
  saveChanges: () => Promise<void>;
  /** Whether there are currently unsaved changes */
  hasUnsavedChanges: boolean;
  /** Whether currently saving changes */
  isSaving: boolean;
}

export const useUnsavedChanges = ({
  hasUnsavedChanges: checkUnsavedChanges,
  onSaveChanges,
  message = 'You have unsaved changes. Do you want to save them before continuing?',
  autoSave = false,
}: UseUnsavedChangesOptions): UseUnsavedChangesReturn => {
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChangesState, setHasUnsavedChangesState] = useState(false);

  // Update unsaved changes state
  useEffect(() => {
    setHasUnsavedChangesState(checkUnsavedChanges());
  }, [checkUnsavedChanges]);

  // Save changes function
  const saveChanges = useCallback(async () => {
    if (!onSaveChanges) return;
    
    try {
      setIsSaving(true);
      await onSaveChanges();
      setHasUnsavedChangesState(false);
    } catch (error) {
      log.error('Failed to save changes', { event: 'save_changes_failed', component: 'useUnsavedChanges' }, error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [onSaveChanges]);

  // Mark as saved function
  const markAsSaved = useCallback(() => {
    setHasUnsavedChangesState(false);
  }, []);

  // Confirmation dialog before navigation
  const confirmNavigation = useCallback((onConfirm: () => void, onCancel?: () => void) => {
    if (!hasUnsavedChangesState) {
      onConfirm();
      return;
    }

    if (autoSave && onSaveChanges) {
      // Auto-save and continue
      saveChanges().then(() => {
        onConfirm();
      }).catch(() => {
        // If save fails, show confirmation dialog
        Alert.alert(
          'Unsaved Changes',
          message,
          [
            {
              text: 'Stay',
              style: 'cancel',
              onPress: onCancel,
            },
            {
              text: 'Continue Without Saving',
              style: 'destructive',
              onPress: onConfirm,
            },
          ]
        );
      });
    } else {
      // Show confirmation dialog
      Alert.alert(
        'Unsaved Changes',
        message,
        [
          {
            text: 'Stay',
            style: 'cancel',
            onPress: onCancel,
          },
          {
            text: 'Continue Without Saving',
            style: 'destructive',
            onPress: onConfirm,
          },
          ...(onSaveChanges ? [{
            text: 'Save & Continue',
            onPress: () => {
              saveChanges().then(() => {
                onConfirm();
              });
            },
          }] : []),
        ]
      );
    }
  }, [hasUnsavedChangesState, autoSave, onSaveChanges, message, saveChanges]);

  return {
    confirmNavigation,
    markAsSaved,
    saveChanges,
    hasUnsavedChanges: hasUnsavedChangesState,
    isSaving,
  };
};
