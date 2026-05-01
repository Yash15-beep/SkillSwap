const API_URL = 'http://localhost:3000/api';

export const createSwapRequest = async (swapData) => {
  const res = await fetch(`${API_URL}/swaps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(swapData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create swap request');
  return data;
};

export const getUserSwaps = async (userId) => {
  const res = await fetch(`${API_URL}/swaps/user/${userId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch user swaps');
  return data; // returns { sent, received }
};

export const updateSwapStatus = async (swapId, newStatus) => {
  const res = await fetch(`${API_URL}/swaps/${swapId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update swap status');
  return data;
};
