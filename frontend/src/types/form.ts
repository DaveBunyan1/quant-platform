export type FormInput = {
  label: string;
  name: string;
  type: 'text' | 'email' | 'password';
  placeholder: string;
  autoComplete?: string;
};
