"use client";

import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Bookmark, LogOut, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/menu";
import { Skeleton } from "@/components/ui/skeleton";
import styles from "./user-nav.module.css";

export function UserNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname() ?? "/";

  if (status === "loading") return <Skeleton className={styles.placeholder} />;

  if (!session?.user) {
    const onAuthPage = pathname.startsWith("/signin") || pathname.startsWith("/register");
    const href = onAuthPage || pathname === "/" ? "/signin" : `/signin?callbackUrl=${encodeURIComponent(pathname)}`;
    return (
      <ButtonLink href={href} variant="secondary" size="sm" className={styles.signIn}>
        Sign in
      </ButtonLink>
    );
  }

  const { name, email, image } = session.user;

  return (
    <Menu
      label="Account"
      align="end"
      triggerClassName={styles.trigger}
      trigger={<Avatar key={image ?? "none"} name={name} email={email} src={image} size="sm" />}
    >
      <MenuLabel className={styles.who}>
        <Avatar key={image ?? "none"} name={name} email={email} src={image} size="md" />
        <span className={styles.whoText}>
          <span className={styles.name}>{name || "Your account"}</span>
          {email ? <span className={styles.email}>{email}</span> : null}
        </span>
      </MenuLabel>
      <MenuSeparator />
      <MenuItem href="/profile" icon={<User />}>
        Profile
      </MenuItem>
      <MenuItem href="/my-list" icon={<Bookmark />}>
        My List
      </MenuItem>
      <MenuSeparator />
      <MenuItem icon={<LogOut />} tone="danger" onSelect={() => void signOut({ callbackUrl: "/" })}>
        Sign out
      </MenuItem>
    </Menu>
  );
}
