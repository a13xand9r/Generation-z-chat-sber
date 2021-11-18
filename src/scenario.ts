import { checkStringSimilarity } from './utils/utils';
import { ScenarioRequest, Question } from './types';
import { SmartAppBrainRecognizer } from '@salutejs/recognizer-smartapp-brain'
import {
    createIntents,
    createMatchers,
    createSaluteRequest,
    createSaluteResponse,
    createScenarioWalker,
    createSystemScenario,
    createUserScenario,
    NLPRequest,
    NLPResponse,
    SaluteRequest
} from '@salutejs/scenario'
import { SaluteMemoryStorage } from '@salutejs/storage-adapter-memory'
import { answerHandler, newGameHandler, noMatchHandler, questionHandler, questionQuantityHandler, runAppHandler, startAppHandler } from './handlers'
import model from './intents.json'
import { closeApp } from './utils/responses';
require('dotenv').config()

const storage = new SaluteMemoryStorage()
const intents = createIntents(model.intents)
const { intent, match } = createMatchers<ScenarioRequest, typeof intents>()

const userScenario = createUserScenario<ScenarioRequest>({
    StartApp: {
        match: () => false,
        handle: startAppHandler,
        children: {
            Yes: {
                match: intent('/Да', {confidence: 0.4}),
                handle: ({req, res}, dispatch) => dispatch && dispatch(['Question'])
            },
            No: {
                match: intent('/Нет', {confidence: 0.4}),
                handle: ({res}) => {
                    res.setPronounceText('Тогда до встречи!')
                    closeApp(res)
                }
            }
        }
    },
    Question: {
        match: intent('/Вопрос', {confidence: 0.5}),
        handle: questionHandler,
    },
    Help: {
        match: intent('/Помощь', {confidence: 0.7}),
        handle: noMatchHandler
    },
    QuestionQuantity: {
        match: intent('/Сколько всего вопросов', {confidence: 0.7}),
        handle: questionQuantityHandler
    },
    NewGame: {
        match: intent('/Сыграть снова', {confidence: 0.5}),
        handle: newGameHandler
    },
    Answer: {
        match: req => {
            return intent('/Вариант ответа', {confidence: 0.2})(req) || req.message.normalized_text.includes('NUM_TOKEN')
        },
        handle: answerHandler
    },
})

const systemScenario = createSystemScenario({
    RUN_APP: runAppHandler,
    NO_MATCH: noMatchHandler
})

const scenarioWalker = createScenarioWalker({
    recognizer: new SmartAppBrainRecognizer(process.env.SMARTAPP_BRAIN_TOKEN),
    intents,
    systemScenario,
    userScenario
})

export const handleNlpRequest = async (request: NLPRequest): Promise<NLPResponse> => {
    const req = createSaluteRequest(request)
    const res = createSaluteResponse(request)

    const sessionId = request.uuid.userId
    const session = await storage.resolve(sessionId)

    await scenarioWalker({ req, res, session })

    await storage.save({ id: sessionId, session })

    return res.message
}