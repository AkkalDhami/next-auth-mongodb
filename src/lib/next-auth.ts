import dbConnect from "@/configs/db";
import { env } from "@/configs/env";
import User from "@/models/user.model";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ account, profile }) {
      console.log({ profile });
      if (!account || !profile) return false;
      if (account?.provider === "google") {
        await dbConnect();
        const user = await User.findOne({ email: profile?.email });
        if (!user) {
          await User.create({
            email: profile?.email,
            name: profile?.name,
            avatar: {
              url: profile?.image,
            },
            providerAccountId: account.providerAccountId,
            provider: account.provider,
            isEmailVerified: true,
          });
        }
        await User.findOneAndUpdate(
          { email: profile?.email },
          {
            $set: {
              providerAccountId: account.providerAccountId,
              provider: account.provider,
              isEmailVerified: true,
            },
          }
        );
      }
      return true;
    },
  },

  session: {
    strategy: "jwt",
  },

  pages: {},

  secret: env.NEXTAUTH_SECRET,
};

export default authOptions;
