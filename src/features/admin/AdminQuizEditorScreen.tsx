import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { dirRow } from '@/lib/rtl';
import { Text } from '@/components/ui/Text';
import { selectTheme } from '@/features/themeSlice';
import { useAppSelector } from '@/lib/hooks';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigations';
import { QuizApi } from '@/lib/services/QuizApi';
import { Quiz, QuizQuestion, QuizOption, QuizQuestionType } from '@/lib/models';
import Toast from 'react-native-toast-message';
import { PlusIcon, Trash2Icon, SaveIcon, ArrowLeft } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminQuizEditor'>;

// We use partial types for editing state
type EditOption = {
  id?: string;
  labelFr: string;
  isCorrect: boolean;
  explanationFr?: string;
  sortOrder: number;
};

type EditQuestion = {
  id?: string;
  questionFr: string;
  type: QuizQuestionType;
  sortOrder: number;
  options: EditOption[];
};

export default function AdminQuizEditorScreen({ route, navigation }: Props) {
  const { lessonId, title } = route.params;
  const theme = useAppSelector(selectTheme);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<EditQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [lessonId]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const q = await QuizApi.getAdminQuizForLesson(lessonId);
      if (q) {
        setQuizId(q.id);
        setQuestions(
          q.questions.map(question => ({
            id: question.id,
            questionFr: question.questionFr || '',
            type: question.type,
            sortOrder: question.sortOrder,
            options: question.options.map(o => ({
              id: o.id,
              labelFr: o.labelFr || '',
              isCorrect: !!o.isCorrect,
              explanationFr: o.explanationFr || '',
              sortOrder: o.sortOrder,
            })),
          })),
        );
      }
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'Failed to load quiz' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionFr: '',
        type: 'SINGLE',
        sortOrder: questions.length,
        options: [
          { labelFr: '', isCorrect: false, sortOrder: 0 },
          { labelFr: '', isCorrect: false, sortOrder: 1 },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQ = [...questions];
    newQ.splice(index, 1);
    setQuestions(newQ);
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQ = [...questions];
    (newQ[index] as any)[field] = value;
    setQuestions(newQ);
  };

  const handleAddOption = (qIndex: number) => {
    const newQ = [...questions];
    newQ[qIndex].options.push({
      labelFr: '',
      isCorrect: false,
      sortOrder: newQ[qIndex].options.length,
    });
    setQuestions(newQ);
  };

  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    const newQ = [...questions];
    newQ[qIndex].options.splice(oIndex, 1);
    setQuestions(newQ);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, field: string, value: any) => {
    const newQ = [...questions];
    (newQ[qIndex].options[oIndex] as any)[field] = value;
    
    // If SINGLE type and setting this to correct, unset others
    if (field === 'isCorrect' && value === true && newQ[qIndex].type === 'SINGLE') {
      newQ[qIndex].options.forEach((opt, idx) => {
        if (idx !== oIndex) opt.isCorrect = false;
      });
    }
    
    setQuestions(newQ);
  };

  const handleSave = async () => {
    // Validate
    if (questions.length === 0) {
      Alert.alert('Error', 'Add at least one question');
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionFr.trim()) {
        Alert.alert('Error', `Question ${i + 1} text is empty`);
        return;
      }
      if (q.options.length < 2) {
        Alert.alert('Error', `Question ${i + 1} must have at least 2 options`);
        return;
      }
      let hasCorrect = false;
      for (let j = 0; j < q.options.length; j++) {
        const o = q.options[j];
        if (!o.labelFr.trim()) {
          Alert.alert('Error', `Option in Question ${i + 1} is empty`);
          return;
        }
        if (o.isCorrect) hasCorrect = true;
      }
      if (!hasCorrect) {
        Alert.alert('Error', `Question ${i + 1} must have at least 1 correct option`);
        return;
      }
    }

    setSaving(true);
    try {
      if (quizId) {
        await QuizApi.updateQuiz(quizId, questions);
      } else {
        await QuizApi.createQuiz(lessonId, questions);
      }
      Toast.show({ type: 'success', text1: 'Quiz saved successfully' });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuiz = () => {
    if (!quizId) return;
    Alert.alert('Delete Quiz', 'Are you sure you want to delete this quiz?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await QuizApi.deleteQuiz(quizId);
            Toast.show({ type: 'success', text1: 'Quiz deleted' });
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Error', e.message);
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Manage Quiz</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.muted }]}>{title}</Text>
        </View>
        <View style={styles.headerActions}>
          {quizId && (
            <TouchableOpacity onPress={handleDeleteQuiz} style={[styles.iconButton, { backgroundColor: '#ef444420' }]}>
              <Trash2Icon size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <SaveIcon size={18} color="#fff" />}
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {questions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ color: theme.colors.muted, textAlign: 'center', marginBottom: 20 }}>
              No questions added yet.
            </Text>
          </View>
        ) : (
          questions.map((q, qIndex) => (
            <View key={qIndex} style={[styles.questionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.questionHeader}>
                <Text style={[styles.questionLabel, { color: theme.colors.text }]}>Question {qIndex + 1}</Text>
                <TouchableOpacity onPress={() => handleRemoveQuestion(qIndex)} style={styles.removeBtn}>
                  <Trash2Icon size={16} color={theme.colors.error} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                value={q.questionFr}
                onChangeText={(val) => handleQuestionChange(qIndex, 'questionFr', val)}
                placeholder="Question text..."
                placeholderTextColor={theme.colors.muted}
                multiline
              />

              <View style={styles.optionsSection}>
                <Text style={[styles.optionsLabel, { color: theme.colors.text }]}>Options</Text>
                {q.options.map((opt, oIndex) => (
                  <View key={oIndex} style={styles.optionRow}>
                    <TouchableOpacity
                      style={[styles.correctToggle, { borderColor: theme.colors.border, backgroundColor: opt.isCorrect ? theme.colors.success + '20' : 'transparent' }]}
                      onPress={() => handleOptionChange(qIndex, oIndex, 'isCorrect', !opt.isCorrect)}
                    >
                      <View style={[styles.checkbox, { borderColor: opt.isCorrect ? theme.colors.success : theme.colors.border, backgroundColor: opt.isCorrect ? theme.colors.success : 'transparent' }]} />
                    </TouchableOpacity>
                    
                    <View style={styles.optionInputs}>
                      <TextInput
                        style={[styles.input, styles.optionInput, { color: theme.colors.text, borderColor: theme.colors.border, flex: 1 }]}
                        value={opt.labelFr}
                        onChangeText={(val) => handleOptionChange(qIndex, oIndex, 'labelFr', val)}
                        placeholder="Option text..."
                        placeholderTextColor={theme.colors.muted}
                      />
                      {!opt.isCorrect && (
                        <TextInput
                          style={[styles.input, styles.explanationInput, { color: theme.colors.muted, borderColor: theme.colors.border }]}
                          value={opt.explanationFr || ''}
                          onChangeText={(val) => handleOptionChange(qIndex, oIndex, 'explanationFr', val)}
                          placeholder="Explanation (optional)..."
                          placeholderTextColor={theme.colors.muted}
                        />
                      )}
                    </View>

                    <TouchableOpacity onPress={() => handleRemoveOption(qIndex, oIndex)} style={styles.removeOptionBtn}>
                      <XIcon size={16} color={theme.colors.muted} />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity onPress={() => handleAddOption(qIndex)} style={styles.addOptionBtn}>
                  <PlusIcon size={14} color={theme.colors.primary} />
                  <Text style={[styles.addOptionText, { color: theme.colors.primary }]}>Add Option</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity onPress={handleAddQuestion} style={[styles.addQuestionBtn, { borderColor: theme.colors.primary, borderStyle: 'dashed' }]}>
          <PlusIcon size={20} color={theme.colors.primary} />
          <Text style={[styles.addQuestionText, { color: theme.colors.primary }]}>Add Question</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Need a simple XIcon for remove option
const XIcon = ({ size, color }: { size: number; color: string }) => (
  <Text style={{ fontSize: size, color }}>✕</Text>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: dirRow(),
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: dirRow(), gap: 10 },
  iconButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  saveButton: { flexDirection: dirRow(), alignItems: 'center', paddingHorizontal: 16, height: 36, borderRadius: 18, gap: 6 },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  emptyState: { paddingVertical: 40 },
  questionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  questionHeader: { flexDirection: dirRow(), justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  questionLabel: { fontSize: 16, fontWeight: '600' },
  removeBtn: { padding: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  optionsSection: { marginTop: 16 },
  optionsLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  optionRow: { flexDirection: dirRow(), alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  correctToggle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  checkbox: { width: 16, height: 16, borderRadius: 8, borderWidth: 1 },
  optionInputs: { flex: 1, gap: 6 },
  optionInput: { flex: 1 },
  explanationInput: { fontSize: 13, fontStyle: 'italic', paddingVertical: 8 },
  removeOptionBtn: { padding: 10, marginTop: 2 },
  addOptionBtn: { flexDirection: dirRow(), alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 6, gap: 4 },
  addOptionText: { fontWeight: '600', fontSize: 14 },
  addQuestionBtn: {
    flexDirection: dirRow(),
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  addQuestionText: { fontSize: 16, fontWeight: '600' },
});
