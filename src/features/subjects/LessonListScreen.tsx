import { Text } from '@/components/ui/Text';
import { Loading } from '@/components/ui/Loading';
import { ErrorView } from '@/components/ui/ErrorView';
import { FAB } from '@/components/ui/FAB';
import { AdminFormModal, FormField } from '@/components/ui/AdminFormModal';
import { selectTheme } from '@/features/themeSlice';
import { selectAuthUser } from '@/features/auth/authSlice';
import { useAppSelector } from '@/lib/hooks';
import { BACLesson } from '@/lib/models';
import { downloadLessonAudio, isDownloadAvailable } from '@/lib/audio/downloadService';
import {
  getLessonsByChapter,
  createLesson,
  updateLesson,
  deleteLesson,
  getProgress,
} from '@/lib/services/BacApi';
import { ProgressEntry } from '@/lib/models';
import {
  getAllLessonDownloadMetadata,
  upsertLessonDownloadMetadata,
} from '@/lib/storage/downloadMetadata';
import { RootStackParamList } from '@/navigations';
import {
  CheckCircleIcon,
  DownloadIcon,
  LockIcon,
  PencilIcon,
  PlayCircleIcon,
  Trash2Icon,
  UploadIcon,
  WandSparklesIcon,
} from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { uploadAudioFile } from '@/lib/services/BacApi';

type Props = NativeStackScreenProps<RootStackParamList, 'LessonList'>;
const PROGRESS_UPDATE_BUCKETS = 20;

