import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useSmartwatch } from '../context/SmartwatchContext';

export const SmartwatchConfigScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { watchState, toggleSimulationMode, flushPendingQueue } = useSmartwatch();

  const handleFlush = async () => {
    try {
      const count = await flushPendingQueue();
      Alert.alert(
        'Sincronización',
        count > 0
          ? `Se sincronizaron ${count} eventos pendientes con el servidor.`
          : 'Todos los eventos ya están al día en el servidor.'
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return { label: 'Conectado (Wear OS)', color: Colors.success, icon: 'checkmark-circle' as const };
      case 'SIMULATION_MODE':
        return { label: 'Modo de Simulación Activo', color: Colors.accent, icon: 'hardware-chip' as const };
      case 'SYNCING':
        return { label: 'Sincronizando...', color: Colors.warning, icon: 'sync' as const };
      case 'ERROR':
        return { label: 'Error / Sin Conexión', color: Colors.error, icon: 'close-circle' as const };
      case 'DISCONNECTED':
      default:
        return { label: 'Desconectado', color: Colors.textSecondary, icon: 'power' as const };
    }
  };

  const statusInfo = getStatusInfo(watchState.status);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Configuración Smartwatch"
        subtitle="Administra la conexión y sincronización con tu reloj"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Tarjeta de Estado Principal */}
        <Card style={styles.card}>
          <View style={styles.deviceRow}>
            <View style={styles.watchIconCircle}>
              <Ionicons name="watch" size={32} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceName}>{watchState.deviceName}</Text>
              <View style={styles.statusBadgeRow}>
                <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} style={{ marginRight: 4 }} />
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Batería</Text>
              <Text style={styles.infoVal}>{watchState.batteryLevel}%</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Pendientes</Text>
              <Text style={styles.infoVal}>{watchState.pendingEventsCount} eventos</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Última Sinc.</Text>
              <Text style={styles.infoVal}>
                {watchState.lastSyncAt
                  ? new Date(watchState.lastSyncAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Acceso Directo al Simulador */}
        <Button
          title="Abrir Simulador de Smartwatch"
          onPress={() => navigation.navigate('SmartwatchSimulator')}
          variant="primary"
          size="large"
          icon={<Ionicons name="watch-outline" size={20} color="#FFF" />}
          style={{ marginBottom: 16 }}
        />

        {/* Ajustes de Simulación */}
        <Card style={styles.card}>
          <Text style={styles.sectionHeader}>Opciones de Integración</Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.switchTitle}>Modo de Simulación</Text>
              <Text style={styles.switchSubtitle}>
                Permite probar todas las alertas, vibración y confirmaciones en pantalla sin un reloj físico.
              </Text>
            </View>
            <Switch
              value={watchState.isSimulated}
              onValueChange={toggleSimulationMode}
              trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
              thumbColor={watchState.isSimulated ? Colors.primary : '#94A3B8'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.actionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Forzar Sincronización</Text>
              <Text style={styles.switchSubtitle}>
                Envía eventos encolados al backend inmediatamente.
              </Text>
            </View>
            <Button
              title="Sincronizar"
              onPress={handleFlush}
              variant="outline"
              size="small"
            />
          </View>
        </Card>

        {/* Nota Técnica de Compatibilidad */}
        <Card style={[styles.card, styles.techNote]}>
          <View style={styles.techHeader}>
            <Ionicons name="information-circle" size={20} color={Colors.primaryDark} />
            <Text style={styles.techTitle}>Compatibilidad de Hardware</Text>
          </View>
          <Text style={styles.techBody}>
            MediSync utiliza Google Wear OS Data Layer API para relojes con Wear OS 3.0, 4.0 y 5.0 (Samsung Galaxy Watch 4+, Google Pixel Watch). La comunicación se establece automáticamente al emparejar el reloj vía Bluetooth.
          </Text>
        </Card>
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
    padding: 20,
  },
  card: {
    padding: 18,
    marginBottom: 16,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  watchIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  deviceName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  infoCol: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  switchSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techNote: {
    backgroundColor: Colors.primaryLight,
    borderColor: '#BFDBFE',
  },
  techHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  techTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginLeft: 6,
  },
  techBody: {
    fontSize: 12,
    color: Colors.primaryDark,
    lineHeight: 18,
  },
});

