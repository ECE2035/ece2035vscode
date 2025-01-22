import './App.css';
import MemoryView from './views/MemoryView';
import ScreenView from './views/ScreenView';
import { useEffect, useRef, useState } from 'react';
import { base64ToBytes } from './util/hexUtils';
import DumpMemoryButton from './component/DumpMemoryButton';

// eslint-disable-next-line no-undef
const vscode = acquireVsCodeApi();

export const BYTES_PER_ROW = 4;

const initialState = {
  memory: {
    main: null,
    stack: null
  },
  stats: {
    di: null,
    mem: null,
    reg: null,
    si: null,
  },
  status: null
};

// TODO: This function was (almost) directly ported from the original
// javascript implementation, and as such uses getElementById and other 
// non-standard elements you wouldn't see in a React implementation.
// These should eventually be migrated over to a fully React-based
// system. 
function showPastScreen(data) {
  let img = document.getElementById("pastScreen");
  let canvas = document.getElementById("screen");
  let saveButton = document.getElementById("save_button");
  saveButton.className = "hidden";
  saveButton.hidden = true;
  saveButton.disabled = true;
  saveButton.style = "opacity: 0;"

  let newImg = new Image();
  let srcUrl = data.image;

  newImg.onload = function() {
    let height = newImg.height;
    let width = newImg.width;
    img.width = width;
    img.height = height;

    canvas.hidden = true;
    img.src = srcUrl;
    img.hidden = false;
  }

  newImg.src = srcUrl;
}

function showMultiScreen() {
  let saveButton = document.getElementById("save_button");
  saveButton.className = "hidden";
  saveButton.hidden = true;
  saveButton.disabled = true;
  saveButton.style = "opacity: 0;"
}

function App() {
  const oldMemory = useRef(new Array(128).fill(0));

  const [{ memory, stats, status }, setState] = useState(initialState);
  const [ title, setTitle ] = useState("RISC-V Screen View");
  const [ log, setLog ] = useState("");

  const handleUpdateScreen = (data) => {
    let canvas = document.getElementById("screen");
    let img = document.getElementById("pastScreen");

    if (img.hidden === false) {
      img.hidden = true;
      canvas.hidden = false;
      let saveButton = document.getElementById("save_button");
      saveButton.className = "primary-button";
      saveButton.hidden = false;
      saveButton.disabled = false;
      saveButton.style = "display: inline-block; margin-left: 20px;";
    }

    if (canvas.width !== data.width || canvas.height !== data.height) {
      canvas.width = data.width;
      canvas.height = data.height;
      canvas.clientWidth = Math.min(canvas.clientWidth, 400);
      canvas.clientHeight = Math.min(canvas.clientWidth, 400);
    }

    let ctx = canvas.getContext("2d");
    ctx.willReadFrequently = true;

    for (let update of data.updates) {
      let x = update.region_x;
      let y = update.region_y;
      let imageData = ctx.getImageData(x, y, 16, 16);

      for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 16; j++) {
          let index = (i * 16 + j) * 4;
          imageData.data[index] = update.data[i * 16 + j] & 0xFF; // red
          imageData.data[index + 1] = (update.data[i * 16 + j] >> 8) & 0xFF; // green
          imageData.data[index + 2] = (update.data[i * 16 + j] >> 16) & 0xFF; // blue
          imageData.data[index + 3] = 0xFF; // alpha
        }
      }

      ctx.putImageData(imageData, x, y);
    }
  }

  const updateData = (data) => {
    if (!data.memory || !data.memory.main) {
      setState(data);
      return;
    }

    const newState = {
      ...data,
      memory: {
        main: base64ToBytes(data.memory.main),
        stack: base64ToBytes(data.memory.stack)
      }
    };

    setState(newState);
  }

  useEffect(() => {
    window.addEventListener("message", (event) => {
      console.log("Received 1", event.data);

      const { command, data, log = "" } = event.data;

      switch (command) {
        case 'screen_update':
          handleUpdateScreen(data);
          updateData(data);
          break;

        case 'show_past_screen':
          showPastScreen(data);
          updateData(data);
          break;
        case "show_multi_screen":
          showMultiScreen(data, data.status);
          
          setLog(log);

          // Hide canvas image
          let canvas = document.getElementById("screen");
          canvas.hidden = true;

          setTitle("RISC-V MultiExec Results");

          updateData(data);
          break;
        default:
          break;
      }
    });

    // To prevent the risk of data being sent to the website before loading,
    // all commands will enter a queue until this ready command is posted
    vscode.postMessage({ command: 'ready' });

  }, [])

  const baseAddress = 0;


  return (
    <>
      <ScreenView vscode={vscode} stats={stats} status={status} log={log} title={title} />

      {memory !== undefined && memory.main !== null ? <>

        <div style={{ display: "flex", flexDirection: "column", rowGap: "0.5rem" }}>
          <DumpMemoryButton memoryData={memory.main} />
        </div>

        <div className='flex-container'>
          <div>
            <MemoryView title={"Memory"} baseAddress={baseAddress} memoryData={memory.main} oldMemory={oldMemory} />
          </div>
          <div>
            <MemoryView reverse={true} title={"Stack"} baseAddress={0x7FFFFFF0} memoryData={memory.stack} oldMemory={oldMemory} />
          </div>
        </div></> : <></>}
    </>
  );
}

export default App;
