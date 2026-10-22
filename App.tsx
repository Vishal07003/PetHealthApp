import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { AddPetScreen } from './src/screens/AddPetScreen';
import { PetDetailScreen } from './src/screens/PetDetailScreen';
import { EditPetScreen } from './src/screens/EditPetScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { Pet } from './src/types/api';
import { Colors } from './src/theme/theme';

type AuthScreenState = 'login' | 'register';
type AppScreenState = 'home' | 'add_pet' | 'pet_detail' | 'edit_pet' | 'profile';

const MainNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreenState>('login');
  const [appScreen, setAppScreen] = useState<AppScreenState>('home');
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

  // Authenticated Pet Flow
  switch (appScreen) {
    case 'add_pet':
      return (
        <AddPetScreen
          onBack={() => setAppScreen('home')}
          onPetCreated={(newPet) => {
            setSelectedPet(newPet);
            setAppScreen('pet_detail');
          }}
        />
      );

    case 'pet_detail':
      if (!selectedPet) {
        setAppScreen('home');
        return null;
      }
      return (
        <PetDetailScreen
          pet={selectedPet}
          onBack={() => setAppScreen('home')}
          onEdit={(petToEdit) => {
            setSelectedPet(petToEdit);
            setAppScreen('edit_pet');
          }}
          onPetDeleted={() => {
            setSelectedPet(null);
            setAppScreen('home');
          }}
        />
      );

    case 'edit_pet':
      if (!selectedPet) {
        setAppScreen('home');
        return null;
      }
      return (
        <EditPetScreen
          pet={selectedPet}
          onBack={() => setAppScreen('pet_detail')}
          onPetUpdated={(updatedPet) => {
            setSelectedPet(updatedPet);
            setAppScreen('pet_detail');
          }}
        />
      );

    case 'profile':
      return (
        <ProfileScreen onBack={() => setAppScreen('home')} />
      );

    case 'home':
    default:
      return (
        <HomeScreen
          onSelectPet={(pet) => {
            setSelectedPet(pet);
            setAppScreen('pet_detail');
          }}
          onNavigateToAddPet={() => setAppScreen('add_pet')}
          onNavigateToProfile={() => setAppScreen('profile')}
        />
      );
  }
};

function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <MainNavigator />
      </AuthProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default App;
