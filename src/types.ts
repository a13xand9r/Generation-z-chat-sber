import {
    AppState,
    SaluteHandler,
    SaluteRequest,
    SaluteRequestVariable
} from '@salutejs/scenario'


export interface ScenarioAppState extends AppState {

}

export interface ScenarioIntentsVariables extends SaluteRequestVariable {
    variant?: string
    variant2?: string
}

export interface ScenarioSession extends Record<string, unknown>{
    currentQuestionId?: number
    correctAnswers?: number
    isAnswerDone?: boolean
}

export type ScenarioRequest = SaluteRequest<ScenarioIntentsVariables, ScenarioAppState>
export type ScenarioHandler = SaluteHandler<ScenarioRequest, ScenarioSession>

export type Question = {
    question: string
    answer: string
    variants: string[]
    commentRight: string
    commentWrong: string
    reaction?: string
}