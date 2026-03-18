"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  username: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setUser(j?.data ?? null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
