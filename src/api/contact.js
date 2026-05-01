const API_URL = 'http://localhost:3000/api';

export const submitContactInquiry = async (contactData) => {
  const res = await fetch(`${API_URL}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contactData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit inquiry');
  return data;
};
