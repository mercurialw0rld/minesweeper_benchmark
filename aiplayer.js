import { GoogleGenAI } from "@google/genai";
import { Type } from "@google/genai";
const apiButton = document.getElementById('set-api-key-button');
const apiInput = document.getElementById('api-key-input');
let ai = null;

apiButton.addEventListener('click', () => {
    const apiKey = apiInput.value;
    if (apiKey) {
        try {
            ai = initializeAI(apiKey);
        } catch (error) {
            alert('Error initializing AI: ' + error.message);
            return;
        }
        alert('API Key set successfully!');
    } else {
        alert('Please enter a valid API Key.');
    }
});

function initializeAI(apiKey) {
  return new GoogleGenAI({
    apiKey: apiKey, // Initially empty, to be set by user
  });
}

export async function aiPlay(state) {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Current board state:
    ${boardToText(state)} 

    INSTRUCTIONS:
    1. Analyze each number on the board.
    2. For each number, count the surrounding 'E' (unopened) and 'F' (flags).
    3. Deduce logically: 
      - If (number) == (unopened + flags), then all unopened are mines (F).
      - If (number) == (flags), then all unopened are safe (O).
    4. Think step-by-step and then call 'action_mine' with your moves.`,
    config: {
        tools: [{
            functionDeclarations: [actionMineDeclaration]
        }],

  },
  });
  if (response.functionCalls && response.functionCalls.length > 0) {
    const args = JSON.stringify(response.functionCalls[0].args);
    return JSON.parse(args);
  } else {
    throw new Error("No function call in the response");
  }

}


const actionMineDeclaration = {
  name: 'action_mine',
  description: 'Gives and executes the play decided by the LLM.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      moves: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            decision: {
              type: Type.STRING,
              enum: ['F', 'O'],
              description: 'The action to take: F for flagging a cell, O for opening a cell.',
            },
            row: {
              type: Type.INTEGER,
              description: 'The row index of the cell to act upon.',
            },
            col: {
              type: Type.INTEGER,
              description: 'The column index of the cell to act upon.',
            },
          },
          required: ['decision', 'row', 'col'],
        },
        description: 'Ordered list of moves to apply sequentially without user input.',
      },
    },
    required: ['moves'],
  },
}



