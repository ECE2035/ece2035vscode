import { BYTES_PER_ROW } from "../App";

export default function MemoryView({gp, baseAddress, memoryData, oldMemory}) {
  const rows = Math.ceil(memoryData.length / BYTES_PER_ROW);

  return <>

    <h2 style={{ display: "inline-block" }}>RISC-V Memory View</h2>

    <label class="vscode-checkbox">
      <input id="show-instructions" type="checkbox" />
      <div class="checkmark"></div>
      <span>Show instructions</span>
    </label>
    <div class="hex-viewer">
      {[...Array(rows)].map((_, row) => {
        const isInstruction = baseAddress + row * BYTES_PER_ROW < gp;

        return (
          <div className='row'>
            <span className='address'>{(baseAddress + row * BYTES_PER_ROW).toString().padStart(6, "0")}</span>
            <div className='hex-values'>
              {[...Array(BYTES_PER_ROW)].map((_, col) => {
                const idx = row * BYTES_PER_ROW + col;
                if (idx < memoryData.length) {
                  const value = memoryData[idx];

                  let hexIdentifier;

                  if (oldMemory.current[idx] !== value) {
                    // different than last step, let's highlight it
                    hexIdentifier = "hex-value-recently-changed";
                    // oldMemory.current[idx] = value; 
                  } else if (!isInstruction) {
                    hexIdentifier = "hex-value";
                  } else {
                    hexIdentifier = "hex-value-instruction";
                  }


                  return (
                    <span className={`${hexIdentifier} hex-value`}>{value.toString(16).padStart(2, "0")}</span>
                  )
                }
                return <></>
              })}
            </div>
          </div>);
      })}
    </div>

  </>
}