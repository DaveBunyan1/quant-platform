type ButtonProps = {
  text: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
};

const Button = ({ text, disabled = false, type = 'submit' }: ButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white shadow-md transition duration-200 hover:bg-blue-700 hover:shadow-lg dark:bg-purple-900 dark:hover:bg-purple-950"
    >
      {text}
    </button>
  );
};

export default Button;
