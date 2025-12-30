import { Sparkles, Tv2, User } from "lucide-react";
import { Session } from "next-auth";
import Link from "next/link";
import UserProfileDropdown from "@/components/user-profile-dropdown";
import { Button } from "@/components/ui/button";

interface HeaderActionsProps {
  session: Session | null | undefined;
  onAiClick: () => void;
  onSignIn: () => void;
}

export default function HeaderActions({
  session,
  onAiClick,
  onSignIn,
}: HeaderActionsProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button asChild variant="ghost" size="sm" className="inline-flex">
        <Link href="/live" className="gap-2">
          <Tv2 className="h-4 w-4" />
          Live
        </Link>
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={onAiClick}
        data-testid="button-ai-picks"
        className="hidden sm:inline-flex"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        AI Picks
      </Button>
      {session ? (
        <UserProfileDropdown />
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onSignIn}
          data-testid="button-signin"
          className="gap-2"
        >
          <User className="h-4 w-4 mr-0 sm:mr-2" />
          <span className="hidden sm:inline">Sign In</span>
        </Button>
      )}
    </div>
  );
}
