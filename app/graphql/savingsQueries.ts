export const GET_USER_SAVINGS_SUMMARY = `
  query GetUserSavingsSummary($address: ID!, $userAddress: Bytes!) {
    user(id: $address) {
      id
      totalGoalsCompleted
      totalCirclesCompleted
      totalReputation
      repCategory
      totalLatePayments
    }
    personalGoals(
      where: { user: $userAddress, isActive: true }
      orderBy: createdAt
      orderDirection: desc
    ) {
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
    circlesJoined: circleJoineds(
      where: { user: $userAddress }
    ) {
      circleId
    }
    contributionMades(where: { user: $userAddress }) {
      amount
      circleId
      round
    }
    payoutDistributeds(where: { user: $userAddress }) {
      payoutAmount
    }
    memberForfeiteds(where: { forfeitedUser: $userAddress }) {
      circleId
      deductionAmount
    }
  }
`;

export const GET_CIRCLES_BY_IDS = `
  query GetCirclesByIds($ids: [BigInt!]) {
    circles(where: { circleId_in: $ids }) {
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
      totalPot
      contributionsThisRound
      nextDeadline
      creator {
        id
      }
      lastVoteExecuted {
        id
        circleStarted
        startVoteTotal
        withdrawVoteTotal
        withdrawWon
      }
    }
    circleJoineds(where: { circleId_in: $ids }) {
      circleId
      user {
        id
      }
    }
    positionAssigneds(where: { circleId_in: $ids }) {
      circleId
      user {
        id
      }
      position
    }
    contributionMades(where: { circleId_in: $ids }) {
      circleId
      user {
        id
      }
      round
      amount
    }
    payoutDistributeds(where: { circleId_in: $ids }) {
      circleId
      user {
        id
      }
      round
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
  query GetCircleDetails($circleId: BigInt!) {
    circles(where: { circleId: $circleId }) {
      id
      circleId
      circleName
      circleDescription
      creator {
        id
      }
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
      totalPot
      contributionsThisRound
      nextDeadline
      lastVoteExecuted {
        id
        circleStarted
        startVoteTotal
        withdrawVoteTotal
        withdrawWon
      }
    }
  }
`;

export const GET_SINGLE_CIRCLE = GET_CIRCLE_DETAILS;

export const GET_PERSONAL_SAVINGS_ACTIVITY = `
  query GetPersonalSavingsActivity($address: Bytes!) {
    goalContributions(
      where: { user: $address }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 50
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
      first: 50
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
      first: 50
    ) {
      id
      goalId
      transaction {
        blockTimestamp
        transactionHash
      }
    }
    personalGoals(where: { user: $address }) {
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
      first: 50
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
      first: 50
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
      first: 50
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
      first: 50
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
      first: 50
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
      first: 50
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
      first: 50
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
      first: 50
    ) {
      id
      circleId
      deadFee
      transaction {
        blockTimestamp
        transactionHash
      }
    }
    # Circles info for lookup
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

export const GET_USER_CIRCLES = `
  query GetUserCircles($address: Bytes!) {
    circleJoineds(where: { user: $address }, first: 100) {
      id
      circleId
    }
    circlesCreated: circles(where: { creator: $address }, first: 100) {
      id
      circleId
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
