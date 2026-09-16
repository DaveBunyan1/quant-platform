import type { MouseEventHandler } from 'react';

type ButtonProps = {
  text: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

const Button = ({ text, onClick }: ButtonProps) => {
  return (
    <button
      className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white shadow-md transition duration-200 hover:bg-blue-700 hover:shadow-lg dark:bg-purple-900 dark:hover:bg-purple-950"
      onClick={onClick}
      type="submit"
    >
      {text}
    </button>
  );
};

export default Button;
