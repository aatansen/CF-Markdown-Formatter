document.addEventListener('DOMContentLoaded', async function() {
  const contentDiv = document.getElementById('content');
  
  // Check if we're on Codeforces
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isCodeforces = tab.url.startsWith('https://codeforces.com/');
  
  if (!isCodeforces) {
    contentDiv.innerHTML = `
      <div class="not-cf-domain">
        This extension only works on<br>
        <strong>https://codeforces.com</strong>
      </div>
    `;
    return;
  }
  
  // If we are on Codeforces, show the normal interface
  contentDiv.innerHTML = `
    <textarea id="inputText" placeholder="Problem text will appear here..."></textarea>
    <div class="button-group">
      <button id="captureBtn">Capture Problem</button>
      <button id="formatBtn" disabled>Format to Markdown</button>
      <button id="copyBtn" disabled>Copy to Clipboard</button>
    </div>
    <div id="status" class="status"></div>
  `;

  const inputText = document.getElementById('inputText');
  const captureBtn = document.getElementById('captureBtn');
  const formatBtn = document.getElementById('formatBtn');
  const copyBtn = document.getElementById('copyBtn');
  const status = document.getElementById('status');

  captureBtn.addEventListener('click', async () => {
    try {
      // First, inject the content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // Then send message to the content script
      chrome.tabs.sendMessage(tab.id, { action: "captureProblem" }, (response) => {
        if (chrome.runtime.lastError) {
          status.textContent = 'Error: ' + chrome.runtime.lastError.message;
          return;
        }
        
        if (response && response.text) {
          inputText.value = response.text;
          formatBtn.disabled = false;
          status.textContent = 'Problem captured successfully!';
          setTimeout(() => status.textContent = '', 2000);
        } else {
          status.textContent = 'Error: No problem text received';
        }
      });
    } catch (err) {
      status.textContent = 'Error capturing problem text: ' + err.message;
      console.error(err);
    }
  });

  formatBtn.addEventListener('click', () => {
    try {
      const formatted = formatText(inputText.value);
      inputText.value = formatted;
      copyBtn.disabled = false;
      status.textContent = 'Formatted successfully!';
      setTimeout(() => status.textContent = '', 2000);
    } catch (err) {
      status.textContent = 'Error formatting text: ' + err.message;
      console.error(err);
    }
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(inputText.value);
      status.textContent = 'Copied to clipboard!';
      setTimeout(() => status.textContent = '', 2000);
    } catch (err) {
      status.textContent = 'Error copying to clipboard: ' + err.message;
      console.error(err);
    }
  });
});

function formatText(text) {
  // Clean up text
  text = text.trim();
  
  // Regular expressions
  const introPattern = /^(.*?)(?=Examples)/s;
  const ioPattern = /InputCopy\s*([\s\S]*?)\s*OutputCopy\s*([\s\S]*?)(?=(?:\s*InputCopy|\s*Note|\s*$))/g;
  const notePattern = /Note\s*([\s\S]*?)$/;
  
  // Extract introduction
  const introMatch = text.match(introPattern);
  const introText = introMatch ? introMatch[1].trim() : "";
  
  // Format introduction
  const lines = introText.split('\n').filter(line => line.trim());
  let formattedIntro = `### ${lines[0]}\n\n`;
  formattedIntro += `> ${lines[1].trim()}\n> ${lines[2].trim()}\n\n`;
  
  // Process remaining intro lines
  let currentSection = null;
  const formattedLines = [];
  
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    if (line === "Input" || line === "Output") {
      currentSection = line;
      formattedLines.push(`- ${line}`);
      continue;
    }
    
    if (currentSection) {
      formattedLines.push(`  - ${line}`);
    } else {
      formattedLines.push(`- ${line}`);
    }
  }
  
  formattedIntro += formattedLines.join('\n');
  
  // Format examples
  let formattedIO = "\n\n- Examples";
  let match;
  while ((match = ioPattern.exec(text)) !== null) {
    const [_, input, output] = match;
    formattedIO += "\n  - Input\n\n";
    formattedIO += "    ```sh\n";
    formattedIO += input.split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => `    ${line}`)
      .join('\n') + '\n';
    formattedIO += "    ```\n\n";
    formattedIO += "  - Output\n\n";
    formattedIO += "    ```sh\n";
    formattedIO += output.split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => `    ${line}`)
      .join('\n') + '\n';
    formattedIO += "    ```\n";
  }
  
  // Format note
  let formattedNote = "";
  const noteMatch = text.match(notePattern);
  if (noteMatch) {
    const noteText = noteMatch[1].trim();
    const noteParagraphs = noteText.split('\n\n')
      .map(p => p.trim())
      .filter(p => p);
    
    formattedNote = "\n\n- Note";
    for (const paragraph of noteParagraphs) {
      formattedNote += `\n  - ${paragraph}`;
    }
  }
  
  return formattedIntro + formattedIO + formattedNote;
}