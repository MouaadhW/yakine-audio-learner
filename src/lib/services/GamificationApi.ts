import { makeApiRequest } from '../makeApiRequest';
import { validateApiResponse } from '../validateApiResponse';
import { LeaderboardEntry } from '../models';

export const GamificationApi = {
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const resp = await makeApiRequest({
      url: '/api/gamification/leaderboard',
    });
    await validateApiResponse(resp);
    return resp.json();
  },

  async getMyStats(): Promise<any> {
    const resp = await makeApiRequest({
      url: '/api/gamification/me',
    });
    await validateApiResponse(resp);
    return resp.json();
  },
};
