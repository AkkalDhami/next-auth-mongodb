"use client";

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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useRegisterMutation } from "@/redux/features/auth/authApi";
import { SignupFormData, SignupSchema } from "@/validators/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

export default function Register(): React.JSX.Element {
  const [register, { isLoading, error }] = useRegisterMutation();

  const router = useRouter();

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignupFormData) {
    try {
      const res = await register(values).unwrap();
      if (res.success) {
        toast.success(res.message as string);
        // dispatch(res.data.data);
        router.push("/login");
        return;
      }
      if (!res.data.success) {
        console.log(res);
        toast.error(res.data.message as string);
        return;
      }
    } catch (error) {
      console.log(error);
      toast.error((error?.data?.message as string) || "Something went wrong.");
    }
  }

  return (
    <Card className="max-w-md border-0 w-full relative overflow-hidden">
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl font-bold">Create an account</h1>
        </CardTitle>
        <CardDescription>
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/signin" className="text-primary-500 hover:underline">
              Sign in
            </a>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormLabel>
                    Password <span className="text-destructive">*</span>
                  </FormLabel>
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

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Confirm Password <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <InputGroup>
                      <InputGroupInput
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        autoComplete="off"
                        {...field}
                      />

                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          type="button"
                          className="bg-transparent hover:bg-transparent dark:hover:bg-transparent">
                          {showConfirmPassword ? (
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
              className="w-full ">
              {isLoading ? (
                <>
                  <Spinner />
                  <span className="ml-2">Signing up...</span>
                </>
              ) : (
                "Sign Up"
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
