import jsPDF from 'jspdf'

export interface PDFData {
  joven: {
    nombres: string
    apellidos: string
    edad: number
    expediente_administrativo?: string
    expediente_judicial?: string
    direccion?: string
    telefono?: string
    email?: string
    fecha_nacimiento?: string
    sexo?: string
    estado_civil?: string
    foto_url?: string
  }
  atencion?: {
    id: string
    tipo: string
    fecha_atencion: string
    motivo: string
    observaciones?: string
    recomendaciones?: string
    estado: string
    profesional: string
    proxima_cita?: string
  }
  formularioEspecifico?: any
}

export class PDFGenerator {
  private doc: jsPDF

  constructor() {
    this.doc = new jsPDF()
  }

  // Generar PDF del Expediente del Joven
  async generateExpedientePDF(data: PDFData): Promise<Blob> {
    this.doc = new jsPDF()
    
    // Configuración del documento
    this.doc.setProperties({
      title: `Expediente - ${data.joven.nombres} ${data.joven.apellidos}`,
      subject: 'Expediente INAMI',
      author: 'Sistema INAMI-APP',
      creator: 'INAMI-APP'
    })

    // Header del documento
    this.addHeader()
    
    // Información del joven
    this.addJovenInfo(data.joven)
    
    // Información de atenciones si existe
    if (data.atencion) {
      this.addAtencionInfo(data.atencion)
    }

    // Formulario específico si existe
    if (data.formularioEspecifico) {
      this.addFormularioEspecifico(data.formularioEspecifico)
    }

    // Footer
    this.addFooter()

    return this.doc.output('blob')
  }

  // Generar PDF de una Atención específica
  async generateAtencionPDF(data: PDFData): Promise<Blob> {
    this.doc = new jsPDF()
    
    // Configuración del documento
    this.doc.setProperties({
      title: `Atención - ${data.joven.nombres} ${data.joven.apellidos}`,
      subject: 'Atención INAMI',
      author: 'Sistema INAMI-APP',
      creator: 'INAMI-APP'
    })

    // Header del documento
    this.addHeader()
    
    // Información del joven
    this.addJovenInfo(data.joven)
    
    // Información de la atención
    if (data.atencion) {
      this.addAtencionInfo(data.atencion)
    }

    // Formulario específico si existe
    if (data.formularioEspecifico) {
      this.addFormularioEspecifico(data.formularioEspecifico)
    }

    // Footer
    this.addFooter()

    return this.doc.output('blob')
  }

