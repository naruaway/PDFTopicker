import fs from 'fs'
import PDFParser from 'pdf2json/pdfparser'
import stopwords from 'stopwords'

const englishStopWords = new Set(stopwords.english)

Array.prototype.flatMap = function(fn) {
  return Array.prototype.concat.apply([], this.map(fn))
}

process.on('message', (filePath) => {

  const pdfParser = new PDFParser()

  pdfParser.on('pdfParser_dataReady', (data) => {
    const words = data.PDFJS.pages.flatMap((page) =>
        page.Texts.flatMap((text) => text.R.map((o) => o.T))
      ).map(word => decodeURIComponent(word).toLowerCase())
      .filter(word => /^[a-z.,-]{2,}$/.test(word))
      .map(word => word.replace(/[,.-]/, ''))

    const wordCounts = new Map()
    words.forEach((word) => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
    })
    const extractedWords = words.filter(word => wordCounts.get(word) >= 2)
      .filter(word => !englishStopWords.has(word))
    process.send({filePath, words: extractedWords})
  })

  pdfParser.on('pdfParser_dataError', (error) => {
    process.send({filePath, error})
  })

  pdfParser.loadPDF(filePath)
})
