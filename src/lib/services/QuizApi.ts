import { makeApiRequest } from '../makeApiRequest';
import { Quiz, QuizAttemptResult, QuizAttempt } from '../models';

export const QuizApi = {
  // Student routes
  getQuizForLesson: async (lessonId: string, lang?: string): Promise<Quiz | null> => {
    try {
      const qs = lang ? `?lang=${lang}` : '';
      const response = await makeApiRequest({
        url: `/api/quiz/lesson/${lessonId}${qs}`,
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch quiz');
      }
      return await response.json();
    } catch (e) {
      console.error('QuizApi.getQuizForLesson error:', e);
      return null;
    }
  },

  submitAttempt: async (
    lessonId: string,
    answers: { questionId: string; selectedOptionIds: string[] }[],
    lang?: string,
  ): Promise<QuizAttemptResult> => {
    const response = await makeApiRequest({
      url: `/api/quiz/lesson/${lessonId}/attempt`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, lang }),
      },
    });
    if (!response.ok) {
      throw new Error('Failed to submit attempt');
    }
    return await response.json();
  },

  getMyAttempts: async (): Promise<QuizAttempt[]> => {
    const response = await makeApiRequest({
      url: '/api/quiz/attempts/me',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch attempts');
    }
    return await response.json();
  },

  getResurfaceLessons: async (): Promise<any[]> => {
    const response = await makeApiRequest({
      url: '/api/quiz/resurface',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch resurface lessons');
    }
    return await response.json();
  },

  // Admin/Teacher routes
  getAdminQuizForLesson: async (lessonId: string): Promise<Quiz | null> => {
    try {
      const response = await makeApiRequest({
        url: `/api/admin/quiz/lesson/${lessonId}`,
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch admin quiz');
      }
      return await response.json();
    } catch (e) {
      console.error('QuizApi.getAdminQuizForLesson error:', e);
      return null;
    }
  },

  createQuiz: async (lessonId: string, questions: any[]): Promise<Quiz> => {
    const response = await makeApiRequest({
      url: '/api/admin/quiz',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, questions }),
      },
    });
    if (!response.ok) {
      throw new Error('Failed to create quiz');
    }
    return await response.json();
  },

  updateQuiz: async (quizId: string, questions: any[]): Promise<Quiz> => {
    const response = await makeApiRequest({
      url: `/api/admin/quiz/${quizId}`,
      options: {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      },
    });
    if (!response.ok) {
      throw new Error('Failed to update quiz');
    }
    return await response.json();
  },

  deleteQuiz: async (quizId: string): Promise<void> => {
    const response = await makeApiRequest({
      url: `/api/admin/quiz/${quizId}`,
      options: {
        method: 'DELETE',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to delete quiz');
    }
  },

  getAttemptsForLesson: async (lessonId: string): Promise<any[]> => {
    const response = await makeApiRequest({
      url: `/api/admin/quiz/attempts/${lessonId}`,
    });
    if (!response.ok) {
      throw new Error('Failed to fetch attempts for lesson');
    }
    return await response.json();
  },
};
