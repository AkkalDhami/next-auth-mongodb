"use server";

import authOptions from "@/lib/next-auth";

export const signInWithGoogle = async () => {
  await signIn("google", {
    redirectTo: "/applicant/my-profile",
  });
};

// export const signInWithGithub = async () => {
//   await signIn("github", {
//     redirectTo: "/applicant/my-profile",
//   });
// };

// export const userSignOut = async () => {
//   await signOut({
//     redirectTo: "/login",
//   });
// };
