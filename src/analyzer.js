import topicModel from './topic_model'

process.on('message', ({documents, numTopics}) => {
  const topics = topicModel({documents, numTopics})
  process.send({topics})
})
