import type { User } from '../types/user';

const getUser = (): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ name: 'Dave' }), 1000);
  });
};

export default getUser;
