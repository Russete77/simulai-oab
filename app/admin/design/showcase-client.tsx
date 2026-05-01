'use client';

import { useState } from 'react';
import { Toggle } from '@/components/ui';

export function ShowcaseClient() {
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);
  const [promo, setPromo] = useState(false);

  return (
    <div className="space-y-1 -mx-6 -mb-6">
      <div className="px-6 py-3 hairline first:border-t-0">
        <Toggle
          checked={push}
          onChange={setPush}
          label="Push notifications"
          description="Notificações no dispositivo"
        />
      </div>
      <div className="px-6 py-3 hairline">
        <Toggle
          checked={email}
          onChange={setEmail}
          label="Emails"
          description="Receber emails do app"
        />
      </div>
      <div className="px-6 py-3 hairline">
        <Toggle
          checked={promo}
          onChange={setPromo}
          label="Promoções"
          description="Descontos e ofertas especiais"
        />
      </div>
    </div>
  );
}
