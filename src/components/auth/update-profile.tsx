"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { LucideBadgeCheck, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  useUpdateProfileMutation,
  authApi,
} from "@/redux/features/auth/authApi";
import { useDispatch } from "react-redux";
import { ProfileFormData, ProfileSchema } from "@/validators/auth";
import toast from "react-hot-toast";
import ThemeToggle from "../home/theme-toggle";
import { Separator } from "../ui/separator";
import { HandleUserAccount } from "./handle-user-account";

interface UpdateProfileFormProps {
  user: User;
}

export function UpdateProfileForm({ user }: UpdateProfileFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.avatar.url || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // RTK Query mutation
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const dispatch = useDispatch();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio || "",
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);

      form.setValue("avatarFile", file, { shouldValidate: true });
    }
  };

  const removeAvatar = () => {
    setAvatarPreview(user.avatar.url || null);
    form.setValue("avatarFile", undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  async function onSubmit(data: ProfileFormData) {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);

      if (data.bio) {
        formData.append("bio", data.bio);
      }

      if (data.avatarFile) {
        formData.append("avatarFile", data.avatarFile);
      }

      console.log(formData);
      const res = await updateProfile(formData).unwrap();

      if (res.success) {
        toast.success(res.message as string);

        // Invalidate the Auth tag so `getProfile` refetches and updates cached profile
        try {
          dispatch(authApi.util.invalidateTags(["Auth"]));
        } catch (err) {
          // fallback: nothing, invalidation failure shouldn't block UI
          console.warn("Failed to invalidate auth tag:", err);
        }

        // reset form values to the latest submitted values
        form.reset({
          name: data.name,
          email: data.email,
          bio: data.bio || "",
        });

        return;
      }
    } catch (err: unknown) {
      toast.error((err?.data?.message as string) || "Something went wrong.");
      // Error is handled by the useEffect above
      console.error("Error in onSubmit:", err);
    } finally {
      setIsOpen(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Reset form when dialog closes
  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset avatar preview and form when dialog closes without saving
      setAvatarPreview(user.avatar?.url || null);
      form.reset({
        name: user.name,
        email: user.email,
        bio: user.bio || "",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl sm:text-3xl font-medium">
                Profile Information
              </h2>
              <ThemeToggle />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar?.url} />
                <AvatarFallback className="text-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl font-bold">
                  {user.name}
                </CardTitle>
                <CardDescription>
                  {user.bio || "No bio provided"}
                </CardDescription>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Profile Display */}
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Personal Info</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span className="font-medium">Name:</span>
                      <span>{user.name}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span className="font-medium">Email:</span>
                      <div className="flex items-center gap-2">
                        <span>{user.email}</span>
                        {user.isEmailVerified && (
                          <LucideBadgeCheck className="size-4 text-green-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span className="font-medium">Role:</span>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                    {user.bio && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <span className="font-medium block mb-2">Bio:</span>
                        <p className="text-sm">{user.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Account Details */}
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Account Details</h3>
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground">
                        Member since
                      </div>
                      <div className="font-medium">
                        {formatDate(user.createdAt)}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground">
                        Last updated
                      </div>
                      <div className="font-medium">
                        {formatDate(user.updatedAt)}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground">
                        User ID
                      </div>
                      <div className="font-mono text-sm break-all">
                        {user.id}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </CardContent>
          <Separator />
          <CardFooter>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between flex-wrap w-full gap-4">
              <Dialog open={isOpen} onOpenChange={handleDialogChange}>
                <DialogTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}>
                    <Button>Update Profile</Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                      Update your profile information and avatar.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6">
                      {/* Avatar Upload */}
                      <FormField
                        control={form.control}
                        name="avatarFile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile Picture</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <Avatar className="h-20 w-20">
                                    <AvatarImage
                                      src={avatarPreview || user.avatar?.url}
                                    />
                                    <AvatarFallback>
                                      {getInitials(
                                        form.watch("name") || user.name
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                  {avatarPreview &&
                                    avatarPreview !== user.avatar?.url && (
                                      <motion.button
                                        type="button"
                                        onClick={removeAvatar}
                                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}>
                                        <X className="h-4 w-4" />
                                      </motion.button>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                  <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    {...field}
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>
                                    ) => {
                                      field.onChange(e);
                                      handleAvatarChange(e);
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                      fileInputRef.current?.click()
                                    }
                                    className="w-full">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload New Photo
                                  </Button>
                                  <FormDescription>
                                    JPG, PNG, GIF, WebP. Max 5MB.
                                  </FormDescription>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Name Field */}
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Bio Field */}
                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us a little about yourself..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {field.value?.length || 0}/500 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleDialogChange(false)}
                          disabled={isLoading}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                              Saving...
                            </>
                          ) : (
                            "Save changes"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <HandleUserAccount user={user} />
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
