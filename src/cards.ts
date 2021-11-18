import { CellView, ListCard } from '@salutejs/scenario'

export const createQuestionCard = (questionNumber: number, question: string, variants: string[]): ListCard => {
    const cells: CellView[] = variants.map((item, index) => ({
        type: 'left_right_cell_view',
        divider: {
            size: 'd5',
            style: 'default'
        },
        left: {
            type: 'simple_left_view',
            texts: {
                title: {
                    text: `${index + 1}. ${item}`,
                    text_color: 'default',
                    typeface: 'body1',
                    max_lines: 3
                },
            }
        },
        paddings: {
            top: '6x',
            bottom: '6x',
            left: '3x',
            right: '3x'
        },
        actions: [
            {
                type: 'text',
                text: item
            }
        ]
    }))
    return {
        type: 'list_card',
        paddings: {
            top: '10x',
            bottom: '10x',
            left: '10x',
            right: '10x',
        },
        cells: [
            {
                type: 'text_cell_view',
                paddings: {
                    bottom: '5x',
                    left: '3x',
                    right: '3x',
                },
                content: {
                    text: `${questionNumber}. ${question}`,
                    typeface: 'headline3',
                    text_color: 'default',
                    max_lines: 10
                }
            },
            ...cells
        ]
    }
}