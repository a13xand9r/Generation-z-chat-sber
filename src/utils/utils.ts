import { ScenarioRequest } from '../types'
import stringSimilarity from 'string-similarity'
import { Character } from '@salutejs/scenario'

export function getRandomFromArray<T>(arr: T[]): T {
    return arr[Math.floor(arr.length * Math.random())]
}

export const checkStringSimilarity = (req: ScenarioRequest, answer: string) => {
    const asrSimilarity = stringSimilarity.compareTwoStrings(req.message.asr_normalized_message ?? '', answer.toLowerCase().trim())
    const originalSimilarity = stringSimilarity.compareTwoStrings(req.message.original_text.toLowerCase().trim() ?? '', answer.toLowerCase().trim())
    const normalizedSimilarity = stringSimilarity.compareTwoStrings(req.message.human_normalized_text.toLowerCase().trim() ?? '', answer.toLowerCase().trim())

    return Math.max(asrSimilarity, originalSimilarity, normalizedSimilarity)
}

export const findNumber = (text: string) => {
    const textArr = text.split(' ')
    for (let i = 0; i < textArr.length; i++) {
        if (!!Number(textArr) && Number(textArr) < 4) return Number(textArr)
    }
}


const youObjOfficial = {
    'Расшифруй': 'Расшифруйте',
    'Тебе': 'Вам',
    'Скажешь': 'Скажете',
}

export function changeAppealText(text: string, appeal: Character['appeal']): string {
    let keys: string[]
    let newText: string = text
    if (appeal === 'official') {
        keys = Object.keys(youObjOfficial)
        keys.forEach((key) => {
            if (newText.toLowerCase().includes(key.toLowerCase())) {
                //@ts-ignore
                newText = newText.replace(key, youObjOfficial[key])
                //@ts-ignore
                newText = newText.replace(key.toLowerCase(), youObjOfficial[key].toLowerCase())
            }
        })
    }
    return newText
}

const ssmlObject = {
    'зумер': 'зу\'мер',
    'шеймить': 'ше\'ймить',
    'стоник': 'сто\'ник',
    'кринжов': 'кринжо\'в',
}

export function addSSML(text: string): string {
    let keys: string[]
    let newText: string = text
    keys = Object.keys(ssmlObject)
    keys.forEach((key) => {
        if (newText.toLowerCase().includes(key.toLowerCase())) {
            //@ts-ignore
            newText = newText.replace(key, ssmlObject[key])
            //@ts-ignore
            newText = newText.replace(key.toLowerCase(), ssmlObject[key].toLowerCase())
        }
    })
    return `<speak>${newText}</speak>`
}