const lessonFields: FormField[] = [
  { key: 'titleEn', label: 'Title (English)', required: true },
  { key: 'titleFr', label: 'Title (French)', required: true },
  { key: 'audioUrl', label: 'Audio URL' },
  { key: 'scriptEn', label: 'Script (English)', multiline: true },
  { key: 'scriptFr', label: 'Script (French)', multiline: true },
  { key: 'duration', label: 'Duration (seconds)', keyboardType: 'numeric' },
  { key: 'sortOrder', label: 'Sort Order', keyboardType: 'numeric' },
  {
    key: 'audience',
    label: 'Access',
    options: [
      { value: 'FREE', label: 'Free (all eligible students)' },
      { value: 'PREMIUM', label: 'Paid (premium subscribers only)' },
    ],
  },
];

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const LessonListScreen = ({ route, navigation }: Props) => {
  const { chapterId } = route.params;
  const { colors } = useAppSelector(selectTheme);
  const user = useAppSelector(selectAuthUser);
  const { i18n, t } = useTranslation();
  const isFr = i18n.language === 'fr';
  const queryClient = useQueryClient();
  const [downloadMap, setDownloadMap] = useState(getAllLessonDownloadMetadata());

  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const canAdd = isAdmin || isTeacher;

  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<BACLesson | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: apiLessons, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/lessons', chapterId],
    queryFn: ({ signal }) => getLessonsByChapter(chapterId, signal),
    placeholderData: [],
  });

  // Fetch user progress so we can show the completed badge
  const { data: progressList } = useQuery({
    queryKey: ['progress'],
    queryFn: ({ signal }) => getProgress(signal),
    staleTime: 60 * 1000,
  });

  const progressMap = useMemo(() => {
    const map = new Map<string, ProgressEntry>();
    (progressList ?? []).forEach(p => map.set(p.lessonId, p));
    return map;
  }, [progressList]);

  const lessons = useMemo(
    () =>
      (apiLessons ?? [])
        .map(lesson => {
          const metadata = downloadMap[lesson.id];
          const progress = progressMap.get(lesson.id);
          return {
            ...lesson,
            completed: progress?.completed ?? false,
            downloadedPath:
              metadata?.status === 'downloaded' ? metadata.localPath : undefined,
            downloadStatus: metadata?.status ?? 'not_downloaded',
            downloadProgress: metadata?.progress ?? 0,
          };
        }),
    [apiLessons, downloadMap, progressMap],
  );

  // Can user edit this lesson?
  const canEditLesson = useCallback(
    (item: BACLesson) => {
      if (isAdmin) return true;
      if (isTeacher && item.teacherId === user?.id) return true;
      return false;
    },
    [isAdmin, isTeacher, user?.id],
  );

  const openAdd = useCallback(() => {
    setEditingLesson(null);
    setFormValues({
      sortOrder: String((lessons?.length ?? 0) + 1),
      duration: '0',
      audience: 'FREE',
    });
    setShowModal(true);
  }, [lessons]);

  const openEdit = useCallback((item: BACLesson) => {
    setEditingLesson(item);
    setFormValues({
      titleEn: item.titleEn,
      titleFr: item.titleFr,
      audioUrl: item.audioUrl ?? '',
      scriptEn: item.scriptEn ?? '',
      scriptFr: item.scriptFr ?? '',
      duration: String(item.duration ?? 0),
      sortOrder: String(item.sortOrder),
      audience: item.audience ?? 'FREE',
    });
    setShowModal(true);
  }, []);

  const handleDeleteLesson = useCallback(
    (item: BACLesson) => {
      Alert.alert(t('deleteLesson'), t('deleteConfirm'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLesson(item.id);
              queryClient.invalidateQueries({ queryKey: ['/api/lessons', chapterId] });
            } catch (err) {
              Alert.alert('Error', String(err));
            }
          },
        },
      ]);
    },
    [t, queryClient, chapterId],
  );

  const handleUploadAudio = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const file = result.assets[0];
      setUploading(true);
      const uploadResult = await uploadAudioFile(file.uri, file.name ?? 'audio.mp3');
      setFormValues(prev => ({ ...prev, audioUrl: uploadResult.publicUrl }));
      Alert.alert('Upload Complete', 'Audio file uploaded successfully');
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!formValues.titleEn || !formValues.titleFr) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        titleEn: formValues.titleEn,
        titleFr: formValues.titleFr,
        audioUrl: formValues.audioUrl || undefined,
        scriptEn: formValues.scriptEn || undefined,
        scriptFr: formValues.scriptFr || undefined,
        duration: formValues.duration ? parseInt(formValues.duration, 10) : undefined,
        sortOrder: formValues.sortOrder ? parseInt(formValues.sortOrder, 10) : undefined,
        audience: (formValues.audience as 'FREE' | 'PREMIUM') || 'FREE',
      };

      if (editingLesson) {
        await updateLesson(editingLesson.id, payload);
      } else {
        await createLesson({ ...payload, chapterId });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/lessons', chapterId] });
      setShowModal(false);
    } catch (err) {
      Alert.alert('Error', String(err));
    } finally {
      setSaving(false);
    }
  }, [editingLesson, formValues, queryClient, chapterId]);

  if (isLoading) {
    return <Loading />;
  }

  if (error && !lessons.length) {
    return <ErrorView error={error} action={() => { refetch(); }} />;
  }

  const updateDownloadState = (
    lessonId: string,
    patch: Parameters<typeof upsertLessonDownloadMetadata>[1],
  ) => {
    setDownloadMap(current => ({
      ...current,
      [lessonId]: upsertLessonDownloadMetadata(lessonId, patch),
    }));
  };

  const handleDownload = async (item: BACLesson) => {
    if (item.locked && !canEditLesson(item)) {
      Alert.alert(
        isFr ? 'Contenu Premium' : 'Premium',
        isFr
          ? 'Les telechargements sont reserves aux abonnes Premium.'
          : 'Downloads are available for Premium subscribers.',
      );
      return;
    }
    if (downloadMap[item.id]?.status === 'downloading') {
      return;
    }
    updateDownloadState(item.id, { status: 'downloading', progress: 0 });

    try {
      let lastProgressBucket = 0;
      const task = downloadLessonAudio(item, progress => {
        const nextBucket = Math.floor(progress * PROGRESS_UPDATE_BUCKETS);
        if (nextBucket !== lastProgressBucket || progress >= 1) {
          lastProgressBucket = nextBucket;
          updateDownloadState(item.id, {
            status: 'downloading',
            progress,
          });
        }
      });
      const { localPath } = await task.start();
      updateDownloadState(item.id, {
        status: 'downloaded',
        progress: 1,
        localPath,
      });
    } catch (error) {
      console.error('Lesson download failed', item.id, error);
      updateDownloadState(item.id, {
        status: 'failed',
        progress: 0,
      });
    }
  };

  const getStatusLabel = (item: BACLesson) => {
    if (item.downloadStatus === 'downloaded') {
      return isFr ? 'Téléchargé' : 'Downloaded';
    }
    if (item.downloadStatus === 'downloading') {
      return `${Math.round((item.downloadProgress ?? 0) * 100)}%`;
    }
    if (item.downloadStatus === 'failed') {
      return isFr ? 'Échec' : 'Failed';
    }
    return isFr ? 'En ligne' : 'Online';
  };

  const renderItem = ({ item }: { item: BACLesson }) => {
    const editable = canEditLesson(item);
    const locked = !!item.locked && !editable;
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => {
          if (locked) {
            Alert.alert(
              isFr ? 'Contenu Premium' : 'Premium',
              isFr
                ? 'Cette lecon est reservee aux abonnes Premium.'
                : 'This lesson is for Premium subscribers.',
            );
            return;
          }
          navigation.navigate('AudioPlayer', { lesson: item });
        }}
        activeOpacity={0.7}>
        <View style={styles.cardLeft}>
          {locked ? (
            <LockIcon size={28} color={colors.muted} />
          ) : item.completed ? (
            <CheckCircleIcon size={28} color={colors.primary} />
          ) : (
            <PlayCircleIcon size={28} color={colors.primary} />
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {isFr ? item.titleFr : item.titleEn}
          </Text>
          {locked ? (
            <Text style={[styles.premiumBadge, { color: '#a855f7' }]}>Premium</Text>
          ) : null}
          <Text style={[styles.meta, { color: colors.muted }]}>
            🎙️ {item.teacherName} • ⏱️ {formatDuration(item.duration)}
          </Text>
          <Text style={[styles.status, { color: colors.primary }]}>
            {getStatusLabel(item)}
          </Text>
          {item.downloadStatus === 'downloading' && (
            <View style={[styles.downloadProgressTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.downloadProgressFill,
                  {
                    width: `${Math.round((item.downloadProgress ?? 0) * 100)}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
          )}
        </View>
        <View style={styles.cardRight}>
          {editable && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary + '20' }]}
              onPress={e => {
                e.stopPropagation();
                openEdit(item);
              }}>
              <PencilIcon size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
          {isAdmin && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.error + '20' }]}
              onPress={e => {
                e.stopPropagation();
                handleDeleteLesson(item);
              }}>
              <Trash2Icon size={14} color={colors.error} />
            </TouchableOpacity>
          )}
          {isDownloadAvailable() && (
          <TouchableOpacity
            style={styles.downloadAction}
            onPress={event => {
              event.stopPropagation();
              if (!item.downloadedPath) {
                handleDownload(item);
              }
            }}
            disabled={item.downloadStatus === 'downloading' || !!item.downloadedPath}>
            {item.downloadedPath ? (
              <Text style={styles.downloadBadge}>📥</Text>
            ) : (
              <DownloadIcon
                size={18}
                color={item.downloadStatus === 'downloading' ? colors.muted : colors.primary}
              />
            )}
          </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {canAdd && (
        <TouchableOpacity
          style={[
            styles.composerShortcut,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => navigation.navigate('TeacherAudioComposer', { chapterId })}
          activeOpacity={0.8}>
          <WandSparklesIcon size={16} color={colors.primary} />
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
            Open Teacher Audio Composer
          </Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={lessons}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingTop: canAdd ? 8 : 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
      {canAdd && <FAB onPress={openAdd} />}
      <AdminFormModal
        visible={showModal}
        title={editingLesson ? t('editLesson') : t('addLesson')}
        fields={lessonFields}
        values={formValues}
        onChange={(key, val) => setFormValues(prev => ({ ...prev, [key]: val }))}
        onSave={handleSave}
        onCancel={() => setShowModal(false)}
        onDelete={
          editingLesson && isAdmin
            ? () => {
                setShowModal(false);
                handleDeleteLesson(editingLesson);
              }
            : undefined
        }
        saveLabel={t('save')}
        cancelLabel={t('cancel')}
        deleteLabel={t('delete')}
        loading={saving}
      />
      {showModal && canAdd && (
        <TouchableOpacity
          style={[styles.uploadFab, { backgroundColor: '#8b5cf6' }]}
          onPress={handleUploadAudio}
          disabled={uploading}
          activeOpacity={0.8}>
          <UploadIcon size={20} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 6 }}>
            {uploading ? 'Uploading...' : 'Upload MP3'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  cardLeft: { justifyContent: 'center' },
  cardBody: { flex: 1 },
  cardRight: { alignItems: 'center', gap: 6 },
  title: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  premiumBadge: { fontSize: 11, fontWeight: '700', marginBottom: 4, letterSpacing: 0.3 },
  meta: { fontSize: 12 },
  status: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  downloadProgressTrack: {
    marginTop: 6,
    width: '100%',
    height: 4,
    borderRadius: 2,
  },
  downloadProgressFill: { height: 4, borderRadius: 2 },
  downloadAction: { padding: 6 },
  downloadBadge: { fontSize: 18 },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadFab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  composerShortcut: {
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default LessonListScreen;