  private addHeader() {
    // Logo y título
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('INSTITUTO NACIONAL PARA LA ATENCIÓN', 20, 30)
    this.doc.text('DE MENORES INFRACTORES (INAMI)', 20, 40)
    
    // Línea separadora
    this.doc.setLineWidth(0.5)
    this.doc.line(20, 45, 190, 45)
    
    // Fecha de generación
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 20, 55)
  }

  private addJovenInfo(joven: PDFData['joven']) {
    let yPosition = 70

    // Título de sección
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('INFORMACIÓN DEL NNAJ', 20, yPosition)
    yPosition += 10

    // Línea separadora
    this.doc.setLineWidth(0.3)
    this.doc.line(20, yPosition, 190, yPosition)
    yPosition += 10

    // Datos del joven
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')

    const jovenData = [
      ['Nombre Completo:', `${joven.nombres} ${joven.apellidos}`],
      ['Edad:', `${joven.edad} años`],
      ['Expediente Administrativo:', joven.expediente_administrativo],
      ['Expediente Judicial:', joven.expediente_judicial || 'No especificado'],
      ['Fecha de Nacimiento:', joven.fecha_nacimiento || 'No especificada'],
      ['Sexo:', joven.sexo || 'No especificado'],
      ['Estado Civil:', joven.estado_civil || 'No especificado'],
      ['Dirección:', joven.direccion || 'No especificada'],
      ['Teléfono:', joven.telefono || 'No especificado'],
      ['Email:', joven.email || 'No especificado']
    ]

    jovenData.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(label, 20, yPosition)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(value, 80, yPosition)
      yPosition += 6
    })

    // Verificar si necesitamos nueva página
    if (yPosition > 250) {
      this.doc.addPage()
      yPosition = 20
    }
  }

  private addAtencionInfo(atencion: PDFData['atencion']) {
    let yPosition = this.doc.getTextDimensions('').h + 20

    // Título de sección
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('INFORMACIÓN DE LA ATENCIÓN', 20, yPosition)
    yPosition += 10

    // Línea separadora
    this.doc.setLineWidth(0.3)
    this.doc.line(20, yPosition, 190, yPosition)
    yPosition += 10

    // Datos de la atención
    if (atencion) {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')

      const atencionData = [
        ['Tipo de Atención:', atencion.tipo],
        ['Fecha y Hora:', atencion.fecha_atencion],
        ['Estado:', atencion.estado],
        ['Profesional:', atencion.profesional],
        ['Motivo:', atencion.motivo],
        ['Próxima Cita:', atencion.proxima_cita || 'No programada']
      ]

    atencionData.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(label, 20, yPosition)
      this.doc.setFont('helvetica', 'normal')
      
      // Manejar texto largo
      const textLines = this.doc.splitTextToSize(value, 100)
      this.doc.text(textLines, 80, yPosition)
      yPosition += textLines.length * 6
      })

      // Observaciones
      if (atencion.observaciones) {
        yPosition += 10
        this.doc.setFont('helvetica', 'bold')
        this.doc.text('Observaciones:', 20, yPosition)
        yPosition += 6
        this.doc.setFont('helvetica', 'normal')
        const observacionesLines = this.doc.splitTextToSize(atencion.observaciones, 170)
        this.doc.text(observacionesLines, 20, yPosition)
        yPosition += observacionesLines.length * 6
      }

      // Recomendaciones
      if (atencion.recomendaciones) {
        yPosition += 10
        this.doc.setFont('helvetica', 'bold')
        this.doc.text('Recomendaciones:', 20, yPosition)
        yPosition += 6
        this.doc.setFont('helvetica', 'normal')
        const recomendacionesLines = this.doc.splitTextToSize(atencion.recomendaciones, 170)
        this.doc.text(recomendacionesLines, 20, yPosition)
        yPosition += recomendacionesLines.length * 6
      }
    }
  }

  private addFormularioEspecifico(formulario: any) {
    let yPosition = this.doc.getTextDimensions('').h + 20

    // Verificar si necesitamos nueva página
    if (yPosition > 200) {
      this.doc.addPage()
      yPosition = 20
    }

    // Título de sección
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('FORMULARIO ESPECÍFICO', 20, yPosition)
    yPosition += 10

    // Línea separadora
    this.doc.setLineWidth(0.3)
    this.doc.line(20, yPosition, 190, yPosition)
    yPosition += 10

    // Datos del formulario
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')

    Object.entries(formulario).forEach(([key, value]) => {
      if (value && value !== '') {
        this.doc.setFont('helvetica', 'bold')
        this.doc.text(`${key.replace(/_/g, ' ').toUpperCase()}:`, 20, yPosition)
        this.doc.setFont('helvetica', 'normal')
        
        const valueStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
        const textLines = this.doc.splitTextToSize(valueStr, 170)
        this.doc.text(textLines, 20, yPosition + 6)
        yPosition += 6 + (textLines.length * 6) + 5
      }
    })
  }

  private addFooter() {
    const pageCount = (this.doc as any).internal.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      
      // Línea separadora
      this.doc.setLineWidth(0.3)
      this.doc.line(20, 280, 190, 280)
      
      // Texto del footer
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text('Sistema INAMI-APP - Documento generado automáticamente', 20, 285)
      this.doc.text(`Página ${i} de ${pageCount}`, 170, 285)
    }
  }

  // Método para descargar el PDF
  static async downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

// Funciones de utilidad para exportar desde las páginas
export const exportExpedientePDF = async (data: PDFData) => {
  const generator = new PDFGenerator()
  const blob = await generator.generateExpedientePDF(data)
  const filename = `Expediente_${data.joven.nombres}_${data.joven.apellidos}_${new Date().toISOString().split('T')[0]}.pdf`
  await PDFGenerator.downloadPDF(blob, filename)
}

export const exportAtencionPDF = async (data: PDFData) => {
  const generator = new PDFGenerator()
  const blob = await generator.generateAtencionPDF(data)
  const filename = `Atencion_${data.joven.nombres}_${data.joven.apellidos}_${new Date().toISOString().split('T')[0]}.pdf`
  await PDFGenerator.downloadPDF(blob, filename)
}

