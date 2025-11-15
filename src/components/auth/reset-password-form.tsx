"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Eye, EyeOff, CheckIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
import { Spinner } from "../ui/spinner";
import { ChangePasswordFormData, ChangePasswordSchema, ResetPasswordFormData, ResetPasswordSchema } from "@/validators/auth";
import { BorderBeam } from "../ui/border-beam";

interface ResetPasswordFormProps extends React.HTMLAttributes<HTMLFormElement> {
  className?: string;
  onsubmit: (data: ResetPasswordFormData) => Promise<void>;
  isChangePassword?: boolean;
}

export function ResetPasswordForm({
  onsubmit,
  isChangePassword = false,
}: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(
      isChangePassword ? ChangePasswordSchema : ResetPasswordSchema,
    ),
    mode: "onTouched",
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    if (apiError) {
      toast.error(apiError);
      setApiError(null);
    }
  }, [apiError]);

  const handleFormSubmit: SubmitHandler<ChangePasswordFormData> = async (data) => {
    try {
      await onsubmit(data);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
      setApiError("Something went wrong. Please try again.");
    }
  };

  const checkStrength = (pass: string) => {
    const requirements = [
      { regex: /.{8,}/, text: "Password must be at least 8 characters" },
      { regex: /[0-9]/, text: "Password must contain at least 1 number" },
      {
        regex: /[a-z]/,
        text: "Password must contain at least 1 lowercase letter",
      },
      {
        regex: /[A-Z]/,
        text: "Password must contain at least 1 uppercase letter",
      },
    ];

    return requirements.map((req) => ({
      met: req.regex.test(pass),
      text: req.text,
    }));
  };

  const getStrengthColor = (score: number) => {
    if (score === 0) return "gray";
    if (score <= 1) return "red";
    if (score <= 2) return "orange";
    if (score === 3) return "yellow";
    return "green";
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return "Enter a password";
    if (score <= 2) return "Weak password";
    if (score === 3) return "Medium password";
    return "Strong password";
  };

  return (
    <Card className="gap-0 relative overflow-hidden border-0 max-w-md w-full">
      <CardHeader>
        <CardTitle>
          <h2 className="text-xl sm:text-2xl font-semibold">
            {isChangePassword ? "Change" : "Reset"} Your Password
          </h2>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => {
                const strength = checkStrength(field.value || "");
                const strengthScore = strength.filter((req) => req.met).length;
                return (
                  <FormItem>
                    <FormLabel>
                      New Password <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupInput
                          type={showPassword ? "text" : "password"}
                          placeholder="Your new password"
                          autoComplete="off"
                          {...field}
                        />

                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            onClick={() => setShowPassword(!showPassword)}
                            type="button"
                            className="bg-transparent hover:bg-transparent dark:hover:bg-transparent"
                          >
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

                    {/* Password strength bar */}
                    <div
                      className="mt-1 mb-1 h-3 w-full overflow-hidden rounded bg-border"
                      role="progressbar"
                      aria-valuenow={strengthScore}
                      aria-valuemin={0}
                      aria-valuemax={4}
                      aria-label="Password strength"
                    >
                      <div
                        className={`h-full transition-all duration-500 ease-out`}
                        style={{
                          width: `${(strengthScore / 4) * 100}%`,
                          backgroundColor: getStrengthColor(strengthScore),
                        }}
                      ></div>
                    </div>

                    <p className="mb-2 text-sm font-medium text-foreground">
                      {getStrengthText(strengthScore)}. Must contain:
                    </p>

                    <ul
                      className="space-y-2"
                      aria-label="Password requirements"
                    >
                      {strength.map((req, index) => (
                        <li key={index} className="flex items-center gap-2">
                          {req.met ? (
                            <CheckIcon
                              size={16}
                              className="text-green-500"
                              aria-hidden="true"
                            />
                          ) : (
                            <XIcon
                              size={16}
                              className="text-muted-foreground/80"
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className={`text-sm ${
                              req.met
                                ? "text-emerald-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {req.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Confirm New Password{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <InputGroup>
                      <InputGroupInput
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        autoComplete="off"
                        {...field}
                      />

                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          type="button"
                          className="bg-transparent hover:bg-transparent dark:hover:bg-transparent"
                        >
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

            <Button type="submit" size="lg" className="w-full cursor-pointer">
              {form.formState.isSubmitting ? (
                <>
                  <Spinner /> <span>Please wait... </span>
                </>
              ) : (
                <>{isChangePassword ? "Change" : "Reset"} Password</>
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
