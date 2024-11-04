chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureProblem") {
    const problemText = captureProblem();
    sendResponse({ text: problemText });
  }
});

function captureProblem() {
  const problemStatement = document.querySelector('.problem-statement');
  if (!problemStatement) return "Could not find problem statement";
  
  const headers = problemStatement.querySelectorAll('.header');
  const title = headers[0].querySelector('.title').textContent.trim();
  const timeLimit = headers[0].querySelector('.time-limit').textContent.replace(/.*: /, '');
  const memoryLimit = headers[0].querySelector('.memory-limit').textContent.replace(/.*: /, '');
  
  const description = problemStatement.querySelector('.problem-statement > div:nth-child(2)').textContent;
  const inputSpec = problemStatement.querySelector('.input-specification').textContent;
  const outputSpec = problemStatement.querySelector('.output-specification').textContent;
  
  const examples = [];
  const inputDivs = problemStatement.querySelectorAll('.input');
  const outputDivs = problemStatement.querySelectorAll('.output');
  
  for (let i = 0; i < inputDivs.length; i++) {
    const input = inputDivs[i].querySelector('pre').textContent;
    const output = outputDivs[i].querySelector('pre').textContent;
    examples.push({ input, output });
  }
  
  let rawText = `${title}\n`;
  rawText += `time limit per test ${timeLimit}\n`;
  rawText += `memory limit per test ${memoryLimit}\n\n`;
  rawText += `${description}\n\n`;
  rawText += `Input\n${inputSpec}\n\n`;
  rawText += `Output\n${outputSpec}\n\n`;
  rawText += `Examples\n`;
  
  for (const example of examples) {
    rawText += `InputCopy\n${example.input}\nOutputCopy\n${example.output}\n`;
  }
  
  const note = problemStatement.querySelector('.note');
  if (note) {
    rawText += `\nNote\n${note.textContent}`;
  }
  
  return rawText;
}