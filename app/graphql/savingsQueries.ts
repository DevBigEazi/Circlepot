export const GET_USER_SAVINGS_SUMMARY = `
  query GetUserSavingsSummary($address: ID!) {
    user(id: $address) {
      id
      personalGoals(orderBy: createdAt, orderDirection: desc) {
        id
        name
        targetAmount
        currentAmount
        contributionAmount
        frequency
        deadline
        createdAt
        isActive
        isYieldEnabled
        contributionCount
        token
      }
      circles(orderBy: joinedAt, orderDirection: desc) {
        id
        joinedAt
        circle {
          id
          name
          description
          targetAmount
          contributionAmount
          frequency
          totalRounds
          currentRound
          startDate
          token
          isActive
        }
      }
    }
  }
`;

export const GET_GOAL_DETAILS = `
  query GetGoalDetails($id: ID!) {
    personalGoal(id: $id) {
      id
      name
      targetAmount
      currentAmount
      contributionAmount
      frequency
      deadline
      createdAt
      isActive
      isYieldEnabled
      contributionCount
      token
      contributions(orderBy: timestamp, orderDirection: desc) {
        id
        amount
        timestamp
        transaction {
          hash
        }
      }
      withdrawals(orderBy: timestamp, orderDirection: desc) {
        id
        amount
        penalty
        timestamp
        transaction {
          hash
        }
      }
    }
  }
`;

export const GET_CIRCLE_DETAILS = `
  query GetCircleDetails($id: ID!) {
    circle(id: $id) {
      id
      name
      description
      creator {
        id
      }
      targetAmount
      contributionAmount
      frequency
      totalRounds
      currentRound
      startDate
      token
      isActive
      members {
        id
        user {
          id
        }
        joinedAt
        position
      }
      payouts(orderBy: round, orderDirection: desc) {
        id
        recipient {
          id
        }
        amount
        round
        timestamp
      }
      contributions(orderBy: timestamp, orderDirection: desc) {
        id
        user {
          id
        }
        amount
        round
        timestamp
      }
    }
  }
`;
