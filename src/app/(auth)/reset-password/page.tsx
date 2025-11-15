"use client";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { useResetPasswordMutation } from "@/redux/features/auth/authApi";
import { ResetPasswordFormData } from "@/validators/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const Page = () => {
  const [resetPassword] = useResetPasswordMutation();
  const router = useRouter();
  const handleResetPasswordFormSubmit = async (data: ResetPasswordFormData) => {
    try {
      const res = await resetPassword(data).unwrap();
      if (res.success) {
        toast.success(res.message as string);
        router.push("/login");
        return;
      }

      if (!res.data.success) {
        toast.error(res.data.message as string);
        return;
      }
    } catch (error) {
      console.log(error);
      toast.error((error?.data?.message as string) || "Something went wrong.");
    }
  };

  return (
    <div className="flex justify-center items-center">
      <ResetPasswordForm onsubmit={handleResetPasswordFormSubmit} />
    </div>
  );
};

export default Page;
