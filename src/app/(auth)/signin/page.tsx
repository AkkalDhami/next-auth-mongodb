"use client";

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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";

import Link from "next/link";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Spinner } from "@/components/ui/spinner";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { BorderBeam } from "@/components/ui/border-beam";
import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { useLoginMutation } from "@/redux/features/auth/authApi";
import { SigninFormData, SigninSchema } from "@/validators/auth";
import { setCredentials } from "@/redux/features/auth/authSlice";

export default function Login(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [login, { isLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { user } = useAppSelector((state) => state.auth);
  console.log({ user });
  const form = useForm<SigninFormData>({
    resolver: zodResolver(SigninSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SigninFormData) {
    try {
      const res = await login(values).unwrap();

      if (res.success) {
        console.log({ res });
        dispatch(
          setCredentials({
            email: res?.data?.email,
            id: res?.data?.id,
            name: res?.data?.name,
            role: res?.data?.role,
          })
        );
        toast.success(res.message as string);
        router.push("/email-verify");
        return;
      }
      if (res.data && !res.data.success) {
        toast.error(res.data.message as string);
        return;
      }
    } catch (error: unknown) {
      console.log(error);
      toast.error((error?.data?.message as string) || "Something went wrong.");
    }
  }

  return (
    <Card className="max-w-md relative border-0 w-full overflow-hidden">
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl font-semibold">Sign in to your account</h1>
        </CardTitle>
        <CardDescription>
          <div className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="text-primary-500 hover:underline">
              Sign up
            </a>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between">
                    <FormLabel>
                      Password <span className="text-destructive">*</span>
                    </FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-primary-500 hover:underline">
                      Forgot password?
                    </Link>
                  </div>

                  <FormControl>
                    <InputGroup>
                      <InputGroupInput
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        autoComplete="off"
                        {...field}
                      />

                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          onClick={() => setShowPassword(!showPassword)}
                          type="button"
                          className="bg-transparent hover:bg-transparent dark:hover:bg-transparent">
                          {showPassword ? (
                            <EyeOff className="text-muted-foreground size-4" />
                          ) : (
                            <Eye className="text-muted-foreground size-4" />
                          )}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size={"lg"}
              disabled={isLoading}
              className="w-full  cursor-pointer">
              {isLoading ? (
                <>
                  <Spinner />
                  <span className="ml-2">Signing in...</span>
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </Form>

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
