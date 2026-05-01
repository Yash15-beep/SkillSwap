const API_URL = 'http://localhost:3000/api';

export const getAllUsers = async (search = '', category = '', skillType = '') => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  if (skillType) params.append('skillType', skillType);
  
  const res = await fetch(`${API_URL}/users?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
  return data;
};

export const getUserById = async (id) => {
  const res = await fetch(`${API_URL}/users/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch user');
  return data;
};

export const updateUserProfile = async (id, userData) => {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update profile');
  return data;
};
