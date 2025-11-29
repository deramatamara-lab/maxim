/**
 * User Management Section
 * Admin interface for managing users, roles, and account status
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { ds } from '../../../constants/theme';
import { GlassCard } from '../../ui/GlassCard';
import { PremiumButton } from '../../ui/PremiumButton';
import { CustomIcon } from '../../ui/CustomIcon';
import { useEnhancedAppStore } from '../../../store/useEnhancedAppStore';
import { type User } from '../../../api/auth';

 
interface UserManagementSectionProps {
  // Props can be added later for callbacks or data
}

export const UserManagementSection: React.FC<UserManagementSectionProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'rider' | 'driver' | 'admin'>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { updateProfile: _updateProfile } = useEnhancedAppStore();

  // Mock data for development
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        isDriver: false,
        isVerified: true,
        role: 'rider',
        kycStatus: 'verified',
        hasCompletedOnboarding: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567891',
        isDriver: true,
        isVerified: true,
        role: 'driver',
        kycStatus: 'pending',
        hasCompletedOnboarding: true,
        createdAt: '2024-01-14T15:30:00Z',
        updatedAt: '2024-01-14T15:30:00Z',
      },
      {
        id: '3',
        name: 'Admin User',
        email: 'admin@aura.com',
        phone: '+1234567892',
        isDriver: false,
        isVerified: true,
        role: 'admin',
        kycStatus: 'verified',
        hasCompletedOnboarding: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];
    setUsers(mockUsers);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: 'rider' | 'driver' | 'admin') => {
    Alert.alert(
      'Change User Role',
      `Are you sure you want to change this user's role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // In real implementation, this would call an admin API
              setUsers(prev => prev.map(user => 
                user.id === userId ? { ...user, role: newRole } : user
              ));
            } catch (error) {
              Alert.alert('Error', 'Failed to update user role');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleVerificationToggle = async (userId: string) => {
    setIsLoading(true);
    try {
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isVerified: !user.isVerified } : user
      ));
    } catch (error) {
      Alert.alert('Error', 'Failed to update verification status');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return ds.colors.error;
      case 'driver': return ds.colors.secondary;
      case 'rider': return ds.colors.primary;
      default: return ds.colors.textSecondary;
    }
  };

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return ds.colors.success;
      case 'pending': return ds.colors.warning;
      case 'rejected': return ds.colors.error;
      default: return ds.colors.textSecondary;
    }
  };

  const renderUserCard = (user: User) => (
    <GlassCard key={user.id} intensity={15} style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userPhone}>{user.phone}</Text>
        </View>
        
        <View style={styles.userBadges}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) + '20' }]}>
            <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
              {user.role.toUpperCase()}
            </Text>
          </View>
          
          <View style={[styles.kycBadge, { backgroundColor: getKYCStatusColor(user.kycStatus) + '20' }]}>
            <Text style={[styles.kycText, { color: getKYCStatusColor(user.kycStatus) }]}>
              {user.kycStatus.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.userActions}>
        <View style={styles.actionGroup}>
          <Text style={styles.actionLabel}>Role:</Text>
          <View style={styles.roleButtons}>
            {(['rider', 'driver', 'admin'] as const).map(role => (
              <PremiumButton
                key={role}
                variant={user.role === role ? 'primary' : 'ghost'}
                size="sm"
                onPress={() => handleRoleChange(user.id, role)}
                style={styles.roleButton}
              >
                {role}
              </PremiumButton>
            ))}
          </View>
        </View>

        <View style={styles.actionGroup}>
          <Text style={styles.actionLabel}>Verified:</Text>
          <PremiumButton
            variant={user.isVerified ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => handleVerificationToggle(user.id)}
          >
            {user.isVerified ? '✓ Verified' : '✗ Not Verified'}
          </PremiumButton>
        </View>
      </View>

      <View style={styles.userMeta}>
        <Text style={styles.metaText}>
          Joined: {new Date(user.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.metaText}>
          Onboarding: {user.hasCompletedOnboarding ? 'Complete' : 'Incomplete'}
        </Text>
      </View>
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      {/* Search and Filters */}
      <GlassCard intensity={15} style={styles.filtersCard}>
        <View style={styles.searchContainer}>
          <CustomIcon name="search" size={20} color={ds.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name or email..."
            placeholderTextColor={ds.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.roleFilters}>
          <Text style={styles.filterLabel}>Filter by Role:</Text>
          <View style={styles.roleFilterButtons}>
            {(['all', 'rider', 'driver', 'admin'] as const).map(role => (
              <PremiumButton
                key={role}
                variant={selectedRole === role ? 'primary' : 'ghost'}
                size="sm"
                onPress={() => setSelectedRole(role)}
                style={styles.filterButton}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </PremiumButton>
            ))}
          </View>
        </View>
      </GlassCard>

      {/* User Stats */}
      <GlassCard intensity={15} style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {users.filter(u => u.kycStatus === 'verified').length}
            </Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {users.filter(u => u.role === 'driver').length}
            </Text>
            <Text style={styles.statLabel}>Drivers</Text>
          </View>
        </View>
      </GlassCard>

      {/* User List */}
      <ScrollView style={styles.userList} showsVerticalScrollIndicator={false}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map(renderUserCard)
        ) : (
          <GlassCard intensity={15} style={styles.emptyCard}>
            <CustomIcon name="profile" size={48} color={ds.colors.textSecondary} />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or filters
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
  filtersCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.md,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    marginBottom: ds.spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textPrimary,
  },
  roleFilters: {
    gap: ds.spacing.sm,
  },
  filterLabel: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  roleFilterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing.sm,
  },
  filterButton: {
    // Uses PremiumButton defaults
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
  userList: {
    flex: 1,
  },
  userCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.sm,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ds.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.xs,
  },
  userEmail: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.xs,
  },
  userPhone: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textMuted,
  },
  userBadges: {
    gap: ds.spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    borderRadius: ds.radius.xs,
  },
  roleText: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold,
  },
  kycBadge: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    borderRadius: ds.radius.xs,
  },
  kycText: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold,
  },
  userActions: {
    marginBottom: ds.spacing.md,
  },
  actionGroup: {
    marginBottom: ds.spacing.sm,
  },
  actionLabel: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.xs,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: ds.spacing.sm,
  },
  roleButton: {
    // Uses PremiumButton defaults
  },
  userMeta: {
    paddingTop: ds.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
  },
  metaText: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textMuted,
    marginBottom: ds.spacing.xs,
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
