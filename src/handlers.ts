import { ScenarioHandler } from './types';
import * as dictionary from './system.i18n'
import { questionsDataBase } from './questionDataBase';
import { createQuestionCard } from './cards';
import { addSSML, changeAppealText, checkStringSimilarity, findNumber } from './utils/utils';
require('dotenv').config()


export const runAppHandler: ScenarioHandler = ({ req, res, session }, dispatch) => {
    session.correctAnswers = 0
    dispatch && dispatch(['StartApp'])
}

export const startAppHandler: ScenarioHandler = ({ req, res, session }) => {
    const keyset = req.i18n(dictionary)
    const responseText = keyset('Привет')
    res.appendBubble(responseText)
    res.setPronounceText(responseText)
    res.appendSuggestions(['Да', 'Нет'])
    res.setAutoListening(true)
}

export const noMatchHandler: ScenarioHandler = async ({ req, res }) => {
    const keyset = req.i18n(dictionary)
    const responseText = keyset('404')
    res.appendBubble(responseText)
    res.setPronounceText(responseText)
}

export const newGameHandler: ScenarioHandler = async ({req, res, session}, dispatch) => {
    session.correctAnswers = 0
    session.currentQuestionId = undefined
    dispatch && dispatch(['Question'])
}

export const questionQuantityHandler: ScenarioHandler = async ({req, res, session}, dispatch) => {
    const keyset = req.i18n(dictionary)
    const responseText = keyset('Количество', {
        questions: questionsDataBase.length,
        user: `<say-as interpret-as="ordinal" format="prepositional_masculine">${session.currentQuestionId as number + 1}</say-as>`
    })
    res.appendBubble(keyset('Количество', {
        questions: questionsDataBase.length,
        user: session.currentQuestionId as number + 1
    }))
    res.setPronounceText(`<speak>${responseText}</speak>`, {ssml: true})

    dispatch && dispatch(['AnswerWait'])
}

export const questionHandler: ScenarioHandler = async ({ req, res, session }, dispatch) => {
    if (session.currentQuestionId === undefined) {
        session.currentQuestionId = 0
    } else session.currentQuestionId = session.currentQuestionId + 1

    const question = changeAppealText(questionsDataBase[session.currentQuestionId].question, req.request.payload.character.appeal)
    res.appendCard(createQuestionCard(question, questionsDataBase[session.currentQuestionId].variants))
    res.setPronounceText(addSSML(question + ' ' + questionsDataBase[session.currentQuestionId].variants.join()), {ssml: true})
    res.appendSuggestions(['Сколько всего вопросов', 'Хватит'])
    res.setASRHints({
        words: questionsDataBase[session.currentQuestionId].variants,
        enable_letters: true,
        model: 'general',
    })

    dispatch && dispatch(['AnswerWait'])
}

export const answerHandler: ScenarioHandler = async ({ req, res, session }, dispatch) => {
    const keyset = req.i18n(dictionary)
    let responseText = ''

    console.log('human_normalized_text', req.message.human_normalized_text)

    const similarity = checkStringSimilarity(req, questionsDataBase[session.currentQuestionId as number].answer)
    const answerNum = findNumber(req.message.human_normalized_text)

    if (similarity > 0.6 || (
        answerNum && questionsDataBase[session.currentQuestionId as number].variants[answerNum - 1] === questionsDataBase[session.currentQuestionId as number].answer
    )) {
        responseText = keyset('Верно', {
            comment: changeAppealText(questionsDataBase[session.currentQuestionId as number].commentRight, req.request.payload.character.appeal)
        })
        res.setEmotion('radost')
        session.correctAnswers = session.correctAnswers as number + 1
    } else {
        res.setEmotion('nesoglasie')
        responseText = keyset('Неверно', {
            comment: changeAppealText(questionsDataBase[session.currentQuestionId as number].commentWrong, req.request.payload.character.appeal)
        })
    }

    if (session.currentQuestionId === questionsDataBase.length - 1) {
        responseText = responseText +
            keyset('Финал', {
                result: `${session.correctAnswers} / ${questionsDataBase.length}`
            })
        if (session.correctAnswers === questionsDataBase.length){
            responseText = responseText + '\n' + keyset('Отличный результат')
        } else if (session.correctAnswers as number / questionsDataBase.length > 0.6) {
            responseText = responseText + '\n' + keyset('Хороший результат')
        } else {
            responseText = responseText + '\n' + keyset('Плохой результат')
        }
        res.appendSuggestions(['Сыграть снова', 'Хватит'])
    } else{
        res.appendSuggestions(['Дальше', 'Помощь', 'Хватит'])
    }

    res.appendBubble(responseText)
    res.setPronounceText(addSSML(responseText), {ssml: true})

    dispatch && dispatch(['AnswerWait'])
}