export async function generateQuotation(formData) {
  const response = await fetch('http://127.0.0.1:8000/routes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })

  if (!response.ok) {
    throw new Error('Failed to generate quotation')
  }

  return await response.json()
}