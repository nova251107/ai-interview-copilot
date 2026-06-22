const axios = require('axios');

/**
 * Fetch real LeetCode stats for a given username
 * using LeetCode's public GraphQL API.
 * Returns: { easy, medium, hard, totalSolved, totalQuestions }
 */
const fetchLeetCodeStats = async (username) => {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
      allQuestionsCount {
        difficulty
        count
      }
    }
  `;

  const response = await axios.post(
    'https://leetcode.com/graphql',
    { query, variables: { username } },
    {
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0',
      },
      timeout: 10000,
    }
  );

  const data = response.data?.data;

  if (!data?.matchedUser) {
    throw new Error(`LeetCode user "${username}" not found`);
  }

  const acStats = data.matchedUser.submitStats.acSubmissionNum;
  const allStats = data.allQuestionsCount;

  const getCount = (arr, difficulty) =>
    arr.find((x) => x.difficulty === difficulty)?.count || 0;

  return {
    username: data.matchedUser.username,
    easy:    getCount(acStats, 'Easy'),
    medium:  getCount(acStats, 'Medium'),
    hard:    getCount(acStats, 'Hard'),
    totalSolved: getCount(acStats, 'All'),
    totalEasy:   getCount(allStats, 'Easy'),
    totalMedium: getCount(allStats, 'Medium'),
    totalHard:   getCount(allStats, 'Hard'),
  };
};

module.exports = { fetchLeetCodeStats };
