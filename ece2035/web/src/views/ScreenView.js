

// eslint-disable-next-line no-undef

import { useEffect, useState } from "react";
import Badge, { BadgeType } from "../component/Badge";

let seed = "";

function handleUpdateScreen(data, setStatus) {
  console.log("message recieved! width:", data.width, "height:", data.height, "updates:", data.updates.length);
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

  // updating stats
  updateStats(data.stats, data.status, setStatus);
}

// TODO: This function was (almost) directly ported from the original
// javascript implementation, and as such uses getElementById and other 
// non-standard elements you wouldn't see in a React implementation.
// These should eventually be migrated over to a fully React-based
// system. 
function showPastScreen(data, setStatus) {
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
    updateStats(data.stats, data.status, setStatus);
  }

  newImg.src = srcUrl;
}

function updateStats(stats, status, setStatus) {
  let badge;

  console.log("set status to ", status);

  switch (status) {
    case "finished":
      badge = BadgeType.FINISHED;
      break;
    case "passed":
    case "pass":
      badge = BadgeType.PASSED;
      break;
    case "failed":
    case "fail":
      badge = BadgeType.FAILED;
      break;
    case "unknown":
      badge = BadgeType.NOT_STARTED;
      break;
    case "done":
      badge = BadgeType.DONE;
      break;
    default:
      badge = BadgeType.IN_PROGRESS;
      break;
  }

  setStatus({
    badge: badge,
    di: stats.di,
    si: stats.si,
    reg: stats.reg,
    mem: stats.mem
  });
}


function saveTestCase(vscode) {
  console.log("saving testcase");

  // Saving the canvas image data as a base64 png image string
  let canvas = document.getElementById("screen");
  let image = canvas.toDataURL("image/png");
  let data = {
    seed: seed,
    image: image.substring(22)
  };

  // Sending the image data to the parent window
  vscode.postMessage({
    command: 'save_testcase',
    data: data
  });
}

function showMultiScreen(data, status, setStatus) {
  let saveButton = document.getElementById("save_button");
  saveButton.className = "hidden";
  saveButton.hidden = true;
  saveButton.disabled = true;
  saveButton.style = "opacity: 0;"
  updateStats(data.stats, status, setStatus);
}

export default function ScreenView({ vscode }) {
  const [{
    badge,
    di,
    si,
    reg,
    mem
  }, setStatus] = useState({
    badge: BadgeType.IN_PROGRESS,
    di: "??",
    si: "??",
    reg: "??",
    mem: "??"
  });
  const [log, setLog] = useState("");

  const [ title, setTitle] = useState("RISC-V Screen View");

  useEffect(() => {

    window.addEventListener('message', event => {
      const message = event.data; // Received message
      switch (message.command) {
        case 'screen_update':
          handleUpdateScreen(message.data, setStatus);

          // update stats
          break;
        case 'show_past_screen':
          showPastScreen(message.data, setStatus);

          // update stats
          break;
        case "show_multi_screen":
          showMultiScreen(message.data, message.data.status, setStatus);
          setLog(message.log);

          // Hide canvas image
          let canvas = document.getElementById("screen");
          canvas.hidden = true;

          setTitle("RISCV MultiExec Results")

          break;
        case 'context_update':
          seed = message.data.seed;
          break;
        default:
          break;
      }
    });
  }, [])

  const handleSaveTestCase = () => {
    saveTestCase(vscode)
  }

  const LogLineFormatted = ({ line }) => (
    <div style={{ color: line.includes("fail") ? "tomato" : "" }}>
      {line}
    </div>
  )

  const StatsDisplay = ({title, value, id}) => (
    <div style={{ borderRadius: '0.5rem' }}>
      <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#718096' }}>{title}</p>
      <p id={id} style={{ fontSize: '1.25rem', fontWeight: '700' }}>{value}</p>
    </div>
  )

  return <>
    <body>
      <div style={{ display: "flex", alignItems: "center" }}>
        <h2 style={{ marginRight: "2rem" }}>{title}</h2>

        <div className="button-container">
          <button onClick={handleSaveTestCase} id="save_button" style={{ marginRight: "0.50rem", height: "2rem" }} className="primary-button">Save Testcase</button>
          
          <Badge badgeType={badge} />
        </div>

      </div>

      {
        log.split("\n")
          .map((line, index) => <LogLineFormatted index={index} line={line} />)
      }

      <div style={{ display: "flex", justifyContent: "center" }}>
        <canvas id="screen" width="160" height="160"></canvas>
        <img alt="pattern" width="160" height="160" hidden="true" id="pastScreen" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <StatsDisplay title={"Dynamic Instructions"} value={di}/> 
        <StatsDisplay title={"Static Instructions"} value={si}/>
        <StatsDisplay title={"Registers Used"} value={reg}/>
        <StatsDisplay title={"Memory Used"} value={mem}/>
      </div>
    </body>

  </>
}
