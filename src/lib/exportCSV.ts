export function exportCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return

  // Colonnes à exclure
  const exclude = ['id', 'user_id', 'password_hash', 'stripe_customer_id']

  const keys = Object.keys(data[0]).filter(k => !exclude.includes(k))

  // Header
  const header = keys.join(';')

  // Rows
  const rows = data.map(row =>
    keys.map(k => {
      const val = row[k] ?? ''
      // Échapper les valeurs avec virgule/point-virgule/guillemets
      const str = String(val).replace(/"/g, '""')
      return str.includes(';') || str.includes('"') || str.includes('\n')
        ? `"${str}"`
        : str
    }).join(';')
  )

  const csv     = [header, ...rows].join('\n')
  const BOM     = '\uFEFF' // Pour Excel FR
  const blob    = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url     = URL.createObjectURL(blob)
  const link    = document.createElement('a')
  link.href     = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
