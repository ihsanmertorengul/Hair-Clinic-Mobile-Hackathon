import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import Header from './components/navigation/Header';

import Login from './components/login/Login';
import Register from './components/login/Register';
import HomeScreen from './components/home/HomeScreen';
import AnalysisHomeScreen from './components/analysis/AnalysisHomeScreen';
import Profile from './components/profile/Profile';

import Step1 from './components/analysis/steps/Step1';
import Step2 from './components/analysis/steps/Step2';
import Step3 from './components/analysis/steps/Step3';
import Step4 from './components/analysis/steps/Step4';
import Step5 from './components/analysis/steps/Step5';
import StepAnalysisDetail from './components/analysis/steps/StepAnalysisDetail';

import MyAnalysis from './components/analysis/MyAnalysis';
import AnalysisDetail from './components/analysis/AnalysisDetail';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// --- Custom Theme
const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
  },
};

// ---- Dummy screen
const DummyScreen = ({ title }) => (
  <View style={styles.screen}>
    <Text style={{ fontSize: 24, color: '#ffffff' }}>{title}</Text>
  </View>
);

// ---- Tab ekranları için Header wrapper
const ScreenWithHeader = ({ children }) => (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
    <Header />
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>{children}</View>
  </SafeAreaView>
);

// ---- Custom Tab Bar
const CustomTabBar = ({ state, navigation }) => {
  return (
    <View
      style={[
        styles.bottomNav,
        {
          paddingBottom: Platform.OS === 'ios' ? 22 : 10,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const onPress = () => navigation.navigate(route.name);
        const iconColor = isFocused ? '#0F62FE' : '#98A2B3';

        let IconComponent;
        switch (route.name) {
          case 'Ana Sayfa':
            IconComponent = <Ionicons name="home" size={24} color={iconColor} />;
            break;
          case 'Saç Analizi':
            IconComponent = <Ionicons name="analytics" size={24} color={iconColor} />;
            break;
          case 'Profil':
            IconComponent = <Ionicons name="person" size={24} color={iconColor} />;
            break;
        }

        return (
          <TouchableOpacity key={route.key} onPress={onPress} style={styles.navItem}>
            <View style={styles.iconWrapper}>{IconComponent}</View>
            <Text style={[styles.label, isFocused && styles.labelActive]}>{route.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ---- Tabs
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Ana Sayfa"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          height: 0,
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen
        name="Ana Sayfa"
        children={() => (
          <ScreenWithHeader>
            <HomeScreen />
          </ScreenWithHeader>
        )}
      />
      <Tab.Screen
        name="Saç Analizi"
        children={() => (
          <ScreenWithHeader>
            <AnalysisHomeScreen />
          </ScreenWithHeader>
        )}
      />
      <Tab.Screen
        name="Profil"
        children={() => (
          <ScreenWithHeader>
            <Profile />
          </ScreenWithHeader>
        )}
      />
    </Tab.Navigator>
  );
}

// ---- App
export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer theme={MyTheme}>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="ProductDetailPage"
            component={() => <DummyScreen title="Product Detail Page" />}
          />
          <Stack.Screen
            name="ProfileDetails"
            component={() => <DummyScreen title="Profile Details" />}
          />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Step1" component={Step1} />
          <Stack.Screen name="Step2" component={Step2} />
          <Stack.Screen name="Step3" component={Step3} />
          <Stack.Screen name="Step4" component={Step4} />
          <Stack.Screen name="Step5" component={Step5} />
          <Stack.Screen name="StepAnalysisDetail" component={StepAnalysisDetail} />
          <Stack.Screen name="MyAnalysis"
            children={() => (
              <ScreenWithHeader>
                <MyAnalysis />
              </ScreenWithHeader>
            )}
          />
          <Stack.Screen name="AnalysisDetail"
            children={() => (
              <ScreenWithHeader>
                <AnalysisDetail />
              </ScreenWithHeader>
            )}
          />

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

// ---- Styles
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 10 : 16,
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: 3,
  },
  label: {
    fontSize: 12,
    color: '#98A2B3',
    fontWeight: '500',
  },
  labelActive: {
    color: '#0F62FE',
    fontWeight: '700',
  },
});
