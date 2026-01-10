import GroupsLayout from "../GroupsLayout";
import { InvitesProvider } from "./InvitesContext";

export default function GroupsProviders() {
  return (
    <InvitesProvider>
      <GroupsLayout />
    </InvitesProvider>
  );
}
