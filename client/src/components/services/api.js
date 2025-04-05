const api_url = process.env.REACT_APP_API_URL;

export const fetchReports = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${api_url}/api/reports`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch reports');
  }

  return res.json();
};