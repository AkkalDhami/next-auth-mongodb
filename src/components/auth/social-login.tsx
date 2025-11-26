import { FaGithub, FaGoogle } from "react-icons/fa6";
import React from "react";
import { Button } from "../ui/button";
import { signIn } from "next-auth/react";

function SocialSignin() {
  return (
    <form>
      <div className="flex flex-col mt-5 gap-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-500/30" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-sidebar px-4 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            // formAction={signInWithGoogle}
            onClick={() => signIn("google")}
            variant="outline"
            size={"lg"}
            className="w-full">
            <div className="flex items-center gap-2">
              <FaGoogle />
              <span>Google</span>
            </div>
          </Button>
          <Button
            // formAction={signInWithGithub}
            variant="outline"
            size={"lg"}
            className="w-full">
            <div className="flex items-center gap-2">
              <FaGithub />

              <span>GitHub</span>
            </div>
          </Button>
        </div>
      </div>
    </form>
  );
}

export default SocialSignin;
