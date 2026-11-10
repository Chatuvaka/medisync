import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email.trim(), password);
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>¡Bienvenido de nuevo!</Text>
            <Text style={styles.subtitle}>Inicia sesión para gestionar tus medicamentos</Text>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ejemplo@correo.com"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Button
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={loading}
              variant="primary"
              size="large"
              style={styles.submitBtn}
            />

            {/* Accesos rápidos Demo */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Cuentas de Demostración:</Text>
              <View style={styles.demoButtonsRow}>
                <TouchableOpacity
                  style={styles.demoPill}
                  onPress={() => fillCredentials('demo@medisync.com')}
                >
                  <Text style={styles.demoPillText}>Paciente: Carlos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoPill}
                  onPress={() => fillCredentials('cuidador@medisync.com')}
                >
                  <Text style={styles.demoPillText}>Cuidadora: Elena</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  backBtn: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  submitBtn: {
    marginTop: 10,
  },
  demoSection: {
    marginTop: 24,
    padding: 14,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  demoPillText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});

