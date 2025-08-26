import { Button } from './ui/button';
import { Download, X } from 'lucide-react';

interface InstallBannerProps {
  showInstallPrompt: boolean;
  onInstallClick: () => void;
  onDismiss: () => void;
}

export function InstallBanner({ showInstallPrompt, onInstallClick, onDismiss }: InstallBannerProps) {
  if (!showInstallPrompt) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-4 shadow-lg">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <Download className="h-5 w-5" />
          <div>
            <p className="text-sm font-medium">Install App</p>
            <p className="text-xs opacity-90">Add to Home Screen for quick access</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={onInstallClick}>
            Install
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}