import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useCaregiver } from '../context/CaregiverContext';

export const CaregiversScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    caregivers,
    pendingInvitations,
    supervisedPatients,
    inviteCaregiver,
    acceptInvitation,
    removeCaregiver,
    refreshCaregivers,
    refreshSupervisedPatients,
  } = useCaregiver();

  // Estados de modal de invitación
  const [modalVisible, setModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Estados para aceptar código de invitación
  const [acceptCode, setAcceptCode] = useState('');
  const [acceptLoading, setAcceptLoading] = useState(false);

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Correo requerido', 'Por favor ingresa el correo de tu familiar o cuidador.');
      return;
    }

    try {
      setInviteLoading(true);
      const res = await inviteCaregiver(inviteEmail.trim());
      setGeneratedCode(res.inviteCode);
      Alert.alert(
        '¡Invitación Generada!',
        `Código de vinculación: ${res.inviteCode}\nCompártelo con tu cuidador para que lo ingrese en su app.`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleAcceptCode = async () => {
    if (!acceptCode.trim()) {
      Alert.alert('Código requerido', 'Ingresa el código de 6 caracteres.');
      return;
    }

    try {
      setAcceptLoading(true);
      const res = await acceptInvitation(acceptCode.trim().toUpperCase());
      Alert.alert('¡Vinculación Exitosa!', res.message || 'Ahora eres cuidador autorizado de este paciente.');
      setAcceptCode('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleRevoke = (caregiverId: string, name: string) => {
    Alert.alert(
      'Revocar Acceso',
      `¿Deseas revocar el permiso de supervisión a ${name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCaregiver(caregiverId);
              Alert.alert('Revocado', 'Permiso revocado con éxito.');
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Red de Cuidadores"
        subtitle="Supervisión segura de familiares y personal de salud"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              setGeneratedCode(null);
              setInviteEmail('');
              setModalVisible(true);
            }}
          >
            <Ionicons name="person-add" size={20} color="#FFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Sección Pacientes que yo superviso (si soy cuidador) */}
        {supervisedPatients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pacientes que Supervisas</Text>
            {supervisedPatients.map((sp: any) => (
              <Card key={sp.relationshipId} style={styles.patientCard}>
                <View style={styles.patientRow}>
                  <View style={styles.patientIcon}>
                    <Ionicons name="heart" size={24} color={Colors.error} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{sp.patient.fullName}</Text>
                    <Text style={styles.patientEmail}>{sp.patient.email}</Text>
                  </View>

                  <Button
                    title="Ver Panel"
                    onPress={() =>
                      navigation.navigate('CaregiverDashboard', {
                        patientId: sp.patient.id,
                      })
                    }
                    variant="primary"
                    size="small"
                  />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Sección de Vincular Código como Cuidador */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>¿Eres Cuidador de Alguien?</Text>
          <Text style={styles.cardSubtitle}>
            Ingresa el código de 6 caracteres que te compartió el paciente:
          </Text>

          <View style={styles.codeRow}>
            <TextInput
              style={styles.codeInput}
              placeholder="Ej: MS4X89"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              maxLength={6}
              value={acceptCode}
              onChangeText={setAcceptCode}
            />
            <Button
              title="Vincular"
              onPress={handleAcceptCode}
              loading={acceptLoading}
              variant="success"
              size="medium"
            />
          </View>
        </Card>

        {/* Mis Cuidadores Autorizados */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Cuidadores de mi Cuenta ({caregivers.length})</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text style={styles.linkText}>+ Invitar</Text>
            </TouchableOpacity>
          </View>

          {caregivers.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="people-outline" size={36} color={Colors.primary} />
              <Text style={styles.emptyTitle}>Sin cuidadores vinculados</Text>
              <Text style={styles.emptySubtitle}>
                Invita a un familiar o médico para que pueda supervisar tus tomas y recibir alertas preventivas.
              </Text>
            </Card>
          ) : (
            caregivers.map((cg) => (
              <Card key={cg.id} style={styles.cgCard}>
                <View style={styles.cgRow}>
                  <View style={styles.cgAvatar}>
                    <Ionicons name="person" size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cgName}>{cg.fullName}</Text>
                    <Text style={styles.cgEmail}>{cg.email}</Text>
                    <Text style={styles.cgPerms}>Permisos: Visualización y Alertas</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.revokeBtn}
                    onPress={() => handleRevoke(cg.id, cg.fullName)}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Invitaciones Pendientes */}
        {pendingInvitations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invitaciones Pendientes</Text>
            {pendingInvitations.map((inv: any) => (
              <Card key={inv.id} style={styles.inviteCard}>
                <View style={styles.inviteRow}>
                  <View>
                    <Text style={styles.inviteTarget}>{inv.inviteeEmail}</Text>
                    <Text style={styles.inviteCode}>Código: {inv.inviteCode}</Text>
                  </View>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingText}>Pendiente</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Invitar Cuidador */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invitar a un Cuidador</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Ingresa el correo del familiar o cuidador. Se generará un código seguro de vinculación.
            </Text>

            <Text style={styles.modalLabel}>Correo del Cuidador</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="familiar@ejemplo.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={inviteEmail}
              onChangeText={setInviteEmail}
            />

            {generatedCode ? (
              <View style={styles.codeDisplayBox}>
                <Text style={styles.codeDisplayTitle}>Código de Invitación Generado:</Text>
                <Text style={styles.codeDisplayText}>{generatedCode}</Text>
                <Text style={styles.codeDisplaySub}>
                  Válido por 7 días. Compártelo con tu cuidador.
                </Text>
              </View>
            ) : null}

            <Button
              title={generatedCode ? 'Cerrar' : 'Generar Código de Invitación'}
              onPress={generatedCode ? () => setModalVisible(false) : handleSendInvite}
              loading={inviteLoading}
              variant="primary"
              size="large"
              style={{ marginTop: 14 }}
            />
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  linkText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  card: {
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  codeInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    color: Colors.text,
  },
  patientCard: {
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  patientEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cgCard: {
    padding: 14,
    marginBottom: 10,
  },
  cgRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cgAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cgName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  cgEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cgPerms: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  revokeBtn: {
    padding: 8,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  inviteCard: {
    padding: 12,
    marginBottom: 8,
  },
  inviteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteTarget: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  inviteCode: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '700',
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  modalDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 10,
  },
  codeDisplayBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 10,
  },
  codeDisplayTitle: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  codeDisplayText: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primaryDark,
    letterSpacing: 4,
    marginVertical: 6,
  },
  codeDisplaySub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});

