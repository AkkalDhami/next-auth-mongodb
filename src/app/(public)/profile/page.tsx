"use client";
import { UpdateProfileForm } from "@/components/auth/update-profile";
import { Spinner } from "@/components/ui/spinner";
import { useGetProfileQuery } from "@/redux/features/auth/authApi";


function Profile() {
  const { data, isLoading } = useGetProfileQuery();

  const profile = data?.data?.user;
  console.log(data?.data);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-4">
        <Spinner className="size-8" /> Profile Loading....
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center mt-20">No profile data found.</div>;
  }
  return <UpdateProfileForm user={profile} />;
}

export default Profile;
