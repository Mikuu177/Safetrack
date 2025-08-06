import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { lightTheme, darkTheme } from '../utils/theme';

const HEALTH_CONDITIONS = [
  { id: 'hypertension', label: 'High Blood Pressure (Hypertension)' },
  { id: 'cardiovascular', label: 'Cardiovascular Disease' },
  { id: 'heart_disease', label: 'Heart Disease' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'asthma', label: 'Asthma' },
  { id: 'obesity', label: 'Obesity' },
  { id: 'none', label: 'No known conditions' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other/Prefer not to say' },
];

export default function UserSetupScreen() {
  const { createUserProfile, isDarkMode } = useApp();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    healthConditions: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name');
      return false;
    }

    const age = parseInt(formData.age, 10);
    if (!formData.age || age < 13 || age > 120) {
      Alert.alert('Validation Error', 'Please enter a valid age (13-120)');
      return false;
    }

    if (!formData.gender) {
      Alert.alert('Validation Error', 'Please select your gender');
      return false;
    }

    if (formData.healthConditions.length === 0) {
      Alert.alert('Validation Error', 'Please select your health conditions (or "No known conditions")');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Filter out 'none' from health conditions
      const healthConditions = formData.healthConditions.includes('none') 
        ? [] 
        : formData.healthConditions;

      await createUserProfile({
        name: formData.name.trim(),
        age: parseInt(formData.age, 10),
        gender: formData.gender as 'male' | 'female' | 'other',
        medicalConditions: healthConditions,
      });

      // Success will be handled by AppContext navigation
    } catch (error) {
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleHealthCondition = (conditionId: string) => {
    if (conditionId === 'none') {
      // If selecting "none", clear all other conditions
      setFormData(prev => ({
        ...prev,
        healthConditions: prev.healthConditions.includes('none') ? [] : ['none']
      }));
    } else {
      // If selecting any condition, remove "none" if it exists
      setFormData(prev => ({
        ...prev,
        healthConditions: prev.healthConditions.includes(conditionId)
          ? prev.healthConditions.filter(id => id !== conditionId)
          : [...prev.healthConditions.filter(id => id !== 'none'), conditionId]
      }));
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>
          Welcome to SafeTrack
        </Text>
        <Text style={[styles.headerSubtitle, { color: '#ffffff' }]}>
          Let's set up your health profile
        </Text>
      </View>

      <View style={[styles.form, { backgroundColor: theme.surface }]}>
        {/* Name Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Name *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Enter your name"
            placeholderTextColor={theme.textSecondary}
            maxLength={50}
          />
        </View>

        {/* Age Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Age *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={formData.age}
            onChangeText={(text) => setFormData(prev => ({ ...prev, age: text }))}
            placeholder="Enter your age"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
            maxLength={3}
          />
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            Age helps us set appropriate health thresholds
          </Text>
        </View>

        {/* Gender Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Gender *
          </Text>
          <View style={styles.optionsContainer}>
            {GENDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  { borderColor: theme.border },
                  formData.gender === option.value && { backgroundColor: theme.primary },
                ]}
                onPress={() => setFormData(prev => ({ ...prev, gender: option.value as any }))}
              >
                <Text style={[
                  styles.optionText,
                  { color: theme.text },
                  formData.gender === option.value && { color: '#ffffff' },
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Health Conditions */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Health Conditions *
          </Text>
          <Text style={[styles.hint, { color: theme.textSecondary, marginBottom: 12 }]}>
            Select all that apply. This helps us personalize your safety alerts.
          </Text>
          <View style={styles.conditionsContainer}>
            {HEALTH_CONDITIONS.map((condition) => (
              <TouchableOpacity
                key={condition.id}
                style={[
                  styles.conditionButton,
                  { borderColor: theme.border },
                  formData.healthConditions.includes(condition.id) && { backgroundColor: theme.primary },
                ]}
                onPress={() => toggleHealthCondition(condition.id)}
              >
                <Text style={[
                  styles.conditionText,
                  { color: theme.text },
                  formData.healthConditions.includes(condition.id) && { color: '#ffffff' },
                ]}>
                  {formData.healthConditions.includes(condition.id) ? '✓ ' : ''}{condition.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
            {isSubmitting ? 'Creating Profile...' : 'Create My Profile'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
          This information is stored locally on your device and helps personalize your health monitoring experience.
        </Text>
      </View>
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
    fontSize: 28,
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
    marginBottom: 24,
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
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  conditionsContainer: {
    gap: 8,
  },
  conditionButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});