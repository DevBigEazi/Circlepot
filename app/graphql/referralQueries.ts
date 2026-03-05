export const GET_USER_REFERRALS = `
  query GetUserReferrals($address: ID!) {
    user(id: $address) {
      id
      referralCount
      totalReferralRewardsEarned
      pendingRewardsEarned
      referrals {
        id
      }
      referralRewards(orderBy: transaction__blockTimestamp, orderDirection: desc) {
        id
        token
        rewardAmount
        transaction {
          blockTimestamp
        }
      }
    }
  }
`;

export const GET_REFERRAL_STATS = `
  query GetReferralStats {
    referralSystem(id: "system") {
      rewardsEnabled
      campaignMode
      supportedTokens {
        token
        bonusAmount
        campaignBonusAmount
      }
    }
  }
`;
