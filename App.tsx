import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, StyleSheet, View, BackHandler } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ActivityTab } from './src/screens/ActivityTab';
import { DevicesTab } from './src/screens/DevicesTab';
import { ProfileTab } from './src/screens/ProfileTab';
import { AddPetScreen } from './src/screens/AddPetScreen';
import { PetDetailScreen } from './src/screens/PetDetailScreen';
import { EditPetScreen } from './src/screens/EditPetScreen';
import { DeviceScannerScreen } from './src/screens/DeviceScannerScreen';
import { ActivityInsightsScreen } from './src/screens/ActivityInsightsScreen';
import { VaccinesMedicalRecordsScreen } from './src/screens/VaccinesMedicalRecordsScreen';
import { ClinicalObservationNotesScreen } from './src/screens/ClinicalObservationNotesScreen';
import { WeightBodyConditionScreen } from './src/screens/WeightBodyConditionScreen';
import { ImuTelemetrySimulatorScreen } from './src/screens/ImuTelemetrySimulatorScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { BottomTabBar, MainTabType } from './src/components/BottomTabBar';
import { Pet, AppNotification } from './src/types/api';
import { Colors } from './src/theme/theme';
import { fcmManager } from './src/services/FCMService';
import { PetService } from './src/services/PetHealthService';

type AuthScreenState = 'login' | 'register';
type AppSubScreenState =
  | 'tabs'
  | 'add_pet'
  | 'pet_detail'
  | 'edit_pet'
  | 'device_scanner'
  | 'insights'
  | 'vaccines'
  | 'observations'
  | 'weight'
  | 'simulator'
  | 'notifications';

const MainNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreenState>('login');
  const [activeTab, setActiveTab] = useState<MainTabType>('home');
  const [subScreen, setSubScreen] = useState<AppSubScreenState>('tabs');
  const [navHistory, setNavHistory] = useState<AppSubScreenState[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  /**
   * Push a new subScreen onto the navigation history stack.
   * Prevents consecutive identical screens from stacking.
   */
  const navigateToSubScreen = useCallback((target: AppSubScreenState, pet?: Pet) => {
    if (pet) setSelectedPet(pet);
    setSubScreen((current) => {
      if (current === target) return current;
      setNavHistory((prev) => [...prev, current]);
      return target;
    });
  }, []);

  /**
   * Pop from the navigation history stack or return to tabs.
   */
  const navigateBack = useCallback(() => {
    setNavHistory((prev) => {
      if (prev.length === 0) {
        setSubScreen('tabs');
        return [];
      }
      const newHistory = [...prev];
      const previousScreen = newHistory.pop() || 'tabs';
      setSubScreen(previousScreen);
      return newHistory;
    });
  }, []);

  /**
   * Reset navigation to root tabs and clear history.
   */
  const resetToTabs = useCallback((tab?: MainTabType) => {
    if (tab) setActiveTab(tab);
    setNavHistory([]);
    setSubScreen('tabs');
  }, []);

  // Android Hardware Back button integration
  useEffect(() => {
    const onHardwareBack = () => {
      // 1. If currently in a subscreen, navigate back up the history stack
      if (subScreen !== 'tabs') {
        navigateBack();
        return true; // handled
      }

      // 2. If at root tabs but not on the 'home' tab, switch back to 'home' tab first
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true; // handled
      }

      // 3. If on home tab, allow default Android behavior (exit app)
      return false;
    };

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onHardwareBack
    );
    return () => backSubscription.remove();
  }, [subScreen, activeTab, navigateBack]);

  // Initialize FCM listeners & routing when authenticated
  useEffect(() => {
    if (!user) return;

    fcmManager.initialize(async (payload) => {
      console.log('[App] Notification action opened:', payload);
      const petId = payload.pet_id;
      if (petId) {
        try {
          const pets = await PetService.listPets();
          const targetPet = pets.find((p) => p.id === petId) || null;
          if (targetPet) setSelectedPet(targetPet);
        } catch (e) {
          console.warn('[App] Could not fetch pet for notification:', e);
        }
      }

      // Route based on notification type with clean history stack
      const notifType = payload.notification_type;
      if (notifType === 'activity_anomaly' || notifType === 'rest_change') {
        setNavHistory(['tabs']);
        setSubScreen('insights');
      } else if (notifType === 'vaccine_reminder') {
        setNavHistory(['tabs']);
        setSubScreen('vaccines');
      } else if (notifType === 'intake_alert') {
        setNavHistory(['tabs']);
        setSubScreen('observations');
      } else if (notifType === 'battery_low') {
        resetToTabs('devices');
      } else {
        resetToTabs('home');
      }
    });
  }, [user, resetToTabs]);

  if (loading) {
    return <SplashScreen />;
  }

  // Unauthenticated Flow
  if (!user) {
    if (authScreen === 'register') {
      return (
        <RegisterScreen onNavigateToLogin={() => setAuthScreen('login')} />
      );
    }
    return (
      <LoginScreen onNavigateToRegister={() => setAuthScreen('register')} />
    );
  }


  // Modal / Detail Sub-screens
  if (subScreen === 'add_pet') {
    return (
      <AddPetScreen
        onBack={navigateBack}
        onPetCreated={(newPet) => {
          setSelectedPet(newPet);
          // Replace add_pet in history with pet_detail so back returns to originating screen
          setNavHistory((prev) => {
            const nextHistory = prev.filter((s) => s !== 'add_pet');
            return nextHistory;
          });
          setSubScreen('pet_detail');
        }}
      />
    );
  }

  if (subScreen === 'pet_detail') {
    if (!selectedPet) {
      resetToTabs();
      return null;
    }
    return (
      <PetDetailScreen
        pet={selectedPet}
        onBack={navigateBack}
        onEdit={(petToEdit) => {
          navigateToSubScreen('edit_pet', petToEdit);
        }}
        onPetDeleted={() => {
          setSelectedPet(null);
          resetToTabs();
        }}
        onNavigateToScanner={() => navigateToSubScreen('device_scanner', selectedPet)}
        onNavigateToInsights={() => navigateToSubScreen('insights', selectedPet)}
      />
    );
  }

  if (subScreen === 'device_scanner') {
    if (!selectedPet) {
      resetToTabs();
      return null;
    }
    return (
      <DeviceScannerScreen
        pet={selectedPet}
        onBack={navigateBack}
        onDevicePaired={() => {
          // After pairing device, return to previous context
          navigateBack();
        }}
      />
    );
  }

  if (subScreen === 'insights') {
    if (!selectedPet) {
      resetToTabs();
      return null;
    }
    return (
      <ActivityInsightsScreen
        pet={selectedPet}
        onBack={navigateBack}
      />
    );
  }

  if (subScreen === 'edit_pet') {
    if (!selectedPet) {
      resetToTabs();
      return null;
    }
    return (
      <EditPetScreen
        pet={selectedPet}
        onBack={navigateBack}
        onPetUpdated={(updatedPet) => {
          setSelectedPet(updatedPet);
          // Return to pet_detail
          navigateBack();
        }}
      />
    );
  }

  if (subScreen === 'vaccines') {
    return (
      <VaccinesMedicalRecordsScreen
        initialPet={selectedPet}
        onBack={navigateBack}
      />
    );
  }

  if (subScreen === 'observations') {
    return (
      <ClinicalObservationNotesScreen
        initialPet={selectedPet}
        onBack={navigateBack}
      />
    );
  }

  if (subScreen === 'weight') {
    return (
      <WeightBodyConditionScreen
        initialPet={selectedPet}
        onBack={navigateBack}
      />
    );
  }

  if (subScreen === 'simulator') {
    return (
      <ImuTelemetrySimulatorScreen
        initialPet={selectedPet}
        onBack={navigateBack}
      />
    );
  }

  if (subScreen === 'notifications') {
    return (
      <NotificationsScreen
        onBack={navigateBack}
        onNotificationSelect={async (notif: AppNotification) => {
          // Resolve target pet if specified
          if (notif.pet) {
            try {
              const pets = await PetService.listPets();
              const targetPet = pets.find((p) => p.id === notif.pet) || null;
              if (targetPet) setSelectedPet(targetPet);
            } catch (e) {
              console.warn('[App] Could not fetch pet for notification:', e);
            }
          }

          // Navigate to relevant subsystem with notifications preserved in history
          const notifType = notif.notification_type;
          if (notifType === 'activity_anomaly' || notifType === 'rest_change') {
            navigateToSubScreen('insights');
          } else if (notifType === 'vaccine_reminder') {
            navigateToSubScreen('vaccines');
          } else if (notifType === 'intake_alert') {
            navigateToSubScreen('observations');
          } else if (notifType === 'battery_low') {
            resetToTabs('devices');
          }
        }}
      />
    );
  }

  // Primary 4-Tab Navigation View
  return (
    <View style={styles.tabContainer}>
      <View style={styles.tabContent}>
        {activeTab === 'home' && (
          <HomeScreen
            onSelectPet={(pet) => navigateToSubScreen('pet_detail', pet)}
            onNavigateToAddPet={() => navigateToSubScreen('add_pet')}
            onNavigateToScanner={(pet) => navigateToSubScreen('device_scanner', pet)}
            onNavigateToInsights={(pet) => navigateToSubScreen('insights', pet)}
            onNavigateToProfile={() => setActiveTab('profile')}
            onNavigateToNotifications={() => navigateToSubScreen('notifications')}
            onNavigateToVaccines={(pet) => navigateToSubScreen('vaccines', pet)}
            onNavigateToObservations={(pet) => navigateToSubScreen('observations', pet)}
            onNavigateToWeight={(pet) => navigateToSubScreen('weight', pet)}
            onNavigateToSimulator={(pet) => navigateToSubScreen('simulator', pet)}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityTab initialPet={selectedPet} />
        )}

        {activeTab === 'devices' && (
          <DevicesTab
            onNavigateToScanner={(pet) => navigateToSubScreen('device_scanner', pet)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            onNavigateToScanner={(pet) => navigateToSubScreen('device_scanner', pet)}
            onNavigateToInsights={(pet) => navigateToSubScreen('insights', pet)}
          />
        )}
      </View>

      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
};

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <AuthProvider>
          <MainNavigator />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabContent: {
    flex: 1,
  },
});

export default App;
