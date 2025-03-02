import { AiOutlineWarning } from "react-icons/ai";

export const ErrorMessage = ({ message }: { message: string }) => {
  return (
    <div className="flex items-center justify-center gap-2 p-3 text-[#FF6166] bg-[#FF61661A] rounded-md border border-[#FF6166] border-opacity-20">
      <AiOutlineWarning size={18} />
      <div className="text-sm font-medium">{message}</div>
    </div>
  );
};
