import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { lightTheme, darkTheme } from '../utils/theme';

const EXERCISE_TYPES = [
  'Walking',
  'Running',
  'Cycling',
  'Swimming',
  'Gym Workout',
  'Yoga',
  'Other',
];

export default function InputScreen({ navigation }: any) {
  const { user, addHealthRecord, isDarkMode } = useApp();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [heartRate, setHeartRate] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [exerciseType, setExerciseType] = useState('');
  const [duration, setDuration] = useState('');
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateInputs = () => {
    const hr = parseInt(heartRate, 10);
    const sys = parseInt(systolic, 10);
    const dia = parseInt(diastolic, 10);

    if (!heartRate || hr < 40 || hr > 220) {
      Alert.alert('Invalid Input', 'Heart rate must be between 40 and 220 bpm');
      return false;
    }

    if (!systolic || sys < 70 || sys > 200) {
      Alert.alert('Invalid Input', 'Systolic pressure must be between 70 and 200 mmHg');
      return false;
    }

    if (!diastolic || dia < 40 || dia > 120) {
      Alert.alert('Invalid Input', 'Diastolic pressure must be between 40 and 120 mmHg');
      return false;
    }

    if (dia >= sys) {
      Alert.alert('Invalid Input', 'Diastolic pressure must be lower than systolic pressure');
      return false;
    }

    if (duration && (parseInt(duration, 10) < 1 || parseInt(duration, 10) > 300)) {
      Alert.alert('Invalid Input', 'Duration must be between 1 and 300 minutes');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    if (!validateInputs()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const record = {
        userId: user.id,
        heartRate: parseInt(heartRate, 10),
        bloodPressureSystolic: parseInt(systolic, 10),
        bloodPressureDiastolic: parseInt(diastolic, 10),
        exerciseType: exerciseType || undefined,
        duration: duration ? parseInt(duration, 10) : undefined,
      };

      await addHealthRecord(record);

      Alert.alert(
        'Success',
        'Health data recorded successfully!',
        [
          {
            text: 'Add Another',
            onPress: () => {
              setHeartRate('');
              setSystolic('');
              setDiastolic('');
              setExerciseType('');
              setDuration('');
            },
          },
          {
            text: 'View Home',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save health data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>
          Add Health Data
        </Text>
        <Text style={[styles.headerSubtitle, { color: '#ffffff' }]}>
          Enter your current readings
        </Text>
      </View>

      <View style={[styles.form, { backgroundColor: theme.surface }]}>
        {/* Heart Rate */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Heart Rate (bpm) *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={heartRate}
            onChangeText={setHeartRate}
            placeholder="e.g., 72"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
            maxLength={3}
          />
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            Normal range: 60-100 bpm at rest
          </Text>
        </View>

        {/* Blood Pressure */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Blood Pressure (mmHg) *
          </Text>
          <View style={styles.bpContainer}>
            <View style={styles.bpInput}>
              <Text style={[styles.bpLabel, { color: theme.textSecondary }]}>Systolic</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={systolic}
                onChangeText={setSystolic}
                placeholder="120"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            <Text style={[styles.bpSeparator, { color: theme.text }]}>/</Text>
            <View style={styles.bpInput}>
              <Text style={[styles.bpLabel, { color: theme.textSecondary }]}>Diastolic</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={diastolic}
                onChangeText={setDiastolic}
                placeholder="80"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            Normal range: 90-120 / 60-80 mmHg
          </Text>
        </View>

        {/* Exercise Type */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Exercise Type (Optional)
          </Text>
          <TouchableOpacity
            style={[styles.picker, { backgroundColor: theme.background, borderColor: theme.border }]}
            onPress={() => setShowExercisePicker(true)}
          >
            <Text style={[styles.pickerText, { color: exerciseType ? theme.text : theme.textSecondary }]}>
              {exerciseType || 'Select exercise type'}
            </Text>
            <Text style={[styles.pickerArrow, { color: theme.textSecondary }]}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Duration */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Duration (minutes) - Optional
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={duration}
            onChangeText={setDuration}
            placeholder="e.g., 30"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
            maxLength={3}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: theme.primary },
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={[styles.submitButtonText, { color: '#ffffff' }]}>
            {isSubmitting ? 'Saving...' : 'Save Health Data'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exercise Type Picker Modal */}
      <Modal
        visible={showExercisePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowExercisePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Select Exercise Type
            </Text>
            <ScrollView style={styles.exerciseList}>
              {EXERCISE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.exerciseOption,
                    { borderBottomColor: theme.border },
                    exerciseType === type && { backgroundColor: theme.primary + '20' },
                  ]}
                  onPress={() => {
                    setExerciseType(type);
                    setShowExercisePicker(false);
                  }}
                >
                  <Text style={[
                    styles.exerciseOptionText,
                    { color: theme.text },
                    exerciseType === type && { color: theme.primary, fontWeight: 'bold' },
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: theme.border }]}
              onPress={() => setShowExercisePicker(false)}
            >
              <Text style={[styles.modalCloseText, { color: theme.text }]}>
                Cancel
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
  form: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  bpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bpInput: {
    flex: 1,
  },
  bpLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  bpSeparator: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    marginTop: 20,
  },
  picker: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
  },
  pickerArrow: {
    fontSize: 12,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  exerciseList: {
    maxHeight: 300,
  },
  exerciseOption: {
    padding: 16,
    borderBottomWidth: 1,
  },
  exerciseOptionText: {
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
  },
});