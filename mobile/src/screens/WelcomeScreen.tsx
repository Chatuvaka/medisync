import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export const WelcomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { login } = useAuth();
  const [demoLoading, setDemoLoading] = React.useState(false);

  const handleQuickDemoLogin = async () => {
    try {
      setDemoLoading(true);
      await login('demo@medisync.com', 'password123');
    } catch (e: any) {
      alert('Error accediendo con cuenta demo: ' + e.message);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Encabezado */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="medical" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.title}>MediSync</Text>
          <Text style={styles.subtitle}>
            Tu asistente inteligente para la administración y cumplimiento de medicamentos
          </Text>
        </View>

        {/* Puntos Clave */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="watch-outline" size={22} color={Colors.primaryDark} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Sincronización con Smartwatch</Text>
              <Text style={styles.featureDesc}>
                Recibe alertas y confirma tus tomas desde tu reloj con Wear OS o el simulador.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.successLight }]}>
              <Ionicons name="checkmark-done-circle-outline" size={22} color={Colors.success} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Control de Tomas e Historial</Text>
              <Text style={styles.featureDesc}>
                Registro confiable e idempotente para evitar dosis duplicadas y verificar el cumplimiento.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.warningLight }]}>
              <Ionicons name="people-outline" size={22} color={Colors.warning} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Red de Cuidadores</Text>
              <Text style={styles.featureDesc}>
                Permite a tus familiares o médicos supervisar tu adherencia y recibir alertas preventivas.
              </Text>
            </View>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          <Button
            title="Iniciar Sesión"
            onPress={() => navigation.navigate('Login')}
            variant="primary"
            size="large"
            style={styles.btn}
          />

          <Button
            title="Registrarse"
            onPress={() => navigation.navigate('Register')}
            variant="outline"
            size="large"
            style={styles.btn}
          />

          <Button
            title="Acceso Rápido con Cuenta Demo"
            onPress={handleQuickDemoLogin}
            loading={demoLoading}
            variant="secondary"
            size="medium"
            style={{ marginTop: 8 }}
          />
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  features: {
    marginVertical: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    paddingBottom: 16,
  },
  btn: {
    marginBottom: 12,
  },
});

