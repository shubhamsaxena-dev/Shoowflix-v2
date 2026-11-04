import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, KeyRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SignOutButton } from "@/components/account/sign-out-button";
import { NameForm } from "./name-form";
import styles from "./profile.module.css";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false },
};

const memberSince = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/signin?callbackUrl=/profile");

  const [user, list, inProgress] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        image: true,
        createdAt: true,
        password: true,
        accounts: { select: { provider: true } },
      },
    }),
    prisma.userFeaturedMovies.findUnique({ where: { userId }, select: { movieIds: true } }),
    prisma.watchProgress.count({ where: { userId } }),
  ]);

  if (!user) redirect("/signin?callbackUrl=/profile");

  const name = user.name || session.user.name || "";
  const listCount = list?.movieIds.length ?? 0;
  const methods = [
    ...(user.accounts.some((a) => a.provider === "google") ? ["Google"] : []),
    ...(user.password ? ["Email and password"] : []),
  ];

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <Avatar name={name} email={user.email} src={user.image} size="xl" className={styles.avatar} />
        <div className={styles.identity}>
          <h1 className={styles.name}>{name || "Your profile"}</h1>
          <p className={styles.meta}>
            {user.email ? <span>{user.email}</span> : null}
            <span className="mono">Member since {memberSince.format(user.createdAt)}</span>
          </p>
        </div>
      </header>

      <section aria-label="Your activity" className={styles.stats}>
        <Link href="/my-list" className={styles.stat}>
          <span className={styles.statValue}>{listCount}</span>
          <span className={styles.statLabel}>
            {listCount === 1 ? "Film" : "Films"} in My List
            <ArrowRight aria-hidden />
          </span>
        </Link>
        <Link href="/" className={styles.stat}>
          <span className={styles.statValue}>{inProgress}</span>
          <span className={styles.statLabel}>
            {inProgress === 1 ? "Film" : "Films"} in progress
            <ArrowRight aria-hidden />
          </span>
        </Link>
      </section>

      <div className={styles.sections}>
        <section className={styles.section} aria-labelledby="account-heading">
          <div className={styles.sectionHead}>
            <h2 id="account-heading" className={styles.sectionTitle}>
              Account
            </h2>
            <p className={styles.sectionText}>How you appear and how you sign in.</p>
          </div>
          <div className={styles.sectionBody}>
            <NameForm defaultName={name} />
            <dl className={styles.details}>
              <div>
                <dt>Email</dt>
                <dd>{user.email ?? "Not set"}</dd>
              </div>
              <div>
                <dt>Sign-in method</dt>
                <dd className={styles.badges}>
                  {methods.length ? methods.map((m) => <Badge key={m}>{m}</Badge>) : <Badge>Unknown</Badge>}
                </dd>
              </div>
            </dl>
          </div>
        </section>


        {user.email ? (
          <section className={styles.section} aria-labelledby="password-heading">
            <div className={styles.sectionHead}>
              <h2 id="password-heading" className={styles.sectionTitle}>
                Password
              </h2>
              <p className={styles.sectionText}>
                {user.password
                  ? "Change your password. We’ll email a code to confirm it’s you."
                  : "You sign in with Google. Set a password to sign in with your email too."}
              </p>
            </div>
            <div className={styles.sectionBody}>
              <ButtonLink href="/forgot-password" variant="secondary">
                <KeyRound aria-hidden />
                {user.password ? "Reset password" : "Set a password"}
              </ButtonLink>
            </div>
          </section>
        ) : null}

        <section className={styles.section} aria-labelledby="session-heading">
          <div className={styles.sectionHead}>
            <h2 id="session-heading" className={styles.sectionTitle}>
              Session
            </h2>
            <p className={styles.sectionText}>Sign out of Shoowflix on this device.</p>
          </div>
          <div className={styles.sectionBody}>
            <SignOutButton />
          </div>
        </section>
      </div>
    </div>
  );
}
