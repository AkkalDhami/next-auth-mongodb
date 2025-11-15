"use client";

import OtpInput from "@/components/auth/input-otp";
// import { SocialLogin } from "@/components/auth/social-login";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAppSelector } from "@/hooks/use-store";
import {
  useRequestOtpMutation,
  useVerifyOtpMutation,
} from "@/redux/features/auth/authApi";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { email, z } from "zod";

const formSchema = z.object({
  email: email({}).min(3, {
    message: "Email is required.",
  }),
});

export default function Page(): React.JSX.Element {
  const [getEmail, setGetEmail] = useState<string>("");

  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  const [verifyOtp, { isLoading: verifyOtpLoading }] = useVerifyOtpMutation();
  const [requestOtp, { isLoading: otpLoading }] = useRequestOtpMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const res = await requestOtp({
        email: values.email,
        type: "password-reset",
      }).unwrap();

      if (res.success) {
        toast.success(res.message as string);
        setGetEmail(values.email);
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
  }

  const [otp, setOtp] = useState("");

  const handleOtpChange = (value: string) => {
    setOtp(value);
  };

  const handleOTPSubmit = async () => {
    try {
      const res = await verifyOtp({
        email: (getEmail as string) || (user?.email as string),
        otpCode: otp,
      }).unwrap();

      if (res.success) {
        setOtp("");
        toast.success(res.message as string);
        router.push("/reset-password");
        return;
      }
      if (!res.data.success) {
        toast.error(res.data.message as string);
        return;
      }
    } catch (error) {
      console.log(error);
      toast.error(
        (error?.data?.data as string) ||
          (error?.data?.message as string) ||
          "Something went wrong."
      );
    }
  };

  return (
    <>
      {getEmail.trim() === "" ? (
        <Card className="max-w-md border-0 w-full relative overflow-hidden">
          <CardHeader>
            <CardTitle>
              <h1 className="text-2xl font-semibold">Forgot Password?</h1>
            </CardTitle>
            <CardDescription>
              <div className="text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you OTP to reset your
                password
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size={"lg"}
                  disabled={otpLoading}
                  className="w-full  cursor-pointer">
                  {otpLoading ? (
                    <>
                      <Spinner /> <span>Getting Reset Code...</span>
                    </>
                  ) : (
                    "Get Reset Code"
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-sm mt-4 text-muted-foreground">
              Remember password ?{" "}
              <Link href="/login" className="text-primary-500 hover:underline">
                Sign in
              </Link>
            </div>

            {/* <SocialLogin /> */}
          </CardContent>
          <BorderBeam
            duration={4}
            size={300}
            reverse
            className="from-transparent via-primary-600 to-transparent"
          />
        </Card>
      ) : (
        <Card className="max-w-[420px] w-full shadow-none border-0 relative overflow-hidden">
          <CardHeader className="sm:px-6 px-3">
            <CardTitle>
              <h1 className="text-2xl font-semibold">
                Email Verification Required
              </h1>
            </CardTitle>
            <CardDescription>
              <p className="text-sm text-muted-foreground">
                A secure verification code has been sent to{" "}
                <span className="text-primary">
                  {"<"}
                  {getEmail}
                  {">"}
                </span>{" "}
                . Please enter the code below to verify your identity and get
                reset password link safely.
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0 sm:px-6 px-3">
            <OtpInput length={6} onChangeOtp={handleOtpChange} />

            <Button
              onClick={handleOTPSubmit}
              disabled={
                otp.length !== 6 ||
                otpLoading ||
                !getEmail.trim() ||
                verifyOtpLoading
              }
              className="px-4 sm:h-10 mt-3 w-full py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600  disabled:bg-zinc-400 disabled:cursor-not-allowed">
              {verifyOtpLoading ? (
                <>
                  <Spinner /> <span>Verifying...</span>
                </>
              ) : (
                "Verify OTP"
              )}
            </Button>

            {/* resend otp */}
            <div className="mt-3">
              <p className="text-sm text-muted-foreground">
                Didn&apos;t receive the code?{" "}
                <span className="text-primary-500 hover:underline cursor-pointer">
                  Resend
                </span>
              </p>
            </div>
          </CardContent>
          <BorderBeam
            duration={4}
            size={300}
            reverse
            className="from-transparent via-cyan-600 to-transparent"
          />
        </Card>
      )}
    </>
  );
}
