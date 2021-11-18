import { ScenarioHandler } from './types';
import * as dictionary from './system.i18n'
import { questionsDataBase } from './questionDataBase';
import { createQuestionCard } from './cards';
import { addSSML, changeAppealText, checkStringSimilarity, findNumber } from './utils/utils';
import stringSimilarity from 'string-similarity';
require('dotenv').config()


export const runAppHandler: ScenarioHandler = ({ req, res, session }, dispatch) => {
    session.correctAnswers = 0
    session.currentQuestionId = undefined
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

export const noMatchHandler: ScenarioHandler = async ({ req, res, session }, dispatch) => {
    const keyset = req.i18n(dictionary)
    const responseText = keyset('404')
    res.appendBubble(responseText)
    res.setPronounceText(responseText)

    if (session.currentQuestionId === undefined) {
        res.appendSuggestions(['Вопрос', 'Хватит'])
    } else {
        session.isAnswerDone
            ? res.appendSuggestions(['Вопрос', 'Хватит'])
            : res.appendSuggestions(['1', '2', '3', 'Хватит'])

        // dispatch && dispatch(['AnswerWait'])
    }
}

export const newGameHandler: ScenarioHandler = async ({ req, res, session }, dispatch) => {
    session.correctAnswers = 0
    session.currentQuestionId = undefined
    dispatch && dispatch(['Question'])
}

export const questionQuantityHandler: ScenarioHandler = async ({ req, res, session }, dispatch) => {
    const keyset = req.i18n(dictionary)
    const responseText = keyset('Количество', {
        questions: questionsDataBase.length,
        user: `<say-as interpret-as="ordinal" format="prepositional_masculine">${session.currentQuestionId as number + 1}</say-as>`
    })
    res.appendBubble(keyset('Количество', {
        questions: questionsDataBase.length,
        user: session.currentQuestionId as number + 1
    }))
    res.setPronounceText(`<speak>${responseText}</speak>`, { ssml: true })

    if (session.currentQuestionId === undefined) {
        res.appendSuggestions(['Вопрос', 'Хватит'])
    } else {
        session.isAnswerDone
            ? res.appendSuggestions(['Вопрос', 'Хватит'])
            : res.appendSuggestions(['1', '2', '3', 'Хватит'])

        // dispatch && dispatch(['AnswerWait'])
    }
}

export const questionHandler: ScenarioHandler = async ({ req, res, session }, dispatch) => {
    if (session.currentQuestionId === undefined) {
        session.currentQuestionId = 0
    } else session.currentQuestionId = session.currentQuestionId + 1

    const question = changeAppealText(questionsDataBase[session.currentQuestionId].question, req.request.payload.character.appeal)
    res.appendCard(createQuestionCard(session.currentQuestionId + 1, question, questionsDataBase[session.currentQuestionId].variants))
    res.setPronounceText(addSSML(question + ' ' + questionsDataBase[session.currentQuestionId].variants.join()), { ssml: true })
    res.appendSuggestions(['Сколько всего вопросов', 'Хватит'])
    res.setASRHints({
        words: questionsDataBase[session.currentQuestionId].variants,
        enable_letters: true,
        model: 'general',
    })

    session.isAnswerDone = false

    // dispatch && dispatch(['AnswerWait'])
}

export const answerHandler: ScenarioHandler = async ({ req, res, session }, dispatch) => {
    const keyset = req.i18n(dictionary)
    let responseText = ''

    console.log('normalized_text', req.message.normalized_text)
    let similarity = 0
    const { variant, variant2 } = req.variables
    console.log('variant', variant)

    if (variant || variant2) {
        const name = variant2 ? JSON.parse(variant2).name : variant
        console.log('human_normalized_text', req.message.human_normalized_text)
        similarity = stringSimilarity.compareTwoStrings(name ?? '', questionsDataBase[session.currentQuestionId as number].answer)
        console.log('name', name)
        console.log('similarity', similarity)
    }

    const answerNum = findNumber(req.message.human_normalized_text)

    if (similarity > 0.4 || (
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

    session.isAnswerDone = true

    let pronounceText = responseText
    if (session.currentQuestionId === questionsDataBase.length - 1) {
        responseText = responseText + '\n\n' +
            keyset('Финал', {
                result: `${session.correctAnswers} / ${questionsDataBase.length}`
            })
            pronounceText = pronounceText + '. ' +
            keyset('Финал', {
                result: `${session.correctAnswers} из ${questionsDataBase.length}`
            })
        if (session.correctAnswers === questionsDataBase.length) {
            responseText = responseText + '\n' + keyset('Отличный результат')
            pronounceText = pronounceText + '. ' + keyset('Отличный результат')
        } else if (session.correctAnswers as number / questionsDataBase.length > 0.6) {
            responseText = responseText + '\n' + keyset('Хороший результат')
            pronounceText = pronounceText + '. ' + keyset('Хороший результат')
        } else {
            responseText = responseText + '\n' + keyset('Плохой результат')
            pronounceText = pronounceText + '. ' + keyset('Плохой результат')
        }
        res.appendSuggestions(['Сыграть снова', 'Хватит'])
    } else {
        res.appendSuggestions(['Дальше', 'Помощь', 'Хватит'])
    }

    console.log('addSSML(responseText)', addSSML(pronounceText))
    res.appendBubble(responseText)
    res.setPronounceText(addSSML(pronounceText), { ssml: true })

}