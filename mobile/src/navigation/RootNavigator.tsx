import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

// Screens
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { MedicationsScreen } from '../screens/MedicationsScreen';
import { AddEditMedicationScreen } from '../screens/AddEditMedicationScreen';
import { MedicationDetailScreen } from '../screens/MedicationDetailScreen';
import { ScheduleManagerScreen } from '../screens/ScheduleManagerScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { SmartwatchConfigScreen } from '../screens/SmartwatchConfigScreen';
import { SmartwatchSimulatorScreen } from '../screens/SmartwatchSimulatorScreen';
import { CaregiversScreen } from '../screens/CaregiversScreen';
import { CaregiverDashboardScreen } from '../screens/CaregiverDashboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.cardBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'TabDashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TabMedications') {
            iconName = focused ? 'medkit' : 'medkit-outline';
          } else if (route.name === 'TabHistory') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'TabStatistics') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'TabProfile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="TabDashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Inicio' }}
      />
      <Tab.Screen
        name="TabMedications"
        component={MedicationsScreen}
        options={{ tabBarLabel: 'Medicamentos' }}
      />
      <Tab.Screen
        name="TabHistory"
        component={HistoryScreen}
        options={{ tabBarLabel: 'Historial' }}
      />
      <Tab.Screen
        name="TabStatistics"
        component={StatisticsScreen}
        options={{ tabBarLabel: 'Estadísticas' }}
      />
      <Tab.Screen
        name="TabProfile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Rutas Públicas de Autenticación
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Rutas Privadas Autenticadas
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="AddEditMedication" component={AddEditMedicationScreen} />
            <Stack.Screen name="MedicationDetail" component={MedicationDetailScreen} />
            <Stack.Screen name="ScheduleManager" component={ScheduleManagerScreen} />
            <Stack.Screen name="SmartwatchConfig" component={SmartwatchConfigScreen} />
            <Stack.Screen name="SmartwatchSimulator" component={SmartwatchSimulatorScreen} />
            <Stack.Screen name="Caregivers" component={CaregiversScreen} />
            <Stack.Screen name="CaregiverDashboard" component={CaregiverDashboardScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

