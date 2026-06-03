import { NedarimSettingsForm } from "@/features/nedarim/NedarimSettingsForm";
import { AiSettingsForm } from "@/features/ai/AiSettingsForm";
import { WhatsAppSettingsForm } from "@/features/whatsapp/components/WhatsAppSettingsForm";

export default function SettingsPage() {
  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Payment Settings</h2>
          <p className="text-muted-foreground text-sm">Configure Nedarim Plus integration credentials.</p>
        </div>
        <NedarimSettingsForm />
      </div>

      <div className="space-y-6 border-t pt-8">
        <div>
          <h2 className="text-xl font-semibold">AI Settings</h2>
          <p className="text-muted-foreground text-sm">Configure Google AI (Gemini) API credentials for content generation.</p>
        </div>
        <AiSettingsForm />
      </div>

      <div className="space-y-6 border-t pt-8">
        <div>
          <h2 className="text-xl font-semibold">WhatsApp Settings (Green API)</h2>
          <p className="text-muted-foreground text-sm">Configure Green API credentials to enable WhatsApp sending and syncing.</p>
        </div>
        <WhatsAppSettingsForm />
      </div>
    </div>
  );
}
