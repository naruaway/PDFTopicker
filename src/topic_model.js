import LDASCVB0 from './lda-scvb0'


function range(n) {
  const a = new Array(n)
  for (let i = 0; i < n; ++i) {
    a[i] = i
  }
  return a
}

function topicModel({documents, numTopics}) {
  const wordSet = new Set()
  documents.forEach(words => {
    words.forEach(word => {
      wordSet.add(word)
    })
  })
  const id2word = [...wordSet]
  const word2id = new Map()
  id2word.forEach((word, id) => word2id.set(word, id))

  const docs = documents.map(words => words.map(word => word2id.get(word)))

  const numDocuments = docs.length
  const numWords = docs.map(doc => doc.length).reduce((a, c) => a + c, 0)
  const numVocabulary = id2word.length

  const model = new LDASCVB0({numDocuments, numWords, numVocabulary, numTopics})
  for (let i = 0; i < 200; ++i) {
    docs.forEach(doc => {
      model.addDocument(doc)
    })
  }
  model.forceUpdate()


  const K = numTopics
  const V = numVocabulary
  const topics = []
  for (let k = 0; k < K; ++k) {
    const probs = model.nkv.slice(k * V, k * V + V)
    const idx = range(V)
    idx.sort((i, j) => probs[j] - probs[i])
    const words = []
    for (let i = 0; i < 200; ++i) {
      words.push(id2word[idx[i]])
    }
    topics.push(words)
  }

  return topics
}

export default topicModel
