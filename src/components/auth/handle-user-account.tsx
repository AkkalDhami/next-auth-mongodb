import { useDeleteAccountMutation, User } from "@/redux/features/auth/authApi";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

import React from "react";
import { Button } from "../ui/button";
import toast from "react-hot-toast";

function HandleUserAccount({ user }: { user: User }) {
  const [deleteAccount, { isLoading }] = useDeleteAccountMutation();

  const handleDeleteAccount = async (type: "soft" | "hard") => {
    try {
      const res = await deleteAccount({ type }).unwrap();
      console.log(res);
      if (res.success) {
        toast.success(res.data?.message as string);
      }
    } catch (error) {
      toast.error(error?.data?.message);
      console.log(error);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {!user.isDeleted && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant={"outline"}
            disabled={isLoading}
            onClick={() => handleDeleteAccount("soft")}
            className={cn(
              "border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground",
              "bg-destructive/10 hover:bg-destructive/20 dark:bg-destructive/10 dark:hover:bg-destructive/20"
            )}>
            {isLoading ? "Processing..." : "Deactivate Account"}
          </Button>
        </motion.div>
      )}
      {!user.isDeleted && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant={"destructive"}
            disabled={isLoading}
            onClick={() => handleDeleteAccount("hard")}>
            {isLoading ? "Processing..." : "Delete Account"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}

export { HandleUserAccount };
