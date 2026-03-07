export const GET_USER_SAVINGS_SUMMARY = `
  query GetUserSavingsSummary($address: ID!) {
    user(id: $address) {
      id
      totalGoalsCompleted
      totalCirclesCompleted
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

export const GET_USER_CIRCLE_ACTIVITY = `
  query GetUserCircleActivity($address: Bytes!) {
    circleJoineds(
      where: { user: $address }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      circleId
      circleState
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    contributionMades(
      where: { user: $address }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      circleId
      amount
      token
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    lateContributionMades(
      where: { user: $address }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      circleId
      amount
      fee
      token
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    payoutDistributeds(
      where: { user: $address }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      circleId
      payoutAmount
      token
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    collateralReturneds(
      where: { user: $address }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      circleId
      amount
      token
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    collateralWithdrawns(
      where: { user: $address }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      circleId
      amount
      token
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    memberForfeiteds(
      where: { forfeiter: $address }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      circleId
      deductionAmount
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    deadCircleFeeDeducteds(
      where: { creator: $address }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      circleId
      deadFee
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    circles(first: 1000) {
      circleId
      circleName
      collateralAmount
      creator {
        id
      }
    }
  }
`;

export const GET_ALL_CIRCLES = `
  query GetAllCircles {
    circles(orderBy: updatedAt, orderDirection: desc, first: 100) {
      id
      circleId
      circleName
      circleDescription
      contributionAmount
      collateralAmount
      frequency
      maxMembers
      currentMembers
      currentRound
      visibility
      state
      createdAt
      startedAt
      updatedAt
      token
      creator {
        id
      }
    }
  }
`;

export const GET_SINGLE_CIRCLE = `
  query GetSingleCircle($id: ID!) {
    circle(id: $id) {
      id
      circleId
      circleName
      circleDescription
      contributionAmount
      collateralAmount
      frequency
      maxMembers
      currentMembers
      currentRound
      visibility
      state
      createdAt
      startedAt
      updatedAt
      token
      creator {
        id
      }
      members: members {
        id
        user {
          id
        }
        joinedAt
        position
      }
    }
  }
`;

export const CHECK_USER_STATUS = `
  query CheckUserStatus($circleId: BigInt!, $userAddress: Bytes!) {
    circleJoineds(where: { circleId: $circleId, user: $userAddress }) {
      id
    }
    memberInviteds(where: { circleId: $circleId, invitee: $userAddress }) {
      id
    }
  }
`;
