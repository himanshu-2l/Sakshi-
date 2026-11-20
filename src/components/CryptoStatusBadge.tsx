import { AlertTriangle, CheckCircle2, ShieldAlert, WifiOff } from "lucide-react";

interface CryptoStatusBadgeProps {
  valid: boolean;
  offlineCount?: number;
  tamperAlert?: boolean;
  excursionAlert?: boolean;
}

export function CryptoStatusBadge({
  valid,
  offlineCount = 0,
  tamperAlert = false,
  excursionAlert = false,
}: CryptoStatusBadgeProps) {
  if (!valid || tamperAlert) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFE4E6] text-[#BE123C]">
        <ShieldAlert className="w-3.5 h-3.5" />
        Integrity Breach
      </span>
    );
  }

  if (excursionAlert) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#B45309]">
        <AlertTriangle className="w-3.5 h-3.5" />
        Signed Excursion
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E6F5EE] text-[#0B7A53]">
      <CheckCircle2 className="w-3.5 h-3.5" />
      ECDSA Verified
      {offlineCount > 0 && (
        <span className="inline-flex items-center gap-1 ml-1 pl-1.5 border-l border-[#0B7A53]/25 text-[#0369A1]">
          <WifiOff className="w-3 h-3" />
          {offlineCount} synced
        </span>
      )}
    </span>
  );
}
