import {Observable} from 'rx'
import combineLatestObj from 'rx-combine-latest-obj'
import Cycle from '@cycle/core'
import {makeDOMDriver, h} from '@cycle/dom'
import {preventDragDropFileOpening, makeIPCDriver} from './utils'
import I from 'immutable'



preventDragDropFileOpening()

function intent(DOM, Worker, Analyzer) {


  return {
    dropFile$: DOM.select('.drop-here').events('drop')
      .do(ev => {ev.preventDefault()})
      .flatMap(ev => Array.from(ev.dataTransfer.files).map(file => file.path)).share(),

    processedFile$: Worker.filter(message => !message.error)
      .map(({filePath}) => filePath),

    clickAnalyze$: DOM.select('.analyze-button').events('click')
      .do(ev => ev.preventDefault())
      .map(() => true),

    showResult$: Analyzer,
  }
}

function model(actions) {
  const droppedFilesMod$ = actions.dropFile$
    .map(filePath => files => files.add(filePath))

  const droppedFiles$ = droppedFilesMod$.startWith(I.OrderedSet()).scan((files, fn) => fn(files))

  const processedFilesMod$ = actions.processedFile$
    .map(filePath => files => files.add(filePath))

  const processedFiles$ = processedFilesMod$.startWith(I.OrderedSet()).scan((files, fn) => fn(files))

  const state$ = combineLatestObj({
      droppedFiles$,
      processedFiles$,
      showResult$: actions.showResult$.startWith(null),
      analyzing$: actions.clickAnalyze$.startWith(null),
    })
    .map(({droppedFiles, processedFiles, showResult, analyzing}) => ({pendingFiles: droppedFiles.subtract(processedFiles), processedFiles, showResult, analyzing}))

  return state$
}

function view(state$) {
  return state$
    .map(({pendingFiles, processedFiles, showResult, analyzing}) => {
      if (showResult === null) {
        if (analyzing) {
          return h('div.g-loading')
        }
        const pendingFilesElm = pendingFiles.size === 0
          ? h('div.drop-here', h('b', 'drop files here'))
          : h('div.drop-here', [h('div', h('b', 'drop files here')), ...pendingFiles.map(filePath => h('div', filePath))])

        const processedFilesElm = processedFiles.size === 0
          ? h('div.processed-files', 'no processed files')
          : h('div.processed-files', [...processedFiles.map(filePath => h('div', filePath))])

        return h('div', [
          h('h1', 'Pending Files'),
          pendingFilesElm,
          h('h1', 'Processed Files'),
          processedFilesElm,
          h('div.analyze-button', 'Start Analyzing'),
        ])
      } else {
        const topics = showResult
        return h('div.topics',
          topics.map(words => h('div.topic',
              words.map(word =>
                h('div.word', word)
              )
            )
          )
        )
      }
    })
}

Cycle.run(({DOM, Worker, Analyzer}) => {
  const actions = intent(DOM, Worker, Analyzer)
  const state$ = model(actions)
  const vTree$ = view(state$)

  return {
    DOM: vTree$,
    Worker: actions.dropFile$,
    Analyzer: actions.clickAnalyze$.map(() => ({numTopics: 5})),
  }
}, {
  DOM: makeDOMDriver('#app'),
  Worker: makeIPCDriver('worker'),
  Analyzer: makeIPCDriver('analyzer'),
})
