import { forwardRef, useState, InputHTMLAttributes } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export const PasswordInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>((props, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex w-full">
      <input
        {...props}
        ref={ref}
        required
        type={showPassword ? "text" : "password"}
        placeholder={props.placeholder || "Password"}
        className="w-full text-[#A1A1A1] h-8 border border-solid border-[#2E2E2E] py-1 px-2.5 rounded-l bg-black text-13"
        name={props.name || "password"}
      />
      <button
        className="flex text-[#A1A1A1] items-center justify-center w-2/12 transition duration-150 bg-black border-r border-solid rounded-r border-y border-[#2E2E2E] ease hover:bg-[#1F1F1F]"
        onClick={(e) => {
          e.preventDefault();
          setShowPassword(!showPassword);
        }}
        type="button"
      >
        {showPassword ? (
          <AiOutlineEye size={16} />
        ) : (
          <AiOutlineEyeInvisible size={16} />
        )}
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";
