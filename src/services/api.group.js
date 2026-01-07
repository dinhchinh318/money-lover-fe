import axios from "./axios.customize";

// GROUP
export const createGroupApi = (data) => axios.post("/v1/api/groups", data);
export const myGroupsApi = () => axios.get("/v1/api/groups/me");
export const groupDetailApi = (groupId) => axios.get(`/v1/api/groups/${groupId}`);
export const leaveGroupApi = (groupId) => axios.post(`/v1/api/groups/${groupId}/leave`);
export const removeMemberApi = (groupId, userId) =>
  axios.delete(`/v1/api/groups/${groupId}/members/${userId}`);
export const setMemberRoleApi = (groupId, userId, role) =>
  axios.patch(`/v1/api/groups/${groupId}/members/${userId}/role`, { role });

export const updateGroupApi = (groupId, data) => axios.patch(`/v1/api/groups/${groupId}`, data);
export const deleteGroupApi = (groupId) => axios.delete(`/v1/api/groups/${groupId}`);

// INVITES
export const createInviteApi = (groupId, data) =>
  axios.post(`/v1/api/groups/${groupId}/invites`, data);
export const myInvitesApi = () => axios.get("/v1/api/groups/invites/me");
export const acceptInviteApi = (token) => axios.post(`/v1/api/groups/invites/${token}/accept`);
export const declineInviteApi = (token) => axios.post(`/v1/api/groups/invites/${token}/decline`);
export const revokeInviteApi = (inviteId) => axios.post(`/v1/api/groups/invites/${inviteId}/revoke`);

// WALLETS
export const listGroupWalletsApi = (groupId) => axios.get(`/v1/api/groups/${groupId}/wallets`);
export const createGroupWalletApi = (groupId, data) =>
  axios.post(`/v1/api/groups/${groupId}/wallets`, data);
export const updateGroupWalletApi = (groupId, walletId, data) =>
  axios.patch(`/v1/api/groups/${groupId}/wallets/${walletId}`, data);
export const disableGroupWalletApi = (groupId, walletId) =>
  axios.delete(`/v1/api/groups/${groupId}/wallets/${walletId}`);
export const recalcGroupWalletApi = (groupId, walletId) =>
  axios.post(`/v1/api/groups/${groupId}/wallets/${walletId}/recalc`);

// CATEGORIES
export const listGroupCategoriesApi = (groupId) => axios.get(`/v1/api/groups/${groupId}/categories`);
export const createGroupCategoryApi = (groupId, data) =>
  axios.post(`/v1/api/groups/${groupId}/categories`, data);
export const updateGroupCategoryApi = (groupId, categoryId, data) =>
  axios.patch(`/v1/api/groups/${groupId}/categories/${categoryId}`, data);
export const disableGroupCategoryApi = (groupId, categoryId) =>
  axios.delete(`/v1/api/groups/${groupId}/categories/${categoryId}`);

// BUDGETS
export const listGroupBudgetsApi = (groupId) => axios.get(`/v1/api/groups/${groupId}/budgets`);
export const createGroupBudgetApi = (groupId, data) =>
  axios.post(`/v1/api/groups/${groupId}/budgets`, data);
export const disableGroupBudgetApi = (groupId, budgetId) =>
  axios.delete(`/v1/api/groups/${groupId}/budgets/${budgetId}`);
export const budgetProgressApi = (groupId, budgetId) =>
  axios.get(`/v1/api/groups/${groupId}/budgets/${budgetId}/progress`);

// TRANSACTIONS
export const listGroupTxApi = (groupId, params) =>
  axios.get(`/v1/api/groups/${groupId}/transactions`, { params });
export const createGroupTxApi = (groupId, data) =>
  axios.post(`/v1/api/groups/${groupId}/transactions`, data);
export const updateGroupTxApi = (groupId, txId, data) =>
  axios.patch(`/v1/api/groups/${groupId}/transactions/${txId}`, data);
export const removeGroupTxApi = (groupId, txId) =>
  axios.delete(`/v1/api/groups/${groupId}/transactions/${txId}`);

// REPORTS
export const reportSummaryApi = (groupId, params) =>
  axios.get(`/v1/api/groups/${groupId}/reports/summary`, { params });
export const reportByCategoryApi = (groupId, params) =>
  axios.get(`/v1/api/groups/${groupId}/reports/by-category`, { params });
export const reportByWalletApi = (groupId, params) =>
  axios.get(`/v1/api/groups/${groupId}/reports/by-wallet`, { params });
