'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const PUBLIC_PATHS = ['/login', '/register'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Check if the current path is public
    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

    if (isPublicPath) {
      setAuthorized(true);
      return;
    }

    // Check for token in localStorage
    const token = localStorage.getItem('token');

    if (!token) {
      // No token found, redirect to login
      router.push('/login');
    } else {
      // Token exists, allow access
      // (Optionally, we could verify token validity here, but Axios interceptor handles 401s)
      setAuthorized(true);
    }
  }, [pathname, router]);

  // Show nothing while checking auth (or a loading spinner)
  if (!authorized) {
      // If public path, we can show children immediately (though useEffect runs after render, so simple return null avoids flash)
      // Actually, if we are on a public path, we want to render.
      // If we are on a private path and checking, we render null.
      if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
          return <>{children}</>;
      }
      return null; 
  }

  return <>{children}</>;
}
