import { PhoneCall } from 'lucide-react';

interface MobileFloatingActivityButtonProps {
  onClick: () => void;
}

export function MobileFloatingActivityButton({ onClick }: MobileFloatingActivityButtonProps) {
  return (
    <div className="md:hidden fixed bottom-18 right-4 z-40">
      <button
        type="button"
        onClick={onClick}
        className="w-12 h-12 rounded-full bg-blue-900 text-white shadow-lg flex items-center justify-center hover:bg-blue-950 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900"
        aria-label="Quick log activity"
        title="Log trade activity"
      >
        <PhoneCall className="w-5 h-5" />
      </button>
    </div>
  );
}
