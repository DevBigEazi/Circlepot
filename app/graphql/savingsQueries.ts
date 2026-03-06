export const GET_USER_SAVINGS_SUMMARY = `
  query GetUserSavingsSummary($address: ID!) {
    user(id: $address) {
      id
      personalGoals: activePersonalGoals(orderBy: createdAt, orderDirection: desc) {
        id
        goalId
        goalName
        goalAmount
        currentAmount
        contributionAmount
        frequency
        deadline
        createdAt
        updatedAt
        isActive
        isYieldEnabled
        token
      }
    }
  }
`;

export const GET_GOAL_DETAILS = `
  query GetGoalDetails($id: ID!) {
    personalGoal(id: $id) {
      id
      goalId
      goalName
      goalAmount
      currentAmount
      contributionAmount
      frequency
      deadline
      createdAt
      updatedAt
      isActive
      isYieldEnabled
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

export const GET_PERSONAL_SAVINGS_ACTIVITY = `
  query GetPersonalSavingsActivity($address: Bytes!) {
    goalContributions(
      where: { user: $address }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      amount
      goalId
      token
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    goalWithdrawns(
      where: { user: $address }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      goalId
      amount
      penalty
      isActive
      token
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    goalCompleteds(
      where: { user: $address }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      goalId
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    personalGoals(
      where: { user: $address }
    ) {
      id
      goalId
      goalName
      goalAmount
    }
  }
`;
