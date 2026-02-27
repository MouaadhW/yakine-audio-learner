import { BACLesson } from './lib/models';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
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
  Moderation: undefined;
  Stats: undefined;
  BulkImportExport: undefined;
  Announcements: undefined;
  FeatureFlags: undefined;
  ContentManagement: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Subjects: undefined;
  Learnings: undefined;
  Profile: undefined;
};
