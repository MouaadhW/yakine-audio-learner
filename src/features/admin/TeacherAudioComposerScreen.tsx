import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MicIcon,
  SquareIcon,
  UploadIcon,
  WandSparklesIcon,
  RefreshCcwIcon,
} from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { selectTheme } from '@/features/themeSlice';
import { selectAuthUser } from '@/features/auth/authSlice';
import { useAppSelector } from '@/lib/hooks';
import {
  attachTeacherComposerManualAudio,
  cancelTeacherComposerAiJob,
  ComposerGenerationJob,
  ComposerLanguage,
  createTeacherComposerLesson,
  enqueueTeacherComposerAiGeneration,
  getChaptersBySubject,
  getSubjects,
  getTeacherComposerAiJob,
  retryTeacherComposerAiJob,
  uploadAudioFile,
  uploadTranscriptDocument,
} from '@/lib/services/BacApi';
import { RootStackParamList } from '@/navigations';

const LANGUAGES: ComposerLanguage[] = ['EN', 'FR', 'AR'];

const VOICE_CATALOG: Record<ComposerLanguage, Array<{ id: string; label: string }>> = {
  EN: [
    { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Rachel' },
    { id: 'pNInz6obpgDQGcFmaJgB', label: 'Adam' },
  ],
  FR: [
    { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Rachel (Multilingual)' },
    { id: 'ThT5KcBeYPX3keUQqHPh', label: 'Dorothy' },
  ],
  AR: [
    { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Rachel (Multilingual)' },
    { id: 'XB0fDUnXU5powFXDhCwa', label: 'Charlotte' },
  ],
};

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherAudioComposer'>;
type ComposerMode = 'MANUAL_UPLOAD' | 'MANUAL_RECORDING' | 'AI_TTS';

function formatRecordingTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

const TeacherAudioComposerScreen = ({ route, navigation }: Props) => {
  const { colors } = useAppSelector(selectTheme);
  const user = useAppSelector(selectAuthUser);
  const queryClient = useQueryClient();

  const [titleEn, setTitleEn] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [audience, setAudience] = useState<'FREE' | 'PREMIUM'>('FREE');
  const [defaultAudioLanguage, setDefaultAudioLanguage] = useState<ComposerLanguage>('FR');

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState(route.params?.chapterId ?? '');

  const [transcriptLanguageTab, setTranscriptLanguageTab] = useState<ComposerLanguage>('FR');
  const [transcripts, setTranscripts] = useState<Record<ComposerLanguage, string>>({
    EN: '',
    FR: '',
    AR: '',
  });

  const [mode, setMode] = useState<ComposerMode>('MANUAL_UPLOAD');
  const [manualLanguage, setManualLanguage] = useState<ComposerLanguage>('FR');
  const [manualAudioUrl, setManualAudioUrl] = useState('');

  const [selectedAiLanguages, setSelectedAiLanguages] = useState<ComposerLanguage[]>(['FR']);
  const [voiceSelection, setVoiceSelection] = useState<Record<ComposerLanguage, string>>({
    EN: VOICE_CATALOG.EN[0].id,
    FR: VOICE_CATALOG.FR[0].id,
    AR: VOICE_CATALOG.AR[0].id,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingTranscript, setIsUploadingTranscript] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMs, setRecordingMs] = useState(0);

  const [jobState, setJobState] = useState<ComposerGenerationJob | null>(null);
  const [pollingJobId, setPollingJobId] = useState<string | null>(null);

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: ({ signal }) => getSubjects(signal),
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters-by-subject', selectedSubjectId],
    enabled: !!selectedSubjectId,
    queryFn: ({ signal }) => getChaptersBySubject(selectedSubjectId, signal),
  });

  const selectedChapter = useMemo(
    () => chapters.find(ch => ch.id === selectedChapterId),
    [chapters, selectedChapterId],
  );

  const hasAnyTranscript = useMemo(
    () => LANGUAGES.some(language => transcripts[language].trim().length > 0),
    [transcripts],
  );

  useEffect(() => {
    if (!pollingJobId) {
      return;
    }

    let alive = true;

    const poll = async () => {
      try {
        const latest = await getTeacherComposerAiJob(pollingJobId);
        if (!alive) return;
        setJobState(latest);

        if (latest.status === 'COMPLETED' || latest.status === 'FAILED' || latest.status === 'CANCELED') {
          setPollingJobId(null);
          if (latest.status === 'COMPLETED') {
            await queryClient.invalidateQueries({ queryKey: ['/api/lessons', selectedChapterId] });
            Alert.alert('Audio Ready', 'AI audio generation completed and lesson is now published.');
          }
        }
      } catch {
        // Keep polling until terminal state or manual cancel.
      }
    };

    void poll();
    const pollTimer = setInterval(() => {
      void poll();
    }, 4000);

    return () => {
      alive = false;
      clearInterval(pollTimer);
    };
  }, [pollingJobId, queryClient, selectedChapterId]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (recordingRef.current) {
        void recordingRef.current.stopAndUnloadAsync().catch(() => undefined);
      }
    };
  }, []);

  const toggleAiLanguage = useCallback((language: ComposerLanguage) => {
    setSelectedAiLanguages(current => {
      if (current.includes(language)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter(item => item !== language);
      }
      return [...current, language];
    });
  }, []);

  const handleUploadTranscript = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/plain',
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const file = result.assets[0];
      setIsUploadingTranscript(true);

      const parsed = await uploadTranscriptDocument(
        file.uri,
        file.name ?? 'transcript.txt',
        file.mimeType ?? 'application/octet-stream',
      );

      setTranscripts(prev => ({
        ...prev,
        [transcriptLanguageTab]: parsed.text,
      }));

      Alert.alert(
        'Transcript Imported',
        `Loaded ${parsed.characterCount} characters into ${transcriptLanguageTab}.`,
      );
    } catch (error: any) {
      Alert.alert('Transcript Upload Failed', error?.message ?? 'Failed to parse transcript document.');
    } finally {
      setIsUploadingTranscript(false);
    }
  }, [transcriptLanguageTab]);

  const handleUploadManualAudio = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const file = result.assets[0];
      setIsUploadingAudio(true);

      const upload = await uploadAudioFile(
        file.uri,
        file.name ?? 'audio.mp3',
        file.mimeType ?? 'audio/mpeg',
      );

      setManualAudioUrl(upload.publicUrl);
      if (mode !== 'MANUAL_UPLOAD') {
        setMode('MANUAL_UPLOAD');
      }

      Alert.alert('Audio Uploaded', 'Manual audio file uploaded successfully.');
    } catch (error: any) {
      Alert.alert('Audio Upload Failed', error?.message ?? 'Failed to upload audio.');
    } finally {
      setIsUploadingAudio(false);
    }
  }, [mode]);

  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Microphone Permission Required', 'Please allow microphone access to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setRecordingMs(0);
      setIsRecording(true);

      recordingTimerRef.current = setInterval(async () => {
        if (!recordingRef.current) {
          return;
        }
        const status = await recordingRef.current.getStatusAsync();
        if (status.isRecording && typeof status.durationMillis === 'number') {
          setRecordingMs(status.durationMillis);
        }
      }, 500);
    } catch (error: any) {
      Alert.alert('Recording Error', error?.message ?? 'Could not start recording.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      const recording = recordingRef.current;
      if (!recording) {
        return;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      recordingRef.current = null;
      recordingTimerRef.current = null;
      setIsRecording(false);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (!uri) {
        Alert.alert('Recording Error', 'No recording file was produced.');
        return;
      }

      setIsUploadingAudio(true);
      const upload = await uploadAudioFile(
        uri,
        `recording-${Date.now()}.m4a`,
        'audio/mp4',
      );
      setManualAudioUrl(upload.publicUrl);
      setMode('MANUAL_RECORDING');
      Alert.alert('Recording Uploaded', 'Recorded audio has been uploaded and is ready to publish.');
    } catch (error: any) {
      Alert.alert('Recording Error', error?.message ?? 'Could not stop or upload recording.');
    } finally {
      setIsUploadingAudio(false);
    }
  }, []);

  const submitComposer = useCallback(async () => {
    if (!isTeacherOrAdmin) {
      Alert.alert('Access denied', 'Only teachers and admins can use the composer.');
      return;
    }

    if (!titleEn.trim() || !titleFr.trim()) {
      Alert.alert('Missing fields', 'English and French titles are required.');
      return;
    }

    if (!selectedChapterId) {
      Alert.alert('Missing chapter', 'Please select a chapter for this lesson.');
      return;
    }

    if (!hasAnyTranscript) {
      Alert.alert('Missing transcript', 'Provide at least one transcript language before publishing.');
      return;
    }

    if (mode !== 'AI_TTS' && !manualAudioUrl) {
      Alert.alert('Missing audio', 'Upload or record audio before publishing manually.');
      return;
    }

    if (mode === 'AI_TTS' && !selectedAiLanguages.length) {
      Alert.alert('Missing AI languages', 'Select at least one language to generate.');
      return;
    }

    if (mode === 'AI_TTS') {
      const missingLanguage = selectedAiLanguages.find(language => !transcripts[language].trim());
      if (missingLanguage) {
        Alert.alert('Missing transcript', `Transcript is required for ${missingLanguage} AI generation.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const draft = await createTeacherComposerLesson({
        chapterId: selectedChapterId,
        titleEn: titleEn.trim(),
        titleFr: titleFr.trim(),
        audience,
        defaultAudioLanguage,
        autoPublish: true,
        transcripts: {
          EN: transcripts.EN.trim() || undefined,
          FR: transcripts.FR.trim() || undefined,
          AR: transcripts.AR.trim() || undefined,
        },
        scripts: {
          EN: transcripts.EN.trim() || undefined,
          FR: transcripts.FR.trim() || undefined,
          AR: transcripts.AR.trim() || undefined,
        },
      });

      if (mode === 'AI_TTS') {
        const voicePayload: Partial<Record<ComposerLanguage, string>> = {};
        selectedAiLanguages.forEach(language => {
          voicePayload[language] = voiceSelection[language];
        });

        const queued = await enqueueTeacherComposerAiGeneration(draft.id, {
          languages: selectedAiLanguages,
          voiceSelection: voicePayload,
          autoPublish: true,
        });

        setJobState(queued.job);
        setPollingJobId(queued.job.id);
        Alert.alert('Generation Started', 'AI generation has started. This screen will keep polling status.');
      } else {
        await attachTeacherComposerManualAudio(draft.id, {
          audioUrl: manualAudioUrl,
          language: manualLanguage,
          sourceType: mode,
          script: transcripts[manualLanguage].trim() || undefined,
        });

        await queryClient.invalidateQueries({ queryKey: ['/api/lessons', selectedChapterId] });
        Alert.alert('Published', 'Manual audio lesson was published successfully.');
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Composer Error', error?.message ?? 'Failed to complete composer workflow.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    audience,
    defaultAudioLanguage,
    hasAnyTranscript,
    isTeacherOrAdmin,
    manualAudioUrl,
    manualLanguage,
    mode,
    navigation,
    queryClient,
    selectedAiLanguages,
    selectedChapterId,
    titleEn,
    titleFr,
    transcripts,
    voiceSelection,
  ]);

  const retryCurrentJob = useCallback(async () => {
    if (!jobState) return;
    try {
      const retried = await retryTeacherComposerAiJob(jobState.id);
      setJobState(retried);
      setPollingJobId(retried.id);
    } catch (error: any) {
      Alert.alert('Retry Failed', error?.message ?? 'Could not retry the AI job.');
    }
  }, [jobState]);

  const cancelCurrentJob = useCallback(async () => {
    if (!jobState) return;
    try {
      const canceled = await cancelTeacherComposerAiJob(jobState.id);
      setJobState(canceled);
      setPollingJobId(null);
    } catch (error: any) {
      Alert.alert('Cancel Failed', error?.message ?? 'Could not cancel the AI job.');
    }
  }, [jobState]);

  if (!isTeacherOrAdmin) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, textAlign: 'center', fontSize: 15 }}>
          This feature is available only for teachers and admins.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.header, { color: colors.text }]}>Teacher Audio Composer</Text>
        <Text style={[styles.subheader, { color: colors.muted }]}>Create from transcript, then publish with manual audio or AI TTS.</Text>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Lesson Basics</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
            placeholder="Title (English)"
            placeholderTextColor={colors.muted}
            value={titleEn}
            onChangeText={setTitleEn}
          />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
            placeholder="Title (French)"
            placeholderTextColor={colors.muted}
            value={titleFr}
            onChangeText={setTitleFr}
          />

          <Text style={[styles.label, { color: colors.muted }]}>Audience</Text>
          <View style={styles.rowWrap}>
            {(['FREE', 'PREMIUM'] as const).map(value => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: audience === value ? colors.primary : colors.inputBackground,
                    borderColor: audience === value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setAudience(value)}>
                <Text style={{ color: audience === value ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>Default Audio Language</Text>
          <View style={styles.rowWrap}>
            {LANGUAGES.map(value => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: defaultAudioLanguage === value ? colors.primary : colors.inputBackground,
                    borderColor: defaultAudioLanguage === value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setDefaultAudioLanguage(value)}>
                <Text style={{ color: defaultAudioLanguage === value ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {!!route.params?.chapterId ? (
            <Text style={[styles.inlineInfo, { color: colors.muted }]}>Using chapter from current lesson list context.</Text>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.muted }]}>Subject</Text>
              <View style={styles.rowWrap}>
                {subjects.map(subject => (
                  <TouchableOpacity
                    key={subject.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selectedSubjectId === subject.id ? colors.primary : colors.inputBackground,
                        borderColor: selectedSubjectId === subject.id ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedSubjectId(subject.id);
                      setSelectedChapterId('');
                    }}>
                    <Text style={{ color: selectedSubjectId === subject.id ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>
                      {subject.nameEn}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!!selectedSubjectId && (
                <>
                  <Text style={[styles.label, { color: colors.muted }]}>Chapter</Text>
                  <View style={styles.rowWrap}>
                    {chapters.map(chapter => (
                      <TouchableOpacity
                        key={chapter.id}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selectedChapterId === chapter.id ? colors.primary : colors.inputBackground,
                            borderColor: selectedChapterId === chapter.id ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => setSelectedChapterId(chapter.id)}>
                        <Text style={{ color: selectedChapterId === chapter.id ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>
                          {chapter.nameEn}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </>
          )}

          {!!selectedChapter && (
            <Text style={[styles.inlineInfo, { color: colors.muted }]}>Selected chapter: {selectedChapter.nameEn}</Text>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Transcript</Text>
          <View style={styles.rowWrap}>
            {LANGUAGES.map(language => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.chip,
                  {
                    backgroundColor: transcriptLanguageTab === language ? colors.primary : colors.inputBackground,
                    borderColor: transcriptLanguageTab === language ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setTranscriptLanguageTab(language)}>
                <Text style={{ color: transcriptLanguageTab === language ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>{language}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            multiline
            style={[
              styles.textArea,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground },
            ]}
            placeholder={`Transcript (${transcriptLanguageTab})`}
            placeholderTextColor={colors.muted}
            value={transcripts[transcriptLanguageTab]}
            onChangeText={text =>
              setTranscripts(prev => ({
                ...prev,
                [transcriptLanguageTab]: text,
              }))
            }
          />

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleUploadTranscript}
            disabled={isUploadingTranscript}
            activeOpacity={0.8}>
            <UploadIcon size={16} color="#fff" />
            <Text style={styles.actionButtonText}>{isUploadingTranscript ? 'Importing...' : `Import ${transcriptLanguageTab} from TXT/PDF/DOCX`}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Audio Method</Text>
          <View style={styles.rowWrap}>
            {([
              { key: 'MANUAL_UPLOAD', label: 'Upload Audio' },
              { key: 'MANUAL_RECORDING', label: 'Record In App' },
              { key: 'AI_TTS', label: 'AI from Text' },
            ] as const).map(item => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.chip,
                  {
                    backgroundColor: mode === item.key ? colors.primary : colors.inputBackground,
                    borderColor: mode === item.key ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setMode(item.key)}>
                <Text style={{ color: mode === item.key ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode !== 'AI_TTS' && (
            <>
              <Text style={[styles.label, { color: colors.muted }]}>Manual Audio Language</Text>
              <View style={styles.rowWrap}>
                {LANGUAGES.map(language => (
                  <TouchableOpacity
                    key={language}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: manualLanguage === language ? colors.primary : colors.inputBackground,
                        borderColor: manualLanguage === language ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setManualLanguage(language)}>
                    <Text style={{ color: manualLanguage === language ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>{language}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleUploadManualAudio}
                disabled={isUploadingAudio || isRecording}
                activeOpacity={0.8}>
                <UploadIcon size={16} color="#fff" />
                <Text style={styles.actionButtonText}>{isUploadingAudio ? 'Uploading...' : 'Upload Existing Audio'}</Text>
              </TouchableOpacity>

              <View style={styles.recordingRow}>
                {!isRecording ? (
                  <TouchableOpacity
                    style={[styles.recordingButton, { backgroundColor: '#ef4444' }]}
                    onPress={startRecording}
                    disabled={isUploadingAudio}
                    activeOpacity={0.85}>
                    <MicIcon size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Start Recording</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.recordingButton, { backgroundColor: '#ef4444' }]}
                    onPress={stopRecording}
                    activeOpacity={0.85}>
                    <SquareIcon size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Stop ({formatRecordingTime(recordingMs)})</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!!manualAudioUrl && (
                <Text style={[styles.inlineInfo, { color: colors.muted }]} numberOfLines={1}>
                  Audio ready: {manualAudioUrl}
                </Text>
              )}
            </>
          )}

          {mode === 'AI_TTS' && (
            <>
              <Text style={[styles.label, { color: colors.muted }]}>Generate Languages</Text>
              <View style={styles.rowWrap}>
                {LANGUAGES.map(language => {
                  const selected = selectedAiLanguages.includes(language);
                  return (
                    <TouchableOpacity
                      key={language}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? colors.primary : colors.inputBackground,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => toggleAiLanguage(language)}>
                      <Text style={{ color: selected ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>{language}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedAiLanguages.map(language => (
                <View key={language} style={{ marginTop: 8 }}>
                  <Text style={[styles.label, { color: colors.muted }]}>{language} Voice</Text>
                  <View style={styles.rowWrap}>
                    {VOICE_CATALOG[language].map(voice => (
                      <TouchableOpacity
                        key={voice.id}
                        style={[
                          styles.chip,
                          {
                            backgroundColor:
                              voiceSelection[language] === voice.id ? colors.primary : colors.inputBackground,
                            borderColor:
                              voiceSelection[language] === voice.id ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() =>
                          setVoiceSelection(prev => ({
                            ...prev,
                            [language]: voice.id,
                          }))
                        }>
                        <Text style={{ color: voiceSelection[language] === voice.id ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>
                          {voice.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              {jobState && (
                <View style={[styles.jobCard, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                  <Text style={[styles.jobTitle, { color: colors.text }]}>Latest AI Job</Text>
                  <Text style={{ color: colors.muted }}>Status: {jobState.status}</Text>
                  {jobState.errorMessage ? (
                    <Text style={{ color: '#ef4444', marginTop: 4 }}>{jobState.errorMessage}</Text>
                  ) : null}
                  <View style={[styles.rowWrap, { marginTop: 8 }]}>
                    <TouchableOpacity
                      style={[styles.smallAction, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={retryCurrentJob}
                      disabled={jobState.status === 'PROCESSING'}>
                      <RefreshCcwIcon size={14} color={colors.text} />
                      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallAction, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={cancelCurrentJob}
                      disabled={jobState.status === 'COMPLETED' || jobState.status === 'CANCELED'}>
                      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.publishButton, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }]}
          onPress={submitComposer}
          disabled={isSubmitting}
          activeOpacity={0.85}>
          <WandSparklesIcon size={18} color="#fff" />
          <Text style={styles.publishText}>{isSubmitting ? 'Publishing...' : 'Create and Publish'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  header: { fontSize: 24, fontWeight: '700' },
  subheader: { fontSize: 13, lineHeight: 18 },
  section: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '600' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  actionButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingRow: { flexDirection: 'row', alignItems: 'center' },
  actionButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  inlineInfo: { fontSize: 12 },
  publishButton: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  publishText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  jobCard: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  jobTitle: { fontSize: 13, fontWeight: '700' },
  smallAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
});

export default TeacherAudioComposerScreen;
