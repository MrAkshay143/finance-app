import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '@finance/shared-ui-tokens';
import type { SecurityQuestion } from '@finance/shared-types';
import {
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldCheckIcon,
  HelpCircleIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  CheckIcon,
  AlertCircleIcon,
  InfoIcon,
} from '../../components/icons';
import { BrandedHeader } from '../../components/BrandedHeader';
import { apiClient } from '../../services/apiClient';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface QuestionItem {
  id: string;
  questionKey: string;
  questionText: string;
}

const DEFAULT_QUESTIONS_POOL: QuestionItem[] = [
  { id: '1', questionKey: 'first_pet', questionText: 'What was the name of your first pet?' },
  { id: '2', questionKey: 'mother_maiden_name', questionText: "What is your mother's maiden name?" },
  { id: '3', questionKey: 'elementary_school', questionText: 'What elementary school did you attend?' },
  { id: '4', questionKey: 'birth_city', questionText: 'In what city were you born?' },
  { id: '5', questionKey: 'first_car', questionText: 'What was the make or model of your first car?' },
  { id: '6', questionKey: 'favorite_book', questionText: 'What is the title of your favorite book?' },
  { id: '7', questionKey: 'childhood_street', questionText: 'What street did you grow up on?' },
];

export const SecurityQuestionsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const [questionsPool, setQuestionsPool] = useState<QuestionItem[]>(DEFAULT_QUESTIONS_POOL);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Selected questions
  const [selectedQ1, setSelectedQ1] = useState<QuestionItem>(DEFAULT_QUESTIONS_POOL[0]);
  const [answer1, setAnswer1] = useState('');
  const [showAnswer1, setShowAnswer1] = useState(false);

  const [selectedQ2, setSelectedQ2] = useState<QuestionItem>(DEFAULT_QUESTIONS_POOL[1]);
  const [answer2, setAnswer2] = useState('');
  const [showAnswer2, setShowAnswer2] = useState(false);

  const [selectedQ3, setSelectedQ3] = useState<QuestionItem>(DEFAULT_QUESTIONS_POOL[2]);
  const [answer3, setAnswer3] = useState('');
  const [showAnswer3, setShowAnswer3] = useState(false);

  // Dropdown modal state
  const [modalVisible, setModalVisible] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const pool: any = await apiClient.auth.getAvailableSecurityQuestions();
        if (Array.isArray(pool) && pool.length >= 3) {
          const mapped: QuestionItem[] = pool.map((q: any, idx: number) => ({
            id: q.id || String(idx + 1),
            questionKey: q.key || q.questionKey || '',
            questionText: q.text || q.questionText || '',
          }));
          setQuestionsPool(mapped);
          if (mapped[0]) setSelectedQ1(mapped[0]);
          if (mapped[1]) setSelectedQ2(mapped[1]);
          if (mapped[2]) setSelectedQ3(mapped[2]);
        }
      } catch {
        // Fallback default questions pool
      }
    };

    void fetchQuestions();
  }, []);

  const getAvailableQuestionsForStep = (): QuestionItem[] => {
    if (currentStep === 1) {
      return questionsPool.filter(
        (q) => q.questionKey !== selectedQ2.questionKey && q.questionKey !== selectedQ3.questionKey
      );
    }
    if (currentStep === 2) {
      return questionsPool.filter(
        (q) => q.questionKey !== selectedQ1.questionKey && q.questionKey !== selectedQ3.questionKey
      );
    }
    return questionsPool.filter(
      (q) => q.questionKey !== selectedQ1.questionKey && q.questionKey !== selectedQ2.questionKey
    );
  };

  const handleSelectQuestion = (item: QuestionItem) => {
    if (currentStep === 1) setSelectedQ1(item);
    if (currentStep === 2) setSelectedQ2(item);
    if (currentStep === 3) setSelectedQ3(item);
    setModalVisible(false);
  };

  const handleNextOrSubmit = async () => {
    setErrorMessage(null);

    if (currentStep === 1) {
      if (!answer1.trim() || answer1.trim().length < 2) {
        setErrorMessage('Answer to Question 1 must be at least 2 characters.');
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!answer2.trim() || answer2.trim().length < 2) {
        setErrorMessage('Answer to Question 2 must be at least 2 characters.');
        return;
      }
      setCurrentStep(3);
      return;
    }

    // Step 3 - Submit all 3 questions
    if (!answer3.trim() || answer3.trim().length < 2) {
      setErrorMessage('Answer to Question 3 must be at least 2 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadAnswers = [
        { questionKey: selectedQ1.questionKey, questionId: selectedQ1.id, answer: answer1.trim().toLowerCase() },
        { questionKey: selectedQ2.questionKey, questionId: selectedQ2.id, answer: answer2.trim().toLowerCase() },
        { questionKey: selectedQ3.questionKey, questionId: selectedQ3.id, answer: answer3.trim().toLowerCase() },
      ];

      await apiClient.auth.setupSecurityQuestions({
        questions: payloadAnswers,
        answers: payloadAnswers,
      });

      setSetupComplete(true);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to configure security questions. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = currentStep === 1 ? selectedQ1 : currentStep === 2 ? selectedQ2 : selectedQ3;
  const currentAnswer = currentStep === 1 ? answer1 : currentStep === 2 ? answer2 : answer3;
  const setCurrentAnswer =
    currentStep === 1 ? setAnswer1 : currentStep === 2 ? setAnswer2 : setAnswer3;
  const currentShowAnswer =
    currentStep === 1 ? showAnswer1 : currentStep === 2 ? showAnswer2 : showAnswer3;
  const setCurrentShowAnswer =
    currentStep === 1
      ? setShowAnswer1
      : currentStep === 2
        ? setShowAnswer2
        : setShowAnswer3;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BrandedHeader
        variant="nested"
        title="Security Questions"
        subtitle="Set up security questions to keep your account safe"
        onBackPress={() => {
          if (currentStep > 1) {
            setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
          } else {
            navigation.goBack();
          }
        }}
        rightAction={
          <View style={styles.secureHeaderBadge}>
            <LockIcon size={12} color={colors.primary} />
            <Text style={styles.secureBadgeText}>Your security matters</Text>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom + 28 : 36,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Advisory Box matching snapshot */}
        <View style={styles.advisoryCard}>
          <View style={styles.advisoryIconSquare}>
            <ShieldCheckIcon size={24} color="#2554EE" />
          </View>
          <View style={styles.advisoryContent}>
            <Text style={styles.advisoryTitle}>Add 3 security questions</Text>
            <Text style={styles.advisorySubtitle}>
              Security questions help you recover your account if you forget your password.
            </Text>
          </View>
        </View>

        {/* Stepper Progress Bar */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepperRow}>
            {/* Step 1 */}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= 1 ? styles.stepCircleActive : styles.stepCircleInactive,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    currentStep >= 1 ? styles.stepNumberActive : styles.stepNumberInactive,
                  ]}
                >
                  1
                </Text>
              </View>
              <Text style={[styles.stepLabel, currentStep === 1 && styles.stepLabelActive]}>
                Question 1
              </Text>
            </View>

            <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />

            {/* Step 2 */}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= 2 ? styles.stepCircleActive : styles.stepCircleInactive,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    currentStep >= 2 ? styles.stepNumberActive : styles.stepNumberInactive,
                  ]}
                >
                  2
                </Text>
              </View>
              <Text style={[styles.stepLabel, currentStep === 2 && styles.stepLabelActive]}>
                Question 2
              </Text>
            </View>

            <View style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]} />

            {/* Step 3 */}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= 3 ? styles.stepCircleActive : styles.stepCircleInactive,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    currentStep >= 3 ? styles.stepNumberActive : styles.stepNumberInactive,
                  ]}
                >
                  3
                </Text>
              </View>
              <Text style={[styles.stepLabel, currentStep === 3 && styles.stepLabelActive]}>
                Question 3
              </Text>
            </View>
          </View>
        </View>

        {/* Feedback Banners */}
        {setupComplete ? (
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <CheckIcon size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Security Setup Complete</Text>
            <Text style={styles.successSubtitle}>
              All 3 security questions are configured and saved.
            </Text>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.doneButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Return to Profile"
            >
              <Text style={styles.doneButtonText}>Return to Profile</Text>
            </Pressable>
          </View>
        ) : (
          /* Form Card */
          <View style={styles.card}>
            <Text style={styles.stepIndicatorText}>QUESTION {currentStep} OF 3</Text>
            <Text style={styles.formSectionTitle}>Choose a security question</Text>
            <Text style={styles.formSectionSubtitle}>
              Select a question from the list and provide your answer.
            </Text>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <AlertCircleIcon size={18} color={colors.danger} />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Question Dropdown Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Security Question <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <Pressable
                onPress={() => setModalVisible(true)}
                style={styles.dropdownSelector}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Choose a security question"
              >
                <View style={styles.dropdownIcon}>
                  <HelpCircleIcon size={18} color={colors.textMuted} />
                </View>
                <Text style={styles.dropdownText} numberOfLines={2}>
                  {currentQuestion?.questionText || 'Choose a question...'}
                </Text>
                <ChevronDownIcon size={18} color="#98A2B3" />
              </Pressable>
            </View>

            {/* Answer Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Your Answer <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <LockIcon size={18} color={colors.textMuted} />
                </View>
                <TextInput
                  style={styles.textInput}
                  value={currentAnswer}
                  onChangeText={(text) => {
                    setCurrentAnswer(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter your answer"
                  placeholderTextColor="#98A2B3"
                  secureTextEntry={!currentShowAnswer}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Security Question Answer"
                />
                <Pressable
                  onPress={() => setCurrentShowAnswer(!currentShowAnswer)}
                  style={styles.eyeToggle}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={currentShowAnswer ? 'Hide answer' : 'Show answer'}
                >
                  {currentShowAnswer ? (
                    <EyeOffIcon size={18} color={colors.textMuted} />
                  ) : (
                    <EyeIcon size={18} color={colors.textMuted} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Advice Box */}
            <View style={styles.adviceCallout}>
              <InfoIcon size={16} color={colors.primary} />
              <Text style={styles.adviceText}>
                Use an answer that you can easily remember, but is hard for others to guess.
              </Text>
            </View>
          </View>
        )}

        {/* Action Button */}
        {!setupComplete ? (
          <Pressable
            onPress={handleNextOrSubmit}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={currentStep === 3 ? 'Save Security Questions' : 'Next Question'}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.primaryButtonText}>
                  {currentStep === 3 ? 'Complete Setup' : 'Next Question'}
                </Text>
                <ArrowRightIcon size={18} color="#FFFFFF" />
              </View>
            )}
          </Pressable>
        ) : null}
      </ScrollView>

      {/* Question Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24 },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose a Question</Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close dialog"
              >
                <Text style={styles.modalCloseText}>Done</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {getAvailableQuestionsForStep().map((item) => (
                <Pressable
                  key={item.questionKey}
                  onPress={() => handleSelectQuestion(item)}
                  style={({ pressed }) => [
                    styles.modalQuestionItem,
                    pressed && styles.itemPressed,
                    currentQuestion.questionKey === item.questionKey && styles.modalItemSelected,
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={item.questionText}
                >
                  <Text
                    style={[
                      styles.modalQuestionText,
                      currentQuestion.questionKey === item.questionKey && styles.modalQuestionTextActive,
                    ]}
                  >
                    {item.questionText}
                  </Text>
                  {currentQuestion.questionKey === item.questionKey && (
                    <CheckIcon size={18} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  secureHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF4FF',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  secureBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  advisoryCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF4FF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  advisoryIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DCE7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisoryContent: {
    flex: 1,
  },
  advisoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  advisorySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  stepperContainer: {
    paddingVertical: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepCircleInactive: {
    backgroundColor: '#EAECF0',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepNumberInactive: {
    color: colors.textMuted,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#EAECF0',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  stepIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  formSectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: -6,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FECDCA',
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.danger,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  requiredAsterisk: {
    color: colors.danger,
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownIcon: {
    marginRight: 10,
  },
  dropdownText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  eyeToggle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adviceCallout: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    alignItems: 'flex-start',
  },
  adviceText: {
    flex: 1,
    fontSize: 12,
    color: '#026AA2',
    lineHeight: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  successSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  modalCloseButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  modalList: {
    marginTop: 10,
  },
  modalQuestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemPressed: {
    backgroundColor: '#F8FAFC',
  },
  modalItemSelected: {
    backgroundColor: '#EFF4FF',
    borderRadius: 10,
  },
  modalQuestionText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  modalQuestionTextActive: {
    fontWeight: '700',
    color: colors.primary,
  },
});
