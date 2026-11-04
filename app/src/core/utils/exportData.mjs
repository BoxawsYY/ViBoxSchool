import ExcelJS from 'exceljs'

export async function exportDataToExcel(data, fileName = 'export.xlsx') {
  if (!data || !data.length) {
    console.error('No hay datos para exportar.')
    return
  }

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Datos')

  const headers = Object.keys(data[0])
  worksheet.addRow(headers)

  data.forEach(row => {
    worksheet.addRow(headers.map(header => row[header]))
  })

  worksheet.columns.forEach(column => {
    let maxLength = 0
    column.eachCell({ includeEmpty: true }, cell => {
      const value = cell.value ? cell.value.toString() : ''
      maxLength = Math.max(maxLength, value.length)
    })
    column.width = maxLength < 10 ? 10 : maxLength
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportDataToExcelOldFormat(data, fileName = 'export.xls') {
  if (!data || !data.length) {
    console.error('No hay datos para exportar.')
    return
  }

  const headers = Object.keys(data[0])
  let html = '<table><thead><tr>'

  headers.forEach(header => {
    html += `<th>${header}</th>`
  })
  html += '</tr></thead><tbody>'

  data.forEach(row => {
    html += '<tr>'
    headers.forEach(header => {
      html += `<td>${row[header] != null ? row[header] : ''}</td>`
    })
    html += '</tr>'
  })

  html += '</tbody></table>'

  const blob = new Blob(
    [
      '\uFEFF',
      `<html xmlns:o="urn:schemas-microsoft-com:office:office" 
             xmlns:x="urn:schemas-microsoft-com:office:excel" 
             xmlns="http://www.w3.org/TR/REC-html40">
         <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
         <x:Name>Hoja1</x:Name>
         <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
         </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
         <body>${html}</body></html>`
    ],
    { type: 'application/vnd.ms-excel' }
  )

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}