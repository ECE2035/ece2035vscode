

// eslint-disable-next-line no-undef

import { useEffect } from "react";
import Badge, { BadgeType } from "../component/Badge";

let seed = "";



function getBadge(str) {
  switch (str) {
    case "finished":
      return BadgeType.FINISHED;
    case "passed":
    case "pass":
      return BadgeType.PASSED;
    case "failed":
    case "fail":
      return BadgeType.FAILED;
    case "unknown":
      return BadgeType.NOT_STARTED;
    case "done":
      return BadgeType.DONE;
    default:
      return BadgeType.IN_PROGRESS;
  }
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



export default function ScreenView({ vscode, stats, status = "", log = "", title }) {
  const { di = "??", mem = "??", reg = "??", si = "??", pc } = stats;
  
  const badge = getBadge(status);

  useEffect(() => {

    window.addEventListener('message', event => {
      const message = event.data; // Received message
      switch (message.command) {


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

  const StatsDisplay = ({title, value, id }) => (
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
        { pc && <StatsDisplay centered={true} title={"Program Counter"} value={pc}/> }
      </div>
    </body>

  </>
}
