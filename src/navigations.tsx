import { BACLesson } from './lib/models';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  MainTabs: undefined;
  BlogDetail: { slug: string };
  CourseDetail: { slug: string };
  CourseList: undefined;
  SubjectList: undefined;
  ChapterList: { subjectId: string };
  LessonList: { chapterId: string };
  AudioPlayer: { lesson: BACLesson };
  AdminPanel: undefined;
  UserManagement: undefined;
  TeacherScopes: { teacherId: string; teacherName: string };
  TeacherLawSubjects: {
    teacherId: string;
    teacherName: string;
    lawUniversity: string | null;
  };
  Moderation: undefined;
  Stats: undefined;
  BulkImportExport: undefined;
  Announcements: undefined;
  FeatureFlags: undefined;
  ContentManagement: undefined;
  TeacherAudioComposer: { chapterId?: string } | undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Subjects: undefined;
  Learnings: undefined;
  Profile: undefined;
};
