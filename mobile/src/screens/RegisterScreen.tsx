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

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'PATIENT' | 'CAREGIVER'>('PATIENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setError('Por favor completa los campos obligatorios (*).');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        role,
      });
    } catch (e: any) {
      setError(e.message || 'Error en el registro.');
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>Comienza a organizar tus tratamientos con MediSync</Text>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            {/* Selector de Rol */}
            <Text style={styles.label}>Tipo de Usuario *</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  role === 'PATIENT' && styles.roleOptionSelected,
                ]}
                onPress={() => setRole('PATIENT')}
              >
                <Ionicons
                  name="person"
                  size={18}
                  color={role === 'PATIENT' ? '#FFF' : Colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.roleText,
                    role === 'PATIENT' && styles.roleTextSelected,
                  ]}
                >
                  Paciente
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  role === 'CAREGIVER' && styles.roleOptionSelected,
                ]}
                onPress={() => setRole('CAREGIVER')}
              >
                <Ionicons
                  name="medkit"
                  size={18}
                  color={role === 'CAREGIVER' ? '#FFF' : Colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.roleText,
                    role === 'CAREGIVER' && styles.roleTextSelected,
                  ]}
                >
                  Cuidador
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nombre Completo *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Carlos Rodríguez"
                placeholderTextColor={Colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <Text style={styles.label}>Correo Electrónico *</Text>
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

            <Text style={styles.label}>Teléfono de Contacto</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="+52 55 1234 5678"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <Text style={styles.label}>Contraseña *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Button
              title="Crear Cuenta"
              onPress={handleRegister}
              loading={loading}
              variant="primary"
              size="large"
              style={styles.submitBtn}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Inicia Sesión</Text>
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
  },
  backBtn: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 24,
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
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surface,
  },
  roleOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleTextSelected: {
    color: '#FFFFFF',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});

