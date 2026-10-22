import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
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
import { BottomTabBar, MainTabType } from './src/components/BottomTabBar';
import { Pet } from './src/types/api';
import { Colors } from './src/theme/theme';

type AuthScreenState = 'login' | 'register';
type AppSubScreenState =
  | 'tabs'
  | 'add_pet'
  | 'pet_detail'
  | 'edit_pet'
  | 'device_scanner'
  | 'insights';

const MainNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreenState>('login');
  const [activeTab, setActiveTab] = useState<MainTabType>('home');
  const [subScreen, setSubScreen] = useState<AppSubScreenState>('tabs');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

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
        onBack={() => setSubScreen('tabs')}
        onPetCreated={(newPet) => {
          setSelectedPet(newPet);
          setSubScreen('pet_detail');
        }}
      />
    );
  }

  if (subScreen === 'pet_detail') {
    if (!selectedPet) {
      setSubScreen('tabs');
      return null;
    }
    return (
      <PetDetailScreen
        pet={selectedPet}
        onBack={() => setSubScreen('tabs')}
        onEdit={(petToEdit) => {
          setSelectedPet(petToEdit);
          setSubScreen('edit_pet');
        }}
        onPetDeleted={() => {
          setSelectedPet(null);
          setSubScreen('tabs');
        }}
        onNavigateToScanner={() => setSubScreen('device_scanner')}
        onNavigateToInsights={() => setSubScreen('insights')}
      />
    );
  }

  if (subScreen === 'device_scanner') {
    if (!selectedPet) {
      setSubScreen('tabs');
      return null;
    }
    return (
      <DeviceScannerScreen
        pet={selectedPet}
        onBack={() => setSubScreen('pet_detail')}
        onDevicePaired={() => {
          setSubScreen('pet_detail');
        }}
      />
    );
  }

  if (subScreen === 'insights') {
    if (!selectedPet) {
      setSubScreen('tabs');
      return null;
    }
    return (
      <ActivityInsightsScreen
        pet={selectedPet}
        onBack={() => setSubScreen('pet_detail')}
      />
    );
  }

  if (subScreen === 'edit_pet') {
    if (!selectedPet) {
      setSubScreen('tabs');
      return null;
    }
    return (
      <EditPetScreen
        pet={selectedPet}
        onBack={() => setSubScreen('pet_detail')}
        onPetUpdated={(updatedPet) => {
          setSelectedPet(updatedPet);
          setSubScreen('pet_detail');
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
            onSelectPet={(pet) => {
              setSelectedPet(pet);
              setSubScreen('pet_detail');
            }}
            onNavigateToAddPet={() => setSubScreen('add_pet')}
            onNavigateToScanner={(pet) => {
              setSelectedPet(pet);
              setSubScreen('device_scanner');
            }}
            onNavigateToInsights={(pet) => {
              setSelectedPet(pet);
              setSubScreen('insights');
            }}
            onNavigateToProfile={() => setActiveTab('profile')}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityTab initialPet={selectedPet} />
        )}

        {activeTab === 'devices' && (
          <DevicesTab
            onNavigateToScanner={(pet) => {
              setSelectedPet(pet);
              setSubScreen('device_scanner');
            }}
          />
        )}

        {activeTab === 'profile' && <ProfileTab />}
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
