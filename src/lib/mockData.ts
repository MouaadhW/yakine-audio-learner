import { Category, Course, Page, Post } from './models';

const now = new Date().toISOString();

export const sampleCategories: Category[] = [
  { id: 1, slug: 'mobile-dev', name: 'Mobile Dev' },
  { id: 2, slug: 'ui-ux', name: 'UI / UX' },
  { id: 3, slug: 'javascript', name: 'JavaScript' },
  { id: 4, slug: 'react-native', name: 'React Native' },
  { id: 5, slug: 'productivity', name: 'Productivity' },
];

export const sampleCourses: Course[] = [
  {
    id: 1,
    title: 'React Native Fundamentals',
    slug: 'react-native-fundamentals',
    featured: true,
    level: 'beginner',
    access: 'free',
    status: 'published',
    category: sampleCategories[3],
    meta: {
      rating: '4.8',
      ratingCount: '120',
      enrolledCount: '980',
    },
  },
  {
    id: 2,
    title: 'Build UI Systems for Mobile',
    slug: 'build-ui-systems-mobile',
    featured: true,
    level: 'intermediate',
    access: 'free',
    status: 'published',
    category: sampleCategories[1],
    meta: {
      rating: '4.7',
      ratingCount: '95',
      enrolledCount: '760',
    },
  },
  {
    id: 3,
    title: 'State Management with Redux Toolkit',
    slug: 'state-management-redux-toolkit',
    featured: false,
    level: 'intermediate',
    access: 'free',
    status: 'published',
    category: sampleCategories[2],
    meta: {
      rating: '4.9',
      ratingCount: '80',
      enrolledCount: '640',
    },
  },
];

export const samplePosts: Post[] = [
  {
    id: 1,
    slug: 'mobile-learning-roadmap',
    title: 'Mobile Learning Roadmap in 2026',
    excerpt: 'A practical roadmap to stay consistent and build skills.',
    status: 'published',
    visibility: 'public',
    featured: true,
    wordCount: 900,
    publishedAt: now,
    meta: { viewCount: '2450' },
  },
  {
    id: 2,
    slug: 'why-react-native-still-matters',
    title: 'Why React Native Still Matters',
    excerpt: 'Where React Native shines for product teams.',
    status: 'published',
    visibility: 'public',
    featured: false,
    wordCount: 720,
    publishedAt: now,
    meta: { viewCount: '1700' },
  },
  {
    id: 3,
    slug: 'learning-by-shipping',
    title: 'Learning Faster by Shipping Small Features',
    excerpt: 'Use tiny deliverables to make steady progress.',
    status: 'published',
    visibility: 'public',
    featured: false,
    wordCount: 650,
    publishedAt: now,
    meta: { viewCount: '1100' },
  },
];

export const sampleCategoryPage: Page<Category> = {
  contents: sampleCategories,
  currentPage: 1,
  totalPage: 1,
  pageSize: sampleCategories.length,
  totalElements: sampleCategories.length,
};

export const sampleCoursePage: Page<Course> = {
  contents: sampleCourses,
  currentPage: 1,
  totalPage: 1,
  pageSize: sampleCourses.length,
  totalElements: sampleCourses.length,
};

export const samplePostPage: Page<Post> = {
  contents: samplePosts,
  currentPage: 1,
  totalPage: 1,
  pageSize: samplePosts.length,
  totalElements: samplePosts.length,
};
