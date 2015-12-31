const numMiniBatches = 100

function rand(n) {
  return Math.floor(Math.random() * n)
}

function robbinsMonro(s, tau, kappa) {
  let t = 0
  return function () {
    ++t
    return s / Math.pow((tau + t), kappa)
  }
}

class LDASCVB0 {
  constructor({numDocuments, numWords, numVocabulary, numTopics}) {
    this.numDocuments = numDocuments
    this.numWords = numWords
    this.numVocabulary = numVocabulary
    this.numTopics = numTopics
    const K = this.numTopics
    const V = this.numVocabulary

    this.alpha = 50.0 / this.numTopics
    this.beta = 0.01

    this.nk = new Float64Array(this.numTopics)
    for (let k = 0; k < K; ++k) {
      this.nk[k] = this.numWords / K
    }
    this.nkv = new Float64Array(this.numTopics * this.numVocabulary)
    for (let k = 0; k < K; ++k) {
      let s = 0.0
      for (let v = 0; v < V; ++v) {
        this.nkv[k * V + v] = Math.random() + 0.001
        s += this.nkv[k * V + v]
      }
      for (let v = 0; v < V; ++v) {
        this.nkv[k * V + v] *= this.numWords / (K * s)
      }
    }
    this.ndk = new Float64Array(this.numTopics)

    this.nk_ = new Float64Array(this.numTopics)
    this.nkv_ = new Float64Array(this.numTopics * this.numVocabulary)
    this.miniBatchCount = 0

    this.topicPosterior = new Float64Array(this.numTopics)
    this.rho = robbinsMonro(10, 1000, 0.9)
  }

  addDocument(document) {
    const documentLength = document.length
    const K = this.numTopics
    const V = this.numVocabulary
    const alpha = this.alpha
    const beta = this.beta
    const rho = robbinsMonro(1, 10, 0.9)

    let s = 0.0
    for (let k = 0; k < K; ++k) {
      this.ndk[k] = this.nk[k]
      s += this.ndk[k]
    }
    for (let k = 0; k < K; ++k) {
      this.ndk[k] *= documentLength / s
    }

    const numLoop = documentLength * 4
    const randIndex = rand.bind(null, document.length)
    for (let i = 0; i < numLoop; ++i) {
      const word = document[randIndex()]
      let s = 0.0
      for (let k = 0; k < K; ++k) {
        this.topicPosterior[k] =  (this.nkv[k * V + word] + beta) / (this.nk[k] + V * beta)
        this.topicPosterior[k] *= this.ndk[k] + alpha
        s += this.topicPosterior[k]
      }
      for (let k = 0; k < K; ++k) {
        this.topicPosterior[k] /= s
      }
      const rate = rho()
      for (let k = 0; k < K; ++k) {
        this.ndk[k] = (1 - rate) * this.ndk[k] + rate * documentLength * this.topicPosterior[k]
      }

      if (numLoop - i > documentLength) {
        continue
      }

      for (let k = 0; k < K; ++k) {
        this.nk_[k] += this.numWords * this.topicPosterior[k]
        this.nkv_[k * V + word] += this.numWords * this.topicPosterior[k]
      }
      ++this.miniBatchCount
      if (this.miniBatchCount >= numMiniBatches) {
        const globalRate = this.rho()
        for (let k = 0; k < K; ++k) {
          this.nk[k] = (1 - globalRate) * this.nk[k] + globalRate * (this.nk_[k] / this.miniBatchCount)
        }
        for (let k = 0; k < K; ++k) {
          for (let v = 0; v < V; ++v) {
            this.nkv[k * V + v] = (1 - globalRate) * this.nkv[k * V + v] + globalRate * (this.nkv_[k * V + v] / this.miniBatchCount)
          }
        }
        this.miniBatchCount = 0
        for (let k = 0; k < K; ++k) {
          this.nk_[k] = 0.0
        }
        for (let k = 0; k < K; ++k) {
          for (let v = 0; v < V; ++v) {
            this.nkv_[k * V + v] = 0.0
          }
        }
      }
    }
  }
  forceUpdate() {
    const K = this.numTopics
    const V = this.numVocabulary
    if (this.miniBatchCount == 0) {
      return
    }
    const globalRate = this.rho()
    for (let k = 0; k < K; ++k) {
      this.nk[k] = (1 - globalRate) * this.nk[k] + globalRate * (this.nk_[k] / this.miniBatchCount)
    }
    for (let k = 0; k < K; ++k) {
      for (let v = 0; v < V; ++v) {
        this.nkv[k * V + v] = (1 - globalRate) * this.nkv[k * V + v] + globalRate * (this.nkv_[k * V + v] / this.miniBatchCount)
      }
    }
    this.miniBatchCount = 0
    for (let k = 0; k < K; ++k) {
      this.nk_[k] = 0.0
    }
    for (let k = 0; k < K; ++k) {
      for (let v = 0; v < V; ++v) {
        this.nkv_[k * V + v] = 0.0
      }
    }
  }
}

export default LDASCVB0
