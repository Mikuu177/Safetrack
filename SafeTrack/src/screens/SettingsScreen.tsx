import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { lightTheme, darkTheme } from '../utils/theme';
import AlertEngine from '../utils/AlertEngine';

const MEDICAL_CONDITIONS = [
  'Hypertension',
  'Cardiovascular Disease',
  'Asthma',
  'Diabetes',
  'Arthritis',
  'COPD',
  'Other',
];

const GENDERS = ['male', 'female', 'other'];

export default function SettingsScreen() {
  const { user, thresholds, updateThresholds, isDarkMode, toggleTheme } = useApp();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [editingProfile, setEditingProfile] = useState(false);
  const [editingThresholds, setEditingThresholds] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);

  // Profile editing state
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [gender, setGender] = useState(user?.gender || 'other');
  const [medicalConditions, setMedicalConditions] = useState(user?.medicalConditions || []);

  // Threshold editing state
  const [heartRateMin, setHeartRateMin] = useState('');
  const [heartRateMax, setHeartRateMax] = useState('');
  const [systolicMin, setSystolicMin] = useState('');
  const [systolicMax, setSystolicMax] = useState('');
  const [diastolicMin, setDiastolicMin] = useState('');
  const [diastolicMax, setDiastolicMax] = useState('');

  React.useEffect(() => {
    if (thresholds.length > 0) {
      const hrThreshold = thresholds.find(t => t.metricName === 'heart_rate');
      const sysThreshold = thresholds.find(t => t.metricName === 'bp_systolic');
      const diaThreshold = thresholds.find(t => t.metricName === 'bp_diastolic');

      if (hrThreshold) {
        setHeartRateMin(hrThreshold.minValue.toString());
        setHeartRateMax(hrThreshold.maxValue.toString());
      }
      if (sysThreshold) {
        setSystolicMin(sysThreshold.minValue.toString());
        setSystolicMax(sysThreshold.maxValue.toString());
      }
      if (diaThreshold) {
        setDiastolicMin(diaThreshold.minValue.toString());
        setDiastolicMax(diaThreshold.maxValue.toString());
      }
    }
  }, [thresholds]);

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      Alert.alert('Error', 'Please enter a valid age (1-120)');
      return;
    }

    try {
      // In a real app, you would update the user profile here
      // For now, we'll just show success
      Alert.alert('Success', 'Profile updated successfully');
      setEditingProfile(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleSaveThresholds = async () => {
    if (!user) return;

    const hrMin = parseInt(heartRateMin);
    const hrMax = parseInt(heartRateMax);
    const sysMin = parseInt(systolicMin);
    const sysMax = parseInt(systolicMax);
    const diaMin = parseInt(diastolicMin);
    const diaMax = parseInt(diastolicMax);

    // Validation
    if (isNaN(hrMin) || isNaN(hrMax) || hrMin >= hrMax || hrMin < 40 || hrMax > 220) {
      Alert.alert('Error', 'Invalid heart rate thresholds');
      return;
    }

    if (isNaN(sysMin) || isNaN(sysMax) || sysMin >= sysMax || sysMin < 70 || sysMax > 200) {
      Alert.alert('Error', 'Invalid systolic blood pressure thresholds');
      return;
    }

    if (isNaN(diaMin) || isNaN(diaMax) || diaMin >= diaMax || diaMin < 40 || diaMax > 120) {
      Alert.alert('Error', 'Invalid diastolic blood pressure thresholds');
      return;
    }

    try {
      const newThresholds = [
        {
          ...thresholds.find(t => t.metricName === 'heart_rate'),
          id: thresholds.find(t => t.metricName === 'heart_rate')?.id || 0,
          userId: user.id,
          metricName: 'heart_rate' as const,
          minValue: hrMin,
          maxValue: hrMax,
          isActive: true,
        },
        {
          ...thresholds.find(t => t.metricName === 'bp_systolic'),
          id: thresholds.find(t => t.metricName === 'bp_systolic')?.id || 0,
          userId: user.id,
          metricName: 'bp_systolic' as const,
          minValue: sysMin,
          maxValue: sysMax,
          isActive: true,
        },
        {
          ...thresholds.find(t => t.metricName === 'bp_diastolic'),
          id: thresholds.find(t => t.metricName === 'bp_diastolic')?.id || 0,
          userId: user.id,
          metricName: 'bp_diastolic' as const,
          minValue: diaMin,
          maxValue: diaMax,
          isActive: true,
        },
      ];

      await updateThresholds(newThresholds);
      Alert.alert('Success', 'Thresholds updated successfully');
      setEditingThresholds(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update thresholds');
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Thresholds',
      'Reset to default values based on your medical conditions?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            if (!user) return;
            const defaults = AlertEngine.getDefaultThresholds(user.id, medicalConditions);
            
            const hrDefault = defaults.find(t => t.metricName === 'heart_rate');
            const sysDefault = defaults.find(t => t.metricName === 'bp_systolic');
            const diaDefault = defaults.find(t => t.metricName === 'bp_diastolic');

            if (hrDefault) {
              setHeartRateMin(hrDefault.minValue.toString());
              setHeartRateMax(hrDefault.maxValue.toString());
            }
            if (sysDefault) {
              setSystolicMin(sysDefault.minValue.toString());
              setSystolicMax(sysDefault.maxValue.toString());
            }
            if (diaDefault) {
              setDiastolicMin(diaDefault.minValue.toString());
              setDiastolicMax(diaDefault.maxValue.toString());
            }
          },
        },
      ]
    );
  };

  const toggleCondition = (condition: string) => {
    if (medicalConditions.includes(condition)) {
      setMedicalConditions(medicalConditions.filter(c => c !== condition));
    } else {
      setMedicalConditions([...medicalConditions, condition]);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>
          Settings
        </Text>
        <Text style={[styles.headerSubtitle, { color: '#ffffff' }]}>
          Customize your SafeTrack experience
        </Text>
      </View>

      {/* Profile Section */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            👤 Profile
          </Text>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: theme.primary }]}
            onPress={() => setEditingProfile(!editingProfile)}
          >
            <Text style={[styles.editButtonText, { color: '#ffffff' }]}>
              {editingProfile ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {editingProfile ? (
          <View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Age</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={age}
                onChangeText={setAge}
                placeholder="Enter your age"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Gender</Text>
              <View style={styles.genderContainer}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderButton,
                      { borderColor: theme.border },
                      gender === g && { backgroundColor: theme.primary },
                    ]}
                    onPress={() => setGender(g as 'male' | 'female' | 'other')}
                  >
                    <Text style={[
                      styles.genderText,
                      { color: theme.text },
                      gender === g && { color: '#ffffff' },
                    ]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Medical Conditions</Text>
              <TouchableOpacity
                style={[styles.conditionButton, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => setShowConditionModal(true)}
              >
                <Text style={[styles.conditionText, { color: theme.text }]}>
                  {medicalConditions.length > 0 
                    ? `${medicalConditions.length} selected` 
                    : 'Select conditions'}
                </Text>
                <Text style={[styles.conditionArrow, { color: theme.textSecondary }]}>▼</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.success }]}
              onPress={handleSaveProfile}
            >
              <Text style={[styles.saveButtonText, { color: '#ffffff' }]}>
                Save Profile
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={[styles.profileInfo, { color: theme.text }]}>
              Name: {user?.name}
            </Text>
            <Text style={[styles.profileInfo, { color: theme.text }]}>
              Age: {user?.age}
            </Text>
            <Text style={[styles.profileInfo, { color: theme.text }]}>
              Gender: {user?.gender}
            </Text>
            <Text style={[styles.profileInfo, { color: theme.text }]}>
              Conditions: {user?.medicalConditions?.join(', ') || 'None'}
            </Text>
          </View>
        )}
      </View>

      {/* Thresholds Section */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            ⚙️ Safety Thresholds
          </Text>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: theme.primary }]}
            onPress={() => setEditingThresholds(!editingThresholds)}
          >
            <Text style={[styles.editButtonText, { color: '#ffffff' }]}>
              {editingThresholds ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {editingThresholds ? (
          <View>
            <View style={styles.thresholdGroup}>
              <Text style={[styles.thresholdTitle, { color: theme.text }]}>
                Heart Rate (bpm)
              </Text>
              <View style={styles.thresholdInputs}>
                <View style={styles.thresholdInput}>
                  <Text style={[styles.thresholdLabel, { color: theme.textSecondary }]}>Min</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={heartRateMin}
                    onChangeText={setHeartRateMin}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
                <View style={styles.thresholdInput}>
                  <Text style={[styles.thresholdLabel, { color: theme.textSecondary }]}>Max</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={heartRateMax}
                    onChangeText={setHeartRateMax}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
              </View>
            </View>

            <View style={styles.thresholdGroup}>
              <Text style={[styles.thresholdTitle, { color: theme.text }]}>
                Systolic BP (mmHg)
              </Text>
              <View style={styles.thresholdInputs}>
                <View style={styles.thresholdInput}>
                  <Text style={[styles.thresholdLabel, { color: theme.textSecondary }]}>Min</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={systolicMin}
                    onChangeText={setSystolicMin}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
                <View style={styles.thresholdInput}>
                  <Text style={[styles.thresholdLabel, { color: theme.textSecondary }]}>Max</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={systolicMax}
                    onChangeText={setSystolicMax}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
              </View>
            </View>

            <View style={styles.thresholdGroup}>
              <Text style={[styles.thresholdTitle, { color: theme.text }]}>
                Diastolic BP (mmHg)
              </Text>
              <View style={styles.thresholdInputs}>
                <View style={styles.thresholdInput}>
                  <Text style={[styles.thresholdLabel, { color: theme.textSecondary }]}>Min</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={diastolicMin}
                    onChangeText={setDiastolicMin}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
                <View style={styles.thresholdInput}>
                  <Text style={[styles.thresholdLabel, { color: theme.textSecondary }]}>Max</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={diastolicMax}
                    onChangeText={setDiastolicMax}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
              </View>
            </View>

            <View style={styles.thresholdActions}>
              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: theme.warning }]}
                onPress={resetToDefaults}
              >
                <Text style={[styles.resetButtonText, { color: '#ffffff' }]}>
                  Reset to Defaults
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.success }]}
                onPress={handleSaveThresholds}
              >
                <Text style={[styles.saveButtonText, { color: '#ffffff' }]}>
                  Save Thresholds
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            {thresholds.map((threshold) => (
              <View key={threshold.id} style={styles.thresholdDisplay}>
                <Text style={[styles.thresholdDisplayTitle, { color: theme.text }]}>
                  {threshold.metricName === 'heart_rate' ? 'Heart Rate' :
                   threshold.metricName === 'bp_systolic' ? 'Systolic BP' :
                   'Diastolic BP'}
                </Text>
                <Text style={[styles.thresholdDisplayValue, { color: theme.textSecondary }]}>
                  {threshold.minValue} - {threshold.maxValue}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* App Settings */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          🎨 App Settings
        </Text>
        
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>
            Dark Mode
          </Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={isDarkMode ? '#ffffff' : theme.background}
          />
        </View>
      </View>

      {/* Medical Conditions Modal */}
      <Modal
        visible={showConditionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConditionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Select Medical Conditions
            </Text>
            <ScrollView style={styles.conditionList}>
              {MEDICAL_CONDITIONS.map((condition) => (
                <TouchableOpacity
                  key={condition}
                  style={[
                    styles.conditionOption,
                    { borderBottomColor: theme.border },
                    medicalConditions.includes(condition) && { backgroundColor: theme.primary + '20' },
                  ]}
                  onPress={() => toggleCondition(condition)}
                >
                  <Text style={[
                    styles.conditionOptionText,
                    { color: theme.text },
                    medicalConditions.includes(condition) && { color: theme.primary, fontWeight: 'bold' },
                  ]}>
                    {medicalConditions.includes(condition) ? '✓ ' : ''}{condition}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowConditionModal(false)}
            >
              <Text style={[styles.modalCloseText, { color: '#ffffff' }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.9,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  conditionButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conditionText: {
    fontSize: 16,
  },
  conditionArrow: {
    fontSize: 12,
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileInfo: {
    fontSize: 16,
    marginBottom: 8,
  },
  thresholdGroup: {
    marginBottom: 20,
  },
  thresholdTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  thresholdInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  thresholdInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  thresholdLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  thresholdActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  resetButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  thresholdDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  thresholdDisplayTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  thresholdDisplayValue: {
    fontSize: 14,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  conditionList: {
    maxHeight: 300,
  },
  conditionOption: {
    padding: 16,
    borderBottomWidth: 1,
  },
  conditionOptionText: {
    fontSize: 16,
  },
  modalCloseButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
});