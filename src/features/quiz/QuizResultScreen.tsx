import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Text } from '@/components/ui/Text';
import { selectTheme } from '@/features/themeSlice';
import { useAppSelector } from '@/lib/hooks';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigations';
import { CheckCircle, XCircle, RotateCcw, ArrowLeft } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'QuizResultScreen'>;

export default function QuizResultScreen({ route, navigation }: Props) {
  const { result, lesson } = route.params;
  const theme = useAppSelector(selectTheme);

  const handleRetry = () => {
    navigation.replace('QuizScreen', { lesson, quizId: result.attemptId }); // Re-fetch quiz logic handles id
  };

  const handleBackToLesson = () => {
    // Go back to the lesson or course list
    navigation.goBack();
  };

  const isPassing = result.passed;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          {isPassing ? (
            <CheckCircle size={80} color={theme.colors.success} />
          ) : (
            <XCircle size={80} color={theme.colors.error} />
          )}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {isPassing ? 'Great Job!' : 'Keep Practicing'}
          </Text>
          <Text style={[styles.scoreText, { color: theme.colors.text }]}>
            You scored {result.correctCount} out of {result.totalCount} ({result.scorePercent}%)
          </Text>
        </View>

        {result.resurface && (
          <View style={[styles.resurfaceCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.resurfaceText, { color: theme.colors.muted }]}>
              We'll remind you to review this lesson in a few days to help you master it.
            </Text>
          </View>
        )}

        <View style={styles.feedbackContainer}>
           <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>Review your answers:</Text>
           {result.feedback.map((f: any, index: number) => (
             <View key={index} style={[styles.feedbackItem, { borderBottomColor: theme.colors.border }]}>
               <Text style={[styles.questionText, { color: theme.colors.text }]}>
                 {index + 1}. {f.question}
               </Text>
               <View style={styles.feedbackResultRow}>
                 {f.isCorrect ? (
                    <Text style={{ color: theme.colors.success, fontWeight: 'bold' }}>Correct</Text>
                 ) : (
                    <Text style={{ color: theme.colors.error, fontWeight: 'bold' }}>Incorrect</Text>
                 )}
               </View>
               {!f.isCorrect && f.explanation && (
                 <Text style={[styles.explanationText, { color: theme.colors.muted }]}>
                   💡 {f.explanation}
                 </Text>
               )}
             </View>
           ))}
        </View>

      </View>

      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.primary }]}
          onPress={handleRetry}>
          <RotateCcw size={20} color={theme.colors.primary} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Retry Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleBackToLesson}>
          <ArrowLeft size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: '#fff' }]}>Back to Lesson</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 18,
  },
  resurfaceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  resurfaceText: {
    fontSize: 14,
    textAlign: 'center',
  },
  feedbackContainer: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  feedbackItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  questionText: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  feedbackResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
