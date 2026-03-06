export const TOKEN_ABI = [
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
] as const;

export const PERSONAL_SAVINGS_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "name", type: "string" },
          { name: "targetAmount", type: "uint256" },
          { name: "contributionAmount", type: "uint256" },
          { name: "frequency", type: "uint8" },
          { name: "deadline", type: "uint256" },
          { name: "enableYield", type: "bool" },
          { name: "token", type: "address" },
          { name: "yieldAPY", type: "uint256" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "createPersonalGoal",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "goalId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    name: "contributeToGoal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "goalId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    name: "withdrawFromGoal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "goalId", type: "uint256" }],
    name: "completeGoal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "tokenVaults",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserGoals",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "personalGoals",
    outputs: [
      { name: "owner", type: "address" },
      { name: "name", type: "string" },
      { name: "targetAmount", type: "uint256" },
      { name: "currentAmount", type: "uint256" },
      { name: "contributionAmount", type: "uint256" },
      { name: "frequency", type: "uint8" },
      { name: "deadline", type: "uint256" },
      { name: "createdAt", type: "uint256" },
      { name: "isActive", type: "bool" },
      { name: "lastContributionAt", type: "uint256" },
      { name: "isYieldEnabled", type: "bool" },
      { name: "contributionCount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ERC4626_ABI = [
  ...TOKEN_ABI,
  {
    inputs: [{ name: "assets", type: "uint256" }],
    name: "convertToShares",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "shares", type: "uint256" }],
    name: "convertToAssets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
