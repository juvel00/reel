"use client";

import { Clapperboard, Loader2, LogIn } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-base-200 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm"
      >
        <Link href="/" className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-neutral text-neutral-content">
            <Clapperboard className="h-5 w-5" />
          </span>
          <span className="text-2xl font-black">Reel</span>
        </Link>

        <h1 className="text-2xl font-black">Sign in</h1>

        <div className="mt-6 space-y-4">
          <label className="form-control">
            <span className="label-text">Email</span>
            <input
              className="input input-bordered mt-2 w-full"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="form-control">
            <span className="label-text">Password</span>
            <input
              className="input input-bordered mt-2 w-full"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-error">{error}</p>}

        <button className="btn btn-neutral mt-6 w-full gap-2" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          Sign in
        </button>

        <p className="mt-6 text-center text-sm text-base-content/70">
          New here?{" "}
          <Link className="font-semibold text-primary" href="/register">
            Create account
          </Link>
        </p>
      </form>
    </main>
  );
}
