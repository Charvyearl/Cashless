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
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [backendStatus, setBackendStatus] = useState(null); // 'ok' | 'fail' | null

  // On app start, verify backend connectivity
  useEffect(() => {
    let isMounted = true;
    const ping = async () => {
      try {
        const url = `${getBaseUrl()}/health`;
        const res = await fetch(url);
        if (!isMounted) return;
        if (res.ok) {
          setBackendStatus('ok');
          Alert.alert('Connected', 'You are connected to backend');
        } else {
          setBackendStatus('fail');
          Alert.alert('Connection failed', 'Cannot reach backend');
        }
      } catch (_) {
        if (!isMounted) return;
        setBackendStatus('fail');
        Alert.alert('Connection failed', 'Cannot reach backend');
      }
    };
    ping();
    return () => { isMounted = false; };
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
      const msg = err?.response?.data?.message || err?.message || 'Unable to login. Please try again.';
      Alert.alert('Login failed', `${msg}${status ? ` (HTTP ${status})` : ''}`);
      // Dev log
      console.log('Login error details:', {
        baseUrl: getBaseUrl(),
        status,
        data: err?.response?.data,
        url: err?.config?.url,
        method: err?.config?.method,
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
    setCurrentScreen('landing');
    setSelectedRole(null);
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setAuthToken();
    setAuthTokenState(null);
    setCurrentUser(null);
    setInitialBalance(0);
  };

  // Render Landing Screen
  const renderLandingScreen = () => (
    <View style={styles.content}>
      {/* Logo and Welcome Text */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('./assets/images/mysmclogo.webp')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.welcomeText}>Welcome to MySmc Wallet!</Text>
      </View>

      {/* Role Selection Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.roleButton,
            selectedRole === 'student' && styles.roleButtonActive
          ]}
          onPress={() => handleRoleSelect('student')}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.roleButtonText,
            selectedRole === 'student' && styles.roleButtonTextActive
          ]}>
            Student
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleButton,
            selectedRole === 'personnel' && styles.roleButtonActive
          ]}
          onPress={() => handleRoleSelect('personnel')}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.roleButtonText,
            selectedRole === 'personnel' && styles.roleButtonTextActive
          ]}>
            Personnel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  // Render Login Screen
  const renderLoginScreen = () => (
    <View style={styles.content}>
      {/* Logo and Welcome Text */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('./assets/images/mysmclogo.webp')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.welcomeText}>Welcome to MySmc Wallet!</Text>
      </View>

      {/* Login Form Card */}
      <View style={styles.loginCard}>
        <Text style={styles.loginTitle}>Login</Text>
        <Text style={styles.roleSubtitle}>as {currentScreen.charAt(0).toUpperCase() + currentScreen.slice(1)}</Text>
        
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputIcon}>👤</Text>
          <TextInput
            style={styles.textInput}
            placeholder={`Email`}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Password"
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
            <Text style={styles.eyeIconText}>{showPassword ? '👁️' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Log in</Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={goBack}
        >
          <Text style={styles.backButtonText}>← Back to Role Selection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Backend connection status banner */}
      {backendStatus && (
        <View style={[styles.statusBanner, backendStatus === 'ok' ? styles.statusOk : styles.statusFail]}>
          <Text style={styles.statusText}>
            {backendStatus === 'ok' ? 'Connected to backend' : 'Cannot reach backend'}
          </Text>
        </View>
      )}

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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
    marginTop: -100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logoImage: {
    width: 800,
    height: 100,
  },
  welcomeText: {
    fontSize: 16,
    color: 'black',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  roleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  roleButtonActive: {
    backgroundColor: '#87CEEB',
  },
  roleButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  // Login form styles
  loginCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    paddingVertical: 30,
    paddingHorizontal: 25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
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
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  eyeIconText: {
    fontSize: 20,
  },
  loginButton: {
    backgroundColor: '#87CEEB',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#87CEEB',
    fontSize: 16,
    fontWeight: '500',
  },
  statusBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    alignItems: 'center',
    zIndex: 10,
  },
  statusOk: {
    backgroundColor: '#e6f7ec',
  },
  statusFail: {
    backgroundColor: '#fdecea',
  },
  statusText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '500',
  },
});
