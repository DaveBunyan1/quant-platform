type UserBase = {
  email: string;
  username: string;
};

export type UserCreate = UserBase & {
  password: string;
};

export type User = UserBase & {
  id: string;
};

export type TokenPair = {
  access_token: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string | null;
};
