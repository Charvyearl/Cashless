  import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ImageBackground,
  Image,
  Dimensions,
  Alert,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Dashboard from './src/screens/Dashboard';
import PersonnelDashboard from './src/screens/PersonnelDashboard';
import { authAPI, setAuthToken, getBaseUrl } from './src/api/client';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('landing'); // 'landing', 'student', 'personnel', 'dashboard'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authToken, setAuthTokenState] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [initialBalance, setInitialBalance] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Animation effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRoleSelect = (role) => {
    if (selectedRole === role) {
      // If the same role is clicked again, navigate to login
      setCurrentScreen(role);
    } else {
      // Select the role
      setSelectedRole(role);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }
    try {
      const res = await authAPI.loginWithEmail(username.trim(), password);
      if (!res?.success) {
        throw new Error(res?.message || 'Login failed');
      }

      const token = res?.data?.token;
      const user = res?.data?.user;
      const balance = res?.data?.wallet?.balance ?? 0;

      if (!token || !user) {
        throw new Error('Invalid login response');
      }

      setAuthToken(token);
      setAuthTokenState(token);
      setCurrentUser(user);
      setInitialBalance(Number(balance) || 0);

      const type = String(user.user_type || '').toLowerCase();
      if (type === 'student') {
        setCurrentScreen('student-dashboard');
      } else if (type === 'personnel' || type === 'staff' || type === 'admin') {
        setCurrentScreen('personnel-dashboard');
      } else {
        // Default to student dashboard if unknown type
        setCurrentScreen('student-dashboard');
      }
    } catch (err) {
      const status = err?.response?.status;
      const responseMsg = err?.response?.data?.message || err?.response?.data?.error;
      let errorMessage = 'Unable to login. Please try again.';
      
      // Provide specific error messages based on the response
      if (status === 401) {
        if (responseMsg?.toLowerCase().includes('invalid credentials') || 
            responseMsg?.toLowerCase().includes('password') ||
            responseMsg?.toLowerCase().includes('authentication failed')) {
          errorMessage = 'Incorrect email or password. Please check your credentials and try again.';
        } else {
          errorMessage = 'Authentication failed. Please check your email and password.';
        }
      } else if (status === 404) {
        errorMessage = 'Account not found. Please check your email address.';
      } else if (status === 403) {
        errorMessage = 'Account access denied. Please contact your administrator.';
      } else if (status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (responseMsg) {
        errorMessage = responseMsg;
      } else if (err?.message?.includes('Network Error') || err?.message?.includes('fetch')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      }
      
      Alert.alert('Login Failed', errorMessage);
      
      // Dev log
      console.log('Login error details:', {
        baseUrl: getBaseUrl(),
        status,
        data: err?.response?.data,
        url: err?.config?.url,
        method: err?.config?.method,
        originalMessage: err?.message,
      });
    }
  };

  const goBack = () => {
    setCurrentScreen('landing');
    setUsername('');
    setPassword('');
    setShowPassword(false);
  };

  const handleLogout = () => {
    setAuthToken();
    setAuthTokenState(null);
    setCurrentUser(null);
    setInitialBalance(0);
    setSelectedRole(null);
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setCurrentScreen('landing');
  };

  // Render Landing Screen
  const renderLandingScreen = () => (
    <KeyboardAvoidingView 
      style={styles.content} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Logo and Welcome Text */}
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Image 
              source={require('./assets/images/mysmclogo.webp')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appTitle}>Cashless Canteen</Text>
          <Text style={styles.subtitle}>Your digital wallet for seamless dining</Text>
        </View>
      </Animated.View>

      {/* Role Selection Cards */}
      <Animated.View 
        style={[
          styles.buttonContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'student' && styles.roleCardActive
          ]}
          onPress={() => handleRoleSelect('student')}
          activeOpacity={0.8}
        >
          <View style={styles.roleCardContent}>
            <View style={styles.roleIconContainer}>
              <Ionicons 
                name="school-outline" 
                size={32} 
                color={selectedRole === 'student' ? '#FFFFFF' : '#00BCD4'} 
              />
            </View>
            <Text style={[
              styles.roleCardTitle,
              selectedRole === 'student' && styles.roleCardTitleActive
            ]}>
              Student
            </Text>
            <Text style={[
              styles.roleCardSubtitle,
              selectedRole === 'student' && styles.roleCardSubtitleActive
            ]}>
              Your Personal Dashboard
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'personnel' && styles.roleCardActive
          ]}
          onPress={() => handleRoleSelect('personnel')}
          activeOpacity={0.8}
        >
          <View style={styles.roleCardContent}>
            <View style={styles.roleIconContainer}>
              <Ionicons 
                name="restaurant-outline" 
                size={32} 
                color={selectedRole === 'personnel' ? '#FFFFFF' : '#00BCD4'} 
              />
            </View>
            <Text style={[
              styles.roleCardTitle,
              selectedRole === 'personnel' && styles.roleCardTitleActive
            ]}>
              Personnel
            </Text>
            <Text style={[
              styles.roleCardSubtitle,
              selectedRole === 'personnel' && styles.roleCardSubtitleActive
            ]}>
              Order and Reserve Food
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );


  // Render Login Screen
  const renderLoginScreen = () => (
    <KeyboardAvoidingView 
      style={styles.content} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header with Logo */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Image 
              source={require('./assets/images/mysmclogo.webp')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.roleSubtitle}>
            {currentScreen.charAt(0).toUpperCase() + currentScreen.slice(1)} Login
          </Text>
        </View>
      </Animated.View>

      {/* Modern Login Form Card */}
      <Animated.View 
        style={[
          styles.loginCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.loginCardHeader}>
          <Ionicons name="log-in-outline" size={24} color="#00BCD4" />
          <Text style={styles.loginTitle}>Sign In</Text>
        </View>
        
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputIconContainer}>
            <Ionicons name="mail-outline" size={20} color="#00BCD4" />
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputIconContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#00BCD4" />
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={showPassword ? "eye-outline" : "eye-off-outline"} 
              size={20} 
              color="#999" 
            />
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <View style={styles.loginButtonContent}>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            <Text style={styles.loginButtonText}>Sign In</Text>
          </View>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={goBack}
        >
          <View style={styles.backButtonContent}>
            <Ionicons name="arrow-back" size={16} color="#00BCD4" />
            <Text style={styles.backButtonText}>Back to Role Selection</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      

      {/* Render appropriate screen */}
      {currentScreen === 'student-dashboard' ? (
        <Dashboard onLogout={handleLogout} user={currentUser} initialBalance={initialBalance} />
      ) : currentScreen === 'personnel-dashboard' ? (
        <PersonnelDashboard onLogout={handleLogout} user={currentUser} initialBalance={initialBalance} />
      ) : (
        <ImageBackground
          source={require('./assets/images/background.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          {/* Overlay for better text readability */}
          <View style={styles.overlay} />
          
          {/* Render landing or login screen */}
          {currentScreen === 'landing' ? renderLandingScreen() : renderLoginScreen()}
        </ImageBackground>
      )}
    </SafeAreaView>
    </SafeAreaProvider>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrapper: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  logoImage: {
    width: 250,
    height: 80,
  },
  welcomeText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '300',
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Role Selection Cards
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  roleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardActive: {
    backgroundColor: '#00BCD4',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.02 }],
  },
  roleCardContent: {
    alignItems: 'center',
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 188, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  roleCardTitleActive: {
    color: '#FFFFFF',
  },
  roleCardSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  roleCardSubtitleActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  // Login form styles
  loginCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: '100%',
    maxWidth: 400,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loginCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    marginBottom: 5,
  },
  roleSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    minHeight: 56,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 8,
  },
  loginButton: {
    backgroundColor: '#00BCD4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#00BCD4',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
});
