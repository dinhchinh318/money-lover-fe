import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { myInvitesApi } from "../../../../services/api.group";

const InvitesCtx = createContext(null);

export function useInvites() {
  const ctx = useContext(InvitesCtx);
  if (!ctx) throw new Error("useInvites must be used inside InvitesProvider");
  return ctx;
}

export function InvitesProvider({ children }) {
  const [invitesCount, setInvitesCount] = useState(0);

  const refreshInvitesCount = useCallback(async () => {
    const res = await myInvitesApi();
    const list = res?.data ?? res ?? [];
    const count = Array.isArray(list) ? list.length : 0;
    setInvitesCount(count);
  }, []);

  useEffect(() => { refreshInvitesCount(); }, [refreshInvitesCount]);

  return (
    <InvitesCtx.Provider value={{ invitesCount, refreshInvitesCount }}>
      {children}
    </InvitesCtx.Provider>
  );
}
