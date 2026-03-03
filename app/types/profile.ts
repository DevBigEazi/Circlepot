export interface Profile {
  dynamicUserId: string;
  walletAddress: string | null;
  username: string;
  firstName: string;
  lastName: string;
  profilePhoto: string | null;
  accountId: number;
  email: string | null;
  phoneNumber: string | null;
  referredBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileResponse extends Omit<
  Profile,
  "createdAt" | "updatedAt"
> {
  createdAt: string;
  updatedAt: string;
}
