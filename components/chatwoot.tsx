'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function Chatwoot() {
  const { data: session } = useSession();

  useEffect(() => {
    const BASE_URL = 'https://chat.alt3dstudio.com';

    if ((window as any).chatwootSDK) return;

    const script = document.createElement('script');
    script.src = BASE_URL + '/packs/js/sdk.js';
    script.async = true;
    script.onload = () => {
      (window as any).chatwootSDK.run({
        websiteToken: 'cqpy71Mth5s2wtgUFi6CrqTr',
        baseUrl: BASE_URL,
      });
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    const user = session.user as any;

    const identify = () => {
      (window as any).$chatwoot?.setUser(user.id, {
        name: user.name ?? undefined,
        email: user.email ?? undefined,
      });
    };

    if ((window as any).$chatwoot) {
      identify();
    } else {
      window.addEventListener('chatwoot:ready', identify, { once: true });
      return () => window.removeEventListener('chatwoot:ready', identify);
    }
  }, [session]);

  return null;
}
