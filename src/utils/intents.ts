import { questionsDataBase } from './../questionDataBase';
import fs from 'fs'

const writeJSON = () => {
    // let data = JSON.stringify(categories)
    const variants: string[] = []
    questionsDataBase.forEach(item => {
        variants.push(...item.variants)
    })
    let content = `${variants.map((item, i) => {
        return `${i};${item};{"name": "${item}"}\n`
    })}`.replace(/,/g, '')
    fs.writeFileSync('variants.csv', content)
}

writeJSON()

export type BookApi = {
    li: {
        Name: string,
        locale: string,
        id: string
    }
}