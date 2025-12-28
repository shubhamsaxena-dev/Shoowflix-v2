import { Session } from "next-auth";
import HeaderActions from "./header-actions";
import HeaderBrand from "./header-brand";
import HeaderSearch from "./header-search";

interface AppHeaderProps {
  session: Session | null | undefined;
  onSearch: (query: string) => void;
  onAiClick: () => void;
  onSignIn: () => void;
}

export default function AppHeader({
  session,
  onSearch,
  onAiClick,
  onSignIn,
}: AppHeaderProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border transition-all duration-300"
      style={{ contain: "layout style" }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <HeaderBrand />
          <HeaderSearch onSearch={onSearch} />
          <HeaderActions
            session={session}
            onAiClick={onAiClick}
            onSignIn={onSignIn}
          />
        </div>
      </div>
    </header>
  );
}
