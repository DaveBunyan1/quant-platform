import type { FormInput } from '../../types/form';

type FormProps = {
  inputs: FormInput[];
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
  buttonText: string;
};

const Form = ({ inputs, onSubmit, buttonText }: FormProps) => {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {inputs.map((input) => (
        <div key={input.name}>
          <label className="mb-2 block text-sm font-medium" htmlFor={input.name}>
            {input.label}
          </label>

          <input
            id={input.name}
            name={input.name}
            type={input.type}
            className="focus:ring-grey-200 w-full rounded-lg border border-gray-300 px-4 py-2 transition duration-200 focus:border-transparent focus:ring-2 focus:outline-none"
            placeholder={input.placeholder}
            autoComplete={input.autoComplete}
            required
          />
        </div>
      ))}

      <button
        className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white shadow-md transition duration-200 hover:bg-blue-700 hover:shadow-lg dark:bg-purple-900 dark:hover:bg-purple-950"
        type="submit"
      >
        {buttonText}
      </button>
    </form>
  );
};

export default Form;
