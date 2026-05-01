import { CampaignForm } from './campaign-form';

export const metadata = { title: 'Nova campanha · Admin' };

export default function NewCampaignPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-3xl font-bold text-ink-1 tracking-tight">Nova campanha</h1>
        <p className="text-ink-3 text-sm mt-1">
          Crie um template multicanal e dispare pra audiência segmentada.
        </p>
      </header>

      <CampaignForm />
    </div>
  );
}
