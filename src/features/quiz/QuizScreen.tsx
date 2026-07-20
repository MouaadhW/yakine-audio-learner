import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { Text } from '@/components/ui/Text';
import { selectTheme } from '@/features/themeSlice';
import { useAppSelector } from '@/lib/hooks';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigations';
import { QuizApi } from '@/lib/services/QuizApi';
import { Quiz, QuizQuestion, QuizOption } from '@/lib/models';
import Toast from 'react-native-toast-message';
import { X } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import React, { useState, useEffect, useRef } from 'react';

type Props = NativeStackScreenProps<RootStackParamList, 'QuizScreen'>;

export default function QuizScreen({ route, navigation }: Props) {
  const { lesson } = route.params;
  const theme = useAppSelector(selectTheme);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  // We use lesson.defaultAudioLanguage to pick the quiz language
  const lang = lesson.defaultAudioLanguage ? lesson.defaultAudioLanguage.toLowerCase() : 'fr';

  const { data: quiz, isLoading: loading } = useQuery({
    queryKey: ['quiz', lesson.id, lang],
    queryFn: () => QuizApi.getQuizForLesson(lesson.id, lang),
    staleTime: 10 * 60 * 1000, // cache for 10 mins
  });

  const handleClose = () => {
    navigation.goBack();
  };

  const toggleOption = (questionId: string, optionId: string, isMultiple: boolean) => {
    setSelectedOptionIds((prev) => {
      const currentSelected = prev[questionId] || [];
      if (isMultiple) {
        if (currentSelected.includes(optionId)) {
          return { ...prev, [questionId]: currentSelected.filter((id) => id !== optionId) };
        } else {
          return { ...prev, [questionId]: [...currentSelected, optionId] };
        }
      } else {
        return { ...prev, [questionId]: [optionId] };
      }
    });
  };

  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      const answers = quiz.questions.map((q) => ({
        questionId: q.id,
        selectedOptionIds: selectedOptionIds[q.id] || [],
      }));

      const result = await QuizApi.submitAttempt(lesson.id, answers, lang);
      navigation.replace('QuizResultScreen', { result, lesson });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to submit quiz' });
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>No questions available for this quiz.</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={handleClose}>
          <Text style={{ color: theme.colors.primary }}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const question = quiz.questions[currentQuestionIndex];
  const isMultiple = question.type === 'MULTIPLE';
  const currentSelected = selectedOptionIds[question.id] || [];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  // Calculate progress
  const progressPercent = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </Text>
        <View style={{ width: 24 }} /> {/* Spacer */}
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: `${progressPercent}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.questionText, { color: theme.colors.text }]}>
          {question.question}
        </Text>
        {isMultiple && (
          <Text style={[styles.hintText, { color: theme.colors.muted }]}>
            Select all that apply
          </Text>
        )}

        <View style={styles.optionsContainer}>
          {question.options.map((option) => {
            const isSelected = currentSelected.includes(option.id);
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
                  isSelected && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '10' },
                ]}
                onPress={() => toggleOption(question.id, option.id, isMultiple)}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: theme.colors.border, borderRadius: isMultiple ? 4 : 12 },
                  isSelected && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary }
                ]} />
                <Text style={[styles.optionText, { color: theme.colors.text }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.footerButton, { opacity: currentQuestionIndex === 0 ? 0 : 1 }]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <Text style={[styles.footerButtonText, { color: theme.colors.text }]}>Previous</Text>
        </TouchableOpacity>

        {isLastQuestion ? (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.colors.primary, opacity: submitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Quiz</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 14,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  footerButton: {
    padding: 12,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    minWidth: 140,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
