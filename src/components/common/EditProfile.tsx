import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserDocument } from "@/types/types";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function EditProfile() {
  const [user, setUser] = useState<UserDocument>({} as UserDocument);
  const { data: session, update } = useSession();

  useEffect(() => {
    if (session && session.user) {
      setUser(session.user as UserDocument);
    }
  }, [session]);

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>
          Make changes to your profile here. Click save when you&apos;re done.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid items-center grid-cols-4 gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            id="name"
            defaultValue={session?.user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            className="col-span-3"
          />
        </div>
        <div className="grid items-center grid-cols-4 gap-4">
          <Label htmlFor="Email" className="text-right">
            Email
          </Label>
          <Input
            id="email"
            defaultValue={session?.user.email}
            disabled={session?.user.image ? true : false}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            className="col-span-3"
          />
        </div>
        <div className="grid items-center grid-cols-4 gap-4">
          <Label htmlFor="Phone" className="text-right">
            Phone
          </Label>
          <Input
            id="phone"
            defaultValue={session?.user.phone}
            disabled={session?.user.image ? true : false}
            onChange={(e) => setUser({ ...user, phone: e.target.value })}
            className="col-span-3"
          />
        </div>
      </div>
      <DialogFooter>
        <button
          onClick={() => {
            update({ ...user });
          }}
          className="text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-[#1F1F1F] hover:border-[#454545]"
        >
          Save changes
        </button>
      </DialogFooter>
    </DialogContent>
  );
}
