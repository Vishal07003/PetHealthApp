import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/theme';
import { Button } from '../components/Button';
import { Pet } from '../types/api';
import { PetService } from '../services/PetHealthService';
import { useAuth } from '../context/AuthContext';

interface HomeScreenProps {
  onSelectPet: (pet: Pet) => void;
  onNavigateToAddPet: () => void;
  onNavigateToProfile: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectPet,
  onNavigateToAddPet,
  onNavigateToProfile,
}) => {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPets = async () => {
    try {
      setError(null);
      const data = await PetService.listPets();
      setPets(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to fetch pet profiles.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPets();
  };

  const renderPetCard = ({ item }: { item: Pet }) => {
    const icon = item.species === 'cat' ? '🐱' : item.species === 'dog' ? '🐶' : '🐾';
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => onSelectPet(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.petIconCircle}>
            <Text style={styles.petIconText}>{icon}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.petName}>{item.name}</Text>
            <Text style={styles.petSubtitle}>
              {item.breed || item.species.toUpperCase()} • {item.sex.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardStats}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Weight</Text>
            <Text style={styles.statValue}>
              {item.weight_kg ? `${item.weight_kg} kg` : 'N/A'}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={[styles.statValue, { color: Colors.success }]}>
              Monitoring Ready
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top App Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.first_name || user?.username || 'Friend'} 👋</Text>
          <Text style={styles.tagline}>Pet Activity & Vitals Dashboard</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBadge}
          onPress={onNavigateToProfile}
          activeOpacity={0.8}
        >
          <Text style={styles.profileBadgeText}>
            {(user?.username?.[0] || 'U').toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Notice */}
      {!!error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchPets} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pet List */}
      <FlatList
        data={pets}
        keyExtractor={(item) => item.id}
        renderItem={renderPetCard}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          loading ? undefined : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🐾</Text>
              <Text style={Typography.titleMedium}>No Pets Added Yet</Text>
              <Text style={styles.emptySubtitle}>
                Add your dog, cat, or other pet to start tracking activity and wearable sensors.
              </Text>
              <Button
                title="+ Add Your First Pet"
                onPress={onNavigateToAddPet}
                style={styles.emptyAddBtn}
              />
            </View>
          )
        }
      />

      {/* Floating Add Pet Button */}
      {pets.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={onNavigateToAddPet}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+ Add Pet</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  tagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  profileBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  profileBadgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  listContainer: {
    padding: Spacing.lg,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petIconText: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  petName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  petSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: Colors.textMuted,
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 54,
    marginBottom: Spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyAddBtn: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: 8,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    flex: 1,
  },
  retryText: {
    color: Colors.danger,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 8,
  },
  retryBtn: {
    padding: 4,
  },
});
