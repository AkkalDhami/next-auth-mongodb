"use client";

import OtpInput from "@/components/auth/input-otp";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAppSelector } from "@/hooks/use-store";
import { useVerifyOtpMutation } from "@/redux/features/auth/authApi";
import { useRouter } from "next/navigation";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function EmailVerify(): React.JSX.Element {
  const [otp, setOtp] = useState("");

  const router = useRouter();
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const { user } = useAppSelector((state) => state.auth);
  console.log(user);
  useEffect(() => {
    if (!user?.email) {
      router.push("/signin");
    }
  }, [user, router]);

  const handleOtpChange = (value: string) => {
    setOtp(value);
  };

  const handleSubmit = async () => {
    try {
      const res = await verifyOtp({
        email: user?.email as string,
        otpCode: otp,
      }).unwrap();
      console.log({ res });
      if (res.success) {
        setOtp("");
        toast.success(res.message as string);
        router.push("/profile");

        return;
      }
      if (!res.data.success) {
        toast.error(res.data.message as string);
        return;
      }
    } catch (error: any) {
      console.log(error);
      toast.error((error?.data?.message as string) || "Something went wrong.");
    }
  };

  return (
    <Card className="max-w-[420px] relative overflow-hidden w-full shadow-none border-0">
      <CardHeader className="sm:px-6 px-3">
        <CardTitle>
          <h1 className="text-2xl font-semibold">Email Verification</h1>
        </CardTitle>
        <CardDescription>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent an OTP to{" "}
            <span className="text-primary">
              {"<"}
              {user?.email}
              {">"}
            </span>{" "}
            to verify your email address and activate your account.
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0 sm:px-6 px-3">
        <OtpInput length={6} onChangeOtp={handleOtpChange} />

        <Button
          onClick={handleSubmit}
          disabled={otp.length !== 6 || isLoading}
          className="px-4 sm:h-10 mt-3 w-full py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600  disabled:bg-zinc-400 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Spinner />
              <span>Verifying...</span>
            </>
          ) : (
            "Verify OTP"
          )}
        </Button>
      </CardContent>
      <BorderBeam
        duration={4}
        size={300}
        reverse
        className="from-transparent via-primary-600 to-transparent"
      />
    </Card>
  );
}
