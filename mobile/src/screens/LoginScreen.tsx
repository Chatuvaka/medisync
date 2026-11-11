import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { STORAGE_KEYS, MACHINE_LAN_IP } from '../config';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuración del servidor Backend
  const [serverUrl, setServerUrl] = useState<string>(api.getBaseUrl());
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [pingStatus, setPingStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');
  const [pingMessage, setPingMessage] = useState<string>('');

  useEffect(() => {
    setServerUrl(api.getBaseUrl());
  }, []);

  const handleTestConnection = async () => {
    setPingStatus('checking');
    setPingMessage('Probando conexión con el backend...');
    try {
      const trimmed = serverUrl.trim();
      const healthUrl = trimmed.endsWith('/api')
        ? trimmed.replace(/\/api$/, '/health')
        : `${trimmed}/health`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        setPingStatus('ok');
        setPingMessage('✓ Conectado correctamente al backend');
        api.setBaseUrl(trimmed);
        await AsyncStorage.setItem(STORAGE_KEYS.API_URL, trimmed);
      } else {
        setPingStatus('fail');
        setPingMessage(`Servidor respondió con código ${res.status}`);
      }
    } catch (e: any) {
      setPingStatus('fail');
      setPingMessage(`No responde (${e.message || 'Error de red'})`);
    }
  };

  const handleSaveServerUrl = async () => {
    const trimmed = serverUrl.trim();
    api.setBaseUrl(trimmed);
    await AsyncStorage.setItem(STORAGE_KEYS.API_URL, trimmed);
    setShowServerConfig(false);
    setError(null);
  };

  const handleLogin = async (overrideEmail?: string, overridePass?: string) => {
    const targetEmail = (overrideEmail || email).trim();
    const targetPass = overridePass || password;

    if (!targetEmail || !targetPass) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(targetEmail, targetPass);
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
    handleLogin(userEmail, 'password123');
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
              onPress={() => handleLogin()}
              loading={loading}
              variant="primary"
              size="large"
              style={styles.submitBtn}
            />

            {/* Accesos rápidos Demo */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Acceso rápido con un toque (Demo):</Text>
              <View style={styles.demoButtonsRow}>
                <TouchableOpacity
                  style={styles.demoPill}
                  disabled={loading}
                  onPress={() => quickLogin('demo@medisync.com')}
                >
                  <Ionicons name="person" size={14} color={Colors.primaryDark} style={{ marginRight: 4 }} />
                  <Text style={styles.demoPillText}>Paciente Carlos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoPill}
                  disabled={loading}
                  onPress={() => quickLogin('cuidador@medisync.com')}
                >
                  <Ionicons name="heart" size={14} color={Colors.primaryDark} style={{ marginRight: 4 }} />
                  <Text style={styles.demoPillText}>Cuidadora Elena</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Configuración / Diagnóstico de Servidor */}
            <View style={styles.serverCard}>
              <TouchableOpacity
                style={styles.serverHeader}
                onPress={() => setShowServerConfig(!showServerConfig)}
              >
                <View style={styles.serverHeaderLeft}>
                  <Ionicons name="server-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.serverTitle}>Servidor: {serverUrl}</Text>
                </View>
                <Ionicons
                  name={showServerConfig ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {showServerConfig && (
                <View style={styles.serverBody}>
                  <Text style={styles.serverHint}>
                    Si el celular está en la misma red Wi-Fi, debe apuntar a la IP de tu PC:
                  </Text>
                  <TextInput
                    style={styles.serverInput}
                    value={serverUrl}
                    onChangeText={setServerUrl}
                    autoCapitalize="none"
                    placeholder="http://10.222.1.33:4000/api"
                  />
                  <View style={styles.serverActions}>
                    <TouchableOpacity
                      style={styles.serverBtnSecondary}
                      onPress={handleTestConnection}
                      disabled={pingStatus === 'checking'}
                    >
                      {pingStatus === 'checking' ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <Text style={styles.serverBtnSecondaryText}>Probar Conexión</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.serverBtnPrimary}
                      onPress={handleSaveServerUrl}
                    >
                      <Text style={styles.serverBtnPrimaryText}>Guardar</Text>
                    </TouchableOpacity>
                  </View>

                  {pingMessage ? (
                    <Text
                      style={[
                        styles.pingStatusText,
                        { color: pingStatus === 'ok' ? Colors.success : Colors.error },
                      ]}
                    >
                      {pingMessage}
                    </Text>
                  ) : null}
                </View>
              )}
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
    marginTop: 20,
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
    gap: 10,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  demoPillText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  serverCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  serverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  serverHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  serverTitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  serverBody: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.background,
  },
  serverHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  serverInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: Colors.text,
    marginBottom: 10,
  },
  serverActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  serverBtnSecondary: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  serverBtnSecondaryText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  serverBtnPrimary: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  serverBtnPrimaryText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pingStatusText: {
    fontSize: 11,
    marginTop: 8,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 16,
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


