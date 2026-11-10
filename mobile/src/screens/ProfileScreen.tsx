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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        emergencyContact: emergencyContact.trim() || null,
      });
      setIsEditing(false);
      Alert.alert('Éxito', 'Información personal actualizada correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Perfil y Cuenta"
        subtitle="Administra tus datos y preferencias"
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Tarjeta de Usuario */}
        <Card style={styles.userCard}>
          <View style={styles.userHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.fullName}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {user?.role === 'PATIENT' ? 'Paciente' : 'Cuidador'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editToggle}>
              <Ionicons name={isEditing ? 'close' : 'create-outline'} size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <Text style={styles.label}>Nombre Completo</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+52 55 1234 5678"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Contacto de Emergencia</Text>
              <TextInput
                style={styles.input}
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                placeholder="Nombre y teléfono del contacto"
              />

              <Button
                title="Guardar Cambios"
                onPress={handleSaveProfile}
                loading={saving}
                variant="primary"
                size="medium"
                style={{ marginTop: 12 }}
              />
            </View>
          ) : (
            <View style={styles.infoSummary}>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{user?.phone || 'Sin teléfono registrado'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.warning} />
                <Text style={styles.infoText}>
                  {user?.emergencyContact || 'Sin contacto de emergencia'}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Accesos a Módulos Especiales */}
        <Text style={styles.sectionTitle}>Módulos y Servicios</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Caregivers')}
        >
          <View style={[styles.menuIcon, { backgroundColor: Colors.warningLight }]}>
            <Ionicons name="people" size={20} color={Colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Red de Cuidadores</Text>
            <Text style={styles.menuSub}>Invitaciones, supervisión y permisos</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('SmartwatchSimulator')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#0F172A' }]}>
            <Ionicons name="watch" size={20} color={Colors.watchAccent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Simulador de Smartwatch</Text>
            <Text style={styles.menuSub}>Probar alertas y confirmaciones en reloj</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('SmartwatchConfig')}
        >
          <View style={[styles.menuIcon, { backgroundColor: Colors.primaryLight }]}>
            <Ionicons name="hardware-chip" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Configuración Smartwatch</Text>
            <Text style={styles.menuSub}>Estado Wear OS, batería y sincronización</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#F1F5F9' }]}>
            <Ionicons name="settings" size={20} color={Colors.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Configuración General</Text>
            <Text style={styles.menuSub}>Servidor, notificaciones y acerca de</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Cerrar Sesión */}
        <Button
          title="Cerrar Sesión"
          onPress={handleLogout}
          variant="outline"
          size="medium"
          icon={<Ionicons name="log-out-outline" size={18} color={Colors.primary} />}
          style={{ marginTop: 20, marginBottom: 40 }}
        />
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
  userCard: {
    padding: 18,
    marginBottom: 20,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  editToggle: {
    padding: 6,
  },
  infoSummary: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  editForm: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  menuSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});

